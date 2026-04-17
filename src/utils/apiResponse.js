/**
 * Send a standardised success response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {*} data
 * @param {number} statusCode
 */
export const successResponse = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

/**
 * Send a standardised error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 */
export const errorResponse = (res, message = 'Something went wrong', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  })
}

/**
 * Build a pagination metadata object.
 * @param {number} total  - total matching records
 * @param {number} page   - current page (1-indexed)
 * @param {number} limit  - records per page
 */
export const paginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
})
