import express from 'express'
import {
  createVendorProfile,
  getMyVendorProfile,
  updateVendorProfile,
  getAllVendors,
  approveVendor,
} from '../controllers/vendorController.js'
import { verifyToken, permitOnly } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/profile', verifyToken, permitOnly('VENDOR'), createVendorProfile)
router.get('/profile/me', verifyToken, permitOnly('VENDOR'), getMyVendorProfile)
router.patch('/profile/me', verifyToken, permitOnly('VENDOR'), updateVendorProfile)
router.get('/all', verifyToken, permitOnly('ADMIN'), getAllVendors)
router.patch('/approve/:id', verifyToken, permitOnly('ADMIN'), approveVendor)

export default router
