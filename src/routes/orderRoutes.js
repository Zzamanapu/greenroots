import express from 'express'
import {
  placeOrder,
  getMyOrders,
  getVendorOrders,
  updateOrderStatus,
  getAllOrders,
} from '../controllers/orderController.js'
import { verifyToken, permitOnly } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Customer
router.post('/', verifyToken, permitOnly('CUSTOMER'), placeOrder)
router.get('/my', verifyToken, permitOnly('CUSTOMER'), getMyOrders)

// Vendor
router.get('/vendor', verifyToken, permitOnly('VENDOR'), getVendorOrders)
router.patch('/:id/status', verifyToken, permitOnly('VENDOR'), updateOrderStatus)

// Admin
router.get('/all', verifyToken, permitOnly('ADMIN'), getAllOrders)

export default router
