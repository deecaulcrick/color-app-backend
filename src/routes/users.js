const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  getUserStats,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const {
  validateMongoId,
  validatePagination,
} = require("../middleware/validation");

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile with basic stats
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalSavedPalettes:
 *                           type: number
 *                         totalCreatedPalettes:
 *                           type: number
 *                         totalFolders:
 *                           type: number
 *                         likedPalettes:
 *                           type: number
 */
router.get("/profile", getUserProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *               avatar:
 *                 type: string
 *                 description: URL to user's avatar image
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 */
router.put("/profile", updateUserProfile);

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     tags: [Users]
 *     summary: Get detailed user statistics and recent activity
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     stats:
 *                       $ref: '#/components/schemas/UserStats'
 *                     recentActivity:
 *                       type: object
 *                       properties:
 *                         recentSavedPalettes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/SavedPaletteResponse'
 */
router.get("/stats", getUserStats);

module.exports = router;
