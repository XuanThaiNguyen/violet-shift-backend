import { Express, Router } from "express";
import authRoutes from "./authRoute";
import clientRoutes from "./clientRoute";
import healthzRoutes from "./healthzRoute";
import meRoutes from "./meRoute";
import priceBookRoutes from "./priceBookRoute";
import shiftRoutes from "./shiftRoute";
import staffRoutes from "./staffRoute";

const router = Router();
router.use("/healthz", healthzRoutes);
router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/staffs", staffRoutes);
router.use("/clients", clientRoutes);
router.use("/shifts", shiftRoutes);
router.use("/pricebook", priceBookRoutes);

export const route = (app: Express) => {
  const prefix = process.env.API_PREFIX || "/";
  app.use(prefix, router);
};
