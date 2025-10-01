import { Express, Router } from "express";
import healthzRoutes from "./healthzRoute";
import authRoutes from "./authRoute";
import meRoutes from "./meRoute";
import staffRoutes from "./staffRoute";

const router = Router();
router.use('/healthz', healthzRoutes);
router.use('/auth', authRoutes);
router.use('/me', meRoutes);
router.use('/staffs', staffRoutes);


export const route = (app: Express) => {
    const prefix = process.env.PREFIX || "/";
    app.use(prefix, router);
}