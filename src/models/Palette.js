const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
  hex: {
    type: String,
    required: true,
    match: [/^#[0-9A-F]{6}$/i, "Invalid hex color format"],
  },
  name: String,
  rgb: {
    r: Number,
    g: Number,
    b: Number,
  },
  hsl: {
    h: Number,
    s: Number,
    l: Number,
  },
});

const paletteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Palette name is required"],
      trim: true,
      maxlength: [100, "Palette name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    colors: {
      type: [colorSchema],
      required: true,
      validate: {
        validator: function (colors) {
          return colors.length >= 2 && colors.length <= 10;
        },
        message: "Palette must have between 2 and 10 colors",
      },
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    source: {
      type: String,
      enum: ["user", "colormagic", "generated"],
      default: "colormagic",
    },
    externalId: String, // For ColorMagic palettes
    likes: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
paletteSchema.index({ externalId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Palette", paletteSchema);
