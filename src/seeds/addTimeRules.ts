import "dotenv/config";
import { connectDB, disconnectDB } from "../config/database";
import { logger as winstonLogger } from "../utils/logger";
import TimeRule from "../models/payrolls/timeRules";
import { TIME_RULES_DATA, TIME_RULES_IDS } from "../constants/salaryTimeRules";

const logger = winstonLogger.child({
  seed: "addTimeRules",
});

async function run(): Promise<void> {
  try {
    await connectDB();

    for (const id of Object.values(TIME_RULES_IDS)) {
      const timeRule = TIME_RULES_DATA[id];
      try {
        await TimeRule.updateOne(
          { _id: id },
          {
            $set: {
              _id: id,
              ...timeRule,
            },
          },
          { upsert: true },
        );
        logger.info(`Time rule ${timeRule.name} seeded/updated successfully.`);
      } catch (error) {
        logger.error(`Time rule ${timeRule.name} seeded/updated failed:`, error);
      }
    }

    logger.info("Time rules seeded/updated successfully.");
  } catch (err) {
    logger.error("Seed time rules failed:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run().then(() => logger.info("Seed time rules completed."));
