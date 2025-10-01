import { Express, Router } from "express";
import authRoutes from "./authRoute";

const prefix = process.env.PREFIX || "/";

const router = Router();
router.use('/auth', authRoutes);

export const route = (app: Express) => {
    app.use('/prefix', router);
}