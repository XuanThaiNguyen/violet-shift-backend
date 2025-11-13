import { Express, Router } from "express";
import authRoutes from "./authRoute";
import clientRoutes from "./clientRoute";
import fundingRoutes from "./fundingRoute";
import healthzRoutes from "./healthzRoute";
import meRoutes from "./meRoute";
import priceBookRoutes from "./priceBookRoute";
import shiftRoutes from "./shiftRoute";
import staffScheduleRoutes from "./staffScheduleRoute";
import staffRoutes from "./staffRoute";
import worklogsRoutes from "./worklogsRoute";

const router = Router();
router.use("/healthz", healthzRoutes);
router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/staffs", staffRoutes);
router.use("/clients", clientRoutes);
router.use("/shifts", shiftRoutes);
router.use("/staff-schedules", staffScheduleRoutes);
router.use("/pricebook", priceBookRoutes);
router.use("/fundings", fundingRoutes);
router.use("/worklogs", worklogsRoutes);

export const route = (app: Express) => {
  const prefix = process.env.API_PREFIX || "/";
  app.use(prefix, router);
};
