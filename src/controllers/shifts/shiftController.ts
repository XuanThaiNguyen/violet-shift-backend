import type { Request, Response } from "express";
import mongoose, { AnyBulkWriteOperation, MongooseBulkWriteResult } from "mongoose";
import { sendResponse } from "../../utils/sendResponse";
import { logger as winstonLogger } from "../../utils/logger";
import {
  ClientSchedule as ClientScheduleType,
  IAddShift,
  ShiftTask as ShiftTaskType,
  StaffSchedule as StaffScheduleType,
  validateAddShift,
  validateBulkDeleteShift,
  validateUpdateShift,
} from "../../validations/shiftValidation";
import { SHIFT_ERROR_CODE } from "../../constants/errorCode";
import Shift from "../../models/shifts/shiftModel";
import ShiftRepeat from "../../models/shifts/shiftRepeatModel";
import ClientSchedule from "../../models/shifts/clientScheduleModel";
import StaffSchedule from "../../models/shifts/staffScheduleModel";
import ShiftTask from "../../models/shifts/shiftTaskModel";
import Client from "../../models/clientModel";
import { AuthRequest } from "../../middleware/type";
import { nanoid } from "nanoid";
import { rrulestr } from "rrule";

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
          rrule.options.tzid = repeat.tz;
          rrule.options.dtstart = new Date(shiftMetadata.timeFrom);
          rrule.options.until = new Date(repeat.endDate);

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

          for (const occurrence of occurrencesDates) {
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
              shiftType: shiftMetadata.shiftType,
              additionalShiftTypes: shiftMetadata.additionalShiftTypes,
              allowances: shiftMetadata.allowances,
              mileageInvoicing: shiftMetadata.mileageInvoicing,
              shiftMileage: shiftMetadata.shiftMileage,
              additionalCost: shiftMetadata.additionalCost,
              ignoreStaffCount: shiftMetadata.ignoreStaffCount,
              confirmationRequired: shiftMetadata.confirmationRequired,
              acceptedDeclinable: shiftMetadata.acceptedDeclinable,
              timeFrom: shiftMetadata.timeFrom,
              timeTo: shiftMetadata.timeTo,
              breakTime: shiftMetadata.breakTime,
              address: shiftMetadata.address,
              unitNumber: shiftMetadata.unitNumber,
              bonus: shiftMetadata.bonus,
              dropOffAddress: shiftMetadata.dropOffAddress,
              dropOffUnitNumber: shiftMetadata.dropOffUnitNumber,

              mileageCap: shiftMetadata.mileageCap,
              mileage: shiftMetadata.mileage,
              isCompanyVehicle: shiftMetadata.isCompanyVehicle,
              clientClockOutRequired: shiftMetadata.clientClockOutRequired,
              staffClockOutRequired: shiftMetadata.staffClockOutRequired,

              instruction: shiftMetadata.instruction,
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

export const bulkUpdateShift = async (req: Request, res: Response) => {
  const logger = controllerLogger.child({
    function: "bulkUpdateShift",
  });
  const { error, value: bulkUpdateData } = validateBulkUpdateShift(req.body);
  if (error) {
    return sendResponse({
      res,
      statusCode: 400,
      message: error.details[0].message,
      code: SHIFT_ERROR_CODE.INVALID_REQUEST,
    });
  }
}
