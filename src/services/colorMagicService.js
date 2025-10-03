const axios = require("axios");
const ColorNamerService = require("./colorNamerService");

class ColorMagicService {
  constructor() {
    this.baseURL = process.env.COLORMAGIC_API_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });
  }

  async searchPalettes(query) {
    try {

      const response = await this.client.get("/palette/search", {
        params: { q: query },
      });

      return {
        success: true,
        data: response.data,
        total: response.data.length,
      }
    } catch (error) {
      console.error("Error searching palettes:", error.message,);

      if (error.response) {
        throw new Error(`ColorMagic API returned ${error.response.status}: ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('ColorMagic API is not responding');
      } else {
        throw new Error('Failed to search palettes');
      }
    }
  }



  // Transform ColorMagic palette to our format
  transformPalette(colorMagicPalette) {
    return {
      name: colorMagicPalette.text || 'Untitled Palette',
      description: colorMagicPalette.description || '',
      colors: colorMagicPalette.colors?.map(color => ({
        hex: color.hex || color,
        name: ColorNamerService.getColorName(color.hex || color) || '',
        rgb: color.rgb || this.hexToRgb(color.hex || color),
        hsl: color.hsl || this.hexToHsl(color.hex || color)
      })) || [],
      tags: colorMagicPalette.tags || [],
      source: 'colormagic',
      externalId: colorMagicPalette.id
    };
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  hexToHsl(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return null;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }
}

module.exports = new ColorMagicService();