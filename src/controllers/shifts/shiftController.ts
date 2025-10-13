import type { NextFunction, Request, Response } from "express";
import mongoose, { PipelineStage, Types } from "mongoose";
import { API_STATUS } from "../../constants/apiStatus";
import { sendResponse } from "../../utils/sendResponse";
import {
  ClientSchedule as ClientScheduleType,
  IAddShift,
  IQueryShift,
  ShiftTask as ShiftTaskType,
  StaffSchedule as StaffScheduleType,
  validateAddShift,
  validateQueryShift,
} from "../../validations/shiftValidation";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import { CronExpressionParser } from "cron-parser";
import Shift, { IShift } from "../../models/shifts/shiftModel";
import ShiftRepeat from "../../models/shifts/shiftRepeatModel";
import ClientSchedule from "../../models/shifts/clientScheduleModel";
import StaffSchedule from "../../models/shifts/staffScheduleModel";
import ShiftTask from "../../models/shifts/shiftTaskModel";
import Client from "../../models/clientModel";
import { AuthRequest } from "../../middleware/type";

type IRawAddShift = Omit<
  IAddShift,
  "repeat" | "clientSchedules" | "staffSchedules" | "tasks" | "instruction"
> & { repeat?: string };

// middleware to check if the user is assigned to the shift
export const isAssignedToShift = async (req: Request) => {

  const { shiftId } = req.params;
  const userId = (req as AuthRequest).userId;

  const schedule = await StaffSchedule.findOne({ shift: shiftId, user: userId });
  return !!schedule;
};

