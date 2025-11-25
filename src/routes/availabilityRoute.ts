import { Router } from "express";
import {
  addAvailabilities,
  declineLeaveRequest,
  deleteAvailability,
  getAvailabilities,
  getStaffAvailabilities,
  isOwnerOfAvailability,
} from "../controllers/availabilityController";
import { isInRoles, isInRolesOrSelf, requireAuth } from "../middleware/authMiddleware";
import { ROLE_IDS } from "../constants/roles";
import { AuthRequest } from "../middleware/type";

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * /availabilities/staffs/{staffId}:
 *   get:
 *     tags:
 *       - Availabilities
 *     summary: Get availabilities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: staffId
 *         in: path
 *         description: Staff ID
 *         required: true
 *         type: string
 *       - name: type
 *         in: query
 *         description: Type
 *         required: false
 *         type: string
 *       - name: isApproved
 *         in: query
 *         description: Is approved
 *         required: false
 *         type: boolean
 *       - name: from
 *         in: query
 *         description: From
 *         required: true
 *         type: number
 *       - name: to
 *         in: query
 *         description: To
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Get availabilities
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
 *                   type:
 *                     type: string
 *                     example: available
 *                   from:
 *                     type: number
 *                     example: 1234567890
 *                   to:
 *                     type: number
 *                     example: 1234567890
 *                   note:
 *                     type: string
 *                     example: Note
 *                   isApproved:
 *                     type: boolean
 *                     example: true
 *                   isDeleted:
 *                     type: boolean
 *                     example: false
 *                   createdAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 *                   updatedAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 *
 */
router.get(
  "/staffs/:staffId",
  isInRolesOrSelf(
    [ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR],
    (req) => req.params.staffId === (req as AuthRequest).userId,
  ),
  getStaffAvailabilities,
);

/**
 * @swagger
 * /availabilities:
 *   get:
 *     tags:
 *       - Availabilities
 *     summary: Get availabilities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: staffs[]
 *         in: query
 *         description: Staff IDs
 *         required: false
 *         type: array
 *         items:
 *           type: string
 *       - name: type
 *         in: query
 *         description: Type
 *         required: false
 *         type: string
 *       - name: isApproved
 *         in: query
 *         description: Is approved
 *         required: false
 *         type: boolean
 *       - name: from
 *         in: query
 *         description: From
 *         required: true
 *         type: number
 *       - name: to
 *         in: query
 *         description: To
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Get availabilities
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
 *                   type:
 *                     type: string
 *                     example: available
 *                   from:
 *                     type: number
 *                     example: 1234567890
 *                   to:
 *                     type: number
 *                     example: 1234567890
 *                   note:
 *                     type: string
 *                     example: Note
 *                   isApproved:
 *                     type: boolean
 *                     example: true
 *                   isDeleted:
 *                     type: boolean
 *                     example: false
 *                   createdAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 *                   updatedAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 *
 */
router.get("/", isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]), getAvailabilities);

/**
 * @swagger
 * /availabilities:
 *   post:
 *     tags:
 *       - Availabilities
 *     summary: Add availabilities
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staff:
 *                 type: string
 *                 description: Staff ID
 *                 required: true
 *                 example: 1234567890
 *               type:
 *                 type: string
 *                 description: Type
 *                 example: available
 *               date:
 *                 type: number
 *                 description: Date
 *                 required: true
 *                 example: 1234567890
 *               tz:
 *                 type: string
 *                 description: Timezone
 *                 required: true
 *                 example: Asia/Shanghai
 *               note:
 *                 type: string
 *                 example: Note
 *               timeSegments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     from:
 *                       type: number
 *                       example: 0
 *                     to:
 *                       type: number
 *                       example: 1440
 *               repeat:
 *                 type: object
 *                 properties:
 *                   pattern:
 *                     type: string
 *                     description: rrule pattern
 *                     example: FREQ=DAILY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR
 *                   endsAt:
 *                     type: number
 *                     description: ends at unix timestamp
 *                     example: 1234567890
 *                   tz:
 *                     type: string
 *                     description: timezone
 *                     example: Asia/Shanghai
 *     responses:
 *       200:
 *         description: Add availabilities
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 'ok'
 *
 */
router.post("/", addAvailabilities);

/**
 * @swagger
 * /availabilities/{id}/decline:
 *   post:
 *     tags:
 *       - Availabilities
 *     summary: Decline leave request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Availability ID
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Decline leave request
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 'ok'
 */
router.post("/:id/decline", isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]), declineLeaveRequest);

/**
 * @swagger
 * /availabilities/{id}/:
 *   delete:
 *     tags:
 *       - Availabilities
 *     summary: Delete availability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Availability ID
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Delete availability
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 'ok'
 */
router.delete(
  "/:id",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isOwnerOfAvailability),
  deleteAvailability,
);

export default router;
