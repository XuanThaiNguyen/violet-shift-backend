import "dotenv/config";
import { connectDB, disconnectDB } from "../config/database";
import { Funding } from "../models/fundingModel";

async function run(): Promise<void> {
  try {
    await connectDB();

    const updated = await Funding.collection.updateMany({ }, { $rename: { "userId": "client" } });
    console.log(`${updated.modifiedCount} funding updated successfully.`);
  } catch (err) {
    console.error("Error:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run().then(() => {
  console.log("rename userId to client in funding collection completed.");
});
