import express from 'express'
import {
  logPlantUpdate,
  getMyPlantLogs,
  getPlantSummary,
} from '../controllers/plantController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.post('/', verifyToken, logPlantUpdate)             
router.get('/my', verifyToken, getMyPlantLogs)             
router.get('/summary', verifyToken, getPlantSummary)      

export default router
