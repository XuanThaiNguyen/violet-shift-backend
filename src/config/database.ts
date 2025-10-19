import mongoose from "mongoose";
import { logger as winstonLogger } from "../utils/logger";

const dbLogger = winstonLogger.child({
  service: "MongoDB",
});

export const connectDB = async (): Promise<void> => {
  const logger = dbLogger.child({
    function: "connectDB",
  });

  try {
    const mongoURI = process.env["MONGO_URL"];

    if (!mongoURI) {
      const error = new Error("MONGO_URL is not defined in environment variables");
      logger.error(error.message, error.stack);
      throw error;
    }

    await mongoose.connect(mongoURI);
    logger.info("MongoDB is running!");

    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    logger.error((error as Error).message, (error as Error).stack);
    throw new Error(`MongoDB connection error: ${error}`);
  }
};

export const disconnectDB = async (): Promise<void> => {
  const logger = dbLogger.child({
    function: "disconnectDB",
  });

  try {
    await mongoose.connection.close();
    logger.info("MongoDB connection is closed");
  } catch (error) {
    throw new Error(`MongoDB disconnection error: ${error}`);
  }
};
