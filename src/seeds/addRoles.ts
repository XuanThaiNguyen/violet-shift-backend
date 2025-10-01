import "dotenv/config";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/database";
import Role from "../models/roleModel";
import { ROLES } from "../constants/roles";

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
          { upsert: true }
        );
        console.log(`Role ${role.name} seeded/updated successfully.`);
      } catch (error) {
        console.error(`Role ${role.name} seeded/updated failed:`, error);
      }
    }

    console.log("Roles seeded/updated successfully.");
  } catch (err) {
    console.error("Seed roles failed:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

run().then(() => console.log("Seed roles completed."));
