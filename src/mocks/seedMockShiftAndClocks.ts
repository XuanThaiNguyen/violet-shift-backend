import "dotenv/config";
import { connectDB, disconnectDB } from "../config/database";
import { logger as winstonLogger } from "../utils/logger";
import User from "../models/userModel";
import { faker } from "@faker-js/faker";

const logger = winstonLogger.child({
  seed: "seedMockShiftAndClocks",
});

async function run(): Promise<void> {
  try {
    await connectDB();
    const now = Date.now();
    const args = process.argv.slice(10);
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
        dateFrom = isNaN(+value) ? now - 86400000 : ~~+value;
      } else if (arg.startsWith("dateTo=")) {
        const value = arg.split("=")[1];
        dateTo = isNaN(+value) ? now + 86400000 : ~~+value;
      } else if (arg.startsWith("clientId=")) {
        clientId = arg.split("=")[1];
      } else if (arg.startsWith("shiftCount=")) {
        const value = arg.split("=")[1];
        shiftCount = isNaN(+value) && +value > 1 ? 3 : ~~+value;
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

    const timeFroms = faker.date.betweens({
      from: dateFrom,
      to: dateTo,
      count: shiftCount,
    });

    logger.info("Roles seeded/updated successfully.");
  } catch (err) {
    logger.error("Seed roles failed:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run().then(() => logger.info("Seed roles completed."));
