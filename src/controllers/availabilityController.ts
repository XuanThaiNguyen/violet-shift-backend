import type { Request, Response } from "express";
import { AVAILABILITY_ERROR_CODE } from "../constants/errorCode";
import { sendResponse } from "../utils/sendResponse";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/type";
import {
  GetAvailabilities,
  validateCreateAvailability,
  validateGetAvailabilities,
} from "../validations/availabilityValidation";
import { rrulestr } from "rrule";
import Availability, { AvailabilityTypeEnum, IAvailability } from "../models/availability";
import { TZDate } from "@date-fns/tz";
import { minutesToTime } from "../utils/worklog";
import { addMonths, startOfDay } from "date-fns";

// insertion sort and merge algorithm
export const _mergeOverlappedOccurrences = (
  occurrences: IAvailability[],
  newOccurrence: IAvailability,
) => {
  let i = occurrences.length;
  let done = false;
  const sortedOccurrences: IAvailability[] = [];
  while (i--) {
    const occurrence = occurrences[i];
    if (occurrence.from > newOccurrence.to) {
      sortedOccurrences.unshift(occurrence);
      continue;
    }

    // has overlap
    if (occurrence.to >= newOccurrence.from) {
      newOccurrence.from = Math.min(occurrence.from, newOccurrence.from);
      newOccurrence.to = Math.max(occurrence.to, newOccurrence.to);

      if (i === 0) {
        done = true;
        sortedOccurrences.unshift(newOccurrence);
      }
    } else {
      if (!done) {
        done = true;
        sortedOccurrences.unshift(newOccurrence);
      }
      sortedOccurrences.unshift(occurrence);
    }
  }

  if (!done) {
    sortedOccurrences.unshift(newOccurrence);
  }
  return sortedOccurrences;
};

export const isOwnerOfAvailability = async (req: Request) => {
  const { id } = req.params;
  const availability = await Availability.findOne({
    _id: id,
    isDeleted: false,
  });
  return availability?.staff.toString() === (req as AuthRequest).userId;
};

