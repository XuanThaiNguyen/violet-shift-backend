import { Router } from "express";
import { healthz } from "../controllers/healthzController";

const router = Router();

router.get('/', healthz);

export default router;
