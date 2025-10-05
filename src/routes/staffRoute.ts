import { Router } from "express";
import { isInRoles, requireAuth } from "../middleware/authMiddleware";
import { acceptInvitation, getStaffs, inviteStaff } from "../controllers/staffController";
import { ROLE_IDS } from "../constants/roles";

const router = Router();

/**
 * @swagger
 * /staffs:
 *   get:
 *     tags:
 *       - Staffs
 *     summary: Get staffs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: query
 *         in: query
 *         description: Query to search staffs
 *         required: false
 *         type: string
 *       - name: page
 *         in: query
 *         description: Page number
 *         required: false
 *         type: number
 *       - name: perPage
 *         in: query
 *         description: Number of items per page
 *         required: false
 *         type: number
 *       - name: sort
 *         in: query
 *         description: Sort Field
 *         required: false
 *         type: string
 *         enum:
 *           - email
 *           - createdAt
 *       - name: order
 *         in: query
 *         description: Sort Order
 *         required: false
 *         type: string
 *         enum:
 *           - asc
 *           - desc
 *       - name: roles
 *         in: query
 *         description: Roles to filter by (can select multiple)
 *         required: false
 *         type: array
 *         items:
 *           type: string
 *     responses:
 *       200:
 *         description: Get staffs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 10
 *                     page:
 *                       type: number
 *                       example: 1
 *                     perPage:
 *                       type: number
 *                       example: 10
 *
 */
router.get("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), getStaffs);
/**
 * @swagger
 * /staffs/invite:
 *   post:
 *     tags:
 *       - Staffs
 *     summary: Invite staff
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *               role:
 *                 type: string
 *                 example: 66fe5a3e9a0c8a0012a00003
 *     responses:
 *       200:
 *         description: Invite staff
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 1234567890
 *
 */
router.post("/invite", requireAuth, isInRoles([ROLE_IDS.ADMIN]), inviteStaff);

/**
 * @swagger
 * /staffs/accept-invitation:
 *   get:
 *     tags:
 *       - Staffs
 *     summary: Accept invitation
 *     parameters:
 *       - name: token
 *         in: query
 *         description: Token to accept invitation
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Accept invitation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: 1234567890
 *                 userId:
 *                   type: string
 *                   example: 1234567890
 *                 email:
 *                   type: string
 *                   example: john.doe@example.com
 *                 role:
 *                   type: string
 *                   example: 1234567890
 */
router.get("/accept-invitation", acceptInvitation);

export default router;
