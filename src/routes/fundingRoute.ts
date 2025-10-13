import { Router } from "express";
import {
  addFunding,
  deleteFunding,
  getFundings,
  getFundingsByUser,
  updateFunding,
} from "../controllers/fundingController";

const router = Router();

router.post("/", addFunding);
router.get("/", getFundings);
router.get("/:id", getFundingsByUser);
router.put("/:id", updateFunding);
router.delete("/:id", deleteFunding);

export default router;
