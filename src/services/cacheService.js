import { createClient } from 'redis';
 
const client = createClient({ url: process.env.REDIS_URL });
 
client.on('error', (err) => console.error('Redis error:', err.message || err));
 
// Call once at startup before the server starts listening
async function connect() {
  await client.connect();
  console.log('Redis connected');
}
 
async function get(key) {
  return client.get(key);
}
 
async function set(key, value, ttl = process.env.CACHE_TTL) {
  await client.set(key, value, { EX: Number(ttl) });
}
 
async function del(key) {
  await client.del(key);
}
 
// Atomic counter used for short code generation
async function incr(key) {
  return client.incr(key);
}
 
export { connect, get, set, del, incr };