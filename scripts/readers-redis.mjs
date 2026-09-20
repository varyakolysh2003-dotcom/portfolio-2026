// A Redis set keeps browser deduplication and the shared total across deployments.
// The script runs atomically, including when several function instances write.
const script = `
if ARGV[1] == 'POST' then redis.call('SADD', KEYS[1], ARGV[2]) end
return {redis.call('SCARD', KEYS[1]), redis.call('SISMEMBER', KEYS[1], ARGV[2])}
`;

export async function redisReaderStore(method, hash) {
  const url = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Reader database is not configured');
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['EVAL', script, '1', process.env.READER_REDIS_KEY || 'portfolio:lavka:readers', method, hash]),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Reader database unavailable');
  const { result, error } = await response.json();
  if (error || !Array.isArray(result) || !Number.isSafeInteger(result[0]) || result[0] < 0 || ![0, 1].includes(result[1])) {
    throw new Error('Invalid reader database response');
  }
  return { count: result[0], counted: result[1] === 1 };
}
