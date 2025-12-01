import { Router } from "express";
import { ROLE_IDS } from "../constants/roles";
import { getSchedulesByShiftId as getClientSchedules } from "../controllers/shifts/clientScheduleController";
import {
  addShift,
  bulkDeleteShift,
  bulkUpdateShifts,
  deleteShift,
  getShift,
  isAssignedToShift,
  updateShift,
} from "../controllers/shifts/shiftController";
import {
  addProgress,
  getProgress,
  getProgresses,
  getProgressEvents,
  updateProgress,
} from "../controllers/shifts/shiftProgressController";
import { getTasksByShiftId, updateTaskStatus } from "../controllers/shifts/shiftTasksController";
import {
  addSignature,
  clockIn,
  clockOut,
  getSchedulesByShiftId as getStaffSchedules,
} from "../controllers/shifts/staffScheduleController";
import { isInRoles, isInRolesOrSelf, requireAuth } from "../middleware/authMiddleware";

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
 *                         example: FREQ=DAILY;INTERVAL=3;DTSTART=20251102T090000Z;UNTIL=20251231T090000Z
 *                         description: RRule string, see https://github.com/jakubroztocil/rrule for more details
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
 *     summary: Add shift
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
 * /shifts/{shiftId}:
 *   put:
 *     tags:
 *       - Shifts
 *     summary: Update shift information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shiftId
 *         in: path
 *         description: Shift ID
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientSchedules:
 *                 type: object
 *                 properties:
 *                   add:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         client:
 *                           type: string
 *                           example: 1234567890
 *                         timeFrom:
 *                           type: number
 *                           example: 10
 *                         timeTo:
 *                           type: number
 *                           example: 10
 *                         priceBook:
 *                           type: string
 *                           example: 1234567890
 *                         fund:
 *                           type: string
 *                           example: 1234567890
 *                   delete:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: 1234567890
 *                       description: repetitiveId
 *                   update:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         repetitiveId:
 *                           type: string
 *                           example: 1234567890
 *                         timeFrom:
 *                           type: number
 *                           example: 10
 *                         timeTo:
 *                           type: number
 *                           example: 10
 *                         priceBook:
 *                           type: string
 *                           example: 1234567890
 *                         fund:
 *                           type: string
 *                           example: 1234567890
 *
 *               staffSchedules:
 *                 type: object
 *                 properties:
 *                   add:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         staff:
 *                           type: string
 *                           example: 1234567890
 *                         timeFrom:
 *                           type: number
 *                           example: 10
 *                         timeTo:
 *                           type: number
 *                           example: 10
 *                         paymentMethod:
 *                           type: string
 *                           example: default
 *                   delete:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: 1234567890
 *                       description: staff id
 *                   update:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         staff:
 *                           type: string
 *                           example: 1234567890
 *                         timeFrom:
 *                           type: number
 *                           example: 10
 *                         timeTo:
 *                           type: number
 *                           example: 10
 *                         paymentMethod:
 *                           type: string
 *                           example: default
 *
 *               tasks:
 *                 type: object
 *                 properties:
 *                   add:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: Task Name
 *                         description:
 *                           type: string
 *                           example: This is a task description
 *                         isMandatory:
 *                           type: boolean
 *                           example: true
 *                         isCompleted:
 *                           type: boolean
 *                           example: false
 *                   delete:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: 1234567890
 *                       description: repetitiveId
 *                   update:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         repetitiveId:
 *                           type: string
 *                           example: 1234567890
 *                         name:
 *                           type: string
 *                           example: Task Name
 *                         description:
 *                           type: string
 *                           example: This is a task description
 *                         isMandatory:
 *                           type: boolean
 *                           example: true
 *                         isCompleted:
 *                           type: boolean
 *                           example: false
 *
 *               instruction:
 *                 type: string
 *                 example: This is a shift instruction
 *
 *               shiftType:
 *                 type: string
 *                 example: personal_care
 *               additionalShiftTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: []
 *               allowances:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: []
 *               mileageInvoicing:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: []
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
 *     responses:
 *       200:
 *         description: Update task status by shift ID and task ID
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 'ok'
 */
router.put("/:shiftId", isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]), updateShift);

/**
 * @swagger
 * /shifts/{shiftId}:
 *   delete:
 *     tags:
 *       - Shifts
 *     summary: Delete shift
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
 *         description: Delete shift
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   example: 'OK'
 *
 */
router.delete("/:shiftId", isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]), deleteShift);

