import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { logger as winstonLogger } from "../utils/logger";
import User from "../models/userModel";

const logger = winstonLogger.child({
  seed: "updateUsers",
});

async function run(): Promise<void> {
  try {
    await connectDB();

    await User.updateMany({}, [
      {
        $set: {
          fullName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$firstName", ""] },
                  {
                    $cond: [{$gt: [{$ifNull: ["$firstName", ""]}, ""] }, " ", ""],
                  },
                  { $ifNull: ["$middleName", ""] },
                  {
                    $cond: [{$gt: [{$ifNull: ["$middleName", ""]}, ""] }, " ", ""],
                  },
                  { $ifNull: ["$lastName", ""] },
                ],
              },
            },
          },
        },
      },
    ]);
    logger.info("Updated full name for users completed.");
  } catch (err) {
    logger.error("Update full name for users failed:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run().then(() => logger.info("Seed roles completed."));
