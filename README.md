# 🌿 GreenRoots — Urban Farming Platform API

A RESTful backend for an interactive urban farming platform that connects urban farmers, gardening enthusiasts, and customers. Built with Node.js, Express, Prisma ORM, and PostgreSQL.

---

## Features

- **JWT Authentication** with role-based access control (Admin / Vendor / Customer)
- **Produce Marketplace** — list, browse, filter, and order organic produce
- **Farm Space Rentals** — location-based search and listing management
- **Community Forum** — posts with tags, public browsing, owner/admin deletion
- **Plant Tracking** — log growth stages and health scores for any produce
- **Sustainability Certifications** — vendor submission + admin approval workflow
- **Platform Admin** — user management, vendor approval, platform-wide stats
- **Rate limiting** on auth and general API routes
- **Swagger UI** documentation at `/api/docs`
- **Consistent JSON response envelope** on all endpoints

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express 4 |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Docs | Swagger UI (swagger-jsdoc) |
| Seeder | @faker-js/faker |

---

## Folder Structure

```
greenroots/
├── prisma/
│   ├── schema.prisma          # Data models and relations
│   └── migrations/            # Auto-generated migration files
├── scripts/
│   └── seed.js                # Database seeder
├── src/
│   ├── config/
│   │   └── db.js              # Prisma client singleton
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── certController.js
│   │   ├── forumController.js
│   │   ├── orderController.js
│   │   ├── plantController.js
│   │   ├── produceController.js
│   │   ├── rentalController.js
│   │   └── vendorController.js
│   ├── docs/
│   │   └── swagger.js         # OpenAPI 3.0 spec
│   ├── middlewares/
│   │   ├── authMiddleware.js  # verifyToken + authorizeRole
│   │   ├── errorHandler.js    # Global error handler
│   │   └── rateLimiter.js     # Auth + general limiters
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── certRoutes.js
│   │   ├── forumRoutes.js
│   │   ├── marketplaceRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── plantRoutes.js
│   │   ├── rentalRoutes.js
│   │   └── vendorRoutes.js
│   ├── utils/
│   │   └── apiResponse.js     # successResponse / errorResponse / paginationMeta
│   └── app.js                 # Express app setup
├── server.js                  # Entry point
├── .env.example
├── package.json
└── PERFORMANCE_NOTES.md
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- PostgreSQL running locally

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
```

### 3. Run migrations
```bash
npx prisma migrate dev --name init
```

### 4. Seed the database
```bash
npm run seed
```

### 5. Start the server
```bash
npm run dev        # development (nodemon)
npm start          # production
```

Server runs on `http://localhost:4000`
Swagger docs at `http://localhost:4000/api/docs`

---

## Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@greenroots.dev | Admin@1234 |
| Vendor | *(check DB)* | Vendor@1234 |
| Customer | *(check DB)* | Customer@1234 |

---

## Key API Endpoints

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register |
| POST | `/api/auth/login` | Public | Login — returns JWT |
| GET | `/api/auth/me` | Any | Own profile |
| GET | `/api/marketplace` | Public | Browse produce |
| POST | `/api/marketplace` | Vendor | List produce |
| POST | `/api/orders` | Customer | Place order |
| GET | `/api/orders/vendor` | Vendor | Incoming orders |
| PATCH | `/api/orders/:id/status` | Vendor | Update order status |
| GET | `/api/forum` | Public | Browse posts |
| POST | `/api/forum` | Any auth | Create post |
| GET | `/api/rentals` | Public | Browse rental spaces |
| POST | `/api/rentals` | Vendor | List rental space |
| POST | `/api/plants` | Any auth | Log plant update |
| GET | `/api/plants/summary` | Any auth | Latest plant status |
| POST | `/api/certs` | Vendor | Submit certification |
| PATCH | `/api/certs/:id/approve` | Admin | Approve cert |
| GET | `/api/admin/stats` | Admin | Platform stats |
| PATCH | `/api/admin/users/:id/status` | Admin | Ban/suspend users |

Full documentation: **`GET /api/docs`**
