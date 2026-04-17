import prisma from '../config/db.js'
import { successResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js'

// ── Create post ──────────────────────────────────────────────────────────────
export const createPost = async (req, res) => {
  try {
    const { title, postContent, tags } = req.body

    if (!title || !postContent) {
      return errorResponse(res, 'Title and post content are required.', 400)
    }

    const post = await prisma.communityPost.create({
      data: {
        userId: req.user.id,
        title: title.trim(),
        postContent: postContent.trim(),
        tags: Array.isArray(tags) ? tags : [],
      },
      include: { user: { select: { name: true, role: true } } },
    })

    return successResponse(res, 'Post created.', post, 201)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get all posts (public, paginated) ────────────────────────────────────────
export const getAllPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit
    const { tag } = req.query

    const where = tag ? { tags: { has: tag } } : {}

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { postDate: 'desc' },
        include: { user: { select: { name: true, role: true } } },
      }),
      prisma.communityPost.count({ where }),
    ])

    return successResponse(res, 'Posts fetched.', { data: posts, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get single post ──────────────────────────────────────────────────────────
export const getPostById = async (req, res) => {
  try {
    const post = await prisma.communityPost.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: { select: { name: true, role: true } } },
    })
    if (!post) return errorResponse(res, 'Post not found.', 404)
    return successResponse(res, 'Post fetched.', post)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Delete post (owner or admin) ─────────────────────────────────────────────
export const deletePost = async (req, res) => {
  try {
    const post = await prisma.communityPost.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!post) return errorResponse(res, 'Post not found.', 404)

    const isOwner = post.userId === req.user.id
    const isAdmin = req.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) return errorResponse(res, 'Not authorised to delete this post.', 403)

    await prisma.communityPost.delete({ where: { id: parseInt(req.params.id) } })
    return successResponse(res, 'Post deleted.')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}
