import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import { logger as winstonLogger } from "../utils/logger";
import Role from "../models/roleModel";
import { ROLES } from "../constants/roles";

const logger = winstonLogger.child({
  seed: "addRoles",
});

async function run(): Promise<void> {
  try {
    await connectDB();

    for (const role of ROLES) {
      try {
        await Role.updateOne(
          { name: role.name },
          {
            $set: {
              _id: new mongoose.Types.ObjectId(role._id),
              name: role.name,
              description: role.description,
            },
          },
          { upsert: true },
        );
        logger.info(`Role ${role.name} seeded/updated successfully.`);
      } catch (error) {
        logger.error(`Role ${role.name} seeded/updated failed:`, error);
      }
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
