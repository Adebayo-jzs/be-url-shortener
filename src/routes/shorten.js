import express from 'express';
import { createShortUrl } from '../services/urlService.js';

const router = express.Router();

/**
 * POST /shorten
 * Shortens a given destination URL.
 */
router.post('/shorten', async (req, res, next) => {
  try {
    const { long_url, custom_alias, expiry_date } = req.body;
    const baseUrl = process.env.BASE_URL || 'http://localhost:8000';

    // Validate that long_url exists
    if (!long_url) {
      const err = new Error('long_url is required');
      err.status = 400;
      throw err;
    }

    // Validate long_url format
    try {
      new URL(long_url);
    } catch (e) {
      const err = new Error('Invalid URL format');
      err.status = 400;
      throw err;
    }

    // Validate expiry_date if provided
    let parsedExpiry = null;
    if (expiry_date) {
      parsedExpiry = new Date(expiry_date);
      if (isNaN(parsedExpiry.getTime())) {
        const err = new Error('Invalid expiry_date format');
        err.status = 400;
        throw err;
      }
    }

    // Call service to generate/store short URL mapping
    const mapping = await createShortUrl(long_url, custom_alias, parsedExpiry);

    // Build the short URL by combining BASE_URL and the short_code
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const shortUrl = `${cleanBaseUrl}/${mapping.short_code}`;

    res.status(201).json({
      short_url: shortUrl,
      long_url: mapping.long_url,
      short_code: mapping.short_code,
      expiry_date: mapping.expiry_date,
      created_at: mapping.created_at,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
