import express from 'express';
import { resolveShortCode, incrementClicks } from '../services/urlService.js';

const router = express.Router();

/**
 * GET /:shortCode
 * Redirects the short code to its original long URL.
 */
router.get('/:shortCode', async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Resolve short code mapping (utilizes cache-aside pattern)
    const mapping = await resolveShortCode(shortCode);

    // Send 404 if not found
    if (!mapping) {
      const err = new Error('Short URL not found');
      err.status = 404;
      throw err;
    }

    // Send 410 if expired
    if (mapping.expiry_date && new Date(mapping.expiry_date) < new Date()) {
      const err = new Error('Short URL has expired');
      err.status = 410;
      throw err;
    }

    // Asynchronous click count increment (fire-and-forget)
    incrementClicks(shortCode).catch((err) => {
      console.error(`Failed to increment click count for short code: ${shortCode}`, err);
    });

    // Perform a 302 redirect
    res.redirect(302, mapping.long_url);
  } catch (err) {
    next(err);
  }
});

export default router;