export const addShift = async (req: Request, res: Response) => {
  const internalError: Record<string, string> = {
    SHIFT_REPEAT_CREATE_FAILED: "SHIFT_REPEAT_CREATE_FAILED",
    SHIFT_CREATE_FAILED: "SHIFT_CREATE_FAILED",
  };
  try {
    const { error, value: shiftData } = validateAddShift(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }

    let repeatDoc: any = null;

    const { clientSchedules, staffSchedules, tasks, repeat, ...shiftMetadata } = shiftData;
    const rawShiftMetadata: IRawAddShift = shiftMetadata;

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const occurrences: IRawAddShift[] = [rawShiftMetadata];
        const clientScheduleReplicas: Array<ClientScheduleType[]> = [clientSchedules];
        const staffScheduleReplicas: Array<StaffScheduleType[]> = [staffSchedules];
        const taskReplicas: Array<ShiftTaskType[]> = [tasks];
        if (repeat) {
          repeatDoc = await ShiftRepeat.insertOne(
            {
              pattern: repeat.pattern,
              endDate: repeat.endDate,
              tz: repeat.tz,
            },
            { session },
          );

          rawShiftMetadata.repeat = repeatDoc._id;

          const interval = CronExpressionParser.parse(repeat.pattern, {
            currentDate: new Date(shiftMetadata.timeFrom),
            endDate: new Date(repeat.endDate),
            tz: repeat.tz,
          });
          // time and location period
          const fromToOffset = shiftMetadata.timeTo - shiftMetadata.timeFrom;

          const clientOffsets = clientSchedules.map((clientSchedule) => {
            const fromToOffset = clientSchedule.timeTo - clientSchedule.timeFrom;
            const clientOffset = clientSchedule.timeFrom - shiftMetadata.timeFrom;

            return {
              fromToOffset,
              clientOffset,
            };
          });

          const staffOffsets = staffSchedules.map((staffSchedule) => {
            const fromToOffset = staffSchedule.timeTo - staffSchedule.timeFrom;
            const staffOffset = staffSchedule.timeFrom - shiftMetadata.timeFrom;
            return {
              fromToOffset,
              staffOffset,
            };
          });

          while (true) {
            try {
              const nextTime = interval.next().toDate().getTime();
              const newShift: IRawAddShift = {
                ...rawShiftMetadata,
                timeFrom: nextTime,
                timeTo: nextTime + fromToOffset,
                //   repeat: repeatDoc._id,
              };
              occurrences.push(newShift);
              clientScheduleReplicas.push(
                clientSchedules.map((clientSchedule, idx) => {
                  const clientOffset = clientOffsets[idx].clientOffset;
                  const fromToOffset = clientOffsets[idx].fromToOffset;
                  const clientTimeFrom = nextTime + clientOffset;
                  return {
                    ...clientSchedule,
                    timeFrom: clientTimeFrom,
                    timeTo: clientTimeFrom + fromToOffset,
                  };
                }),
              );
              staffScheduleReplicas.push(
                staffSchedules.map((staffSchedule, idx) => {
                  const staffOffset = staffOffsets[idx].staffOffset;
                  const fromToOffset = staffOffsets[idx].fromToOffset;
                  const staffTimeFrom = nextTime + staffOffset;
                  return {
                    ...staffSchedule,
                    timeFrom: staffTimeFrom,
                    timeTo: staffTimeFrom + fromToOffset,
                  };
                }),
              );
              taskReplicas.push(
                tasks.map((task) => ({
                  ...task,
                })),
              );
            } catch (err: any) {
              break;
            }
          }
        }
        // Insert shifts and get clients
        const [shiftDocs, clients] = await Promise.all([
          Shift.insertMany(occurrences, { session }),
          Client.find({ _id: clientSchedules.map((clientSchedule) => clientSchedule.client) }),
        ]);
        const _clientSchedules = clientScheduleReplicas
          .map((clientSchedule) => {
            return clientSchedule.map((clientSchedule) => {
              return {
                ...clientSchedule,
                shift: shiftDocs[0]._id as string,
              };
            });
          })
          .flat();
        const _staffSchedules = staffScheduleReplicas
          .map((staffSchedule) => {
            return staffSchedule.map((staffSchedule) => {
              return {
                ...staffSchedule,
                shift: shiftDocs[0]._id as string,
                clientNames: clients.map((client) => {
                  const clientName =
                    client.displayName ||
                    (client.middleName
                      ? `${client.firstName} ${client.middleName} ${client.lastName}`
                      : `${client.firstName} ${client.lastName}`);
                  return clientName;
                }),
              };
            });
          })
          .flat();
        const _tasks = taskReplicas
          .map((task) => {
            return task.map((task) => {
              return {
                ...task,
                shift: shiftDocs[0]._id as string,
              };
            });
          })
          .flat();
        await Promise.all([
          ClientSchedule.insertMany(_clientSchedules, { session }),
          StaffSchedule.insertMany(_staffSchedules, { session }),
          ShiftTask.insertMany(_tasks, { session }),
        ]);
      });
    } catch (error: any) {
      // make sure to abort transaction if error is thrown
      try {
        await session.abortTransaction();
      } catch {}

      if (error?.message?.includes("CronDate")) {
        return sendResponse({
          res,
          statusCode: 400,
          message: error.message,
          code: SHIFT_ERROR_CODE.INVALID_REQUEST,
        });
      }

      if (internalError[error.message]) {
        console.error(error);
      }

      return sendResponse({
        res,
        statusCode: 500,
        message: "Internal server error",
        code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
      });
    } finally {
      await session.endSession();
    }
    return sendResponse({
      res,
      statusCode: 200,
      message: "Shift created successfully",
      data: "ok",
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

export const getShift = async (req: Request, res: Response) => {
  try {
    const shiftId = req.params.shiftId;
    console.log("🚀 ~ shiftId:", shiftId)
    const shift = await Shift.findOne({ _id: shiftId }).populate([
      {
        path: "repeat",
      },
    ]);
    if (!shift) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Shift not found",
        code: SHIFT_ERROR_CODE.SHIFT_NOT_FOUND,
      });
    }
    return sendResponse({
      res,
      statusCode: 200,
      message: "Shift fetched successfully",
      data: shift,
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
