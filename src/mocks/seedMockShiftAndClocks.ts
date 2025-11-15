import "dotenv/config";
import { connectDB, disconnectDB } from "../config/database";
import { logger as winstonLogger } from "../utils/logger";
import User from "../models/userModel";
import { faker } from "@faker-js/faker";
import { addHours } from "date-fns";
import { IAddShift } from "../validations/shiftValidation";
import Shift, { Allowances, ShiftTypes } from "../models/shifts/shiftModel";
import mongoose from "mongoose";
import { PriceBook } from "../models/priceBookModel";
import { Funding } from "../models/fundingModel";
import ClientSchedule from "../models/shifts/clientScheduleModel";
import StaffSchedule from "../models/shifts/staffScheduleModel";

const logger = winstonLogger.child({
  seed: "seedMockShiftAndClocks",
});

async function run(): Promise<void> {
  try {
    await connectDB();
    const now = Date.now();
    const args = process.argv.slice(2);
    let staffEmail = "";
    let dateFrom = now - 86400000;
    let dateTo = now + 86400000;
    let clientId = "";
    let shiftCount = 3;

    for (const arg of args) {
      if (arg.startsWith("staffEmail=")) {
        staffEmail = arg.split("=")[1];
      } else if (arg.startsWith("dateFrom=")) {
        const value = arg.split("=")[1];
        dateFrom = isNaN(+value) ? now - 86400000 : parseInt(value);
      } else if (arg.startsWith("dateTo=")) {
        const value = arg.split("=")[1];
        dateTo = isNaN(+value) ? now + 86400000 : parseInt(value);
      } else if (arg.startsWith("clientId=")) {
        clientId = arg.split("=")[1];
      } else if (arg.startsWith("shiftCount=")) {
        const value = arg.split("=")[1];
        shiftCount = isNaN(+value) && +value > 1 ? 3 : parseInt(value);
      }
    }

    let staff;
    if (staffEmail) {
      staff = await User.findOne({ email: staffEmail });
    }
    if (!staff) {
      const staffs = await User.find();
      staff = staffs[Math.floor(Math.random() * 10000) % staffs.length];
    }

    const clientIds = [
      "690b79e3ddd8befeefc4b57e",
      "690b79e2ddd8befeefc4b577",
      "690b78d3d51e3f76c20089fd",
    ];
    if (!clientId) {
      clientId = clientIds[Math.floor(Math.random() * 10000) % clientIds.length];
    }

    const [priceBooks, fundings] = await Promise.all([PriceBook.find({}), Funding.find({})]);

    const timeFroms = faker.date.betweens({
      from: dateFrom,
      to: dateTo,
      count: shiftCount,
    }).map((time) => {
      const unixTimestamp = time.getTime();
      const roundedMinuteTimestamp = Math.floor(unixTimestamp / 60000) * 60000;
      return new Date(roundedMinuteTimestamp);
    });

    const timeTos = timeFroms.map((timeFrom) => {
      const hourOffset = faker.number.int({ min: 1, max: 10 });
      return addHours(timeFrom, hourOffset);
    });

    const _shifts: IAddShift[] = Array.from({ length: shiftCount }, (_, index) => {
      const randomPriceBook = faker.helpers.arrayElement(priceBooks);
      const randomFunding = faker.helpers.arrayElement(fundings);

      return {
        clientSchedules: [
          {
            client: clientId,
            timeFrom: timeFroms[index].getTime(),
            timeTo: timeTos[index].getTime(),
            priceBook: randomPriceBook._id!.toString(),
            fund: randomFunding._id!.toString(),
          },
        ],
        staffSchedules: [
          {
            staff: staff._id,
            paymentMethod: "default",
            timeFrom: timeFroms[index].getTime(),
            timeTo: timeTos[index].getTime(),
          },
        ],
        instruction: faker.lorem.sentence(),
        tasks: [],
        shiftType: faker.helpers.arrayElement(ShiftTypes),
        additionalShiftTypes: faker.helpers.arrayElements(ShiftTypes, { min: 1, max: 3 }),
        allowances: faker.helpers.arrayElements(Allowances, { min: 0, max: 3 }),
        mileageInvoicing: [],
        shiftMileage: faker.number.int({ min: 1, max: 100 }),
        additionalCost: faker.number.int({ min: 1, max: 100 }),
        ignoreStaffCount: faker.datatype.boolean(),
        confirmationRequired: faker.datatype.boolean(),
        acceptedDeclinable: faker.datatype.boolean(),
        timeFrom: timeFroms[index].getTime(),
        timeTo: timeTos[index].getTime(),
        breakTime: faker.number.int({ min: 1, max: 100 }),
        address: faker.location.streetAddress(),
        unitNumber: faker.location.buildingNumber(),
        bonus: faker.number.int({ min: 1, max: 100 }),
        dropOffAddress: faker.location.streetAddress(),
        dropOffUnitNumber: faker.location.buildingNumber(),
        mileageCap: faker.number.int({ min: 1, max: 100 }),
        mileage: faker.number.int({ min: 1, max: 100 }),
        isCompanyVehicle: faker.datatype.boolean(),
        clientClockOutRequired: false,
        staffClockOutRequired: false,
        timezone: "Australia/Sydney",
      };
    });

    const addShiftProcesses: Array<() => Promise<void>> = _shifts.map((_shift) => {
      return async () => {
        const transaction = await mongoose.startSession();
        transaction.startTransaction();
        try {
          const { clientSchedules, staffSchedules, tasks, repeat, ...shiftMetadata } = _shift;
          const shift = await Shift.create(shiftMetadata);
          if (!shift) {
            logger.error("Failed to create shift", { shift: _shift });
            await transaction.abortTransaction();
            transaction.endSession();
            return;
          }
          const shiftId = (shift._id as mongoose.Types.ObjectId).toString();
          logger.info(`Shift created at ${new Date(_shift.timeFrom).toISOString()} with id ${shiftId}`);
          const addedClientSchedule = await ClientSchedule.create({
            ...clientSchedules[0],
            shift: shiftId,
            repetitiveId: faker.string.nanoid(10),
          });
          if (!addedClientSchedule) {
            logger.error("Failed to create client schedule", {
              clientSchedule: clientSchedules[0],
            });
            await transaction.abortTransaction();
            transaction.endSession();
            return;
          }
          logger.info(`Client schedule created at ${new Date(clientSchedules[0].timeFrom).toISOString()} with id ${addedClientSchedule._id}`);
          const addedStaffSchedule = await StaffSchedule.create({
            ...staffSchedules[0],
            shift: shiftId,
            clocksInAt: staffSchedules[0].timeFrom,
            clocksOutAt: clientSchedules[0].timeTo,
            repetitiveId: faker.string.nanoid(10),
          });
          if (!addedStaffSchedule) {
            logger.error("Failed to create staff schedule", { staffSchedule: staffSchedules[0] });
            await transaction.abortTransaction();
            transaction.endSession();
            return;
          }
          logger.info(`Staff schedule created at ${new Date(staffSchedules[0].timeFrom).toISOString()} with id ${addedStaffSchedule._id}`);
          await transaction.commitTransaction();
          transaction.endSession();
          
        } catch (error) {
          logger.error(`Failed to add shift at ${new Date(_shift.timeFrom).toISOString()}`, { error });
          await transaction.abortTransaction();
          transaction.endSession();
        }
      };
    });

    for (const addShiftProcess of addShiftProcesses) {
      await addShiftProcess();
    }

    logger.info("Roles seeded/updated successfully.");
  } catch (err) {
    logger.error("Seed roles failed:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run().then(() => logger.info("Seed roles completed."));
