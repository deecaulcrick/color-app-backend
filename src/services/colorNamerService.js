const namer = require('color-namer');

class ColorNamerService {
    // Get color name from hex code
    getColorName(hex) {
        try {
            const names = namer(hex);
            // Return the first name from the 'ntc' list as it's usually the most common
            return names.ntc[0]?.name || 'Unknown';
        } catch (error) {
            console.error("Error getting color name:", error.message);
            return 'Unknown';
        }
    }
}

module.exports = new ColorNamerService();