import { Router } from "express";
import { isInRoles, isInRolesOrSelf, requireAuth } from "../middleware/authMiddleware";
import { addShift, getShift, isAssignedToShift } from "../controllers/shifts/shiftController";
import { ROLE_IDS } from "../constants/roles";
import {
  getStaffSchedules,
  getSchedulesByShiftId,
  getStaffSchedule,
  isAssignedToSchedule,
} from "../controllers/shifts/staffScheduleController";
import { AuthRequest } from "../middleware/type";

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * /staff-schedules/{scheduleId}:
 *   get:
 *     tags:
 *       - Staff Schedules
 *     summary: Get staff schedule by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: scheduleId
 *         in: path
 *         description: Schedule ID
 *         required: true
 *         type: string
 *       - name: from
 *         in: query
 *         description: From date
 *         required: false
 *         type: string
 *       - name: to
 *         in: query
 *         description: To date
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: Staff schedule fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 1234567890
 *                 shift:
 *                   type: string
 *                   example: 1234567890
 *                 staff:
 *                   type: string
 *                   example: 1234567890
 *                 paymentMethod:
 *                   type: string
 *                   example: cash
 *                 timeFrom:
 *                   type: number
 *                   example: 10
 *                 timeTo:
 *                   type: number
 *                   example: 10
 */
router.get(
  "/:scheduleId",
  requireAuth,
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToSchedule),
  getStaffSchedule,
);

/**
 * @swagger
 * /staff-schedules/staff/{staffId}:
 *   get:
 *     tags:
 *       - Staff Schedules
 *     summary: Get staff schedules by staff ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: staffId
 *         in: path
 *         description: Staff ID
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Staff schedules fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: 1234567890
 *                   shift:
 *                     type: string
 *                     example: 1234567890
 *                   staff:
 *                     type: string
 *                     example: 1234567890
 *                   paymentMethod:
 *                     type: string
 *                     example: cash
 *                   timeFrom:
 *                     type: number
 *                     example: 10
 *                   timeTo:
 *                     type: number
 *                     example: 10
 *                   createdAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 *                   updatedAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 */
router.get(
  "/staff/:staffId",
  requireAuth,
  isInRolesOrSelf(
    [ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR],
    (req) => req.query.staffId === (req as AuthRequest).userId,
  ),
  getStaffSchedules,
);

export default router;