export const addAvailabilities = async (req: Request, res: Response) => {
  try {
    const { error, value: availabilityData } = validateCreateAvailability(req.body);
    const userId = (req as AuthRequest).userId;
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: AVAILABILITY_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const date = new TZDate(new Date(availabilityData.date), availabilityData.tz);
    const dateMap: Record<string, IAvailability[]> = {};
    availabilityData.timeSegments.forEach((curr) => {
      const [hourFrom, minuteFrom] = minutesToTime(curr.from);
      const [hourTo, minuteTo] = minutesToTime(curr.to);
      const fromDate = new TZDate(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hourFrom,
        minuteFrom,
        availabilityData.tz,
      );
      const from = fromDate.getTime();
      const toDate = new TZDate(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hourTo,
        minuteTo,
        availabilityData.tz,
      );
      const to = toDate.getTime();
      const occurrenceDuration = to - from;
      if (occurrenceDuration <= 0) {
        return;
      }

      const firstOccurrence: IAvailability = {
        staff: mongoose.Types.ObjectId.createFromHexString(userId),
        type: availabilityData.type,
        from: from,
        to: to,
        isApproved: true,
        isDeleted: false,
        note: availabilityData.note,
      };
      const _date = startOfDay(fromDate).getTime();
      const occurrencesInDate = dateMap[_date] || [];
      // in case we want to merge overlapping occurrences
      // dateMap[_date] = _mergeOverlappedOccurrences(occurrencesInDate, firstOccurrence);
      dateMap[_date] = [...occurrencesInDate, firstOccurrence];

      if (availabilityData.repeat) {
        const rrule = rrulestr(availabilityData.repeat.pattern);

        const timeFromDate = new Date(from);
        const endDateDate = new Date(availabilityData.repeat.endsAt);
        const hourFrom = timeFromDate.getUTCHours();
        const minuteFrom = timeFromDate.getUTCMinutes();

        rrule.origOptions.tzid = availabilityData.tz;
        rrule.origOptions.dtstart = new Date(from);
        rrule.origOptions.until = endDateDate;
        rrule.origOptions.byhour = hourFrom;
        rrule.origOptions.byminute = minuteFrom;
        rrule.origOptions.bysecond = 0;

        rrule.options.tzid = availabilityData.tz;
        rrule.options.dtstart = new Date(from);
        rrule.options.until = endDateDate;
        rrule.options.byhour = [hourFrom];
        rrule.options.byminute = [minuteFrom];
        rrule.options.bysecond = [0];

        const occurrencesDates = rrule.all();
        for (const _occurrence of occurrencesDates) {
          const zonedOccurrence = new TZDate(_occurrence, availabilityData.tz);
          const occurrence = new Date(
            zonedOccurrence.getFullYear(),
            zonedOccurrence.getMonth(),
            zonedOccurrence.getDate(),
            timeFromDate.getHours(),
            timeFromDate.getMinutes(),
            timeFromDate.getSeconds(),
            timeFromDate.getMilliseconds(),
          );
          const nextFrom = occurrence.getTime();
          if (nextFrom === from) {
            continue;
          }
          const nextTo = nextFrom + occurrenceDuration;

          const occurrencesInDate = dateMap[_date] || [];
          dateMap[_date] = [
            ...occurrencesInDate,
            {
              ...firstOccurrence,
              from: nextFrom,
              to: nextTo,
            },
          ];
          // in case we want to merge overlapping occurrences
          // dateMap[_date] = _mergeOverlappedOccurrences(occurrencesInDate, {
          //   ...firstOccurrence,
          //   from: nextFrom,
          //   to: nextTo,
          // });
        }
      }
    });

    const _availabilities = Object.values(dateMap).flat();

    const _availabilityDocs = await Availability.insertMany(_availabilities);

    return sendResponse({
      res,
      statusCode: 200,
      message: "Availabilities created successfully",
      data: "Ok",
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: AVAILABILITY_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const declineLeaveRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const availability = await Availability.findOne({
      _id: id,
      isDeleted: false,
      isApproved: true,
      type: AvailabilityTypeEnum.UNAVAILABLE,
    });
    if (!availability) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Availability not found",
        code: AVAILABILITY_ERROR_CODE.AVAILABILITY_NOT_FOUND,
      });
    }
    availability.isApproved = false;
    await availability.save();
    return sendResponse({
      res,
      statusCode: 200,
      message: "Availability declined successfully",
      data: "Ok",
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: AVAILABILITY_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const deleteAvailability = async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    const { id } = req.params;
    const availability = await Availability.findOne({
      _id: id,
      isDeleted: false,
    });
    if (!availability?.from || availability.from < now) {
      return sendResponse({
        res,
        statusCode: 400,
        message: "Availability has already happened",
        code: AVAILABILITY_ERROR_CODE.AVAILABILITY_HAS_ALREADY_HAPPENED,
      });
    }
    if (!availability) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Availability not found",
        code: AVAILABILITY_ERROR_CODE.AVAILABILITY_NOT_FOUND,
      });
    }
    availability.isDeleted = true;
    await availability.save();
    return sendResponse({
      res,
      statusCode: 200,
      message: "Availability declined successfully",
      data: "Ok",
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: AVAILABILITY_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getAvailabilities = async (req: Request, res: Response) => {
  try {
    const { error, value: getAvailabilitiesData } = validateGetAvailabilities(
      req.query as unknown as GetAvailabilities,
    );
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: AVAILABILITY_ERROR_CODE.INVALID_REQUEST,
      });
    }
    const maxTo = addMonths(getAvailabilitiesData.to, 1).getTime();
    const clampTo = Math.min(getAvailabilitiesData.to, maxTo);
    const staffs = getAvailabilitiesData["staffs[]"];
    const availabilities = await Availability.find({
      ...((staffs?.length ?? 0) > 0 && {
        staff: { $in: staffs },
      }),
      ...(getAvailabilitiesData.type !== undefined && { type: getAvailabilitiesData.type }),
      ...(getAvailabilitiesData.isApproved !== undefined && {
        isApproved: getAvailabilitiesData.isApproved,
      }),
      from: { $lte: clampTo },
      to: { $gte: getAvailabilitiesData.from },
      isDeleted: false,
    });
    return sendResponse({
      res,
      statusCode: 200,
      message: "Availabilities fetched successfully",
      data: availabilities,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: AVAILABILITY_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const getStaffAvailabilities = async (req: Request, res: Response) => {
  try {
    const { error, value: getAvailabilitiesData } = validateGetAvailabilities(
      req.query as unknown as GetAvailabilities,
    );
    const staff = req.params.staffId;
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: AVAILABILITY_ERROR_CODE.INVALID_REQUEST,
      });
    }
    const maxTo = addMonths(getAvailabilitiesData.to, 1).getTime();
    const clampTo = Math.min(getAvailabilitiesData.to, maxTo);
    const availabilities = await Availability.find({
      staff: mongoose.Types.ObjectId.createFromHexString(staff),
      ...(getAvailabilitiesData.type !== undefined && { type: getAvailabilitiesData.type }),
      ...(getAvailabilitiesData.isApproved !== undefined && {
        isApproved: getAvailabilitiesData.isApproved,
      }),
      from: { $lte: clampTo },
      to: { $gte: getAvailabilitiesData.from },
      isDeleted: false,
    });
    return sendResponse({
      res,
      statusCode: 200,
      message: "Availabilities fetched successfully",
      data: availabilities,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: AVAILABILITY_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
