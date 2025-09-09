const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Color Palette API',
      version: '2.0.0',
      description: 'A comprehensive API for managing color palettes with global palette storage and user-specific saves, similar to Spotify\'s architecture',
      contact: {
        name: 'API Support',
        email: 'support@colorpaletteapp.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production'
          ? 'https://your-production-domain.com'
          : `http://localhost:${process.env.PORT || 5000}`,
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your Bearer token in the format: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier'
            },
            username: {
              type: 'string',
              description: 'Unique username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            avatar: {
              type: 'string',
              description: 'URL to user avatar image'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Color: {
          type: 'object',
          required: ['hex'],
          properties: {
            hex: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              description: 'Hexadecimal color code',
              example: '#FF6B6B'
            },
            name: {
              type: 'string',
              description: 'Human-readable color name',
              example: 'Coral Red'
            },
            rgb: {
              type: 'object',
              description: 'RGB color values',
              properties: {
                r: { type: 'number', minimum: 0, maximum: 255 },
                g: { type: 'number', minimum: 0, maximum: 255 },
                b: { type: 'number', minimum: 0, maximum: 255 }
              }
            },
            hsl: {
              type: 'object',
              description: 'HSL color values',
              properties: {
                h: { type: 'number', minimum: 0, maximum: 360 },
                s: { type: 'number', minimum: 0, maximum: 100 },
                l: { type: 'number', minimum: 0, maximum: 100 }
              }
            }
          }
        },
        GlobalPalette: {
          type: 'object',
          required: ['name', 'colors', 'createdBy'],
          description: 'Global palette that exists once and can be saved by multiple users',
          properties: {
            id: {
              type: 'string',
              description: 'Unique global palette identifier'
            },
            name: {
              type: 'string',
              maxLength: 100,
              description: 'Palette name'
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Palette description'
            },
            colors: {
              type: 'array',
              items: { $ref: '#/components/schemas/Color' },
              minItems: 2,
              maxItems: 10,
              description: 'Array of colors in the palette'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags associated with the palette'
            },
            source: {
              type: 'string',
              enum: ['user', 'colormagic', 'generated'],
              default: 'user',
              description: 'Source of the palette'
            },
            externalId: {
              type: 'string',
              description: 'ID from external source (e.g., ColorMagic)'
            },
            createdBy: {
              type: 'string',
              description: 'ID of user who created this palette'
            },
            totalSaves: {
              type: 'number',
              default: 0,
              description: 'Total number of times this palette has been saved'
            },
            totalLikes: {
              type: 'number',
              default: 0,
              description: 'Total number of likes across all users'
            },
            totalViews: {
              type: 'number',
              default: 0,
              description: 'Total number of views'
            },
            isPublic: {
              type: 'boolean',
              default: true,
              description: 'Whether the palette is publicly visible'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        SavedPalette: {
          type: 'object',
          required: ['userId', 'paletteId'],
          description: 'User-specific save of a global palette',
          properties: {
            id: {
              type: 'string',
              description: 'Unique saved palette identifier'
            },
            userId: {
              type: 'string',
              description: 'ID of user who saved this palette'
            },
            paletteId: {
              type: 'string',
              description: 'ID of the global palette being saved'
            },
            folderId: {
              type: 'string',
              nullable: true,
              description: 'ID of folder containing this saved palette'
            },
            personalNotes: {
              type: 'string',
              maxLength: 500,
              description: 'User\'s personal notes about this palette'
            },
            personalTags: {
              type: 'array',
              items: { type: 'string' },
              description: 'User\'s personal tags for this palette'
            },
            isLiked: {
              type: 'boolean',
              default: false,
              description: 'Whether the user liked this palette'
            },
            savedAt: {
              type: 'string',
              format: 'date-time',
              description: 'When the user saved this palette'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        SavedPaletteResponse: {
          type: 'object',
          description: 'Combined response with global palette data and user save data',
          properties: {
            savedPaletteId: {
              type: 'string',
              description: 'ID of the saved palette record'
            },
            paletteId: {
              type: 'string',
              description: 'ID of the global palette (for convenience)'
            },
            globalPalette: {
              $ref: '#/components/schemas/GlobalPalette',
              description: 'Complete global palette data'
            },
            userSaveData: {
              type: 'object',
              description: 'User-specific save information',
              properties: {
                folderId: {
                  type: 'string',
                  nullable: true,
                  description: 'Folder containing this saved palette'
                },
                personalNotes: {
                  type: 'string',
                  description: 'User\'s personal notes'
                },
                personalTags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'User\'s personal tags'
                },
                isLiked: {
                  type: 'boolean',
                  description: 'Whether user liked this palette'
                },
                savedAt: {
                  type: 'string',
                  format: 'date-time',
                  description: 'When user saved this palette'
                }
              }
            }
          }
        },
        Folder: {
          type: 'object',
          required: ['name', 'userId'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique folder identifier'
            },
            name: {
              type: 'string',
              maxLength: 50,
              description: 'Folder name'
            },
            description: {
              type: 'string',
              maxLength: 200,
              description: 'Folder description'
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              default: '#6366f1',
              description: 'Folder color theme'
            },
            userId: {
              type: 'string',
              description: 'ID of user who owns this folder'
            },
            isDefault: {
              type: 'boolean',
              default: false,
              description: 'Whether this is the user\'s default folder'
            },
            paletteCount: {
              type: 'number',
              default: 0,
              description: 'Number of saved palettes in this folder'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        UserStats: {
          type: 'object',
          description: 'Comprehensive user statistics',
          properties: {
            saved: {
              type: 'object',
              description: 'Statistics about saved palettes',
              properties: {
                totalSavedPalettes: {
                  type: 'number',
                  description: 'Total palettes saved by user'
                },
                likedPalettes: {
                  type: 'number',
                  description: 'Total palettes liked by user'
                }
              }
            },
            created: {
              type: 'object',
              description: 'Statistics about palettes created by user',
              properties: {
                totalCreatedPalettes: {
                  type: 'number',
                  description: 'Total palettes created by user'
                },
                totalViews: {
                  type: 'number',
                  description: 'Total views across user\'s created palettes'
                },
                totalLikes: {
                  type: 'number',
                  description: 'Total likes across user\'s created palettes'
                },
                totalSaves: {
                  type: 'number',
                  description: 'Total saves across user\'s created palettes'
                }
              }
            },
            organization: {
              type: 'object',
              description: 'Organization statistics',
              properties: {
                totalFolders: {
                  type: 'number',
                  description: 'Total folders created by user'
                }
              }
            }
          }
        },
        Pagination: {
          type: 'object',
          description: 'Pagination information',
          properties: {
            current: {
              type: 'number',
              description: 'Current page number'
            },
            pages: {
              type: 'number',
              description: 'Total number of pages'
            },
            total: {
              type: 'number',
              description: 'Total number of items'
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page'
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                token: {
                  type: 'string',
                  description: 'JWT authentication token'
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              description: 'Detailed validation errors',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field that caused the error'
                  },
                  message: {
                    type: 'string',
                    description: 'Error message for this field'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User profile and statistics endpoints'
      },
      {
        name: 'Palettes',
        description: 'Palette search, save, and management endpoints'
      },
      {
        name: 'Folders',
        description: 'Folder organization endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = specs;