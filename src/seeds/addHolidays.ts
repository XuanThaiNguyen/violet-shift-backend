import "dotenv/config";
import { connectDB, disconnectDB } from "../config/database";
import Holidays from "date-holidays";
import Holiday from "../models/payrolls/holidays";

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

    const holidays = new Holidays(AUSTRALIA_COUNTRY_CODE);
    const dates = holidays.getHolidays(year);
    const paidHolidays = dates.filter((date) => date.type === "public" || date.type === "bank");

    Holiday.insertMany(paidHolidays.map((date) => ({
      name: date.name,
      date: new Date(date.start),
      type: date.type,
    })));

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
