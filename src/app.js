import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/authRoutes.js'
import vendorRoutes from './routes/vendorRoutes.js'
import marketplaceRoutes from './routes/marketplaceRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import forumRoutes from './routes/forumRoutes.js'
import rentalRoutes from './routes/rentalRoutes.js'
import certRoutes from './routes/certRoutes.js'
import plantRoutes from './routes/plantRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

import { errorHandler } from './middlewares/errorHandler.js'
import { apiLimiter } from './middlewares/rateLimiter.js'
import { setupSwagger } from './docs/swagger.js'

dotenv.config()

const app = express()

// ── Core middleware ────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── General rate-limit (applied to all /api routes) ───────────────────────
app.use('/api', apiLimiter)

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/forum', forumRoutes)
app.use('/api/rentals', rentalRoutes)
app.use('/api/certs', certRoutes)
app.use('/api/plants', plantRoutes)
app.use('/api/admin', adminRoutes)

// ── Swagger docs ───────────────────────────────────────────────────────────
setupSwagger(app)

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'GreenRoots API is running 🌿', uptime: process.uptime() })
})

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.', data: null })
})

// ── Global error handler (must be last) ────────────────────────────────────
app.use(errorHandler)

export default app
