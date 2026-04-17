import prisma from '../config/db.js'
import { successResponse, errorResponse } from '../utils/apiResponse.js'

// ── Submit certification ─────────────────────────────────────────────────────
export const submitCertification = async (req, res) => {
  try {
    const { certifyingAgency, certificationDate, expiryDate } = req.body

    if (!certifyingAgency || !certificationDate) {
      return errorResponse(res, 'Certifying agency and certification date are required.', 400)
    }

    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const cert = await prisma.sustainabilityCert.create({
      data: {
        vendorId: vendor.id,
        certifyingAgency: certifyingAgency.trim(),
        certificationDate: new Date(certificationDate),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        status: 'PENDING',
      },
    })

    return successResponse(res, 'Certification submitted. Pending admin review.', cert, 201)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get own certifications ───────────────────────────────────────────────────
export const getMyCertifications = async (req, res) => {
  try {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId: req.user.id } })
    if (!vendor) return errorResponse(res, 'Vendor profile not found.', 404)

    const certs = await prisma.sustainabilityCert.findMany({
      where: { vendorId: vendor.id },
      orderBy: { certificationDate: 'desc' },
    })

    return successResponse(res, 'Your certifications.', certs)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Get all certifications (admin) ───────────────────────────────────────────
export const getAllCertifications = async (req, res) => {
  try {
    const { status } = req.query
    const where = status ? { status: status.toUpperCase() } : {}

    const certs = await prisma.sustainabilityCert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            farmName: true,
            farmLocation: true,
            certificationStatus: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    })

    return successResponse(res, 'All certifications.', certs)
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Approve certification ────────────────────────────────────────────────────
export const approveCertification = async (req, res) => {
  try {
    const cert = await prisma.sustainabilityCert.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!cert) return errorResponse(res, 'Certification not found.', 404)

    await prisma.$transaction([
      prisma.sustainabilityCert.update({ where: { id: cert.id }, data: { status: 'APPROVED' } }),
      prisma.vendorProfile.update({ where: { id: cert.vendorId }, data: { certificationStatus: 'APPROVED' } }),
    ])

    return successResponse(res, 'Certification approved. Vendor is now certified.')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}

// ── Reject certification ─────────────────────────────────────────────────────
export const rejectCertification = async (req, res) => {
  try {
    const cert = await prisma.sustainabilityCert.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!cert) return errorResponse(res, 'Certification not found.', 404)

    await prisma.$transaction([
      prisma.sustainabilityCert.update({ where: { id: cert.id }, data: { status: 'REJECTED' } }),
      prisma.vendorProfile.update({ where: { id: cert.vendorId }, data: { certificationStatus: 'REJECTED' } }),
    ])

    return successResponse(res, 'Certification rejected.')
  } catch (err) {
    return errorResponse(res, err.message, 500)
  }
}
