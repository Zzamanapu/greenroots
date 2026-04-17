import express from 'express'
import {
  logPlantUpdate,
  getMyPlantLogs,
  getPlantSummary,
} from '../controllers/plantController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

// All authenticated users can track plants
router.post('/', verifyToken, logPlantUpdate)              // Log a new update
router.get('/my', verifyToken, getMyPlantLogs)             // Full history — supports ?produceId=
router.get('/summary', verifyToken, getPlantSummary)       // Latest status per plant

export default router
