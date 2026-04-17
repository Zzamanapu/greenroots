import prisma from '../config/db.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

// ── Create vendor profile ────────────────────────────────────────────────────
export const createVendorProfile = async (req, res) => {
  try {
    const { farmName, farmLocation, bio } = req.body

    if (!farmName || !farmLocation) {
      return errorResponse(res, 'Farm name and location are required.', 400)
    }

    const existing = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (existing) return errorResponse(res, 'Vendor profile already exists.', 409)

    const profile = await prisma.vendorProfile.create({
      data: { userId: req.user.id, farmName: farmName.trim(), farmLocation: farmLocation.trim(), bio },
    })

    return successResponse(res, 'Vendor profile created successfully.', profile, 201)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get own vendor profile ───────────────────────────────────────────────────
export const getMyVendorProfile = async (req, res) => {
  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { name: true, email: true } },
        produce: { select: { id: true, name: true, price: true, category: true, availableQuantity: true } },
        rentalSpaces: { select: { id: true, location: true, pricePerMonth: true, availability: true } },
      },
    })

    if (!profile) return errorResponse(res, 'Vendor profile not found.', 404)
    return successResponse(res, 'Vendor profile fetched.', profile)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Update vendor profile ────────────────────────────────────────────────────
export const updateVendorProfile = async (req, res) => {
  try {
    const { farmName, farmLocation, bio } = req.body

    const profile = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!profile) return errorResponse(res, 'Vendor profile not found.', 404)

    const updated = await prisma.vendorProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(farmName && { farmName: farmName.trim() }),
        ...(farmLocation && { farmLocation: farmLocation.trim() }),
        ...(bio !== undefined && { bio }),
      },
    })

    return successResponse(res, 'Vendor profile updated.', updated)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── List all vendors (admin) ─────────────────────────────────────────────────
export const getAllVendors = async (req, res) => {
  try {
    const { status } = req.query
    const where = status ? { certificationStatus: status.toUpperCase() } : {}

    const vendors = await prisma.vendorProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true, status: true } } },
    })

    return successResponse(res, 'Vendors fetched.', vendors)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Approve vendor (admin) ───────────────────────────────────────────────────
export const approveVendor = async (req, res) => {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!vendor) return errorResponse(res, 'Vendor not found.', 404)

    const updated = await prisma.vendorProfile.update({
      where: { id: parseInt(req.params.id) },
      data: { certificationStatus: 'APPROVED' },
    })

    return successResponse(res, 'Vendor approved.', updated)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}
