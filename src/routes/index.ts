import { Express, Router } from "express";
import authRoutes from "./authRoute";
import healthzRoutes from "./healthzRoute";



const router = Router();
router.use('/auth', authRoutes);
router.use('/healthz', healthzRoutes);

export const route = (app: Express) => {
    const prefix = process.env.PREFIX || "/";
    app.use(prefix, router);
}