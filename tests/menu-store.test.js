import test from 'node:test';
import assert from 'node:assert/strict';
import {redisMenuStore} from '../lib/menu-store.js';
test('Redis uses server credentials, non-expiring snapshots and owner-checked locks',async()=>{
 const calls=[];const store=redisMenuStore({UPSTASH_REDIS_REST_URL:'https://storage.invalid',UPSTASH_REDIS_REST_TOKEN:'test-secret'},async(url,options)=>{
  const args=JSON.parse(options.body);calls.push(args);assert.equal(options.headers.Authorization,'Bearer test-secret');assert.equal(options.method,'POST');assert.ok(options.signal);
  return {ok:true,json:async()=>({result:args[0]==='GET'?JSON.stringify({fetchedAt:'test'}):'OK'})};
 });
 assert.deepEqual(await store.read(),{fetchedAt:'test'});await store.write({fetchedAt:'2026-11-25T00:00:00.000Z'});assert.equal(await store.acquire('owner'),true);await store.release('owner');
 assert.equal(calls[1][0],'EVAL');assert.match(calls[1][1],/v.fetchedAt > ARGV\[2\]/);assert.doesNotMatch(calls[1][1],/EXPIRE/);assert.equal(calls[2][3],'NX');assert.match(calls[3][1],/== ARGV\[1\]/);
});
test('missing storage configuration is explicit and Redis command errors fail closed',async()=>{
 assert.equal(redisMenuStore({}),null);
 const store=redisMenuStore({KV_REST_API_URL:'https://storage.invalid',KV_REST_API_TOKEN:'test'},async()=>({ok:true,json:async()=>({error:'denied'})}));await assert.rejects(()=>store.read());
});