/**
 * @swagger
 * /shifts/bulk-delete/{repeatId}:
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Delete shift
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: repeatId
 *         in: path
 *         description: Repeat ID
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: number
 *                 description: From unix timestamp
 *                 required: true
 *                 example: 10
 *               to:
 *                 type: number
 *                 description: To unix timestamp
 *                 required: true
 *                 example: 10
 *     responses:
 *       200:
 *         description: Delete shift
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   example: 'OK'
 *
 */
router.post(
  "/bulk-delete/:repeatId",
  isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR]),
  bulkDeleteShift,
);

/**
 * @swagger
 * /shifts/bulk-update/{repeatId}:
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Bulk update shift
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: repeatId
 *         in: path
 *         description: Repeat ID
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               from:
 *                 type: number
 *                 description: From unix timestamp
 *                 required: true
 *                 example: 10
 *               to:
 *                 type: number
 *                 description: To unix timestamp
 *                 required: true
 *                 example: 10
 *               update:
 *                 type: object
 *                 description: Update shift
 *                 properties:
 *                   clientSchedules:
 *                     type: object
 *                     properties:
 *                       add:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             client:
 *                               type: string
 *                               example: 1234567890
 *                             timeFrom:
 *                               type: number
 *                               example: 10
 *                             timeTo:
 *                               type: number
 *                               example: 10
 *                             priceBook:
 *                               type: string
 *                               example: 1234567890
 *                             fund:
 *                               type: string
 *                               example: 1234567890
 *                       delete:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: 1234567890
 *                           description: repetitiveId
 *                       update:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             repetitiveId:
 *                               type: string
 *                               example: 1234567890
 *                             timeFrom:
 *                               type: number
 *                               example: 10
 *                             timeTo:
 *                               type: number
 *                               example: 10
 *                             priceBook:
 *                               type: string
 *                               example: 1234567890
 *                             fund:
 *                               type: string
 *                               example: 1234567890
 *
 *                   staffSchedules:
 *                     type: object
 *                     properties:
 *                       add:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             staff:
 *                               type: string
 *                               example: 1234567890
 *                             timeFrom:
 *                               type: number
 *                               example: 10
 *                             timeTo:
 *                               type: number
 *                               example: 10
 *                             paymentMethod:
 *                               type: string
 *                               example: default
 *                       delete:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: 1234567890
 *                           description: staff id
 *                       update:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             staff:
 *                               type: string
 *                               example: 1234567890
 *                             timeFrom:
 *                               type: number
 *                               example: 10
 *                             timeTo:
 *                               type: number
 *                               example: 10
 *                             paymentMethod:
 *                               type: string
 *                               example: default
 *
 *                   tasks:
 *                     type: object
 *                     properties:
 *                       add:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: Task Name
 *                             description:
 *                               type: string
 *                               example: This is a task description
 *                             isMandatory:
 *                               type: boolean
 *                               example: true
 *                             isCompleted:
 *                               type: boolean
 *                               example: false
 *                       delete:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: 1234567890
 *                           description: repetitiveId
 *                       update:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             repetitiveId:
 *                               type: string
 *                               example: 1234567890
 *                             name:
 *                               type: string
 *                               example: Task Name
 *                             description:
 *                               type: string
 *                               example: This is a task description
 *                             isMandatory:
 *                               type: boolean
 *                               example: true
 *                             isCompleted:
 *                               type: boolean
 *                               example: false
 *
 *                   instruction:
 *                     type: string
 *                     example: This is a shift instruction
 *
 *                   shiftType:
 *                     type: string
 *                     example: personal_care
 *                   additionalShiftTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: []
 *                   allowances:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: []
 *                   mileageInvoicing:
 *                     type: array
 *                     items:
 *                       type: string
 *                       example: []
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
 *     responses:
 *       200:
 *         description: Delete shift
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   example: 'OK'
 *
 */
router.post(
  "/bulk-update/:repeatId",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  bulkUpdateShifts,
);

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
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  getStaffSchedules,
);

/**
 * @swagger
 * /shifts/{shiftId}/staff-schedules/{scheduleId}/clock-in:
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Staff clocks in
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shiftId
 *         in: path
 *         description: Shift ID
 *         required: true
 *         type: string
 *       - name: scheduleId
 *         in: path
 *         description: Schedule ID
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Staff clocks in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 1234567890
 *                     clocksInAt:
 *                       type: string
 *                       example: 2021-01-01T00:00:00.000Z
 */
router.post("/:shiftId/staff-schedules/:scheduleId/clock-in", clockIn);

