import { Router } from "express";
import { isInRoles, isInRolesOrSelf, requireAuth } from "../middleware/authMiddleware";
import { addShift, getShift, isAssignedToShift } from "../controllers/shifts/shiftController";
import { ROLE_IDS } from "../constants/roles";
import {
  getSchedulesByShiftId as getStaffSchedules,
} from "../controllers/shifts/staffScheduleController";
import { getSchedulesByShiftId as getClientSchedules } from "../controllers/shifts/clientScheduleController";
import { getTasksByShiftId } from "../controllers/shifts/shiftTasksController";



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
router.get(
  "/:shiftId",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  getShift,
);

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
router.post("/", isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]), addShift);

/**
 * @swagger
 * /shifts/{shiftId}/staff-schedules:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get staff schedules by shift ID
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
 *         description: Get staff schedules by shift ID
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
 *                   staff:
 *                     type: string
 *                     example: 1234567890
 *                   paymentMethod:
 *                     type: string
 *                     example: default
 *                   timeFrom:
 *                     type: number
 *                     example: 10
 *                   timeTo:
 *                     type: number
 *                     example: 10
 *                   clientNames:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: John Doe
 *                   createdAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 *                   updatedAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 */
router.get(
  "/:shiftId/staff-schedules",
  isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]),
  getStaffSchedules,
);


/**
 * @swagger
 * /shifts/{shiftId}/client-schedules:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get client schedules by shift ID
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
 *         description: Get client schedules by shift ID
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
 *                   client:
 *                     type: string
 *                     example: 1234567890
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
  "/:shiftId/client-schedules",
  isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]),
  getClientSchedules,
);

/**
 * @swagger
 * /shifts/{shiftId}/tasks:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get tasks by shift ID
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
 *         description: Get tasks by shift ID
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
 *                   name:
 *                     type: string
 *                     example: Task Name
 *                   description:
 *                     type: string
 *                     example: This is a task description
 *                   isMandatory:
 *                     type: boolean
 *                     example: true
 *                   isCompleted:
 *                     type: boolean
 *                     example: false
 *                   createdAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 *                   updatedAt:
 *                     type: string
 *                     example: 2021-01-01T00:00:00.000Z
 */
router.get(
  "/:shiftId/tasks",
  isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]),
  getTasksByShiftId,
);

export default router;
