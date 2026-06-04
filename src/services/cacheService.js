import { createClient } from 'redis';

let client = null;
let useMemoryFallback = false;
const memoryCache = new Map();
let memoryCounter = 0;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  client = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: false,
    },
  });

  client.on('error', (err) => {
    // Only print error logs if fallback is not active
    if (!useMemoryFallback) {
      console.error('Redis error:', err.message || err);
    }
  });
}

// Call once at startup before the server starts listening
async function connect() {
  if (!client) {
    console.warn('No REDIS_URL configured. Falling back to in-memory cache/counter.');
    useMemoryFallback = true;
    return;
  }

  try {
    await client.connect();
    console.log('Redis connected successfully!');
  } catch (err) {
    console.warn('Redis connection failed. Falling back to in-memory cache/counter.');
    useMemoryFallback = true;
  }
}

async function get(key) {
  if (useMemoryFallback) {
    return memoryCache.get(key) || null;
  }
  const val = await client.get(key);
  return val ? JSON.parse(val) : null;
}

async function set(key, value, ttl = process.env.CACHE_TTL) {
  if (useMemoryFallback) {
    memoryCache.set(key, value);
    if (ttl) {
      setTimeout(() => {
        memoryCache.delete(key);
      }, Number(ttl) * 1000);
    }
    return;
  }
  await client.set(key, JSON.stringify(value), { EX: Number(ttl) });
}

async function del(key) {
  if (useMemoryFallback) {
    memoryCache.delete(key);
    return;
  }
  await client.del(key);
}

// Atomic counter used for short code generation
async function incr(key) {
  if (useMemoryFallback) {
    if (key === 'counter:global') {
      memoryCounter += 1;
      return memoryCounter;
    }
    const current = Number(memoryCache.get(key)) || 0;
    const next = current + 1;
    memoryCache.set(key, next);
    return next;
  }
  return client.incr(key);
}

export { connect, get, set, del, incr };