/**
 * @swagger
 * /shifts/{shiftId}/staff-schedules/{scheduleId}/clock-out:
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Staff clock out
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shiftId
 *         in: path
 *         description: Staff ID
 *         required: true
 *         type: string
 *       - name: scheduleId
 *         in: path
 *         description: Schedule ID
 *         required: true
 *         type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 example: 1234567890
 *               clientSignature:
 *                 type: string
 *                 example: 1234567890
 *     responses:
 *       200:
 *         description: Staff clock out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 1234567890
 *                     clocksOutAt:
 *                       type: string
 *                       example: 2021-01-01T00:00:00.000Z
 */
router.post("/:shiftId/staff-schedules/:scheduleId/clock-out", clockOut);

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
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
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
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  getTasksByShiftId,
);

/**
 * @swagger
 * /shifts/{shiftId}/tasks/{taskId}/complete:
 *   put:
 *     tags:
 *       - Shifts
 *     summary: Update task status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shiftId
 *         in: path
 *         description: Shift ID
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isCompleted:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Update task status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   example: 'OK'
 */
router.put(
  "/:shiftId/tasks/:taskId/complete",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  updateTaskStatus,
);

/**
 * @swagger
 * /shifts/{shiftId}/staff-schedules/{scheduleId}/signature:
 *   put:
 *     tags:
 *       - Shifts
 *     summary: Add or update staff signature for a shift schedule
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shiftId
 *         in: path
 *         description: Shift ID
 *         required: true
 *         type: string
 *       - name: scheduleId
 *         in: path
 *         description: Staff schedule ID
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 example: data:image/png;base64,iVBORw0KGgoAAAANSUhEUg....
 *               signedAt:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-06-15T14:30:00.000Z
 *             required:
 *               - signature
 *     responses:
 *       200:
 *         description: Signature added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 signature:
 *                   type: string
 *                 signedAt:
 *                   type: string
 *                   example: 2025-06-15T14:30:00.000Z
 *                 updatedAt:
 *                   type: string
 */
router.put(
  "/:shiftId/staff-schedules/:scheduleId/signature",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  addSignature,
);

/**
 * @swagger
 * /shifts/{shiftId}/progresses:
 *   post:
 *     tags:
 *       - Shifts
 *     summary: Add progress update to a shift
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shiftId
 *         in: path
 *         description: Shift ID
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: Completed patient intake and initial assessment
 *               percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 45
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["photo1.jpg", "photo2.jpg"]
 *             required:
 *               - description
 *     responses:
 *       201:
 *         description: Progress entry created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 1234567890
 *                 shiftId:
 *                   type: string
 *                 staffId:
 *                   type: string
 *                 description:
 *                   type: string
 *                 percentage:
 *                   type: number
 *                 photos:
 *                   type: array
 *                   items:
 *                     type: string
 *                 createdAt:
 *                   type: string
 *                   example: 2025-06-15T14:30:00.000Z
 */
router.post(
  "/:shiftId/progresses",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  addProgress,
);

/**
 * @swagger
 * /shifts/{shiftId}/progresses:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get all progress updates for a shift
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
 *         description: List of progress entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   description:
 *                     type: string
 *                   percentage:
 *                     type: number
 *                   photos:
 *                     type: array
 *                     items:
 *                       type: string
 *                   staff:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                   createdAt:
 *                     type: string
 */
router.get(
  "/:shiftId/progresses",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  getProgresses,
);

/**
 * @swagger
 * /shifts/{shiftId}/progresses/{progressId}:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get a single progress entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shiftId
 *         in: path
 *         required: true
 *         type: string
 *       - name: progressId
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Progress entry details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 description:
 *                   type: string
 *                 percentage:
 *                   type: number
 *                 photos:
 *                   type: array
 *                   items:
 *                     type: string
 *                 staff:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 */
router.get(
  "/:shiftId/progresses/:progressId",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  getProgress,
);

/**
 * @swagger
 * /shifts/{shiftId}/progresses/{progressId}:
 *   put:
 *     tags:
 *       - Shifts
 *     summary: Update a progress entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: shiftId
 *         in: path
 *         required: true
 *         type: string
 *       - name: progressId
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               percentage:
 *                 type: number
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
router.put(
  "/:shiftId/progresses/:progressId",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  updateProgress,
);

/**
 * @swagger
 * /shifts/{shiftId}/progress-events:
 *   get:
 *     tags:
 *       - Shifts
 *     summary: Get timeline of all progress events for a shift (including signatures, clock-ins, etc.)
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
 *         description: Chronological list of progress events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     enum: [progress, signature, clock-in, clock-out, note]
 *                     example: progress
 *                   description:
 *                     type: string
 *                   staffName:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     example: 2025-06-15T14:30:00.000Z
 *                   metadata:
 *                     type: object
 */
router.get(
  "/:shiftId/progress-events",
  isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], isAssignedToShift),
  getProgressEvents,
);

export default router;
