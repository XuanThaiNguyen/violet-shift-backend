import type { Request, Response } from "express";
import mongoose, { AnyBulkWriteOperation, MongooseBulkWriteResult, Types } from "mongoose";
import { sendResponse } from "../../utils/sendResponse";
import { logger as winstonLogger } from "../../utils/logger";
import {
  ClientSchedule as ClientScheduleType,
  IAddShift,
  ShiftTask as ShiftTaskType,
  StaffSchedule as StaffScheduleType,
  validateAddShift,
  validateBulkDeleteShift,
  validateBulkUpdateShift,
  validateUpdateShift,
} from "../../validations/shiftValidation";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import Shift from "../../models/shifts/shiftModel";
import ShiftRepeat, { IShiftRepeat } from "../../models/shifts/shiftRepeatModel";
import ClientSchedule from "../../models/shifts/clientScheduleModel";
import StaffSchedule from "../../models/shifts/staffScheduleModel";
import ShiftTask from "../../models/shifts/shiftTaskModel";
import Client from "../../models/clientModel";
import { AuthRequest } from "../../middleware/type";
import { nanoid } from "nanoid";
import { rrulestr } from "rrule";
import { TZDate } from "@date-fns/tz";
import { isValidTimeZone } from "../../utils/tz";

const controllerLogger = winstonLogger.child({
  controller: "shiftController",
});

type IRawAddShift = Omit<
  IAddShift,
  "repeat" | "clientSchedules" | "staffSchedules" | "tasks" | "instruction"
> & { repeat?: string };

// middleware to check if the user is assigned to the shift
export const isAssignedToShift = async (req: Request) => {
  try {
    const { shiftId } = req.params;
    const userId = (req as AuthRequest).userId;

    const schedule = await StaffSchedule.findOne({
      shift: shiftId,
      staff: userId,
      isDeleted: false,
    });
    return !!schedule;
  } catch (error) {
    return false;
  }
};

