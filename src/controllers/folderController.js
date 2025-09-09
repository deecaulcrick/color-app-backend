const Folder = require("../models/Folder");
const UserPalette = require("../models/UserPalette");

const getUserFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: { folders },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFolderById = async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { folder },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createFolder = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    const folder = await Folder.create({
      name,
      description,
      color,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Folder created successfully",
      data: { folder },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A folder with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating default folder name
    if (updates.name) {
      const folder = await Folder.findById(id);
      if (folder?.isDefault) {
        delete updates.name;
      }
    }

    const folder = await Folder.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Folder updated successfully",
      data: { folder },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A folder with this name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await Folder.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Don't allow deletion of default folder
    if (folder.isDefault) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete default folder",
      });
    }

    // Move all palettes in this folder to default folder
    const defaultFolder = await Folder.findOne({
      userId: req.user._id,
      isDefault: true,
    });

    if (defaultFolder) {
      const paletteCount = await UserPalette.countDocuments({
        userId: req.user._id,
        folderId: id,
      });

      // Update palettes to move to default folder
      await UserPalette.updateMany(
        { userId: req.user._id, folderId: id },
        { folderId: defaultFolder._id }
      );

      // Update default folder count
      await Folder.findByIdAndUpdate(defaultFolder._id, {
        $inc: { paletteCount: paletteCount },
      });
    }

    // Delete the folder
    await Folder.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Folder deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFolderPalettes = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Verify folder ownership
    const folder = await Folder.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Folder not found",
      });
    }

    // Get saved palettes in this folder
    const savedPalettes = await UserPalette.find({
      userId: req.user._id,
      folderId: id,
    })
      .populate("paletteId") // Populate the global palette data
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserPalette.countDocuments({
      userId: req.user._id,
      folderId: id,
    });

    // Format the response to separate user save data from global palette data
    const formattedPalettes = savedPalettes.map((saved) => ({
      savedPaletteId: saved._id,
      globalPalette: saved.paletteId, // The actual palette data
      userSaveData: {
        folderId: saved.folderId,
        personalNotes: saved.personalNotes,
        personalTags: saved.personalTags,
        isLiked: saved.isLiked,
        savedAt: saved.savedAt,
      },
    }));

    res.status(200).json({
      success: true,
      data: {
        folder,
        savedPalettes: formattedPalettes,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: skip + savedPalettes.length < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUserFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderPalettes,
};
