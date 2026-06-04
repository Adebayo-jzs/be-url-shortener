/**
 * Express global error handling middleware.
 * Formats errors thrown during route processing into a consistent JSON response.
 */
export default function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log server errors (5xx) for visibility
  if (status >= 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(status).json({
    error: message,
  });
}
