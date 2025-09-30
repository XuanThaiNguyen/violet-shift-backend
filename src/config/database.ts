import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env["MONGO_URL"];

    if (!mongoURI) {
      throw new Error("MONGO_URL is not defined in environment variables");
    }

    await mongoose.connect(mongoURI);
    console.log("MongoDB is running!");

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    throw new Error(`MongoDB connection error: ${error}`);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection is closed");
  } catch (error) {
    throw new Error(`MongoDB disconnection error: ${error}`);
  }
};
