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
import { startOfDay } from "date-fns";

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
        rrule.options.tzid = availabilityData.tz;
        rrule.options.dtstart = new Date(from);
        rrule.options.until = new Date(availabilityData.repeat.endsAt);
        rrule.options.byhour = [hourFrom];
        rrule.options.byminute = [minuteFrom];
        const occurrencesDates = rrule.all();
        for (const occurrence of occurrencesDates) {
          const nextFrom = occurrence.getTime();
          if (nextFrom === from) {
            continue;
          }
          const nextTo = nextFrom + occurrenceDuration;

          const occurrencesInDate = dateMap[_date] || [];
          dateMap[_date] = [...occurrencesInDate, {
            ...firstOccurrence,
            from: nextFrom,
            to: nextTo,
          }];
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
    const availabilities = await Availability.find({
      staff: mongoose.Types.ObjectId.createFromHexString(getAvailabilitiesData.staff),
      type: getAvailabilitiesData.type,
      isDeleted: false,
      isApproved: true,
      from: { $lte: getAvailabilitiesData.to },
      to: { $gte: getAvailabilitiesData.from },
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
