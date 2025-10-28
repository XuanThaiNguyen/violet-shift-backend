import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB, disconnectDB } from "./config/database";
import { route } from "./routes";
import Joi from "joi";
import RedisService from "./services/redis";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { logger as winstonLogger } from "./utils/logger";

const logger = winstonLogger.child({
  service: "root",
});

// Validate environment variables
dotenv.config();
const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  MONGO_URL: Joi.string().required(),
  MONGO_LOG_URL: Joi.string().optional(),
  JWT_SECRET: Joi.string().required(),
  PREFIX: Joi.string().default("/"),
  REDIS_URL: Joi.string().required(),
});
const { error } = envSchema.validate(process.env, { allowUnknown: true });
if (error) {
  logger.error(error.message, error.details);
  process.exit(1);
} else {
  logger.info("Environment variables validated successfully");
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security
app.use(
  helmet({
    xPoweredBy: false,
  }),
);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Logger
app.use(morgan("dev"));

// Swagger
const prefix = process.env.API_PREFIX || "";
const docsPath = prefix + "/docs";
app.use(docsPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get(`${prefix}/swagger.json`, (req, res) => {
  res.json(swaggerSpec);
});

const port = process.env.PORT || 3000;

route(app);

const server = app.listen(port, () => {
  connectDB();
  RedisService.init();
  logger.info(`Server is running on port ${port}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  try {
    logger.info(`\nReceived ${signal}. Gracefully shutting down...`);

    await new Promise<void>((resolve) => {
      server.close(() => {
        logger.info("HTTP server closed");
        resolve();
      });
    });
    await Promise.all([
      disconnectDB(),
      RedisService.disconnect(),
    ]);

    logger.info("Shutdown complete. Bye!\n");
    process.exit(0);
  } catch (err) {
    logger.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});
