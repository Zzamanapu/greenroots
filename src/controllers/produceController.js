import prisma from '../config/db.js'
import { successResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js'

// ── Create produce listing ───────────────────────────────────────────────────
export const createProduce = async (req, res) => {
  try {
    const { name, description, price, category, availableQuantity, imageUrl } = req.body

    if (!name || !price || !category) {
      return errorResponse(res, 'Name, price and category are required.', 400)
    }

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Create a vendor profile first.', 404)

    const produce = await prisma.produce.create({
      data: {
        vendorId: vendor.id,
        name: name.trim(),
        description: description?.trim() || '',
        price: parseFloat(price),
        category: category.trim(),
        availableQuantity: parseInt(availableQuantity) || 0,
        certificationStatus: 'PENDING',
        ...(imageUrl && { imageUrl }),
      },
    })

    return successResponse(res, 'Produce listed successfully.', produce, 201)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get all produce (public, with filters & pagination) ──────────────────────
export const getAllProduce = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit
    const { category, minPrice, maxPrice, inStock } = req.query

    const where = {}
    if (category) where.category = { equals: category, mode: 'insensitive' }
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      }
    }
    if (inStock === 'true') where.availableQuantity = { gt: 0 }

    const [produce, total] = await Promise.all([
      prisma.produce.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: { select: { farmName: true, farmLocation: true, certificationStatus: true } } },
      }),
      prisma.produce.count({ where }),
    ])

    return successResponse(res, 'Produce fetched.', { data: produce, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get single produce ───────────────────────────────────────────────────────
export const getProduceById = async (req, res) => {
  try {
    const produce = await prisma.produce.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { vendor: { select: { farmName: true, farmLocation: true, certificationStatus: true } } },
    })

    if (!produce) return errorResponse(res, 'Produce not found.', 404)
    return successResponse(res, 'Produce fetched.', produce)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Update produce ───────────────────────────────────────────────────────────
export const updateProduce = async (req, res) => {
  try {
    const { name, description, price, category, availableQuantity, imageUrl } = req.body

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const produce = await prisma.produce.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!produce) return errorResponse(res, 'Produce not found.', 404)
    if (produce.vendorId !== vendor.id) return errorResponse(res, 'Not authorised.', 403)

    const updated = await prisma.produce.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(category && { category: category.trim() }),
        ...(availableQuantity !== undefined && { availableQuantity: parseInt(availableQuantity) }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    })

    return successResponse(res, 'Produce updated.', updated)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Delete produce ───────────────────────────────────────────────────────────
export const deleteProduce = async (req, res) => {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const produce = await prisma.produce.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!produce) return errorResponse(res, 'Produce not found.', 404)
    if (produce.vendorId !== vendor.id) return errorResponse(res, 'Not authorized.', 403)

    await prisma.produce.delete({ where: { id: parseInt(req.params.id) } })
    return successResponse(res, 'Produce deleted.')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get produce by vendor ────────────────────────────────────────────────────
export const getProduceByVendor = async (req, res) => {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit

    const [produce, total] = await Promise.all([
      prisma.produce.findMany({ where: { vendorId: vendor.id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.produce.count({ where: { vendorId: vendor.id } }),
    ])

    return successResponse(res, 'Your produce listings.', { data: produce, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}
