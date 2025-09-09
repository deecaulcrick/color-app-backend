const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

const validateRegistration = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, hyphens, and underscores"
    ),
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("firstName")
    .optional()
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),
  body("lastName")
    .optional()
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),
  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validatePalette = [
  body("name")
    .isLength({ min: 1, max: 100 })
    .withMessage("Palette name must be between 1 and 100 characters"),
  body("colors")
    .isArray({ min: 2, max: 10 })
    .withMessage("Palette must have between 2 and 10 colors"),
  body("colors.*.hex")
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Invalid hex color format"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  handleValidationErrors,
];

const validateSavePalette = [
  body("externalId").notEmpty().withMessage("External ID is required"),
  body("name")
    .isLength({ min: 1, max: 100 })
    .withMessage("Palette name must be between 1 and 100 characters"),
  body("colors")
    .isArray({ min: 2, max: 10 })
    .withMessage("Palette must have between 2 and 10 colors"),
  body("colors.*.hex")
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Invalid hex color format"),
  body("folderId").optional().isMongoId().withMessage("Invalid folder ID"),
  body("personalNotes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Personal notes cannot exceed 500 characters"),
  body("personalTags")
    .optional()
    .isArray()
    .withMessage("Personal tags must be an array"),
  handleValidationErrors,
];

const validateUpdateSavedPalette = [
  body("folderId").optional().isMongoId().withMessage("Invalid folder ID"),
  body("personalNotes")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Personal notes cannot exceed 500 characters"),
  body("personalTags")
    .optional()
    .isArray()
    .withMessage("Personal tags must be an array"),
  body("isFavorite")
    .optional()
    .isBoolean()
    .withMessage("isLiked must be a boolean"),
  handleValidationErrors,
];

const validateFolder = [
  body("name")
    .isLength({ min: 1, max: 50 })
    .withMessage("Folder name must be between 1 and 50 characters"),
  body("description")
    .optional()
    .isLength({ max: 200 })
    .withMessage("Description cannot exceed 200 characters"),
  body("color")
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage("Invalid hex color format"),
  handleValidationErrors,
];

const validateMongoId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

module.exports = {
  validateRegistration,
  validateLogin,
  validatePalette,
  validateSavePalette,
  validateUpdateSavedPalette,
  validateFolder,
  validateMongoId,
  validatePagination,
  handleValidationErrors,
};
