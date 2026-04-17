import express from 'express'
import {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
} from '../controllers/forumController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = express.Router()

router.get('/', getAllPosts)                         // Public — supports ?tag=
router.get('/:id', getPostById)                     // Public
router.post('/', verifyToken, createPost)           // Any authenticated user
router.delete('/:id', verifyToken, deletePost)      // Owner or Admin

export default router
