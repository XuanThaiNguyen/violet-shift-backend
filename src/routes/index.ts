import { Express, Router } from "express";
import authRoutes from "./authRoute";
import healthzRoutes from "./healthzRoute";

const prefix = process.env.PREFIX || "/";

const router = Router();
router.use('/auth', authRoutes);
router.use('/healthz', healthzRoutes);

export const route = (app: Express) => {
    app.use(prefix, router);
}