import { Request } from 'express';

/**
 * Build frontend URL that respects request origin for local development
 * In production: uses process.env.FRONTEND_URL
 * In development: extracts localhost from request headers
 * @param req Express request object
 * @returns Base frontend URL (e.g., http://localhost:5173 or https://domain.com)
 */
export function buildFrontendUrl(req: Request): string {
  try {
    // Try to extract origin from request headers
    const origin = req.headers.origin || extractOriginFromReferer(req.headers.referer);

    if (origin && isLocalhost(origin)) {
      // Local development - use request origin (e.g., http://localhost:5173)
      return trimTrailingSlash(origin);
    }
  } catch (error) {
    console.warn('[urlHelper] Error extracting origin from request:', error);
  }

  // Fallback to environment variable (production)
  return trimTrailingSlash(process.env.FRONTEND_URL || 'http://localhost:5173');
}

/**
 * Check if a URL is localhost or 127.0.0.1
 */
function isLocalhost(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch (error) {
    return false;
  }
}

/**
 * Extract origin from referer header
 * Referer: http://localhost:5173/gallery/abc123?token=xyz
 * Returns: http://localhost:5173
 */
function extractOriginFromReferer(referer?: string): string | null {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    return null;
  }
}

/**
 * Remove trailing slash from URL
 */
function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}
