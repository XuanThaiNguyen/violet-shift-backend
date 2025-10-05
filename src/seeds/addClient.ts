import "dotenv/config";
import { connectDB, disconnectDB } from "../config/database";
import Client from "../models/clientModel";

async function run(): Promise<void> {
  try {
    await connectDB();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const data: Record<string, string> = {};

    for (const arg of args) {
      const [key, value] = arg.split("=");
      if (key && value) {
        data[key] = value;
      }
    }

    const { displayName } = data;
    if (!displayName) {
      throw new Error(`Usage: yarn seed:client displayName="John Doe"`);
    }

    const existing = await Client.findOne({ displayName });

    if (!existing) {
      await Client.create({
        displayName,
        ...data,
      });
      console.log(`✅ Client "${displayName}" created.`);
    } else {
      Object.assign(existing, data);
      await existing.save();
      console.log(`🔄 Client "${displayName}" updated.`);
    }
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
