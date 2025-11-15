import { Router } from "express";
import { addAvailabilities, declineLeaveRequest, getAvailabilities } from "../controllers/availabilityController";
import { isInRolesOrSelf, requireAuth } from "../middleware/authMiddleware";
import { ROLE_IDS } from "../constants/roles";
import { AuthRequest } from "../middleware/type";

const router = Router();
router.use(requireAuth);

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
 *       - name: staff
 *         in: query
 *         description: Staff ID
 *         required: true
 *         type: string
 *       - name: type
 *         in: query
 *         description: Type
 *         required: true
 *         type: string
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
  "/",
  isInRolesOrSelf(
    [ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR],
    (req) => req.query.staffId === (req as AuthRequest).userId,
  ),
  getAvailabilities,
);
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               staff:
 *                 type: string
 *                 example: 1234567890
 *               type:
 *                 type: string
 *                 example: available
 *               from:
 *                 type: number
 *                 example: 1234567890
 *               to:
 *                 type: number
 *                 example: 1234567890
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
 *                       example: 1234567890
 *                     to:
 *                       type: number
 *                       example: 1234567890
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
router.post("/:id/decline", declineLeaveRequest);

export default router;
