import { Router } from "express";
import {
  addClient,
  archiveClient,
  getClient,
  getClients,
  changeStatusClient,
  updateClient,
  getArchivedClients,
} from "../controllers/clientController";
import { isInRoles, requireAuth } from "../middleware/authMiddleware";
import { ROLE_IDS } from "../constants/roles";

const router = Router();

/**
 * @swagger
 * /clients:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get all active clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: query
 *         in: query
 *         description: Query to search staffs
 *         required: false
 *         type: string
 *       - name: page
 *         in: query
 *         description: Page number
 *         required: false
 *         type: number
 *       - name: perPage
 *         in: query
 *         description: Number of items per page
 *         required: false
 *         type: number
 *       - name: sort
 *         in: query
 *         description: Sort Field
 *         required: false
 *         type: string
 *         enum:
 *           - email
 *           - createdAt
 *       - name: order
 *         in: query
 *         description: Sort Order
 *         required: false
 *         type: string
 *         enum:
 *           - asc
 *           - desc
 *       - name: roles
 *         in: query
 *         description: Roles to filter by (can select multiple)
 *         required: false
 *         type: array
 *         items:
 *           type: string
 *       - name: joined
 *         in: query
 *         description: Joined status to filter by
 *         required: false
 *         type: boolean
 *       - name: archived
 *         in: query
 *         description: Archived status to filter by
 *         required: false
 *     responses:
 *       200:
 *         description: Get staffs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 1234567890
 *                       useSalutation:
 *                         type: boolean
 *                         example: false
 *                       firstName:
 *                         type: string
 *                         example: John
 *                       lastName:
 *                         type: string
 *                         example: Doe
 *                       middleName:
 *                         type: string
 *                         example: Melissa
 *                       birthdate:
 *                         type: string
 *                         example: 2021-01-01
 *                       gender:
 *                         type: string
 *                         example: male
 *                       address:
 *                         type: string
 *                         example: 86 Te Hanh St
 *                       mobileNumber:
 *                         type: string
 *                         example: 0123456789
 *                       email:
 *                         type: string
 *                         example: john.doe@example.com
 *                       languages:
 *                         type: [string]
 *                         example: [English, French]
 *                       status:
 *                         type: enum
 *                         example: propect, active, inactive
 *                       isArchived:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         example: 2021-01-01T00:00:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         example: 2021-01-01T00:00:00.000Z
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 10
 *                     page:
 *                       type: number
 *                       example: 1
 *                     perPage:
 *                       type: number
 *                       example: 10
 *
 */
router.get("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), getClients);

/**
 * @swagger
 * /clients/archived:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get all archived clients
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: query
 *         in: query
 *         description: Query to search staffs
 *         required: false
 *         type: string
 *       - name: page
 *         in: query
 *         description: Page number
 *         required: false
 *         type: number
 *       - name: perPage
 *         in: query
 *         description: Number of items per page
 *         required: false
 *         type: number
 *       - name: sort
 *         in: query
 *         description: Sort Field
 *         required: false
 *         type: string
 *         enum:
 *           - email
 *           - createdAt
 *       - name: order
 *         in: query
 *         description: Sort Order
 *         required: false
 *         type: string
 *         enum:
 *           - asc
 *           - desc
 *       - name: roles
 *         in: query
 *         description: Roles to filter by (can select multiple)
 *         required: false
 *         type: array
 *         items:
 *           type: string
 *       - name: joined
 *         in: query
 *         description: Joined status to filter by
 *         required: false
 *         type: boolean
 *       - name: archived
 *         in: query
 *         description: Archived status to filter by
 *         required: false
 *     responses:
 *       200:
 *         description: Get staffs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 1234567890
 *                       useSalutation:
 *                         type: boolean
 *                         example: false
 *                       firstName:
 *                         type: string
 *                         example: John
 *                       lastName:
 *                         type: string
 *                         example: Doe
 *                       middleName:
 *                         type: string
 *                         example: Melissa
 *                       birthdate:
 *                         type: string
 *                         example: 2021-01-01
 *                       gender:
 *                         type: string
 *                         example: male
 *                       address:
 *                         type: string
 *                         example: 86 Te Hanh St
 *                       mobileNumber:
 *                         type: string
 *                         example: 0123456789
 *                       email:
 *                         type: string
 *                         example: john.doe@example.com
 *                       languages:
 *                         type: [string]
 *                         example: [English, French]
 *                       status:
 *                         type: enum
 *                         example: propect, active, inactive
 *                       isArchived:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         example: 2021-01-01T00:00:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         example: 2021-01-01T00:00:00.000Z
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                       example: 10
 *                     page:
 *                       type: number
 *                       example: 1
 *                     perPage:
 *                       type: number
 *                       example: 10
 *
 */
router.get("/archived", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), getArchivedClients);

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Get client by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Client ID
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Client details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 */
router.get("/:id", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), getClient);

/**
 * @swagger
 * /clients:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Create a new client
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientDto'
 *     responses:
 *       201:
 *         description: Client created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 */
router.post("/", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), addClient);

/**
 * @swagger
 * /clients/{id}:
 *   put:
 *     tags:
 *       - Clients
 *     summary: Update client
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Client ID
 *         required: true
 *         type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClientDto'
 *     responses:
 *       200:
 *         description: Client updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 */
router.put("/:id", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), updateClient);

/**
 * @swagger
 * /clients/archive:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Archive one or multiple clients
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["60f1b2b3e4b0c1234567890", "60f1b2b3e4b0c1234567891"]
 *             required:
 *               - clientIds
 *     responses:
 *       200:
 *         description: Clients archived successfully
 */
router.post("/archive", requireAuth, isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]), archiveClient);

/**
 * @swagger
 * /clients/change-status:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Change client status (e.g. active/inactive)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: 60f1b2b3e4b0c1234567890
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: inactive
 *             required:
 *               - clientId
 *               - status
 *     responses:
 *       200:
 *         description: Client status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 */
router.post(
  "/change-status",
  requireAuth,
  isInRoles([ROLE_IDS.ADMIN, ROLE_IDS.HR]),
  changeStatusClient,
);

export default router;
