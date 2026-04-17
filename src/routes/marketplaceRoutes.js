import express from 'express'
import {
  createProduce,
  getAllProduce,
  getProduceById,
  updateProduce,
  deleteProduce,
  getProduceByVendor,
} from '../controllers/produceController.js'
import { verifyToken, permitOnly } from '../middlewares/authMiddleware.js'

const router = express.Router()

// Public
router.get('/', getAllProduce)
router.get('/:id', getProduceById)

// Vendor only
router.get('/vendor/mine', verifyToken, permitOnly('VENDOR'), getProduceByVendor)
router.post('/', verifyToken, permitOnly('VENDOR'), createProduce)
router.put('/:id', verifyToken, permitOnly('VENDOR'), updateProduce)
router.delete('/:id', verifyToken, permitOnly('VENDOR'), deleteProduce)

export default router
