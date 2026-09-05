/**
 * Centralized Security & Anti-Hacker Layer for Word Imposter
 */

/**
 * Strips HTML tags, script elements, control characters, and enforces length bounds.
 */
export function sanitizeText(str, maxLength = 100) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script blocks and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style blocks and content
    .replace(/<[^>]*>?/gm, '') // Remove remaining HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim()
    .slice(0, maxLength);
}

/**
 * Enforces strict 4-letter uppercase alphanumeric room codes (e.g. ABCD, W8X2).
 */
export function validateRoomCode(code) {
  if (typeof code !== 'string') return null;
  const cleaned = code.trim().toUpperCase();
  return /^[A-Z0-9]{4}$/.test(cleaned) ? cleaned : null;
}

/**
 * Validates drawing payloads against XSS, script injection, and memory bomb attacks.
 * Allows safe Base64 image URIs (PNG/JPEG/WEBP) and clean SVG data URIs under 100KB.
 */
export function validateDrawingData(data) {
  if (!data || typeof data !== 'string') return '';
  
  // Hard size limit: 100KB (prevent memory exhaustion)
  if (data.length > 102400) {
    console.warn(`[Security] Drawing payload rejected: size ${data.length} bytes exceeds 100KB limit`);
    return '';
  }

  const trimmed = data.trim();

  // 1. Safe base64 image data URI
  const base64ImageRegex = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
  if (base64ImageRegex.test(trimmed)) {
    return trimmed;
  }

  // 2. Safe SVG data URI or SVG string
  if (trimmed.startsWith('data:image/svg+xml') || trimmed.startsWith('<svg')) {
    const dangerousPatterns = [
      /<script\b/i,
      /javascript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i,
      /<iframe\b/i,
      /xlink:href\s*=\s*['"]?javascript:/i,
      /href\s*=\s*['"]?javascript:/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        console.warn(`[Security] Malicious SVG drawing rejected matching pattern ${pattern}`);
        return '';
      }
    }
    return trimmed;
  }

  return '';
}

/**
 * In-Memory Sliding-Window Socket Event Rate Limiter
 */
export class SocketRateLimiter {
  constructor() {
    this.events = new Map(); // key `${socketId}:${action}` -> array of timestamps
    // Periodic garbage collector every 5 minutes to remove expired records
    this.gcInterval = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  /**
   * Check if an action is allowed for a given socket.
   * @param {string} socketId 
   * @param {string} action (e.g. 'chat', 'create-room', 'drawing')
   * @param {number} limit Maximum events in window
   * @param {number} windowMs Window duration in milliseconds
   * @returns {boolean} True if allowed, False if rate limited
   */
  checkLimit(socketId, action, limit, windowMs) {
    const key = `${socketId}:${action}`;
    const now = Date.now();
    const timestamps = this.events.get(key) || [];
    
    // Filter out timestamps outside the current window
    const recent = timestamps.filter(t => now - t < windowMs);

    if (recent.length >= limit) {
      return false; // Rate limit exceeded!
    }

    recent.push(now);
    this.events.set(key, recent);
    return true;
  }

  /**
   * Clean up all records for a disconnected socket.
   */
  cleanupSocket(socketId) {
    for (const key of this.events.keys()) {
      if (key.startsWith(`${socketId}:`)) {
        this.events.delete(key);
      }
    }
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [key, timestamps] of this.events.entries()) {
      const recent = timestamps.filter(t => now - t < 60000);
      if (recent.length === 0) {
        this.events.delete(key);
      } else {
        this.events.set(key, recent);
      }
    }
  }
}

export const socketRateLimiter = new SocketRateLimiter();

/**
 * Verify if the caller is the authorized room host.
 */
export function verifyHost(room, socketId) {
  return !!(room && socketId && room.hostId === socketId);
}
