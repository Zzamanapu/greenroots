import express from 'express'
import { register, login, getMe, logout } from '../controllers/authController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { authLimiter } from '../middlewares/rateLimiter.js'

const router = express.Router()

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.get('/me', verifyToken, getMe)
router.post('/logout', verifyToken, logout)

export default router
