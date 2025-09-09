const express = require("express");
const {
  getUserFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderPalettes,
} = require("../controllers/folderController");
const { validateFolder } = require("../middleware/validation");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All routes are protected
router.use(protect);

/**
 * @swagger
 * /api/folders:
 *   get:
 *     tags: [Folders]
 *     summary: Get user's folders
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Folders retrieved successfully
 */
router.get("/", getUserFolders);

/**
 * @swagger
 * /api/folders:
 *   post:
 *     tags: [Folders]
 *     summary: Create a new folder
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *               description:
 *                 type: string
 *                 maxLength: 200
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *                 default: '#6366f1'
 *     responses:
 *       201:
 *         description: Folder created successfully
 */
router.post("/", validateFolder, createFolder);

/**
 * @swagger
 * /api/folders/{id}:
 *   get:
 *     tags: [Folders]
 *     summary: Get a specific folder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder retrieved successfully
 */
router.get("/:id", getFolderById);

/**
 * @swagger
 * /api/folders/{id}:
 *   put:
 *     tags: [Folders]
 *     summary: Update a folder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder updated successfully
 */
router.put("/:id", validateFolder, updateFolder);

/**
 * @swagger
 * /api/folders/{id}:
 *   delete:
 *     tags: [Folders]
 *     summary: Delete a folder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder deleted successfully
 */
router.delete("/:id", deleteFolder);

/**
 * @swagger
 * /api/folders/{id}/palettes:
 *   get:
 *     tags: [Folders]
 *     summary: Get palettes in a specific folder
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder palettes retrieved successfully
 */
router.get("/:id/palettes", getFolderPalettes);

module.exports = router;
