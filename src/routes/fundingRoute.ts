import { Router } from "express";
import {
  addFunding,
  deleteFunding,
  getFundingsByUser,
  updateFunding,
} from "../controllers/fundingController";

const router = Router();

/**
 * @swagger
 * /fundings:
 *   post:
 *     tags:
 *       - Fundings
 *     summary: Create a new funding request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500000
 *               currency:
 *                 type: string
 *                 example: USD
 *               purpose:
 *                 type: string
 *                 example: Project startup capital
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["file1.pdf", "file2.pdf"]
 *               notes:
 *                 type: string
 *                 example: Additional information
 *             required:
 *               - amount
 *               - purpose
 *     responses:
 *       201:
 *         description: Funding request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 1234567890
 *                 userId:
 *                   type: string
 *                   example: 9876543210
 *                 amount:
 *                   type: number
 *                   example: 500000
 *                 currency:
 *                   type: string
 *                   example: USD
 *                 purpose:
 *                   type: string
 *                   example: Project startup capital
 *                 status:
 *                   type: string
 *                   example: pending
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: string
 *                 notes:
 *                   type: string
 *                 isDeleted:
 *                   type: boolean
 *                   example: false
 *                 createdAt:
 *                   type: string
 *                   example: 2025-01-01T00:00:00.000Z
 *                 updatedAt:
 *                   type: string
 *                   example: 2025-01-01T00:00:00.000Z
 */
router.post("/", addFunding);

/**
 * @swagger
 * /fundings/{id}:
 *   get:
 *     tags:
 *       - Fundings
 *     summary: Get funding request by ID (accessible only to owner or admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Funding request ID
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Funding request details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 1234567890
 *                 userId:
 *                   type: string
 *                   example: 9876543210
 *                 amount:
 *                   type: number
 *                   example: 500000
 *                 currency:
 *                   type: string
 *                   example: USD
 *                 purpose:
 *                   type: string
 *                   example: Project startup capital
 *                 status:
 *                   type: string
 *                   example: pending
 *                 documents:
 *                   type: array
 *                   items:
 *                     type: string
 *                 notes:
 *                   type: string
 *                 isDeleted:
 *                   type: boolean
 *                   example: false
 *                 createdAt:
 *                   type: string
 *                   example: 2025-01-01T00:00:00.000Z
 *                 updatedAt:
 *                   type: string
 *                   example: 2025-01-01T00:00:00.000Z
 */
router.get("/:id", getFundingsByUser);

/**
 * @swagger
 * /fundings/{id}:
 *   put:
 *     tags:
 *       - Fundings
 *     summary: Update funding request (only if still pending)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Funding request ID
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 750000
 *               currency:
 *                 type: string
 *                 example: USD
 *               purpose:
 *                 type: string
 *                 example: Updated project capital request
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Funding request updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: 1234567890
 *                 amount:
 *                   type: number
 *                   example: 750000
 *                 purpose:
 *                   type: string
 *                   example: Updated project capital request
 *                 updatedAt:
 *                   type: string
 *                   example: 2025-01-02T10:00:00.000Z
 */
router.put("/:id", updateFunding);

/**
 * @swagger
 * /fundings/{id}:
 *   delete:
 *     tags:
 *       - Fundings
 *     summary: Delete (soft delete) funding request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Funding request ID
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Funding request deleted successfully
 *       204:
 *         description: No content
 */
router.delete("/:id", deleteFunding);

export default router;
