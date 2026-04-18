import express from 'express'
import {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
} from '../controllers/forumController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', getAllPosts)                         
router.get('/:id', getPostById)                     
router.post('/', verifyToken, createPost)           
router.delete('/:id', verifyToken, deletePost)      

export default router
