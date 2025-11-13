import type { Request, Response } from "express";
import mongoose from "mongoose";
import { FUNDING_ERROR_CODE } from "../constants/errorCode";
import { Funding } from "../models/fundingModel";
import { sendResponse } from "../utils/sendResponse";
import { validateCreateAvailability } from "../validations/availabilityValidation";
import { rrulestr } from "rrule";

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

    const rrules = availabilityData.timeSegments.map((timeSegment) => {
      const rrule = rrulestr(availabilityData);
      rrule.options.tzid = availabilityData.tz;
      const toHour = Math.floor(timeSegment.to / 60);
      const toMinute = timeSegment.to % 60;
      const fromHour = Math.floor(timeSegment.from / 60);
      const fromMinute = timeSegment.from % 60;
      const start
      rrule.options.dtstart = new Date(availabilityData.tz, fromHour, fromMinute);
      rrule.options.until = new Date(availabilityData.tz, toHour, toMinute);
      return rrule;
    });

    if (existing) {
      return sendResponse({
        res,
        statusCode: 400,
        code: FUNDING_ERROR_CODE.FUNDING_IS_EXISTING,
        message: "Funding name already exists for this user.",
      });
    }

    if (fundingData.isDefault) {
      await Funding.updateMany({ client: fundingData.client }, { $set: { isDefault: false } });
    }

    const newFunding = await Funding.create(fundingData);
    const { _id, ...rest } = newFunding.toObject();

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
