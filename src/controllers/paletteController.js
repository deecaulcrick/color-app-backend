const Palette = require("../models/Palette");
const Folder = require("../models/Folder");
const UserPalette = require("../models/UserPalette");
const ColorMagicService = require("../services/colorMagicService");

const searchPalettes = async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'q' is required",
      });
    }
    const searchResults = await ColorMagicService.searchPalettes(query);

    let savedPaletteIds = [];
    if (req.user && req.user._id) {
      const savedPalettes = await UserPalette.find({
        userId: req.user._id,
      }).populate({
        path: "paletteId",
        match: {
          source: "colormagic",
          externalId: { $in: searchResults.data.map((p) => p.id) },
        },
      });

      savedPaletteIds = savedPalettes
        .filter((sp) => sp.paletteId) // Filter out nulls
        .map((sp) => sp.paletteId.externalId);
    }

    // Transform results to our palette format
    const transformedPalettes = searchResults.data.map((palette) => ({
      ...ColorMagicService.transformPalette(palette),
      id: palette.id,
      isSaved: savedPaletteIds.includes(palette.id),

      totalSaves: 0,
      totalLikes: 0,
    }));

    res.status(200).json({
      success: true,
      message: "Palettes retrieved successfully",
      data: {
        palettes: transformedPalettes,
        total: searchResults.total,
        query,
      },
    });
  } catch (error) {
    console.error("Error in searchPalettes controller:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search palettes",
    });
  }
};

