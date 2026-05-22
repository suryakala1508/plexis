import { get, post, API_URL } from './api'

const isAbsolutePdfUrl = (url) => /^(https?:\/\/|blob:|data:)/i.test(url)

const isHostLikeUrl = (url) => /^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(url)

const normalizePdfUrl = (input) => {
  if (!input || typeof input !== 'string') return null

  const value = input.trim()
  if (!value) return null

  if (isAbsolutePdfUrl(value)) return value

  // Some backends return URLs like "blr1.digitaloceanspaces.com/bucket/file.pdf"
  // without protocol; treat them as absolute HTTPS URLs.
  if (isHostLikeUrl(value)) {
    return `https://${value}`
  }

  if (value.startsWith('//')) {
    return `${window.location.protocol}${value}`
  }

  const apiBase = (API_URL || '').replace(/\/+$/, '')

  if (value.startsWith('/')) {
    return `${apiBase}${value}`
  }

  return `${apiBase}/${value.replace(/^\/+/, '')}`
}

const extractPdfUrl = (payload) => {
  if (!payload) return null

  if (typeof payload === 'string') {
    return payload
  }

  return payload?.data?.pdfUrl || payload?.pdfUrl || payload?.url || null
}

const withCacheBuster = (url) => {
  if (!url || typeof url !== 'string') return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}t=${Date.now()}`
}

/**
 * PDF Service
 * Handles PDF generation and download operations
 */

/**
 * Export quotation to PDF
 * @param {string} quotationId - Quotation ID
 * @param {Object} options - Export options
 * @param {boolean} options.force - Force regeneration even if a cached PDF exists
 * @returns {Promise<string>} PDF URL
 */
const pollPdfStatus = async (quotationId, intervalMs = 2000, timeoutMs = 120000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, intervalMs))
    const res = await get(`/quotation/${quotationId}/pdf-status`)
    const status = res?.data?.status || res?.status
    if (status === 'ready') return res?.data?.pdfUrl || res?.pdfUrl || null
    if (status !== 'generating') throw new Error('PDF generation failed')
  }
  throw new Error('PDF generation timed out')
}

export const exportQuotationToPdf = async (quotationId, options = {}) => {
  try {
    const query = options.force ? '?force=true' : ''
    const response = await post(`/quotation/${quotationId}/export-pdf${query}`, {}, { timeout: 30000 })
    const pdfUrl = extractPdfUrl(response)
    if (pdfUrl) return pdfUrl
    // 202 — PDF generating in background, poll until ready.
    const status = response?.data?.status || response?.status
    if (status === 'generating') return await pollPdfStatus(quotationId)
    return null
  } catch (error) {
    console.error('Error exporting quotation to PDF:', error)
    throw new Error(error.message || 'Failed to export quotation to PDF')
  }
}

/**
 * Create contract PDF from quotation
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<string>} Contract PDF URL
 */
export const createContractPdf = async (quotationId) => {
  try {
    const response = await post(`/contract/from-quotation/${quotationId}`)
    return response?.data?.contractUrl || response?.contractUrl || response?.url || null
  } catch (error) {
    console.error('Error creating contract PDF:', error)
    throw new Error(error.message || 'Failed to create contract PDF')
  }
}

/**
 * Download PDF from URL
 * @param {string} pdfUrl - PDF URL
 * @param {string} filename - Optional filename for download
 */
export const downloadPdf = (pdfUrl, filename = 'document.pdf') => {
  try {
    const finalUrl = withCacheBuster(normalizePdfUrl(pdfUrl))
    if (!finalUrl) {
      throw new Error('Invalid PDF URL')
    }

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = finalUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    // Fallback: open in new tab
    openPdfInNewTab(pdfUrl)
  }
}

/**
 * Open PDF in new tab
 * @param {string} pdfUrl - PDF URL
 */
export const openPdfInNewTab = (pdfUrl) => {
  try {
    const finalUrl = withCacheBuster(normalizePdfUrl(pdfUrl))
    if (!finalUrl) {
      throw new Error('Invalid PDF URL')
    }

    const newWindow = window.open(finalUrl, '_blank', 'noopener,noreferrer')
    if (!newWindow) {
      console.warn('PDF window may have been blocked by popup blocker')
    }
    return finalUrl
  } catch (error) {
    console.error('Error opening PDF:', error)
    return null
  }
}

/**
 * Generate and download quotation PDF
 * @param {string} quotationId - Quotation ID
 * @param {string} filename - Optional filename
 * @returns {Promise<void>}
 */
export const generateAndDownloadQuotationPdf = async (quotationId, filename = null) => {
  try {
    const pdfUrl = await exportQuotationToPdf(quotationId, { force: true })
    openPdfInNewTab(pdfUrl)
    return pdfUrl
  } catch (error) {
    console.error('Error generating and downloading quotation PDF:', error)
    throw error
  }
}

/**
 * Export contract to PDF
 * @param {Object} contractData - Contract data
 * @param {Object} quotationData - Optional quotation data
 * @returns {Promise<string>} PDF URL
 */
export const exportContractToPdf = async (contractData, quotationData = null) => {
  try {
    const response = await post('/contract/export-pdf', {
      contractData,
      quotationData
    })
    // Backend returns { success: true, data: { pdfUrl } }
    return response.data?.pdfUrl || response.pdfUrl
  } catch (error) {
    console.error('Error exporting contract to PDF:', error)
    throw new Error(error.message || 'Failed to export contract to PDF')
  }
}

/**
 * Generate and download contract PDF
 * @param {Object} contractData - Contract data
 * @param {Object} quotationData - Optional quotation data
 * @param {string} filename - Optional filename
 * @returns {Promise<string>} PDF URL
 */
export const generateAndDownloadContractPdf = async (contractData, quotationData = null, filename = null) => {
  try {
    const pdfUrl = await exportContractToPdf(contractData, quotationData)
    const defaultFilename = filename || `contract-${new Date().getTime()}.pdf`
    downloadPdf(pdfUrl, defaultFilename)
    return pdfUrl
  } catch (error) {
    console.error('Error generating and downloading contract PDF:', error)
    throw error
  }
}