export const addShift = async (req: Request, res: Response) => {
  const logger = winstonLogger.child({
    controller: "shiftController",
    function: "addShift",
  });
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

    const {
      clientSchedules: rawClientSchedules,
      staffSchedules: rawStaffSchedules,
      tasks: rawTasks,
      repeat,
      ...shiftMetadata
    } = shiftData;
    const rawShiftMetadata: IRawAddShift = shiftMetadata;
    const clientSchedules = rawClientSchedules.map((clientSchedule) => {
      return {
        ...clientSchedule,
        repetitiveId: nanoid(10),
      };
    });
    const staffSchedules = rawStaffSchedules.map((staffSchedule) => {
      return {
        ...staffSchedule,
        repetitiveId: nanoid(10),
      };
    });
    const tasks = rawTasks.map((task) => {
      return {
        ...task,
        repetitiveId: nanoid(10),
      };
    });

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

          const rrule = rrulestr(repeat.pattern);

          const timeFromDate = new Date(shiftMetadata.timeFrom);
          const endDateDate = new Date(repeat.endDate);
          const hourFrom = timeFromDate.getUTCHours();
          const minuteFrom = timeFromDate.getUTCMinutes();
          rrule.origOptions.tzid = repeat.tz;
          rrule.origOptions.dtstart = timeFromDate;
          rrule.origOptions.until = endDateDate;
          rrule.origOptions.byhour = hourFrom;
          rrule.origOptions.byminute = minuteFrom;
          rrule.options.tzid = repeat.tz;
          rrule.options.dtstart = timeFromDate;
          rrule.options.until = endDateDate;
          rrule.options.byhour = [hourFrom];
          rrule.options.byminute = [minuteFrom];

          const occurrencesDates = rrule.all();
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

          for (const _occurrence of occurrencesDates) {
            const zonedOccurrence = new TZDate(_occurrence, repeat.tz);
            const occurrence = new Date(
              zonedOccurrence.getFullYear(),
              zonedOccurrence.getMonth(),
              zonedOccurrence.getDate(),
              timeFromDate.getHours(),
              timeFromDate.getMinutes(),
              timeFromDate.getSeconds(),
              timeFromDate.getMilliseconds(),
            );

            try {
              const nextTime = occurrence.getTime();
              if (nextTime === shiftMetadata.timeFrom) {
                continue;
              }
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
        const clientIds = Array.from(
          new Set(clientSchedules.map((clientSchedule) => clientSchedule.client)),
        );
        const [shiftDocs, clients] = await Promise.all([
          Shift.insertMany(occurrences, { session }),
          Client.find({ _id: clientIds }),
        ]);
        const _clientSchedules = clientScheduleReplicas
          .map((clientSchedule, idx) => {
            return clientSchedule.map((clientSchedule) => {
              return {
                ...clientSchedule,
                shift: shiftDocs[idx]._id as string,
              };
            });
          })
          .flat();
        const _staffSchedules = staffScheduleReplicas
          .map((staffSchedule, idx) => {
            return staffSchedule.map((staffSchedule) => {
              return {
                ...staffSchedule,
                shift: shiftDocs[idx]._id as string,
                clientNames: clients.map((client) => {
                  const clientName =
                    client.preferredName ||
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
          .map((task, idx) => {
            return task.map((task) => {
              return {
                ...task,
                shift: shiftDocs[idx]._id as string,
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
        logger.error(error.message, error.stack);
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
    const shift = await Shift.findOne(
      {
        _id: shiftId,
        isDeleted: false,
      },
      undefined,
      {
        lean: true,
      },
    ).populate([
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

export const deleteShift = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "deleteShift",
  });
  const INTERNAL_ERROR: Record<string, string> = {
    SHIFT_NOT_FOUND: "SHIFT_NOT_FOUND",
    SHIFT_HAPPENED: "SHIFT_HAPPENED",
  };
  try {
    const shiftId = req.params.shiftId;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // sanity check if shift happened or not
        const [shift, staffSchedule] = await Promise.all([
          Shift.findOneAndUpdate(
            { _id: shiftId },
            { $set: { isDeleted: true } },
            { new: true, session },
          ),
          StaffSchedule.findOne(
            { shift: shiftId, isDeleted: false, timeFrom: { $lt: Date.now() } },
            undefined,
            { lean: true },
          ),
        ]);

        if (!shift) {
          throw new Error(INTERNAL_ERROR.SHIFT_NOT_FOUND);
        }

        if (shift.timeFrom < Date.now() || staffSchedule) {
          throw new Error(INTERNAL_ERROR.SHIFT_HAPPENED);
        }

        const [clientSchedules, staffSchedules, tasks] = await Promise.all([
          ClientSchedule.updateMany(
            { shift: shiftId, isDeleted: false },
            { $set: { isDeleted: true } },
            { session },
          ),
          StaffSchedule.updateMany(
            { shift: shiftId, isDeleted: false },
            { $set: { isDeleted: true } },
            { session },
          ),
          ShiftTask.updateMany(
            { shift: shiftId, isDeleted: false },
            { $set: { isDeleted: true } },
            { session },
          ),
        ]);
      });
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch {}
      if ((error as Error).message === INTERNAL_ERROR.SHIFT_NOT_FOUND) {
        return sendResponse({
          res,
          statusCode: 404,
          message: "Shift not found",
          code: SHIFT_ERROR_CODE.SHIFT_NOT_FOUND,
        });
      }
      if ((error as Error).message === INTERNAL_ERROR.SHIFT_HAPPENED) {
        return sendResponse({
          res,
          statusCode: 400,
          message: "Shift has happened",
          code: SHIFT_ERROR_CODE.SHIFT_HAPPENED,
        });
      }
      if (error instanceof Error) {
        logger.error(error.message, error.stack);
      } else {
        logger.error("Unknown error", error);
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
      message: "Shift deleted successfully",
      data: "OK",
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error("Unknown error", error);
    }
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const bulkDeleteShift = async (req: Request, res: Response) => {
  const INTERNAL_ERROR: Record<string, string> = {
    SHIFT_NOT_FOUND: "SHIFT_NOT_FOUND",
    SHIFT_HAPPENED: "SHIFT_HAPPENED",
  };
  const logger = controllerLogger.child({
    function: "bulkDeleteShift",
  });
  try {
    const repeatId = req.params.repeatId;
    const { error, value: bulkDeleteData } = validateBulkDeleteShift(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }
    const { from, to } = bulkDeleteData;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // sanity check if the first shift happened or not
        const shifts = await Shift.find(
          {
            repeat: repeatId,
            isDeleted: false,
            timeFrom: { $gte: from, $lte: to },
          },
          {},
          { lean: true, sort: { timeFrom: 1 } },
        );
        if (!shifts || shifts.length === 0) {
          throw new Error(INTERNAL_ERROR.SHIFT_NOT_FOUND);
        }

        const earliestShift = shifts[0];

        const staffSchedule = await StaffSchedule.findOne(
          {
            shift: earliestShift._id,
            isDeleted: false,
            timeFrom: { $lt: Date.now() },
          },
          undefined,
          { lean: true },
        );
        if (staffSchedule) {
          throw new Error(INTERNAL_ERROR.SHIFT_HAPPENED);
        }
        const shiftIds = shifts.map((shift) => shift._id);

        // Now it's safe to delete the shifts
        await Promise.all([
          Shift.updateMany(
            { repeat: repeatId, isDeleted: false, timeFrom: { $gte: from, $lte: to } },
            { $set: { isDeleted: true } },
            { session },
          ),
          ClientSchedule.updateMany(
            { shift: { $in: shiftIds }, isDeleted: false },
            { $set: { isDeleted: true } },
            { session },
          ),
          StaffSchedule.updateMany(
            { shift: { $in: shiftIds }, isDeleted: false },
            { $set: { isDeleted: true } },
            { session },
          ),
          ShiftTask.updateMany(
            { shift: { $in: shiftIds }, isDeleted: false },
            { $set: { isDeleted: true } },
            { session },
          ),
        ]);
      });
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch {}

      if (error instanceof Error) {
        logger.error(error.message, error.stack);
      } else {
        logger.error("Unknown error", error);
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
      message: "Shifts deleted successfully",
      data: "OK",
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error("Unknown error", error);
    }
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const updateShift = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "updateShift",
  });
  const shiftId = req.params.shiftId;
  const { error, value: updateData } = validateUpdateShift(req.body);
  const INTERNAL_ERROR = {
    SHIFT_NOT_FOUND: "SHIFT_NOT_FOUND",
    SHIFT_HAPPENED: "SHIFT_HAPPENED",
    SHIFT_UPDATE_FAILED: "SHIFT_UPDATE_FAILED",
  };
  if (error) {
    return sendResponse({
      res,
      statusCode: 400,
      message: error.details[0].message,
      code: SHIFT_ERROR_CODE.INVALID_REQUEST,
    });
  }
  try {
    // sanity check if the shift happened or not or not found
    const [shift, happenedSchedule] = await Promise.all([
      Shift.findOne({ _id: shiftId, isDeleted: false }, undefined),
      StaffSchedule.findOne(
        { shift: shiftId, isDeleted: false, timeFrom: { $lte: Date.now() } },
        undefined,
        {
          lean: true,
        },
      ),
    ]);
    if (!shift) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Shift not found",
        code: SHIFT_ERROR_CODE.SHIFT_NOT_FOUND,
      });
    }

    if (shift.timeFrom < Date.now() || happenedSchedule) {
      return sendResponse({
        res,
        statusCode: 405,
        message: "Shift has happened",
        code: SHIFT_ERROR_CODE.SHIFT_HAPPENED,
      });
    }
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const { clientSchedules, staffSchedules, tasks, ...shiftMetadata } = updateData;

        const clientScheduleOps: AnyBulkWriteOperation<any>[] = [];
        const staffScheduleOps: AnyBulkWriteOperation<any>[] = [];
        const taskOps: AnyBulkWriteOperation<any>[] = [];

        clientSchedules?.add?.forEach((clientSchedule) => {
          clientScheduleOps.push({
            insertOne: {
              document: {
                client: clientSchedule.client,
                priceBook: clientSchedule.priceBook,
                fund: clientSchedule.fund,
                timeFrom: clientSchedule.timeFrom,
                timeTo: clientSchedule.timeTo,
                shift: shiftId,
                repetitiveId: nanoid(10),
              },
              timestamps: true,
            },
          });
        });
        staffSchedules?.add?.forEach((staffSchedule) => {
          staffScheduleOps.push({
            insertOne: {
              document: {
                staff: staffSchedule.staff,
                paymentMethod: staffSchedule.paymentMethod,
                timeFrom: staffSchedule.timeFrom,
                timeTo: staffSchedule.timeTo,
                shift: shiftId,
                repetitiveId: nanoid(10),
              },
              timestamps: true,
            },
          });
        });
        tasks?.add?.forEach((task) => {
          taskOps.push({
            insertOne: {
              document: {
                name: task.name,
                description: task.description,
                isMandatory: task.isMandatory,
                isCompleted: task.isCompleted,
                shift: shiftId,
                repetitiveId: nanoid(10),
              },
              timestamps: true,
            },
          });
        });

        clientSchedules?.update?.forEach((clientSchedule) => {
          clientScheduleOps.push({
            updateOne: {
              filter: { repetitiveId: clientSchedule.repetitiveId, shift: shiftId },
              update: {
                $set: {
                  timeFrom: clientSchedule.timeFrom,
                  timeTo: clientSchedule.timeTo,
                  client: clientSchedule.client,
                  priceBook: clientSchedule.priceBook,
                  fund: clientSchedule.fund,
                },
              },
              timestamps: true,
            },
          });
        });
        staffSchedules?.update?.forEach((staffSchedule) => {
          staffScheduleOps.push({
            updateOne: {
              filter: { staff: staffSchedule.staff, shift: shiftId },
              update: {
                $set: {
                  timeFrom: staffSchedule.timeFrom,
                  timeTo: staffSchedule.timeTo,
                  paymentMethod: staffSchedule.paymentMethod,
                },
              },
              timestamps: true,
            },
          });
        });
        tasks?.update?.forEach((task) => {
          taskOps.push({
            updateOne: {
              filter: { repetitiveId: task.repetitiveId, shift: shiftId },
              update: {
                $set: {
                  name: task.name,
                  description: task.description,
                  isMandatory: task.isMandatory,
                },
              },
              timestamps: true,
            },
          });
        });

        if (clientSchedules?.delete?.length > 0) {
          clientScheduleOps.push({
            deleteMany: {
              filter: { repetitiveId: { $in: clientSchedules.delete }, shift: shiftId },
            },
          });
        }
        if (staffSchedules?.delete?.length > 0) {
          staffScheduleOps.push({
            deleteMany: {
              filter: { staff: { $in: staffSchedules.delete }, shift: shiftId },
            },
          });
        }
        if (tasks?.delete?.length > 0) {
          taskOps.push({
            deleteMany: {
              filter: { repetitiveId: { $in: tasks.delete }, shift: shiftId },
            },
          });
        }

        // Update clientNames in StaffSchedule whenever clientSchedules change
        if (clientSchedules?.add || clientSchedules?.update || clientSchedules?.delete) {
          if (clientScheduleOps.length > 0) {
            await ClientSchedule.bulkWrite(clientScheduleOps, { session, ordered: false });
          }

          const allClientSchedules = await ClientSchedule.find(
            { shift: shiftId, isDeleted: false },
            { client: 1 },
            { session },
          ).lean();

          const clientIds = allClientSchedules.map((cs) => cs.client);
          let clientNames: string[] = [];

          if (clientIds.length > 0) {
            const clients = await Client.find(
              { _id: { $in: clientIds } },
              { firstName: 1, middleName: 1, lastName: 1, preferredName: 1 },
            ).lean();

            clientNames = clients.map(
              (client) =>
                client.preferredName ||
                `${client.firstName}${client.middleName ? ` ${client.middleName}` : ""} ${client.lastName}`,
            );
          }

          staffScheduleOps.push({
            updateMany: {
              filter: { shift: shiftId, isDeleted: false },
              update: { $set: { clientNames } },
            },
          });
        }

        const [shiftUpdate, staffScheduleOpsStatus, taskOpsStatus] = await Promise.all([
          shift.updateOne(
            {
              _id: shiftId,
              ...shiftMetadata,
            },
            { session, new: true },
          ),

          ...(staffScheduleOps?.length > 0
            ? [StaffSchedule.bulkWrite(staffScheduleOps, { session, ordered: false })]
            : []),
          ...(taskOps?.length > 0
            ? [ShiftTask.bulkWrite(taskOps, { session, ordered: false })]
            : []),
        ]);

        // TODO add checksum later, also optimize the code later
      });
    } catch (error) {
      try {
        await session.abortTransaction();
        await session.endSession();
      } catch {}

      if (error instanceof Error) {
        logger.error(error.message, error.stack);
      } else {
        logger.error("Unknown error", error);
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
      message: "Shift updated successfully",
      data: "OK",
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error("Unknown error", error);
    }
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const bulkUpdateShifts = async (req: Request, res: Response) => {
  const logger = winstonLogger.child({
    controller: "shiftController",
    function: "bulkUpdateShifts",
  });
  const internalError: Record<string, string> = {
    SHIFT_UPDATE_FAILED: "SHIFT_UPDATE_FAILED",
  };
  try {
    const repeatId = req.params.repeatId;
    const { error, value: updateShiftData } = validateBulkUpdateShift(req.body);
    if (error) {
      return sendResponse({
        res,
        statusCode: 400,
        message: error.details[0].message,
        code: SHIFT_ERROR_CODE.INVALID_REQUEST,
      });
    }
    const shiftData = updateShiftData.payload;
    const { from, to } = updateShiftData;
    const {
      clientSchedules: clientSchedulesUpdate,
      staffSchedules: staffSchedulesUpdate,
      tasks: tasksUpdate,
      ...shiftMetadata
    } = shiftData;

    const shiftDocs = await Shift.find({
      timeFrom: { $gte: from, $lte: to },
      repeat: repeatId,
    }).lean();
    const ids = shiftDocs.map((shift) => shift._id);
    const staffSchedules = await StaffSchedule.find({ shift: { $in: ids } }).lean();
    const ineligibleShifts: Record<string, boolean> = {};
    const now = Date.now();
    for (const schedule of staffSchedules) {
      const shiftId = schedule.shift.toString();
      if (ineligibleShifts[shiftId]) {
        continue;
      }
      ineligibleShifts[shiftId] = schedule.timeFrom < now;
    }

    const shifts = shiftDocs.filter(
      (shift) => !ineligibleShifts[(shift._id as mongoose.Types.ObjectId).toString()],
    );

    if (shifts.length === 0) {
      return sendResponse({
        res,
        statusCode: 404,
        message: "Shift not found",
        code: SHIFT_ERROR_CODE.SHIFT_NOT_FOUND,
      });
    }

    // define bulk write operations
    const shiftOps: AnyBulkWriteOperation<any>[] = [];
    const clientScheduleOps: AnyBulkWriteOperation<any>[] = [];
    const staffScheduleOps: AnyBulkWriteOperation<any>[] = [];
    const taskOps: AnyBulkWriteOperation<any>[] = [];

    // time-related variables
    const zonedFrom = new TZDate(shiftMetadata.timeFrom, shiftMetadata.timezone);
    const hourFrom = zonedFrom.getHours();
    const minuteFrom = zonedFrom.getMinutes();
    const secondFrom = zonedFrom.getSeconds();
    const millisecondFrom = zonedFrom.getMilliseconds();
    const shiftDuration = shiftMetadata.timeTo - shiftMetadata.timeFrom;

    for (const shift of shifts) {
      const shiftId = shift._id.toString();
      const tz = isValidTimeZone(shiftMetadata.timezone)
        ? shiftMetadata.timezone
        : Intl.DateTimeFormat().resolvedOptions().timeZone;
      let zonedDate = new TZDate(shift.timeFrom, tz);
      zonedDate.setHours(hourFrom);
      zonedDate.setMinutes(minuteFrom);
      zonedDate.setSeconds(secondFrom);
      zonedDate.setMilliseconds(millisecondFrom);
      const newFrom = zonedDate.getTime();
      const newTo = newFrom + shiftDuration;

      shiftOps.push({
        updateOne: {
          filter: { _id: shiftId },
          update: {
            $set: {
              ...shiftMetadata,
              timeFrom: newFrom,
              timeTo: newTo,
            },
          },
        },
      });

      clientSchedulesUpdate?.add?.forEach((clientSchedule) => {
        const duration = clientSchedule.timeTo - clientSchedule.timeFrom;
        const zonedClientDataFrom = new TZDate(clientSchedule.timeFrom, tz);
        const zonedClientFrom = new TZDate(shift.timeFrom, tz);

        const clientHourFrom = zonedClientDataFrom.getHours();
        const clientMinuteFrom = zonedClientDataFrom.getMinutes();
        const clientSecondFrom = zonedClientDataFrom.getSeconds();
        const clientMillisecondFrom = zonedClientDataFrom.getMilliseconds();

        zonedClientFrom.setHours(clientHourFrom);
        zonedClientFrom.setMinutes(clientMinuteFrom);
        zonedClientFrom.setSeconds(clientSecondFrom);
        zonedClientFrom.setMilliseconds(clientMillisecondFrom);
        const newClientFrom = zonedClientFrom.getTime();
        const newClientTo = newClientFrom + duration;
        clientScheduleOps.push({
          insertOne: {
            document: {
              client: clientSchedule.client,
              priceBook: clientSchedule.priceBook,
              fund: clientSchedule.fund,
              timeFrom: newClientFrom,
              timeTo: newClientTo,
              shift: shiftId,
              repetitiveId: nanoid(10),
            },
            timestamps: true,
          },
        });
      });
      staffSchedulesUpdate?.add?.forEach((staffSchedule) => {
        const duration = staffSchedule.timeTo - staffSchedule.timeFrom;
        const zonedStaffDataFrom = new TZDate(staffSchedule.timeFrom, tz);
        const zonedStaffFrom = new TZDate(shift.timeFrom, tz);

        const staffHourFrom = zonedStaffDataFrom.getHours();
        const staffMinuteFrom = zonedStaffDataFrom.getMinutes();
        const staffSecondFrom = zonedStaffDataFrom.getSeconds();
        const staffMillisecondFrom = zonedStaffDataFrom.getMilliseconds();

        zonedStaffFrom.setHours(staffHourFrom);
        zonedStaffFrom.setMinutes(staffMinuteFrom);
        zonedStaffFrom.setSeconds(staffSecondFrom);
        zonedStaffFrom.setMilliseconds(staffMillisecondFrom);
        const newStaffFrom = zonedStaffFrom.getTime();
        const newStaffTo = newStaffFrom + duration;
        staffScheduleOps.push({
          insertOne: {
            document: {
              staff: staffSchedule.staff,
              paymentMethod: staffSchedule.paymentMethod,
              timeFrom: newStaffFrom,
              timeTo: newStaffTo,
              shift: shiftId,
              repetitiveId: nanoid(10),
            },
            timestamps: true,
          },
        });
      });
      tasksUpdate?.add?.forEach((task) => {
        taskOps.push({
          insertOne: {
            document: {
              name: task.name,
              description: task.description,
              isMandatory: task.isMandatory,
              isCompleted: task.isCompleted,
              shift: shiftId,
              repetitiveId: nanoid(10),
            },
            timestamps: true,
          },
        });
      });

      clientSchedulesUpdate?.update?.forEach((clientSchedule) => {
        const duration = clientSchedule.timeTo - clientSchedule.timeFrom;
        const zonedClientDataFrom = new TZDate(clientSchedule.timeFrom, tz);
        const zonedClientFrom = new TZDate(shift.timeFrom, tz);

        const clientHourFrom = zonedClientDataFrom.getHours();
        const clientMinuteFrom = zonedClientDataFrom.getMinutes();
        const clientSecondFrom = zonedClientDataFrom.getSeconds();
        const clientMillisecondFrom = zonedClientDataFrom.getMilliseconds();

        zonedClientFrom.setHours(clientHourFrom);
        zonedClientFrom.setMinutes(clientMinuteFrom);
        zonedClientFrom.setSeconds(clientSecondFrom);
        zonedClientFrom.setMilliseconds(clientMillisecondFrom);
        const newClientFrom = zonedClientFrom.getTime();
        const newClientTo = newClientFrom + duration;
        clientScheduleOps.push({
          updateOne: {
            filter: { repetitiveId: clientSchedule.repetitiveId, shift: shiftId },
            update: {
              $set: {
                timeFrom: newClientFrom,
                timeTo: newClientTo,
                client: clientSchedule.client,
                priceBook: clientSchedule.priceBook,
                fund: clientSchedule.fund,
              },
            },
            timestamps: true,
          },
        });
      });
      staffSchedulesUpdate?.update?.forEach((staffSchedule) => {
        const duration = staffSchedule.timeTo - staffSchedule.timeFrom;
        const zonedStaffDataFrom = new TZDate(staffSchedule.timeFrom, tz);
        const zonedStaffFrom = new TZDate(shift.timeFrom, tz);

        const staffHourFrom = zonedStaffDataFrom.getHours();
        const staffMinuteFrom = zonedStaffDataFrom.getMinutes();
        const staffSecondFrom = zonedStaffDataFrom.getSeconds();
        const staffMillisecondFrom = zonedStaffDataFrom.getMilliseconds();

        zonedStaffFrom.setHours(staffHourFrom);
        zonedStaffFrom.setMinutes(staffMinuteFrom);
        zonedStaffFrom.setSeconds(staffSecondFrom);
        zonedStaffFrom.setMilliseconds(staffMillisecondFrom);
        const newStaffFrom = zonedStaffFrom.getTime();
        const newStaffTo = newStaffFrom + duration;
        staffScheduleOps.push({
          updateOne: {
            filter: { staff: staffSchedule.staff, shift: shiftId },
            update: {
              $set: {
                timeFrom: newStaffFrom,
                timeTo: newStaffTo,
                paymentMethod: staffSchedule.paymentMethod,
              },
            },
            timestamps: true,
          },
        });
      });
      tasksUpdate?.update?.forEach((task) => {
        taskOps.push({
          updateOne: {
            filter: { repetitiveId: task.repetitiveId, shift: shiftId },
            update: {
              $set: {
                name: task.name,
                description: task.description,
                isMandatory: task.isMandatory,
              },
            },
            timestamps: true,
          },
        });
      });

      if (clientSchedulesUpdate?.delete?.length > 0) {
        clientScheduleOps.push({
          deleteMany: {
            filter: { repetitiveId: { $in: clientSchedulesUpdate.delete }, shift: shiftId },
          },
        });
      }
      if (staffSchedulesUpdate?.delete?.length > 0) {
        staffScheduleOps.push({
          deleteMany: {
            filter: { staff: { $in: staffSchedulesUpdate.delete }, shift: shiftId },
          },
        });
      }
      if (tasksUpdate?.delete?.length > 0) {
        taskOps.push({
          deleteMany: {
            filter: { repetitiveId: { $in: tasksUpdate.delete }, shift: shiftId },
          },
        });
      }
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        const [] = await Promise.all([
          Shift.bulkWrite(shiftOps, { session }),
          ClientSchedule.bulkWrite(clientScheduleOps, { session }),
          StaffSchedule.bulkWrite(staffScheduleOps, { session }),
          ShiftTask.bulkWrite(taskOps, { session }),
        ]);
        await session.commitTransaction();
      });
    } catch (error) {
      try {
        await session.abortTransaction();
      } catch (error) {}
      if (error instanceof Error) {
        logger.error(error.message, error.stack);
      } else {
        logger.error("Unknown error", error);
      }
      return sendResponse({
        res,
        statusCode: 500,
        message: "Internal server error",
        code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
      });
    } finally {
      session.endSession();
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error("Unknown error", error);
    }
    return sendResponse({
      res,
      statusCode: 500,
      message: "Internal server error",
      code: SHIFT_ERROR_CODE.INTERNAL_SERVER_ERROR,
    });
  }
};
