import * as db from '../db/queries.js';
import * as cache from './cacheService.js';
import encode from '../utils/base62.js';

const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 86400;

/**
 * Creates a new shortened URL mapping.
 * 
 * @param {string} longUrl - The original destination URL.
 * @param {string|null} customAlias - Optional custom short code alias.
 * @param {Date|null} expiryDate - Optional expiry timestamp.
 * @returns {Promise<object>} The created URL mapping record.
 * @throws {Error} 409 Conflict if custom alias is already in use.
 */
export async function createShortUrl(longUrl, customAlias = null, expiryDate = null) {
  let shortCode;

  if (customAlias) {
    // Check if the alias is already in use
    const existing = await db.findByShortCode(customAlias);
    if (existing) {
      const err = new Error('Custom alias already exists');
      err.status = 409;
      throw err;
    }
    shortCode = customAlias;
  } else {
    // Increment global counter and encode to Base62
    const counterVal = await cache.incr('counter:global');
    shortCode = encode(counterVal);
  }

  // Save the mapping to the database
  const mapping = await db.insertMapping(shortCode, longUrl, expiryDate);
  return mapping;
}

/**
 * Resolves a short code to its URL mapping using the cache-aside pattern.
 * 
 * @param {string} shortCode - The short code identifier.
 * @returns {Promise<object|null>} The URL mapping record, or null if not found.
 */
export async function resolveShortCode(shortCode) {
  const cacheKey = `cache:${shortCode}`;
  
  // Try retrieving from cache first
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (err) {
    // Log cache read failures but do not block the request
    console.error('Redis read failure during lookup:', err);
  }

  // Fallback to database
  const mapping = await db.findByShortCode(shortCode);

  if (mapping) {
    // Write back to cache for subsequent requests
    try {
      await cache.set(cacheKey, mapping, CACHE_TTL);
    } catch (err) {
      console.error('Redis write failure during lookup:', err);
    }
  }

  return mapping;
}

/**
 * Re-exports database click increment.
 * 
 * @param {string} shortCode - The short code identifier.
 * @returns {Promise<object|null>} The updated click representation.
 */
export async function incrementClicks(shortCode) {
  return await db.incrementClicks(shortCode);
}
