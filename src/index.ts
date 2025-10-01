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

// Validate environment variables
dotenv.config();
const envSchema = Joi.object({
  PORT: Joi.number().default(3000),
  MONGO_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  PREFIX: Joi.string().default("/"),
  REDIS_URL: Joi.string().required(),
});
const { error } = envSchema.validate(process.env, { allowUnknown: true });
if (error) {
  console.error(error);
  process.exit(1);
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security
app.use(helmet({
  xPoweredBy: false,
}));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  // allowedHeaders: ["Content-Type", "Authorization"],
}));

// Logger
app.use(morgan("dev"));

// Swagger
const docsPath = (process.env.PREFIX  || "") + "/docs";
app.use(docsPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const port = process.env.PORT || 3000;

route(app);

const server = app.listen(port, () => {
  connectDB();
  RedisService.init();
  console.log(`Server is running on port ${port}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  try {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);

    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log("HTTP server closed");
        resolve();
      });
    });

    await disconnectDB();
    await RedisService.disconnect();
    console.log("Shutdown complete. Bye!\n");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
  gracefulShutdown("unhandledRejection");
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});
