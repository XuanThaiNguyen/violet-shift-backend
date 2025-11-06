import "dotenv/config";
import { connectDB, disconnectDB } from "../config/database";
import Client from "../models/clientModel";
import { addYears } from "date-fns";
import Holidays from "date-holidays";

const AUSTRALIA_COUNTRY_CODE = "AU";
const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"];

async function run(): Promise<void> {
  try {
    await connectDB();

    // Parse command line arguments
    const args = process.argv.slice(2);
    let year = new Date().getFullYear();

    for (const arg of args) {
      const [key, value] = arg.split("=");
      if (key === "year") {
        year = isNaN(+value) || +value < 2025 ? new Date().getFullYear() : parseInt(value);
      }
    }

    const holidays = new Holidays("AU");
    const dates = holidays.getHolidays();
    console.log("🚀 ~ dates:", dates)

  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run().then(() => {
  console.log("Seed completed.");
});
