import express from 'express'
import {
  createRentalSpace,
  getAllRentalSpaces,
  getRentalSpaceById,
  updateRentalSpace,
  deleteRentalSpace,
} from '../controllers/rentalController.js'
import { verifyToken, permitOnly } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Public — supports ?location= and ?available=true
router.get('/', getAllRentalSpaces)
router.get('/:id', getRentalSpaceById)

// Vendor only
router.post('/', verifyToken, permitOnly('VENDOR'), createRentalSpace)
router.patch('/:id', verifyToken, permitOnly('VENDOR'), updateRentalSpace)
router.delete('/:id', verifyToken, permitOnly('VENDOR'), deleteRentalSpace)

export default router
