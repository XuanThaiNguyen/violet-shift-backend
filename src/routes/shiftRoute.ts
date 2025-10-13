import { Router } from "express";
import { getMe, updateMe } from "../controllers/me";
import { isInRoles, isInRolesOrSelf, requireAuth } from "../middleware/authMiddleware";
import { addShift, getShift, isAssignedToShift } from "../controllers/shiftController";
import { ROLE_IDS } from "../constants/roles";

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * /shifts/{shiftId}:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get shift
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shiftId
 *         in: path
 *         description: Shift ID
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Get shift
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
 *                   shiftType:
 *                     type: string
 *                     example: personal_care
 *                   additionalShiftTypes:
 *                     type: string
 *                     example: []
 *                   allowances:
 *                     type: string
 *                     example: []
 *                   mileageInvoicing:
 *                     type: string
 *                     example: []
 *                   shiftMileage:
 *                     type: number
 *                     example: 10
 *                   additionalCost:
 *                     type: number
 *                     example: 10
 *                   ignoreStaffCount:
 *                     type: boolean
 *                     example: false
 *                   confirmationRequired:
 *                     type: boolean
 *                     example: false
 *                   acceptedDeclinable:
 *                     type: boolean
 *                     example: false
 *
 *                   timeFrom:
 *                     type: number
 *                     example: 10
 *                   timeTo:
 *                     type: number
 *                     example: 10
 *                   breakTime:
 *                     type: number
 *                     example: 10
 *                   address:
 *                     type: string
 *                     example: 123 Main St
 *                   unitNumber:
 *                     type: string
 *                     example: 123
 *                   bonus:
 *                     type: number
 *                     example: 10
 *                   dropOffAddress:
 *                     type: string
 *                     example: 123 Main St
 *                   dropOffUnitNumber:
 *                     type: string
 *                     example: 123
 *                   repeat:
 *                     type: object
 *                     properties:
 *                       pattern:
 *                         type: string
 *                         example: 0 0 1 * *
 *                       endDate:
 *                         type: number
 *                         example: 10
 *                       tz:
 *                         type: string
 *                         example: Asia/Shanghai
 * 
 *                   instruction:
 *                     type: string
 *                     example: This is a shift instruction
 *
 *                   mileageCap:
 *                     type: number
 *                     example: 10
 *                   mileage:
 *                     type: number
 *                     example: 10
 *                   isCompanyVehicle:
 *                     type: boolean
 *                     example: false
 *
 *                   clientClockOutRequired:
 *                     type: boolean
 *                     example: false
 *                   staffClockOutRequired:
 *                     type: boolean
 *                     example: false
 *                   clientClockOutTime:
 *                     type: number
 *                     example: 10
 *                   staffClockOutTime:
 *                     type: number
 *                     example: 10
 */
router.get("/:shiftId", isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift), getShift);

/**
 * @swagger
 * /shifts:
 *   post:
 *     tags:
 *       - Shifts
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
 *               clientSchedules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     client:
 *                       type: string
 *                       example: 1234567890
 *                     timeFrom:
 *                       type: number
 *                       example: 10
 *                     timeTo:
 *                       type: number
 *                       example: 10
 *
 *               staffSchedules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     staff:
 *                       type: string
 *                       example: 1234567890
 *                     paymentMethod:
 *                       type: string
 *                       example: default
 *                     timeFrom:
 *                       type: number
 *                       example: 10
 *                     timeTo:
 *                       type: number
 *                       example: 10
 *
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Task Name
 *                     description:
 *                       type: string
 *                       example: This is a task description
 *                     isMandatory:
 *                       type: boolean
 *                       example: true
 *                     isCompleted:
 *                       type: boolean
 *                       example: false
 *
 *               shiftType:
 *                 type: string
 *                 example: personal_care
 *               additionalShiftTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *               allowances:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *               mileageInvoicing:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *               shiftMileage:
 *                 type: number
 *                 example: 10
 *               additionalCost:
 *                 type: number
 *                 example: 10
 *               ignoreStaffCount:
 *                 type: boolean
 *                 example: false
 *               confirmationRequired:
 *                 type: boolean
 *                 example: false
 *               acceptedDeclinable:
 *                 type: boolean
 *                 example: false
 *
 *               timeFrom:
 *                 type: number
 *                 example: 10
 *               timeTo:
 *                 type: number
 *                 example: 10
 *               breakTime:
 *                 type: number
 *                 example: 10
 *               address:
 *                 type: string
 *                 example: 123 Main St
 *               unitNumber:
 *                 type: string
 *                 example: 123
 *               bonus:
 *                 type: number
 *                 example: 10
 *               dropOffAddress:
 *                 type: string
 *                 example: 123 Main St
 *               dropOffUnitNumber:
 *                 type: string
 *                 example: 123
 *               repeat:
 *                 type: object
 *                 properties:
 *                   pattern:
 *                     type: string
 *                     example: 0 0 1 * *
 *                   endDate:
 *                     type: number
 *                     example: 10
 *                   tz:
 *                     type: string
 *                     example: Asia/Shanghai
 * 
 *               instruction:
 *                 type: string
 *                 example: This is a shift instruction
 *
 *               mileageCap:
 *                 type: number
 *                 example: 10
 *               mileage:
 *                 type: number
 *                 example: 10
 *               isCompanyVehicle:
 *                 type: boolean
 *                 example: false
 *
 *               clientClockOutRequired:
 *                 type: boolean
 *                 example: false
 *               staffClockOutRequired:
 *                 type: boolean
 *                 example: false
 *               clientClockOutTime:
 *                 type: number
 *                 example: 10
 *               staffClockOutTime:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: Update shift
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                       id:
 *                         type: string
 *                         example: 1234567890
 *
 */
router.post("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]), addShift);

export default router;
