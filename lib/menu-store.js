// Server-only persistence: credentials never reach the browser.
const KEY = 'khan:menu:33:last-complete:v1';
export function redisMenuStore(env = process.env, request = fetch) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  async function command(args) {
    const response = await request(url, {method:'POST', headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(2500)});
    if (!response.ok) throw new Error('Menu storage unavailable');
    const payload = await response.json();
    if (payload.error) throw new Error('Menu storage command failed');
    return payload.result;
  }
  return {
    async read(){const value=await command(['GET',KEY]);return value ? JSON.parse(value) : null;},
    // Atomic timestamp comparison prevents a slower older refresh overwriting a newer snapshot.
    async write(data){return command(['EVAL',`local old=redis.call('GET',KEYS[1]); if old then local ok,v=pcall(cjson.decode,old); if ok and v.fetchedAt and v.fetchedAt > ARGV[2] then return 0 end end; redis.call('SET',KEYS[1],ARGV[1]); return 1`,1,KEY,JSON.stringify(data),data.fetchedAt]);},
    async acquire(owner){return await command(['SET',KEY+':refresh',owner,'NX','EX',30]) === 'OK';},
    async release(owner){return command(['EVAL',"if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",1,KEY+':refresh',owner]);}
  };
}
