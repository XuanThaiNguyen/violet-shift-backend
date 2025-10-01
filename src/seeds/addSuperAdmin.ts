import "dotenv/config";
import bcrypt from "bcrypt";
import { connectDB, disconnectDB } from "../config/database";
import User from "../models/user.model";

async function run(): Promise<void> {
  try {
    await connectDB();

    // Parse command line arguments in format: email=admin@mail.com pass=123123
    const args = process.argv.slice(2);
    let adminEmail = "";
    let adminPassword = "";

    for (const arg of args) {
      if (arg.startsWith("email=")) {
        adminEmail = arg.split("=")[1];
      } else if (arg.startsWith("pass=")) {
        adminPassword = arg.split("=")[1];
      }
    }

    if (!adminEmail || !adminPassword) {
      throw new Error(
        "Usage: yarn seed:admin email=admin@mail.com pass=123123"
      );
    }

    const existing = await User.findOne({ email: adminEmail });

    const hashed = await bcrypt.hash(adminPassword, 10);

    if (!existing) {
      await User.create({
        email: adminEmail,
        password: hashed,
      });
      console.log("Admin user created.");
    } else {
      const needsUpdate = !(await bcrypt.compare(adminPassword, existing.password));
      if (needsUpdate) {
        existing.password = hashed;
        await existing.save();
        console.log("Admin user updated.");
      } else {
        console.log("Admin user already exists and is up to date.");
      }
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

