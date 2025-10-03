const express = require("express");
const {
  searchPalettes,
  getUserPalettes,
  getPaletteById,
  createCustomPalette,
  savePalette,
  updateSavedPalette,
  unsavePalette,
  getPopularPalettes,
  getGlobalPaletteById,
  getGlobalPaletteByExternalId,
} = require("../controllers/paletteController");
const {
  validatePalette,
  validateSavePalette,
  validateUpdateSavedPalette,
  validateMongoId,
  validatePagination,
} = require("../middleware/validation");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
/**
 * @swagger
 * /api/palettes/search:
 *   get:
 *     tags: [Palettes]
 *     summary: Search for palettes using ColorMagic API
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *         example: ocean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: Search results returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Palettes retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     palettes:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/GlobalPalette'
 *                           - type: object
 *                             properties:
 *                               isSaved:
 *                                 type: boolean
 *                                 description: Whether the current user has saved this palette
 *                               savedPaletteId:
 *                                 type: string
 *                                 nullable: true
 *                                 description: ID of saved palette if user has saved it
 *                     total:
 *                       type: number
 *                     query:
 *                       type: string
 *       400:
 *         description: Missing search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/search", searchPalettes);

/**
 * @swagger
 * /api/palettes/popular:
 *   get:
 *     tags: [Palettes]
 *     summary: Get popular/trending palettes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [all, week, month]
 *           default: all
 *         description: Time period for trending palettes
 *     responses:
 *       200:
 *         description: Popular palettes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     palettes:
 *                       type: array
 *                       items:
 *                         allOf:
 *                           - $ref: '#/components/schemas/GlobalPalette'
 *                           - type: object
 *                             properties:
 *                               isSaved:
 *                                 type: boolean
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get("/popular", validatePagination, getPopularPalettes);

/**
 * @swagger
 * /api/palettes/global/{id}:
 *   get:
 *     tags: [Palettes]
 *     summary: Get a global palette by ID (for sharing/viewing)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Global palette ID
 *     responses:
 *       200:
 *         description: Palette retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     palette:
 *                       allOf:
 *                         - $ref: '#/components/schemas/GlobalPalette'
 *                         - type: object
 *                           properties:
 *                             isSaved:
 *                               type: boolean
 *                             savedPaletteId:
 *                               type: string
 *                               nullable: true
 *       404:
 *         description: Palette not found
 */
router.get("/global/:id", validateMongoId, getGlobalPaletteById);

/**
 * @swagger
 * /api/palettes/external/{externalId}:
 *   get:
 *     tags: [Palettes]
 *     summary: Get a palette by external ID (auto-syncs if needed)
 *     parameters:
 *       - in: path
 *         name: externalId
 *         required: true
 *         schema:
 *           type: string
 *         description: External palette ID (e.g., from ColorMagic)
 *         example: colormagic_123
 *     responses:
 *       200:
 *         description: Palette retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     palette:
 *                       allOf:
 *                         - $ref: '#/components/schemas/GlobalPalette'
 *                         - type: object
 *                           properties:
 *                             isSaved:
 *                               type: boolean
 *                             savedPaletteId:
 *                               type: string
 *                               nullable: true
 *       404:
 *         description: Palette not found
 */
router.get("/external/:externalId", getGlobalPaletteByExternalId);

// Protected routes
router.use(protect);

/**
 * @swagger
 * /api/palettes/saved:
 *   get:
 *     tags: [Palettes]
 *     summary: Get user's saved palettes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: string
 *         description: Filter by folder ID
 *     responses:
 *       200:
 *         description: Saved palettes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     savedPalettes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SavedPaletteResponse'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get("/saved", validatePagination, getUserPalettes);

/**
 * @swagger
 * /api/palettes/create:
 *   post:
 *     tags: [Palettes]
 *     summary: Create a new custom palette
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - colors
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: My Custom Palette
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: A beautiful custom palette for my project
 *               colors:
 *                 type: array
 *                 minItems: 2
 *                 maxItems: 10
 *                 items:
 *                   type: object
 *                   required:
 *                     - hex
 *                   properties:
 *                     hex:
 *                       type: string
 *                       pattern: '^#[0-9A-F]{6}$'
 *                       example: '#FF6B6B'
 *                     name:
 *                       type: string
 *                       example: Coral Red
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [custom, red, warm]
 *               folderId:
 *                 type: string
 *                 description: Optional folder to save the palette in
 *     responses:
 *       201:
 *         description: Palette created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Palette created and saved successfully
 *                 data:
 *                   $ref: '#/components/schemas/SavedPaletteResponse'
 */
