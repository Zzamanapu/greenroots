/**
 * Global Express error handler.
 * Must be registered as the LAST middleware in app.js.
 */
export const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${req.method}] ${req.path} →`, err.stack)
  }

  return res.status(status).json({
    success: false,
    message,
    data: null,
  })
}
