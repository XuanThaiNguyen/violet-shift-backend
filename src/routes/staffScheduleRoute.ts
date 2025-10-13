import { Router } from "express";
import { isInRoles, isInRolesOrSelf, requireAuth } from "../middleware/authMiddleware";
import { addShift, getShift, isAssignedToShift } from "../controllers/shifts/shiftController";
import { ROLE_IDS } from "../constants/roles";
import { getStaffSchedules } from "../controllers/shifts/staffSchedulesController";
import { AuthRequest } from "../middleware/type";

const router = Router();
router.use(requireAuth);

router.get("/", requireAuth, isInRolesOrSelf([ROLE_IDS.ADMIN, ROLE_IDS.COORDINATOR], (req) => req.query.staffId === (req as AuthRequest).userId), getStaffSchedules);


export default router;
