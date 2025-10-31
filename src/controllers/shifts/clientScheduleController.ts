import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import ClientSchedule from "../../models/shifts/clientScheduleModel";

export const getSchedulesByShiftId = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    const _schedules = await ClientSchedule.find(
      { shift: shiftId, isDeleted: false },
      {},
      {
        populate: [
          {
            path: "client",
            select: [
              "firstName",
              "lastName",
              "middleName",
              "preferredName",
              "email",
              "phoneNumber",
              "mobileNumber",
              "address",
              "apartmentNumber",
              "languages",
            ],
          },
          {
            path: "priceBook",
            select: ["name"],
          },
          {
            path: "fund",
            select: ["name", "startDate", "expireDate", "amount", "balance", "isDefault"],
          },
        ],
        lean: true,
      },
    );
    const schedules = _schedules.map((schedule) => {
      const priceBookId =
        typeof schedule.priceBook === "object" && "_id" in schedule.priceBook
          ? schedule.priceBook._id
          : schedule.priceBook;

      const fundId =
        typeof schedule.fund === "object" && "_id" in schedule.fund
          ? schedule.fund._id
          : schedule.fund;

      return {
        ...schedule,
        id: schedule._id,
        priceBook: {
          ...schedule.priceBook,
          id: priceBookId,
        },
        fund: {
          ...schedule.fund,
          id: fundId,
        },
      };
    });
    return sendResponse({
      res,
      statusCode: 200,
      message: "Schedules fetched successfully",
      data: schedules,
    });
  } catch (error) {
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
