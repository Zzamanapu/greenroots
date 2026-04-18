import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../config/db.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

// ── Register ────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email and password are required.', 400)
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) return errorResponse(res, 'Email is already registered.', 409)

    const allowedRoles = ['CUSTOMER', 'VENDOR']
    if (role && !allowedRoles.includes(role)) {
      return errorResponse(res, `Role must be one of: ${allowedRoles.join(', ')}.`, 400)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || 'CUSTOMER',
      },
    })

    return successResponse(
      res,
      'Registration successful.',
      { id: user.id, name: user.name, email: user.email, role: user.role },
      201
    )
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Login ───────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required.', 400)
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) return errorResponse(res, 'Invalid credentials.', 401)

    if (user.status !== 'active') {
      return errorResponse(res, `Account is ${user.status}. Contact support.`, 403)
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return errorResponse(res, 'Invalid credentials.', 401)

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return successResponse(res, 'Login successful.', {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get own profile ─────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, createdAt: true, vendorProfile: true,
      },
    })
    if (!user) return errorResponse(res, 'User not found.', 404)
    return successResponse(res, 'Profile fetched.', user)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}


export const logout = async (req, res) => {
  return successResponse(res, 'Logged out successfully. Please delete your token on the client side.')
}