import { Router } from "express";
import { ApiKeys } from "../constants/apiKeys";
import {
  forgotPassword,
  login,
  logout,
  newPassword,
  updatePassword,
} from "../controllers/authController";
import { isInRoles, isInRolesOrSelf, requireAuth } from "../middleware/authMiddleware";
import { requireToken } from "../middleware/tokenMiddleware";
import { ROLE_IDS } from "../constants/roles";
import { getByStaff } from "../controllers/payrolls/worklogController";
import { AuthRequest } from "../middleware/type";

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * /worklogs/staffs/{staffId}:
 *   get:
 *     tags:
 *       - Worklogs
 *     summary: Get worklogs by staff ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: staffId
 *         in: path
 *         description: Staff ID
 *         required: true
 *         type: string
 *       - name: from
 *         in: query
 *         description: From date
 *         required: false
 *         type: number
 *       - name: to
 *         in: query
 *         description: To date
 *         required: false
 *         type: number
 *       - name: ruleId
 *         in: query
 *         description: Rule ID
 *         required: false
 *         type: string
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
 *                   id:
 *                     type: string
 *                     example: 1234567890
 *                   staff:
 *                     type: string
 *                     example: 1234567890
 *                   shift:
 *                     type: string
 *                     example: 1234567890
 *                   rule:
 *                     type: string
 *                     example: 1234567890
 *                   startedAt:
 *                     type: number
 *                     example: 1234567890
 *                   endedAt:
 *                     type: number
 *                     example: 1234567890
 *                   hours:
 *                     type: number
 *                     example: 1234567890
 *                   createdAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 *                   updatedAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 */
router.get(
  "/staffs/:staffId",
  isInRolesOrSelf(
    [ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR],
    (req) => req.params.staffId === (req as AuthRequest).userId,
  ),
  getByStaff,
);

export default router;