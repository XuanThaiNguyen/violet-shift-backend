import { Router } from "express";
import { ApiKeys } from "../constants/apiKeys";
import { forgotPassword, login, logout, newPassword, updatePassword } from "../controllers/authController";
import { requireAuth } from "../middleware/authMiddleware";
import { requireToken } from "../middleware/tokenMiddleware";

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: tusocnau@gmail.com
 *               password:
 *                 type: string
 *                 example: 123123
 *     responses:
 *       200:
 *         description: Login a user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                     example: 1234567890
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:    
 *                         type: string
 *                         example: 1234567890
 *                       firstName:
 *                         type: string
 *                         example: John Doe
 *                       lastName:
 *                         type: string
 *                         example: Doe
 *                       email:
 *                         type: string
 *                         example: john.doe@example.com
 *                       phone:
 *                         type: string
 *                         example: 1234567890
 *                       role:
 *                         type: string
 *                         example: admin
 *                       createdAt:
 *                         type: string
 *                         example: 2021-01-01T00:00:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         example: 2021-01-01T00:00:00.000Z
 * 
*/
router.post(ApiKeys.LOGIN, login);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout a user
 *     responses:
 *       200:
 *         description: Logout a user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successfully!"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post(ApiKeys.LOGOUT, requireAuth, logout);
/**
 * @swagger
 * /auth/new-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: New password
 *     responses:
 *       200:
 *         description: New password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "New password"
 *                 token:
 *                   type: string
 *                   example: "1234567890"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "1234567890"
 *                     firstName:
 *                       type: string
 *                       example: "John Doe"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     phone:
 *                       type: string
 *                       example: "1234567890"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     createdAt:
 *                       type: string
 *                       example: "2021-01-01T00:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2021-01-01T00:00:00.000Z"
 */
router.post('/new-password', requireToken, newPassword); // for new user or forgot password
/**
 * @swagger
 * /auth/update-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Update password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "123123"
 *               password:
 *                 type: string
 *                 example: "123123"
 *     responses:
 *       200:
 *         description: Update password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 */
router.post('/update-password', requireAuth, updatePassword); // for update password
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Forgot password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Forgot password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset email sent successfully"
 */
router.post('/forgot-password', forgotPassword);
export default router;
