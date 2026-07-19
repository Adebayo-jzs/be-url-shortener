import * as db from '../db/queries.js';
import * as cache from './cacheService.js';
import encode from '../utils/base62.js';

const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 86400;

/**
 * Creates a new shortened URL mapping.
 */
export async function createShortUrl(longUrl, customAlias = null, expiryDate = null) {
  let shortCode;

  if (customAlias) {
    shortCode = customAlias;
  } else {
    // Increment global counter and encode to Base62
    const counterVal = await cache.incr('counter:global');
    shortCode = encode(counterVal);
  }

  // Save the mapping to the database directly
  try {
    const mapping = await db.insertMapping(shortCode, longUrl, expiryDate);
    return mapping;
  } catch (err) {
    // Check if it's a unique key violation (PostgreSQL code 23505)
    if (err.code === '23505') {
      const conflictErr = new Error('Custom alias already exists');
      conflictErr.status = 409;
      throw conflictErr;
    }
    throw err;
  }
}

/**
 * Resolves a short code to its URL mapping using the cache-aside pattern.
 */
export async function resolveShortCode(shortCode) {
  const cacheKey = `cache:${shortCode}`;
  
  // Try retrieving from cache first
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      // Check if it's a cached negative result
      if (cached.isNull) {
        return null;
      }
      return cached;
    }
  } catch (err) {
    // Log cache read failures but do not block the request
    console.error('Redis read failure during lookup:', err);
  }

  // Fallback to database
  const mapping = await db.findByShortCode(shortCode);

  try {
    if (mapping) {
      // Write back to cache for subsequent requests
      await cache.set(cacheKey, mapping, CACHE_TTL);
    } else {
      // Cache negative lookup (null result) for 5 minutes (300 seconds)
      // to prevent cache penetration lookups from hitting the database repeatedly
      await cache.set(cacheKey, { isNull: true }, 300);
    }
  } catch (err) {
    console.error('Redis write failure during lookup:', err);
  }

  return mapping;
}


export async function incrementClicks(shortCode) {
  return await db.incrementClicks(shortCode);
}