const getUserPalettes = async (req, res) => {
  try {
    const { page = 1, limit = 20, folderId } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (folderId) {
      query.folderId = folderId;
    }

    const userPalettes = await UserPalette.find(query)
      .populate("paletteId")
      .populate("folderId", "name description color")
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserPalette.countDocuments(query);

    const formattedPalettes = userPalettes.map((saved) => ({
      savedPaletteId: saved._id,
      paletteId: saved.paletteId._id,
      globalPalette: {
        id: saved.paletteId._id,
        name: saved.paletteId.name,
        description: saved.paletteId.description,
        colors: saved.paletteId.colors,
        tags: saved.paletteId.tags,
        source: saved.paletteId.source,
        externalId: saved.paletteId.externalId,
        totalSaves: saved.paletteId.totalSaves,
        totalLikes: saved.paletteId.totalLikes,
        totalViews: saved.paletteId.totalViews,
        createdBy: saved.paletteId.createdBy,
        createdAt: saved.paletteId.createdAt,
      },
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

const getPaletteById = async (req, res) => {
  try {
    const { id } = req.params;

    const userPalette = await UserPalette.findOne({
      _id: id,
      userId: req.user._id,
    })
      .populate("paletteId")
      .populate("folderId", "name description");

    if (!userPalette) {
      return res.status(404).json({
        success: false,
        message: "Palette not found in user's collection",
      });
    }

    await Palette.findByIdAndUpdate(userPalette.paletteId._id, {
      $inc: { totalViews: 1 },
    });

    res.status(200).json({
      success: true,
      data: {
        userPaletteId: userPalette._id,
        globalPalette: userPalette.paletteId,
        useruserata: {
          folderId: userPalette.folderId,
          personalNotes: userPalette.personalNotes,
          personalTags: userPalette.personalTags,
          isLiked: userPalette.isLiked,
          userAt: userPalette.userAt,
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

const savePalette = async (req, res) => {
  try {
    const {
      externalId,
      name,
      description,
      colors,
      tags,
      folderId,
      personalNotes,
      personalTags,
    } = req.body;

    // Check if user already saved this palette
    const existingGlobalPalette = await Palette.findOne({
      source: "colormagic",
      externalId,
    });

    let globalPalette;
    if (existingGlobalPalette) {
      globalPalette = existingGlobalPalette;

      //check if palette with externalId already saved by user
      const existingPalette = await UserPalette.findOne({
        userId: req.user._id,
        paletteId: globalPalette._id,
      });

      if (existingPalette) {
        return res.status(400).json({
          success: false,
          message: "Palette already saved in your collection",
          data: {
            savedPaletteId: existingSave._id,
            globalPalette,
          },
        });
      }
    } else {
      // Create new global palette
      globalPalette = await Palette.create({
        name,
        description,
        colors,
        tags,
        source: "colormagic",
        externalId,
        createdBy: req.user._id,
        isPublic: true,
      });
    }

    // Verify folder if specified
    if (folderId) {
      const folder = await Folder.findOne({
        _id: folderId,
        userId: req.user._id,
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Folder not found",
        });
      }
    }

    // Save palette for user
    const savedPalette = await UserPalette.create({
      userId: req.user._id,
      paletteId: globalPalette._id,
      folderId: folderId || null,
      personalNotes: personalNotes || "",
      personalTags: personalTags || [],
    });

    // Update folder count
    if (folderId) {
      await Folder.findByIdAndUpdate(folderId, {
        $inc: { paletteCount: 1 },
      });
    }

    const populatedSavedPalette = await UserPalette.findById(savedPalette._id)
      .populate("paletteId")
      .populate("folderId", "name color");

    res.status(201).json({
      success: true,
      message: "Palette saved successfully",
      data: {
        savedPaletteId: populatedSavedPalette._id,
        globalPalette: populatedSavedPalette.paletteId,
        userSaveData: {
          folderId: populatedSavedPalette.folderId,
          personalNotes: populatedSavedPalette.personalNotes,
          personalTags: populatedSavedPalette.personalTags,
          isLiked: populatedSavedPalette.isLiked,
          savedAt: populatedSavedPalette.savedAt,
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

const updateSavedPalette = async (req, res) => {
  try {
    const { id } = req.params;
    const { folderId, personalNotes, personalTags, isLiked } = req.body;

    // Find the saved palette
    const savedPalette = await UserPalette.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!savedPalette) {
      return res.status(404).json({
        success: false,
        message: "Saved palette not found",
      });
    }

    // Handle folder change
    if (
      folderId !== undefined &&
      folderId !== savedPalette.folderId?.toString()
    ) {
      // Verify new folder belongs to user if changing folder
      if (folderId) {
        const newFolder = await Folder.findOne({
          _id: folderId,
          userId: req.user._id,
        });

        if (!newFolder) {
          return res.status(404).json({
            success: false,
            message: "Target folder not found",
          });
        }
      }

      // Update folder counts
      if (savedPalette.folderId) {
        await Folder.findByIdAndUpdate(savedPalette.folderId, {
          $inc: { paletteCount: -1 },
        });
      }
      if (folderId) {
        await Folder.findByIdAndUpdate(folderId, {
          $inc: { paletteCount: 1 },
        });
      }
    }

    // Update the saved palette
    const updatedSavedPalette = await UserPalette.findByIdAndUpdate(
      id,
      {
        folderId: folderId !== undefined ? folderId : savedPalette.folderId,
        personalNotes:
          personalNotes !== undefined
            ? personalNotes
            : savedPalette.personalNotes,
        personalTags:
          personalTags !== undefined ? personalTags : savedPalette.personalTags,
        isLiked: isLiked !== undefined ? isLiked : savedPalette.isLiked,
        updatedAt: Date.now(),
      },
      { new: true }
    )
      .populate("paletteId")
      .populate("folderId", "name color");

    res.status(200).json({
      success: true,
      message: "Saved palette updated successfully",
      data: {
        savedPaletteId: updatedSavedPalette._id,
        globalPalette: updatedSavedPalette.paletteId,
        userSaveData: {
          folderId: updatedSavedPalette.folderId,
          personalNotes: updatedSavedPalette.personalNotes,
          personalTags: updatedSavedPalette.personalTags,
          isLiked: updatedSavedPalette.isLiked,
          savedAt: updatedSavedPalette.savedAt,
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

const unsavePalette = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and verify ownership
    const savedPalette = await UserPalette.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!savedPalette) {
      return res.status(404).json({
        success: false,
        message: "Saved palette not found",
      });
    }

    // Update folder count
    if (savedPalette.folderId) {
      await Folder.findByIdAndUpdate(savedPalette.folderId, {
        $inc: { paletteCount: -1 },
      });
    }

    // Remove the saved palette (this will trigger the post-remove middleware to update global stats)
    await UserPalette.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Palette removed from saved palettes",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get popular/trending palettes
const getPopularPalettes = async (req, res) => {
  try {
    const { page = 1, limit = 20, timeframe = "all" } = req.query;
    const skip = (page - 1) * limit;

    let dateFilter = {};
    if (timeframe === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter.createdAt = { $gte: weekAgo };
    } else if (timeframe === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter.createdAt = { $gte: monthAgo };
    }

    const popularPalettes = await Palette.find({
      isPublic: true,
      ...dateFilter,
    })
      .sort({ totalSaves: -1, totalLikes: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy", "username firstName lastName");

    const total = await Palette.countDocuments({
      isPublic: true,
      ...dateFilter,
    });

    // Check which palettes the user has saved (if authenticated)
    let userSavedPalettes = [];
    if (req.user) {
      const savedPalettes = await UserPalette.find({
        userId: req.user._id,
        paletteId: { $in: popularPalettes.map((p) => p._id) },
      });
      userSavedPalettes = savedPalettes.map((sp) => sp.paletteId.toString());
    }

    const palettesWithSaveStatus = popularPalettes.map((palette) => ({
      ...palette.toObject(),
      isSaved: userSavedPalettes.includes(palette._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data: {
        palettes: palettesWithSaveStatus,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: skip + popularPalettes.length < total,
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

// Get palette by global ID (for sharing/viewing)
const getGlobalPaletteById = async (req, res) => {
  try {
    const { id } = req.params;

    const palette = await Palette.findById(id).populate(
      "createdBy",
      "username firstName lastName"
    );

    if (!palette) {
      return res.status(404).json({
        success: false,
        message: "Palette not found",
      });
    }

    // Increment view count
    await Palette.findByIdAndUpdate(id, {
      $inc: { totalViews: 1 },
    });

    // Check if user has saved this palette (if authenticated)
    let isSaved = false;
    let savedPaletteId = null;
    if (req.user) {
      const savedPalette = await UserPalette.findOne({
        userId: req.user._id,
        paletteId: id,
      });
      if (savedPalette) {
        isSaved = true;
        savedPaletteId = savedPalette._id;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        palette: {
          ...palette.toObject(),
          isSaved,
          savedPaletteId,
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
  searchPalettes,
  getUserPalettes,
  getPaletteById,
  savePalette,
  updateSavedPalette,
  unsavePalette,
  getPopularPalettes,
  getGlobalPaletteById,
};
