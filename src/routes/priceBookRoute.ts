import { Router } from "express";
import { ROLE_IDS } from "../constants/roles";
import {
  addPriceBook,
  archivePricebook,
  getPriceBooks,
  updatePriceBook,
} from "../controllers/priceBookController";
import { isInRoles, requireAuth } from "../middleware/authMiddleware";

const router = Router();

router.get("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), getPriceBooks);
router.post("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), addPriceBook);
router.put("/:id", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), updatePriceBook);
router.post("/archive", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), archivePricebook);

export default router;
