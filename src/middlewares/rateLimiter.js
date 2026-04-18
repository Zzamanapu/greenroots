import rateLimit from 'express-rate-limit'

const rateLimitResponse = {
  success: false,
  message: 'Too many requests. Please try again after 15 minutes.',
  data: null,
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
})

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded. Slow down.',
    data: null,
  },
})
