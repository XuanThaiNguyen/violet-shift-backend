import type { Request, Response } from "express";
import mongoose from "mongoose";
import { FUNDING_ERROR_CODE } from "../constants/errorCode";
import { Funding } from "../models/fundingModel";
import { sendResponse } from "../utils/sendResponse";
import { validateCreateAvailability } from "../validations/availabilityValidation";
import { rrulestr } from "rrule";
import { IAvailability } from "../models/availability";
import { I } from "@faker-js/faker/dist/airline-DF6RqYmq";
import { TZDate } from "@date-fns/tz";
import { minutesToTime, toMinuteOfDay } from "../utils/worklog";
import { startOfDay } from "date-fns";


export const _mergeOverlappedOccurrences = (occurrences: IAvailability[], newOccurrence: IAvailability) => {
  const sortedOccurrences = occurrences.sort((a, b) => a.from - b.from);
  let isOverlapped = false;
  sortedOccurrences.forEach(occurrence => {
    if (
      
    ) {
      occurrence.from = Math.min(occurrence.from, newOccurrence.from);
      occurrence.to = Math.max(occurrence.to, newOccurrence.to);
    }


  });

  return occurrences;
};

export const addAvailabilities = async (req: Request, res: Response) => {
  try {
    const { error, value: availabilityData } = validateCreateAvailability(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: FUNDING_ERROR_CODE.INVALID_REQUEST,
      });
    }

    const date = new TZDate(new Date(availabilityData.date), availabilityData.tz);
    const dateMap: Record<string, IAvailability[]> = {};
    availabilityData.timeSegments.forEach(
      (curr) => {
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
          return ;
        }
        

        const firstOccurrence: IAvailability = {
          type: availabilityData.type,
          from: from,
          to: to,
          isApproved: true,
          isDeleted: false,
          note: availabilityData.note,
        };
        const _date = startOfDay(fromDate).getTime();
        const _dateMap = dateMap[_date] || [];
      
        
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
            _occurrences.push({
              ...firstOccurrence,
              from: nextFrom,
              to: nextTo,
            });
          }
        }
      },
      [],
    );
    

    return sendResponse({
      res,
      statusCode: 201,
      message: "Funding created successfully",
      data: { id: _id, ...rest },
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: FUNDING_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
