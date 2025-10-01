import { Router } from "express";
import { healthz } from "../controllers/healthzController";

const router = Router();

/**
 * @swagger
 * /healthz:
 *   get:
 *     tags:
 *       - Healthz
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Health check
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 */
router.get('/', healthz);

export default router;
