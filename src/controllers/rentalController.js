import prisma from '../config/db.js'
import { successResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js'

// ── Create rental space ──────────────────────────────────────────────────────
export const createRentalSpace = async (req, res) => {
  try {
    const { location, size, pricePerMonth, description } = req.body

    if (!location || !size || !pricePerMonth) {
      return errorResponse(res, 'Location, size and pricePerMonth are required.', 400)
    }

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Create a vendor profile first.', 404)

    const space = await prisma.rentalSpace.create({
      data: {
        vendorId: vendor.id,
        location: location.trim(),
        size: size.trim(),
        pricePerMonth: parseFloat(pricePerMonth),
        availability: true,
        ...(description && { description: description.trim() }),
      },
    })

    return successResponse(res, 'Rental space listed.', space, 201)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get all rental spaces (public, with location filter) ─────────────────────
export const getAllRentalSpaces = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit
    const { location, available } = req.query

    const where = {}
    if (location) where.location = { contains: location.trim(), mode: 'insensitive' }
    if (available === 'true') where.availability = true

    const [spaces, total] = await Promise.all([
      prisma.rentalSpace.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: { select: { farmName: true, farmLocation: true } } },
      }),
      prisma.rentalSpace.count({ where }),
    ])

    return successResponse(res, 'Rental spaces fetched.', { data: spaces, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get single rental space ──────────────────────────────────────────────────
export const getRentalSpaceById = async (req, res) => {
  try {
    const space = await prisma.rentalSpace.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { vendor: { select: { farmName: true, farmLocation: true, certificationStatus: true } } },
    })
    if (!space) return errorResponse(res, 'Rental space not found.', 404)
    return successResponse(res, 'Rental space fetched.', space)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Update rental space ──────────────────────────────────────────────────────
export const updateRentalSpace = async (req, res) => {
  try {
    const { location, size, pricePerMonth, availability, description } = req.body

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const space = await prisma.rentalSpace.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!space) return errorResponse(res, 'Rental space not found.', 404)
    if (space.vendorId !== vendor.id) return errorResponse(res, 'Not authorised.', 403)

    const updated = await prisma.rentalSpace.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(location !== undefined && { location: location.trim() }),
        ...(size !== undefined && { size: size.trim() }),
        ...(pricePerMonth !== undefined && { pricePerMonth: parseFloat(pricePerMonth) }),
        ...(availability !== undefined && { availability: Boolean(availability) }),
        ...(description !== undefined && { description: description.trim() }),
      },
    })

    return successResponse(res, 'Rental space updated.', updated)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Delete rental space ──────────────────────────────────────────────────────
export const deleteRentalSpace = async (req, res) => {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const space = await prisma.rentalSpace.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!space) return errorResponse(res, 'Rental space not found.', 404)
    if (space.vendorId !== vendor.id) return errorResponse(res, 'Not authorised.', 403)

    await prisma.rentalSpace.delete({ where: { id: parseInt(req.params.id) } })
    return successResponse(res, 'Rental space deleted.')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}
