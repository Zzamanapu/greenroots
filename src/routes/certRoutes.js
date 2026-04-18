import express from 'express'
import {
  submitCertification,
  getMyCertifications,
  getAllCertifications,
  approveCertification,
  rejectCertification,
} from '../controllers/certController.js'
import { verifyToken, permitOnly } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Vendor
router.post('/', verifyToken, permitOnly('VENDOR'), submitCertification)
router.get('/my', verifyToken, permitOnly('VENDOR'), getMyCertifications)

// Admin 
router.get('/all', verifyToken, permitOnly('ADMIN'), getAllCertifications)
router.patch('/:id/approve', verifyToken, permitOnly('ADMIN'), approveCertification)
router.patch('/:id/reject', verifyToken, permitOnly('ADMIN'), rejectCertification)

export default router
