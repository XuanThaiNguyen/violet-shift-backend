import { Router } from "express";
import {
  addClient,
  archiveClient,
  getClient,
  getClients,
  changeStatusClient,
  updateClient,
} from "../controllers/clientController";
import { isInRoles, requireAuth } from "../middleware/authMiddleware";
import { ROLE_IDS } from "../constants/roles";

const router = Router();

router.get("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), getClients);

router.get("/:id", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), getClient);

router.post("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), addClient);

router.put("/:id", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), updateClient);

router.post("/archive", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), archiveClient);

router.post(
  "/change-status",
  requireAuth,
  isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]),
  changeStatusClient,
);

export default router;
