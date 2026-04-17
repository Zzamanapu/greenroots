import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GreenRoots — Urban Farming Platform API',
      version: '1.0.0',
      description:
        'RESTful backend API for the GreenRoots Interactive Urban Farming Platform. ' +
        'Supports role-based access (Admin / Vendor / Customer), marketplace, rentals, ' +
        'community forum, plant tracking, and sustainability certifications.',
      contact: { name: 'GreenRoots Dev Team' },
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful.' },
            data: { nullable: true },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong.' },
            data: { nullable: true, example: null },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Registration, login, and profile' },
      { name: 'Vendors', description: 'Vendor profile management' },
      { name: 'Marketplace', description: 'Produce listings (seeds, tools, organic products)' },
      { name: 'Orders', description: 'Order placement and status management' },
      { name: 'Rentals', description: 'Farm space rental listings' },
      { name: 'Forum', description: 'Community posts and knowledge sharing' },
      { name: 'Certifications', description: 'Sustainability and organic certification' },
      { name: 'Plant Tracking', description: 'Real-time plant growth and health monitoring' },
      { name: 'Admin', description: 'Platform administration (Admin role only)' },
    ],
    paths: {
      // ── AUTH ──────────────────────────────────────────────────────────────
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Rafiq Hossain' },
                    email: { type: 'string', example: 'rafiq@example.com' },
                    password: { type: 'string', example: 'SecurePass@1' },
                    role: { type: 'string', enum: ['CUSTOMER', 'VENDOR'], example: 'CUSTOMER' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered successfully' },
            409: { description: 'Email already registered' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT token',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', example: 'rafiq@example.com' },
                    password: { type: 'string', example: 'SecurePass@1' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful — returns JWT token' },
            401: { description: 'Invalid credentials' },
            403: { description: 'Account suspended or banned' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          responses: {
            200: { description: 'Profile fetched' },
            401: { description: 'Unauthorised' },
          },
        },
      },

      // ── VENDORS ───────────────────────────────────────────────────────────
      '/api/vendors/profile': {
        post: {
          tags: ['Vendors'],
          summary: 'Create vendor profile (Vendor only)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['farmName', 'farmLocation'],
                  properties: {
                    farmName: { type: 'string', example: 'Sundarbans Organics' },
                    farmLocation: { type: 'string', example: 'Khulna, Bangladesh' },
                    bio: { type: 'string', example: 'Family-run organic farm since 2010.' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Vendor profile created' }, 409: { description: 'Profile already exists' } },
        },
      },
      '/api/vendors/profile/me': {
        get: {
          tags: ['Vendors'],
          summary: 'Get own vendor profile (Vendor only)',
          responses: { 200: { description: 'Profile fetched' }, 404: { description: 'Not found' } },
        },
        patch: {
          tags: ['Vendors'],
          summary: 'Update own vendor profile (Vendor only)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    farmName: { type: 'string' },
                    farmLocation: { type: 'string' },
                    bio: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Profile updated' } },
        },
      },
      '/api/vendors/all': {
        get: {
          tags: ['Vendors'],
          summary: 'List all vendors (Admin only) — supports ?status=',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] } },
          ],
          responses: { 200: { description: 'Vendors fetched' } },
        },
      },
      '/api/vendors/approve/{id}': {
        patch: {
          tags: ['Vendors'],
          summary: 'Approve a vendor (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Vendor approved' }, 404: { description: 'Vendor not found' } },
        },
      },

      // ── MARKETPLACE ───────────────────────────────────────────────────────
      '/api/marketplace': {
        get: {
          tags: ['Marketplace'],
          summary: 'Get all produce listings (Public)',
          security: [],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', example: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', example: 10 } },
            { name: 'category', in: 'query', schema: { type: 'string', example: 'Vegetables' } },
            { name: 'minPrice', in: 'query', schema: { type: 'number', example: 10 } },
            { name: 'maxPrice', in: 'query', schema: { type: 'number', example: 500 } },
            { name: 'inStock', in: 'query', schema: { type: 'boolean', example: true } },
          ],
          responses: { 200: { description: 'Produce list with pagination' } },
        },
        post: {
          tags: ['Marketplace'],
          summary: 'Create a produce listing (Vendor only)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'price', 'category'],
                  properties: {
                    name: { type: 'string', example: 'Organic Tomatoes' },
                    description: { type: 'string', example: 'Sun-ripened organic tomatoes.' },
                    price: { type: 'number', example: 45.00 },
                    category: { type: 'string', example: 'Vegetables' },
                    availableQuantity: { type: 'integer', example: 120 },
                    imageUrl: { type: 'string', example: 'https://example.com/tomato.jpg' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Produce created' } },
        },
      },
      '/api/marketplace/{id}': {
        get: {
          tags: ['Marketplace'],
          summary: 'Get produce by ID (Public)',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Produce fetched' }, 404: { description: 'Not found' } },
        },
        put: {
          tags: ['Marketplace'],
          summary: 'Update produce listing (Vendor only — must own it)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Updated' }, 403: { description: 'Not authorised' } },
        },
        delete: {
          tags: ['Marketplace'],
          summary: 'Delete produce listing (Vendor only — must own it)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Deleted' }, 403: { description: 'Not authorised' } },
        },
      },
      '/api/marketplace/vendor/mine': {
        get: {
          tags: ['Marketplace'],
          summary: "Get the vendor's own listings (Vendor only)",
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Vendor listings' } },
        },
      },

      // ── ORDERS ────────────────────────────────────────────────────────────
      '/api/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Place an order (Customer only)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['produceId'],
                  properties: {
                    produceId: { type: 'integer', example: 3 },
                    quantity: { type: 'integer', example: 2 },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Order placed' }, 400: { description: 'Out of stock / bad quantity' } },
        },
      },
      '/api/orders/my': {
        get: {
          tags: ['Orders'],
          summary: 'Get own orders (Customer only)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Orders fetched' } },
        },
      },
      '/api/orders/vendor': {
        get: {
          tags: ['Orders'],
          summary: "Get vendor's incoming orders (Vendor only) — supports ?status=",
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'] } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Vendor orders' } },
        },
      },
      '/api/orders/{id}/status': {
        patch: {
          tags: ['Orders'],
          summary: 'Update order status (Vendor only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Status updated' } },
        },
      },
      '/api/orders/all': {
        get: {
          tags: ['Orders'],
          summary: 'Get all orders — platform overview (Admin only)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'All orders' } },
        },
      },

      // ── FORUM ─────────────────────────────────────────────────────────────
      '/api/forum': {
        get: {
          tags: ['Forum'],
          summary: 'Get all posts (Public) — supports ?tag=',
          security: [],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'tag', in: 'query', schema: { type: 'string', example: 'organic' } },
          ],
          responses: { 200: { description: 'Posts fetched' } },
        },
        post: {
          tags: ['Forum'],
          summary: 'Create a post (Any authenticated user)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'postContent'],
                  properties: {
                    title: { type: 'string', example: 'Best compost ratio for tomatoes' },
                    postContent: { type: 'string', example: 'I have been experimenting with 3:1 brown-to-green ratio...' },
                    tags: { type: 'array', items: { type: 'string' }, example: ['composting', 'tomatoes'] },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Post created' } },
        },
      },
      '/api/forum/{id}': {
        get: {
          tags: ['Forum'],
          summary: 'Get a single post (Public)',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Post fetched' }, 404: { description: 'Not found' } },
        },
        delete: {
          tags: ['Forum'],
          summary: 'Delete a post (Owner or Admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Deleted' }, 403: { description: 'Not authorised' } },
        },
      },

      // ── RENTALS ───────────────────────────────────────────────────────────
      '/api/rentals': {
        get: {
          tags: ['Rentals'],
          summary: 'List all rental spaces (Public) — supports ?location= and ?available=true',
          security: [],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
            { name: 'location', in: 'query', schema: { type: 'string', example: 'Dhaka' } },
            { name: 'available', in: 'query', schema: { type: 'boolean', example: true } },
          ],
          responses: { 200: { description: 'Rental spaces fetched' } },
        },
        post: {
          tags: ['Rentals'],
          summary: 'Create a rental space listing (Vendor only)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['location', 'size', 'pricePerMonth'],
                  properties: {
                    location: { type: 'string', example: 'Mirpur-10, Dhaka' },
                    size: { type: 'string', example: '10x10 m' },
                    pricePerMonth: { type: 'number', example: 1500 },
                    description: { type: 'string', example: 'Sunny rooftop plot with water access.' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Rental space created' } },
        },
      },
      '/api/rentals/{id}': {
        get: {
          tags: ['Rentals'],
          summary: 'Get a single rental space (Public)',
          security: [],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Fetched' } },
        },
        patch: {
          tags: ['Rentals'],
          summary: 'Update rental space details / availability (Vendor only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    location: { type: 'string' },
                    size: { type: 'string' },
                    pricePerMonth: { type: 'number' },
                    availability: { type: 'boolean' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Rentals'],
          summary: 'Delete rental space (Vendor only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },

      // ── CERTIFICATIONS ────────────────────────────────────────────────────
      '/api/certs': {
        post: {
          tags: ['Certifications'],
          summary: 'Submit a sustainability certification (Vendor only)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['certifyingAgency', 'certificationDate'],
                  properties: {
                    certifyingAgency: { type: 'string', example: 'Bangladesh Organic Certification Board' },
                    certificationDate: { type: 'string', format: 'date', example: '2024-03-01' },
                    expiryDate: { type: 'string', format: 'date', example: '2026-03-01' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Certification submitted, pending review' } },
        },
      },
      '/api/certs/my': {
        get: {
          tags: ['Certifications'],
          summary: "Get vendor's own certifications (Vendor only)",
          responses: { 200: { description: 'Certifications fetched' } },
        },
      },
      '/api/certs/all': {
        get: {
          tags: ['Certifications'],
          summary: 'Get all certifications (Admin only) — supports ?status=',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] } },
          ],
          responses: { 200: { description: 'All certifications' } },
        },
      },
      '/api/certs/{id}/approve': {
        patch: {
          tags: ['Certifications'],
          summary: 'Approve certification and mark vendor as certified (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Approved' } },
        },
      },
      '/api/certs/{id}/reject': {
        patch: {
          tags: ['Certifications'],
          summary: 'Reject certification (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Rejected' } },
        },
      },

      // ── PLANT TRACKING ────────────────────────────────────────────────────
      '/api/plants': {
        post: {
          tags: ['Plant Tracking'],
          summary: 'Log a plant growth / health update',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['produceId', 'stage'],
                  properties: {
                    produceId: { type: 'integer', example: 5 },
                    stage: { type: 'string', enum: ['seedling', 'growing', 'flowering', 'harvest-ready'], example: 'growing' },
                    healthScore: { type: 'integer', minimum: 0, maximum: 100, example: 85 },
                    notes: { type: 'string', example: 'Leaves look healthy, added compost today.' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Log created' } },
        },
      },
      '/api/plants/my': {
        get: {
          tags: ['Plant Tracking'],
          summary: 'Get full plant log history — supports ?produceId=',
          parameters: [
            { name: 'produceId', in: 'query', schema: { type: 'integer' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Logs fetched' } },
        },
      },
      '/api/plants/summary': {
        get: {
          tags: ['Plant Tracking'],
          summary: 'Get latest status per tracked plant (dashboard view)',
          responses: { 200: { description: 'Plant summary' } },
        },
      },

      // ── ADMIN ─────────────────────────────────────────────────────────────
      '/api/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Get platform-wide statistics (Admin only)',
          responses: { 200: { description: 'Stats fetched' } },
        },
      },
      '/api/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'List all users — supports ?role= and ?status= (Admin only)',
          parameters: [
            { name: 'role', in: 'query', schema: { type: 'string', enum: ['ADMIN', 'VENDOR', 'CUSTOMER'] } },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'suspended', 'banned'] } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Users fetched' } },
        },
      },
      '/api/admin/users/{id}': {
        get: {
          tags: ['Admin'],
          summary: 'Get user by ID (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'User fetched' }, 404: { description: 'Not found' } },
        },
        delete: {
          tags: ['Admin'],
          summary: 'Delete a user (Admin only — cannot delete another admin)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Deleted' }, 403: { description: 'Cannot delete admin' } },
        },
      },
      '/api/admin/users/{id}/status': {
        patch: {
          tags: ['Admin'],
          summary: 'Update user status — active / suspended / banned (Admin only)',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string', enum: ['active', 'suspended', 'banned'] } },
                },
              },
            },
          },
          responses: { 200: { description: 'Status updated' } },
        },
      },
      '/api/admin/orders': {
        get: {
          tags: ['Admin'],
          summary: 'Get all orders across the platform (Admin only)',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Orders fetched' } },
        },
      },
    },
  },
  apis: [],
}

const swaggerSpec = swaggerJsdoc(options)

export const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'GreenRoots API Docs',
    swaggerOptions: { persistAuthorization: true },
  }))
  console.log('📄 Swagger docs → http://localhost:4000/api/docs')
}
