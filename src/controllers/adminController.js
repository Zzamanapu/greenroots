import prisma from '../config/db.js'
import { successResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js'

// ── Platform stats ──────────────────────────────────────────────────────────
export const getPlatformStats = async (req, res) => {
  try {
    const [
      totalUsers, totalVendors, totalCustomers,
      totalProduce, totalOrders, totalRentals,
      totalPosts, totalCerts, pendingVendors,
      pendingCerts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'VENDOR' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.produce.count(),
      prisma.order.count(),
      prisma.rentalSpace.count(),
      prisma.communityPost.count(),
      prisma.sustainabilityCert.count(),
      prisma.vendorProfile.count({ where: { certificationStatus: 'PENDING' } }),
      prisma.sustainabilityCert.count({ where: { status: 'PENDING' } }),
    ])

    return successResponse(res, 'Platform stats fetched.', {
      users: { total: totalUsers, vendors: totalVendors, customers: totalCustomers },
      produce: totalProduce,
      orders: totalOrders,
      rentalSpaces: totalRentals,
      communityPosts: totalPosts,
      certifications: { total: totalCerts, pendingCerts },
      pendingVendorApprovals: pendingVendors,
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── List all users ──────────────────────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit
    const { role, status } = req.query

    const where = {}
    if (role) where.role = role.toUpperCase()
    if (status) where.status = status

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ])

    return successResponse(res, 'Users fetched.', { data: users, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Single user ─────────────────────────────────────────────────────────────
export const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, createdAt: true, vendorProfile: true,
      },
    })
    if (!user) return errorResponse(res, 'User not found.', 404)
    return successResponse(res, 'User fetched.', user)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Ban / suspend / reactivate user ─────────────────────────────────────────
export const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ['active', 'suspended', 'banned']

    if (!allowed.includes(status)) {
      return errorResponse(res, `Status must be one of: ${allowed.join(', ')}.`, 400)
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!user) return errorResponse(res, 'User not found.', 404)
    if (user.role === 'ADMIN') return errorResponse(res, 'Cannot modify another admin account.', 403)

    const updated = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      select: { id: true, name: true, email: true, role: true, status: true },
    })

    return successResponse(res, `User status updated to "${status}".`, updated)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Delete user ─────────────────────────────────────────────────────────────
export const deleteUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!user) return errorResponse(res, 'User not found.', 404)
    if (user.role === 'ADMIN') return errorResponse(res, 'Cannot delete an admin account.', 403)

    await prisma.user.delete({ where: { id: parseInt(req.params.id) } })
    return successResponse(res, 'User deleted successfully.')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Approve vendor ──────────────────────────────────────────────────────────
export const approveVendor = async (req, res) => {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const updated = await prisma.vendorProfile.update({
      where: { id: parseInt(req.params.id) },
      data: { certificationStatus: 'APPROVED' },
    })

    return successResponse(res, 'Vendor approved.', updated)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── All orders (admin overview) ─────────────────────────────────────────────
export const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          produce: { select: { name: true, price: true, category: true } },
          vendor: { select: { farmName: true, farmLocation: true } },
        },
      }),
      prisma.order.count(),
    ])

    return successResponse(res, 'All orders fetched.', { data: orders, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}
