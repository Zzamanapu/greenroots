import prisma from '../config/db.js'
import { successResponse, errorResponse, paginationMeta } from '../utils/apiResponse.js'

// ── Place order (customer) ───────────────────────────────────────────────────
export const placeOrder = async (req, res) => {
  try {
    const { produceId, quantity = 1 } = req.body

    if (!produceId) return errorResponse(res, 'produceId is required.', 400)

    const qty = parseInt(quantity)
    if (qty < 1) return errorResponse(res, 'Quantity must be at least 1.', 400)

    const produce = await prisma.produce.findUnique({ where: { id: parseInt(produceId) } })
    if (!produce) return errorResponse(res, 'Produce not found.', 404)
    if (produce.availableQuantity < qty) {
      return errorResponse(res, `Only ${produce.availableQuantity} units available.`, 400)
    }

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          userId: req.user.id,
          produceId: produce.id,
          vendorId: produce.vendorId,
          quantity: qty,
          status: 'PENDING',
        },
      }),
      prisma.produce.update({
        where: { id: produce.id },
        data: { availableQuantity: produce.availableQuantity - qty },
      }),
    ])

    return successResponse(res, 'Order placed successfully.', order, 201)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get customer orders ──────────────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user.id },
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          produce: { select: { name: true, price: true, category: true } },
          vendor: { select: { farmName: true } },
        },
      }),
      prisma.order.count({ where: { userId: req.user.id } }),
    ])

    return successResponse(res, 'Your orders.', { data: orders, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get vendor orders ────────────────────────────────────────────────────────
export const getVendorOrders = async (req, res) => {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const page = Math.max(parseInt(req.query.page) || 1, 1)
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit
    const { status } = req.query
    const where = { vendorId: vendor.id, ...(status && { status: status.toUpperCase() }) }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          produce: { select: { name: true, price: true } },
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return successResponse(res, 'Vendor orders.', { data: orders, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Update order status (vendor) ─────────────────────────────────────────────
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED']

    if (!allowed.includes(status)) {
      return errorResponse(res, `Status must be one of: ${allowed.join(', ')}.`, 400)
    }

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const order = await prisma.order.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!order) return errorResponse(res, 'Order not found.', 404)
    if (order.vendorId !== vendor.id) return errorResponse(res, 'Not authorised.', 403)

    // Restore stock if cancelling
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      await prisma.$transaction([
        prisma.order.update({ where: { id: order.id }, data: { status } }),
        prisma.produce.update({
          where: { id: order.produceId },
          data: { availableQuantity: { increment: order.quantity } },
        }),
      ])
      return successResponse(res, 'Order cancelled and stock restored.')
    }

    const updated = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    })

    return successResponse(res, `Order status updated to "${status}".`, updated)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── All orders (admin) ───────────────────────────────────────────────────────
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
          produce: { select: { name: true, price: true, category: true } },
          user: { select: { name: true, email: true } },
          vendor: { select: { farmName: true } },
        },
      }),
      prisma.order.count(),
    ])

    return successResponse(res, 'All orders.', { data: orders, pagination: paginationMeta(total, page, limit) })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}
