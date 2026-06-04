import express from 'express';
import dotenv from 'dotenv';
import { connect as connectRedis } from './services/cacheService.js';
import shortenRouter from './routes/shorten.js';
import redirectRouter from './routes/redirect.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());

// Register API routes
app.use('/', shortenRouter);
app.use('/', redirectRouter);

// Register global error handler (must be last)
app.use(errorHandler);

/**
 * Boots the server by initializing Redis and then starting Express.
 */
async function startServer() {
  try {
    console.log('Connecting to Redis caching layer...');
    await connectRedis();
    console.log('Redis connected successfully!');

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server due to connection issues:', err.message || err);
    process.exit(1);
  }
}

startServer();