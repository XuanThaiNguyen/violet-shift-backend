import { Router } from "express";
import { getMe, updateMe } from "../controllers/me";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /me:
 *   get:
 *     tags:
 *       - Me
 *     summary: Get me
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Get me
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: 1234567890
 *                   firstName:
 *                     type: string
 *                     example: John Doe
 *                   lastName:
 *                     type: string
 *                     example: Doe
 *                   email:
 *                     type: string
 *                     example: john.doe@example.com
 *                   phone:
 *                     type: string
 *                     example: 1234567890
 *                   role:
 *                     type: string
 *                     example: admin
 *                   createdAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 *                   updatedAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 * 
 */
router.get("/", requireAuth, getMe);
/**
 * @swagger
 * /me:
 *   patch:
 *     tags:
 *       - Me
 *     summary: Update me
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 example: https://example.com/avatar.jpg
 *               firstName:
 *                 type: string
 *                 example: John Doe
 *               middleName:
 *                 type: string
 *                 example: Middle Name
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               prefferedName:
 *                 type: string
 *                 example: Preferred Name
 *               gender:
 *                 type: string
 *                 example: male
 *               birthdate:
 *                 type: string
 *                 example: 2021-01-01
 *               phone:
 *                 type: string
 *                 example: 1234567890
 *     responses:
 *       200:
 *         description: Update me
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
router.patch("/", requireAuth, updateMe);

export default router;
