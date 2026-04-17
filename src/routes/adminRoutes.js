import express from 'express'
import {
  getPlatformStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  approveVendor,
  getAllOrders,
} from '../controllers/adminController.js'
import { verifyToken, permitOnly } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.use(verifyToken, permitOnly('ADMIN'))

router.get('/stats', getPlatformStats)
router.get('/users', getAllUsers)
router.get('/users/:id', getUserById)
router.patch('/users/:id/status', updateUserStatus)
router.delete('/users/:id', deleteUser)
router.patch('/vendors/:id/approve', approveVendor)
router.get('/orders', getAllOrders)

export default router
