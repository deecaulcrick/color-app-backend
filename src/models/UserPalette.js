const mongoose = require("mongoose");

const userPaletteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paletteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Palette",
      required: true,
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    personalNotes: {
      type: String,
      maxlength: [500, "Personal notes cannot exceed 500 characters"],
      default: "",
    },
    personalTags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isFavorite: { type: Boolean, default: false },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A user shouldn't save the same palette twice
userPaletteSchema.index({ userId: 1, paletteId: 1 }, { unique: true });

module.exports = mongoose.model("UserPalette", userPaletteSchema);
