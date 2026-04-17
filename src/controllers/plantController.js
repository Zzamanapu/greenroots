import prisma from '../config/db.js'
import { successResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js'

const VALID_STAGES = ['seedling', 'growing', 'flowering', 'harvest-ready']

// ── Log plant growth update ──────────────────────────────────────────────────
export const logPlantUpdate = async (req, res) => {
  try {
    const { produceId, stage, healthScore, notes } = req.body

    if (!produceId || !stage) {
      return errorResponse(res, 'produceId and stage are required.', 400)
    }

    if (!VALID_STAGES.includes(stage)) {
      return errorResponse(res, `Stage must be one of: ${VALID_STAGES.join(', ')}.`, 400)
    }

    if (healthScore !== undefined && (healthScore < 0 || healthScore > 100)) {
      return errorResponse(res, 'Health score must be between 0 and 100.', 400)
    }

    const produce = await prisma.produce.findUnique({ where: { id: parseInt(produceId) } })
    if (!produce) return errorResponse(res, 'Produce not found.', 404)

    const log = await prisma.plantLog.create({
      data: {
        userId: req.user.id,
        produceId: parseInt(produceId),
        stage,
        healthScore: healthScore !== undefined ? parseInt(healthScore) : 100,
        ...(notes && { notes: notes.trim() }),
      },
      include: { produce: { select: { name: true, category: true } } },
    })

    return successResponse(res, 'Plant update logged.', log, 201)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get my plant logs ────────────────────────────────────────────────────────
export const getMyPlantLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit
    const { produceId } = req.query

    const where = {
      userId: req.user.id,
      ...(produceId && { produceId: parseInt(produceId) }),
    }

    const [logs, total] = await Promise.all([
      prisma.plantLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { loggedAt: 'desc' },
        include: { produce: { select: { name: true, category: true } } },
      }),
      prisma.plantLog.count({ where }),
    ])

    return successResponse(res, 'Plant logs fetched.', { data: logs, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get latest status per plant ──────────────────────────────────────────────
export const getPlantSummary = async (req, res) => {
  try {
    // Get the most recent log for each produce the user is tracking
    const latestLogs = await prisma.plantLog.findMany({
      where: { userId: req.user.id },
      distinct: ['produceId'],
      orderBy: { loggedAt: 'desc' },
      include: { produce: { select: { name: true, category: true, imageUrl: true } } },
    })

    return successResponse(res, 'Plant tracking summary.', latestLogs)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}
