const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
 
function toBase62(num) {
  if (num === 0) return CHARS[0];
  let result = '';
  while (num > 0) {
    result = CHARS[num % 62] + result;
    num = Math.floor(num / 62);
  }
  return result;
}
 
// Pad to minimum length for consistent short code appearance
export default function encode(num, minLength = 6) {
  return toBase62(num).padStart(minLength, CHARS[0]);
}
 
// export default encode;