router.post('/create', validatePalette, createCustomPalette);

/**
 * @swagger
 * /api/palettes/save:
 *   post:
 *     tags: [Palettes]
 *     summary: Save a palette from search results
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - externalId
 *               - name
 *               - colors
 *             properties:
 *               externalId:
 *                 type: string
 *                 description: External ID from ColorMagic
 *                 example: colormagic_123
 *               name:
 *                 type: string
 *                 example: Ocean Breeze
 *               description:
 *                 type: string
 *                 example: A calming ocean-inspired palette
 *               colors:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Color'
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               folderId:
 *                 type: string
 *                 description: Optional folder to save the palette in
 *               personalNotes:
 *                 type: string
 *                 maxLength: 500
 *                 example: Perfect for my summer project
 *               personalTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [summer, project]
 *     responses:
 *       201:
 *         description: Palette saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Palette saved successfully
 *                 data:
 *                   $ref: '#/components/schemas/SavedPaletteResponse'
 *       400:
 *         description: Palette already saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Palette already saved in your collection
 *                 data:
 *                   type: object
 *                   properties:
 *                     savedPaletteId:
 *                       type: string
 *                     globalPalette:
 *                       $ref: '#/components/schemas/GlobalPalette'
 */
router.post("/save", validateSavePalette, savePalette);

/**
 * @swagger
 * /api/palettes/saved/{id}:
 *   get:
 *     tags: [Palettes]
 *     summary: Get a specific saved palette
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Saved palette ID (UserPalette ID)
 *     responses:
 *       200:
 *         description: Saved palette retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     savedPaletteId:
 *                       type: string
 *                       description: ID of the UserPalette record
 *                     globalPalette:
 *                       $ref: '#/components/schemas/GlobalPalette'
 *                     userSaveData:
 *                       type: object
 *                       properties:
 *                         folderId:
 *                           type: string
 *                           nullable: true
 *                         personalNotes:
 *                           type: string
 *                         personalTags:
 *                           type: array
 *                           items:
 *                             type: string
 *                         isLiked:
 *                           type: boolean
 *                         savedAt:
 *                           type: string
 *                           format: date-time
 *       404:
 *         description: Saved palette not found
 */
router.get("/saved/:id", validateMongoId, getPaletteById);

/**
 * @swagger
 * /api/palettes/saved/{id}:
 *   put:
 *     tags: [Palettes]
 *     summary: Update a saved palette (folder, notes, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Saved palette ID (UserPalette ID)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: string
 *                 nullable: true
 *                 description: Move to different folder (null for no folder)
 *               personalNotes:
 *                 type: string
 *                 maxLength: 500
 *                 example: Updated notes about this palette
 *               personalTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [updated, tag]
 *               isLiked:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Saved palette updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Saved palette updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/SavedPaletteResponse'
 */
router.put(
  "/saved/:id",
  validateMongoId,
  validateUpdateSavedPalette,
  updateSavedPalette
);

/**
 * @swagger
 * /api/palettes/saved/{id}:
 *   delete:
 *     tags: [Palettes]
 *     summary: Remove a palette from saved palettes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Saved palette ID (UserPalette ID)
 *     responses:
 *       200:
 *         description: Palette removed from saved palettes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Palette removed from saved palettes
 *       404:
 *         description: Saved palette not found
 */
router.delete("/saved/:id", validateMongoId, unsavePalette);

module.exports = router;