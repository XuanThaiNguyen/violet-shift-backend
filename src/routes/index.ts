import { Express, Router } from "express";
import healthzRoutes from "./healthzRoute";
import authRoutes from "./authRoute";
import meRoutes from "./meRoute";
import staffRoutes from "./staffRoute";
import clientRoutes from "./clientRoute";
import shiftRoutes from "./shiftRoute";

const router = Router();
router.use("/healthz", healthzRoutes);
router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/staffs", staffRoutes);
router.use("/clients", clientRoutes);
router.use("/shifts", shiftRoutes);

export const route = (app: Express) => {
  const prefix = process.env.API_PREFIX || "/";
  app.use(prefix, router);
};
