import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { logger as winstonLogger } from "../utils/logger";
import Shift, { IShift } from "../models/shifts/shiftModel";
import StaffSchedule from "../models/shifts/staffScheduleModel";
import worklogService from "../services/worklog/worklog";

const logger = winstonLogger.child({
  temp: "syncWorklog",
});

async function run(): Promise<void> {
  try {
    await connectDB();

    // Ensure Shift model is registered with the current connection
    // Access the model to trigger registration if it hasn't been registered yet
    const shiftModel = mongoose.models.Shift || Shift;
    logger.info(
      `Shift model registered: ${!!shiftModel}, Available models: ${Object.keys(mongoose.models).join(", ")}`,
    );

    // Populate using chained method (more reliable)
    const staffSchedules = await StaffSchedule.find({
      isDeleted: false,
      clocksInAt: { $ne: null },
      clocksOutAt: { $ne: null },
    }).populate("shift").lean();

    for (const staffSchedule of staffSchedules) {
      if (!staffSchedule.shift) {
        logger.warn(`Staff schedule ${staffSchedule._id} has no shift`);
        continue;
      }
      if (!staffSchedule.staff) {
        logger.warn(`Staff schedule ${staffSchedule._id} has no staff`);
        continue;
      }
      try {
        await worklogService.logWork({
          staff: (staffSchedule.staff as mongoose.Types.ObjectId)?.toString(),
          shift: staffSchedule.shift._id!.toString() || "",
          startTime: staffSchedule.timeFrom,
          endTime: staffSchedule.timeTo,
          timezone: (staffSchedule.shift as IShift).timezone || "Australia/Sydney",
        });
      } catch {}
    }
    logger.info("Worklogs synced successfully.");
  } catch (err) {
    logger.error("Sync worklogs failed:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run().then(() => logger.info("Sync worklogs completed."));
