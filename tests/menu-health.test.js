import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/menu-health.js';
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
test('health proves outage fallback using a stored snapshot without writes or upstream calls',async()=>{
 const original=global.fetch;const oldURL=process.env.UPSTASH_REDIS_REST_URL,oldToken=process.env.UPSTASH_REDIS_REST_TOKEN;
 process.env.UPSTASH_REDIS_REST_URL='https://storage.invalid';process.env.UPSTASH_REDIS_REST_TOKEN='test';
 let calls=0;const saved={fetchedAt:'2026-11-25T18:22:19.124Z',failedCategoryCount:0,categories:[{id:1,products:[{id:2,title:{en:'Soup'}}]}]};
 global.fetch=async(url,options)=>{calls++;assert.equal(url,'https://storage.invalid');assert.equal(JSON.parse(options.body)[0],'GET');return {ok:true,json:async()=>({result:JSON.stringify(saved)})};};
 try{const res=response();await handler({method:'GET'},res);assert.equal(res.code,200);assert.equal(res.body.durableRead,true);assert.equal(res.body.sourceOutageSimulation,'passed');assert.equal(calls,1);}finally{global.fetch=original;if(oldURL===undefined)delete process.env.UPSTASH_REDIS_REST_URL;else process.env.UPSTASH_REDIS_REST_URL=oldURL;if(oldToken===undefined)delete process.env.UPSTASH_REDIS_REST_TOKEN;else process.env.UPSTASH_REDIS_REST_TOKEN=oldToken;}
});
test('readiness check refuses mutations',async()=>{const res=response();await handler({method:'POST'},res);assert.equal(res.code,405);});
