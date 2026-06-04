import pool from './pool.js';

/**
 * Inserts a new URL mapping into the database.
 * @param {string} shortCode - The short code identifier.
 * @param {string} longUrl - The original long URL.
 * @param {Date|null} expiryDate - Optional expiry timestamp.
 * @returns {Promise<object>} The inserted mapping object.
 */
export async function insertMapping(shortCode, longUrl, expiryDate = null) {
  const query = `
    INSERT INTO url_mappings (short_code, long_url, expiry_date)
    VALUES ($1, $2, $3)
    RETURNING short_code, long_url, created_at, expiry_date, click_count;
  `;
  const values = [shortCode, longUrl, expiryDate];
  const res = await pool.query(query, values);
  return res.rows[0];
}

/**
 * Finds a URL mapping by its short code.
 * @param {string} shortCode - The short code identifier.
 * @returns {Promise<object|null>} The mapping object if found, otherwise null.
 */
export async function findByShortCode(shortCode) {
  const query = `
    SELECT short_code, long_url, created_at, expiry_date, click_count
    FROM url_mappings
    WHERE short_code = $1;
  `;
  const res = await pool.query(query, [shortCode]);
  return res.rows[0] || null;
}

/**
 * Atomically increments the click counter for a short code.
 * @param {string} shortCode - The short code identifier.
 * @returns {Promise<object|null>} The updated click count representation if found, otherwise null.
 */
export async function incrementClicks(shortCode) {
  const query = `
    UPDATE url_mappings
    SET click_count = click_count + 1
    WHERE short_code = $1
    RETURNING click_count;
  `;
  const res = await pool.query(query, [shortCode]);
  return res.rows[0] || null;
}
