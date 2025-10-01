import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/database";
import { route } from "./routes";

dotenv.config();
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

const port = 3000;

route(app);

app.listen(port, () => {
  connectDB();
  console.log(`Server is running on port ${port}`);
});
