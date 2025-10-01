import { Router } from "express";
import { ApiKeys } from "../constants/apiKeys";
import { login, logout } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.post(ApiKeys.LOGIN, login);
router.post(ApiKeys.LOGOUT, requireAuth, logout);

export default router;
