import winston from "winston";
import "winston-mongodb"; // To expose MongoDB transport
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
// const isProduction = true;

const baseFormat = winston.format.printf(({ level, message, ...meta }) => {
  const timestamp = new Date().toISOString();
  return `${timestamp} [${level}] meta: ${JSON.stringify(meta)} - ${message}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: isProduction ? "info" : "debug",
    format: winston.format.combine(
      winston.format.colorize(),
      baseFormat
    ),
  }),
];

// Only enable MongoDB transport in production and log errors only
if (isProduction && process.env.MONGO_LOG_URL) {
  transports.push(
    new winston.transports.MongoDB({
      level: "error",
      db: process.env.MONGO_LOG_URL as string,
      collection: "logs",
      options: {
        // useUnifiedTopology: true, // deprecated
      },
      tryReconnect: true,
      // capped collection can help prevent unbounded growth in long-running clusters
      // capped: true,
      // cappedMax: 5000,
    })
  );
}

export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: baseFormat,
  transports,
});
