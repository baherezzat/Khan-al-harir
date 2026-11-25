import test from 'node:test';
import assert from 'node:assert/strict';
import {createMenuService,completeMenu} from '../lib/menu-service.js';
const seed={fetchedAt:'2026-01-01T00:00:00.000Z',failedCategoryCount:0,categories:[{id:1,products:[{id:10,title:{en:'Soup'},price:50}]}]};
const start=Date.parse('2026-11-25T10:00:00.000Z');
const live={...seed,fetchedAt:new Date(start).toISOString(),categories:[{id:1,products:[{id:10,title:{en:'Soup'},price:60}]}]};
function durable(initial=seed){let value=initial,locked=false;return {read:async()=>value,write:async v=>{value=v;},acquire:async()=>{if(locked)return false;locked=true;return true;},release:async()=>{locked=false;}};}
test('cold start and total source failure returns complete bundled menu',async()=>{
 const service=createMenuService({seed,now:()=>start,fetchSource:async()=>{throw Error('offline');}});
 const data=await service.get();assert.equal(data.stale,true);assert.deepEqual(data.categories,seed.categories);
});
test('100 simultaneous visitors share one refresh; warm visitors do not hit source again',async()=>{
 let calls=0;const service=createMenuService({seed,now:()=>start,fetchSource:async()=>{calls++;await new Promise(r=>setTimeout(r,10));return live;}});
 const results=await Promise.all(Array.from({length:100},()=>service.get()));
 assert.equal(calls,1);assert.ok(results.every(r=>r.categories[0].products[0].price===60));await service.get();assert.equal(calls,1);
});
test('complete update persists across cold starts and survives partial refreshes',async()=>{
 let now=start;const store=durable();
 await createMenuService({seed,store,now:()=>now,fetchSource:async()=>live}).get();
 now+=70000;
 const data=await createMenuService({seed,store,now:()=>now,fetchSource:async()=>({...live,failedCategoryCount:1,categories:[]})}).get();
 assert.equal(data.stale,true);assert.equal(data.categories[0].products[0].price,60);assert.equal((await store.read()).fetchedAt,live.fetchedAt);
});
test('source recovery replaces fallback, while repeated failures are throttled',async()=>{
 let now=start,calls=0;const service=createMenuService({seed,now:()=>now,fetchSource:async()=>{if(++calls===1)throw Error();return {...live,fetchedAt:new Date(now).toISOString()};}});
 assert.equal((await service.get()).stale,true);await service.get();assert.equal(calls,1);now+=31000;assert.equal((await service.get()).stale,false);assert.equal(calls,2);
});
test('storage outage still serves source or bundled backup',async()=>{
 const store={read:async()=>{throw Error();}};
 assert.equal((await createMenuService({seed,store,now:()=>start,fetchSource:async()=>live}).get()).stale,false);
 assert.equal((await createMenuService({seed,store,now:()=>start,fetchSource:async()=>{throw Error();}}).get()).stale,true);
});
test('distributed refresh lock lets other server instances serve saved menu',async()=>{
 const store=durable();let calls=0;let release;
 const fetchSource=async()=>{calls++;await new Promise(r=>{release=r;});return live;};
 const first=createMenuService({seed,store,now:()=>start,fetchSource}).get();await new Promise(r=>setImmediate(r));
 const second=await createMenuService({seed,store,now:()=>start,fetchSource}).get();assert.equal(second.stale,true);assert.equal(calls,1);release();await first;
});
test('empty or malformed snapshots never qualify as usable menu backups',()=>{
 assert.equal(completeMenu({...seed,categories:[]}),false);assert.equal(completeMenu({...seed,categories:[{id:1,products:[]}]}),false);assert.equal(completeMenu({...seed,categories:[{id:1,products:[null]}]}),false);
});
