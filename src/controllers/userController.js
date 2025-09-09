const User = require("../models/User");
const Palette = require("../models/Palette");
const UserPalette = require("../models/UserPalette");
const Folder = require("../models/Folder");

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Get user stats
    const [
      totalSavedPalettes,
      totalCreatedPalettes,
      folderCount,
      likedPalettesCount,
    ] = await Promise.all([
      UserPalette.countDocuments({ userId: req.user._id }),
      Palette.countDocuments({ createdBy: req.user._id }),
      Folder.countDocuments({ userId: req.user._id }),
      UserPalette.countDocuments({ userId: req.user._id, isLiked: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        stats: {
          totalSavedPalettes,
          totalCreatedPalettes,
          totalFolders: folderCount,
          likedPalettes: likedPalettesCount,
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

const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, avatar } = req.body;

    // Don't allow updating sensitive fields
    const allowedUpdates = { firstName, lastName, avatar };

    // Remove undefined values
    Object.keys(allowedUpdates).forEach(
      (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...allowedUpdates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
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

const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get comprehensive stats
    const [
      totalSavedPalettes,
      totalCreatedPalettes,
      totalFolders,
      likedPalettes,
      recentSavedPalettes,
      createdPaletteStats,
    ] = await Promise.all([
      UserPalette.countDocuments({ userId }),
      Palette.countDocuments({ createdBy: userId }),
      Folder.countDocuments({ userId }),
      UserPalette.countDocuments({ userId, isLiked: true }),
      UserPalette.find({ userId })
        .populate("paletteId", "name colors totalSaves totalLikes")
        .sort({ savedAt: -1 })
        .limit(5),
      Palette.aggregate([
        { $match: { createdBy: userId } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$totalViews" },
            totalLikes: { $sum: "$totalLikes" },
            totalSaves: { $sum: "$totalSaves" },
          },
        },
      ]),
    ]);
    const createdStats = createdPaletteStats[0] || {
      totalViews: 0,
      totalLikes: 0,
      totalSaves: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        stats: {
          saved: {
            totalSavedPalettes,
            likedPalettes,
          },
          created: {
            totalCreatedPalettes,
            totalViews: createdStats.totalViews,
            totalLikes: createdStats.totalLikes,
            totalSaves: createdStats.totalSaves,
          },
          organization: {
            totalFolders,
          },
        },
        recentActivity: {
          recentSavedPalettes: recentSavedPalettes.map((saved) => ({
            savedPaletteId: saved._id,
            globalPalette: saved.paletteId,
            savedAt: saved.savedAt,
          })),
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
  getUserProfile,
  updateUserProfile,
  getUserStats,
};
