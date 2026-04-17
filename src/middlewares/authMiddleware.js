import jwt from 'jsonwebtoken'
import { errorResponse } from '../utils/apiResponse.js'

/**
 * Verify JWT and attach decoded payload to req.user.
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Access denied. No token provided.', 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return errorResponse(res, 'Invalid or expired token.', 401)
  }
}

/**
 * Restrict access to users whose role is in the provided list.
 * Must be used AFTER verifyToken.
 * @param {...string} roles
 */
export const permitOnly = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Access denied. Insufficient permissions.', 403)
    }
    next()
  }
}
