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

/**
 * @swagger
 * /price-books:
 *   get:
 *     tags:
 *       - Price Books
 *     summary: Get all active price books
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active price books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PriceBook'
 */
router.get("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), getPriceBooks);

/**
 * @swagger
 * /price-books:
 *   get:
 *     tags:
 *       - Price Books
 *     summary: Get all active price books
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active price books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PriceBook'
 */

/**
 * @swagger
 * /price-books:
 *   post:
 *     tags:
 *       - Price Books
 *     summary: Create a new price book
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Standard Rate 2025
 *               description:
 *                 type: string
 *                 example: Default pricing for all clients in 2025
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *               validFrom:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-01
 *               validTo:
 *                 type: string
 *                 format: date
 *                 example: 2025-12-31
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Price book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceBook'
 */
router.post("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), addPriceBook);

/**
 * @swagger
 * /price-books/{id}:
 *   put:
 *     tags:
 *       - Price Books
 *     summary: Update price book
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Price book ID
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Standard Rate 2025 - Updated
 *               description:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               validFrom:
 *                 type: string
 *                 format: date
 *               validTo:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Price book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceBook'
 */
router.put("/:id", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), updatePriceBook);

/**
 * @swagger
 * /price-books/archive:
 *   post:
 *     tags:
 *       - Price Books
 *     summary: Archive one or multiple price books
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priceBookIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60f1b2b3e4b0c1234567890", "60f1b2b3e4b0c1234567891"]
 *             required:
 *               - priceBookIds
 *     responses:
 *       200:
 *         description: Price book(s) archived successfully
 */
router.post("/archive", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), archivePricebook);

export default router;
