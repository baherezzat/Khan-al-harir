import test from 'node:test';
import assert from 'node:assert/strict';
import {createImageArchive,imageSources,imagePath,boundedBytes} from '../lib/image-archive.js';
const src='https://dashboard.iconapp.site/a.jpg',bytes=Buffer.from('sample-original-bytes');
const imageResponse=()=>new Response(bytes,{headers:{'Content-Type':'image/jpeg'}});
test('archives original bytes unchanged and coalesces simultaneous image requests',async()=>{
 let fetches=0,writes=0;const archive=createImageArchive({store:{head:async()=>{throw Error();},put:async(path,body)=>{writes++;assert.deepEqual(body,bytes);assert.equal(path,imagePath(src));}},request:async()=>{fetches++;return imageResponse();}});
 const values=await Promise.all(Array.from({length:50},()=>archive.load(src)));assert.equal(fetches,1);assert.equal(writes,1);assert.ok(values.every(v=>v.origin==='source-saved'));
});
test('new server uses durable original during source outage, preserving exact bytes',async()=>{
 let failed=false;const saved={url:'https://images.example/a',uploadedAt:new Date(0),contentType:'image/jpeg'};
 const archive=createImageArchive({store:{head:async()=>saved},request:async(url)=>{if(url===src){failed=true;throw Error('offline');}return imageResponse();}});
 const image=await archive.load(src);assert.equal(failed,true);assert.equal(image.origin,'archive');assert.deepEqual(image.bytes,bytes);
});
test('fresh archived image does not call original host',async()=>{
 const archive=createImageArchive({store:{head:async()=>({url:'https://images.example/a',uploadedAt:new Date()})},request:async url=>{assert.notEqual(url,src);return imageResponse();}});assert.equal((await archive.load(src)).origin,'archive');
});
test('source and storage errors do not replace a good saved original',async()=>{
 let wrote=false;const archive=createImageArchive({store:{head:async()=>({url:'https://images.example/a',uploadedAt:new Date(0)}),put:async()=>{wrote=true;}},request:async url=>url===src?new Response('broken',{headers:{'Content-Type':'text/html'}}):imageResponse()});
 assert.equal((await archive.load(src)).origin,'archive');assert.equal(wrote,false);
});
test('invalid hosts are rejected and URL encoding is canonical',()=>{
 assert.throws(()=>imagePath('http://localhost/a.jpg'));assert.throws(()=>imagePath('https://evil.example/a.jpg'));assert.equal(imagePath('https://dashboard.iconapp.site/صورة.jpg'),imagePath('https://dashboard.iconapp.site/%D8%B5%D9%88%D8%B1%D8%A9.jpg'));
});
test('inventory includes add-ons and choices and removes duplicate image URLs',()=>{
 assert.deepEqual(imageSources({images:[{image:src}],addons:[{values:[{image:src},{image:'https://dashboard.iconapp.site/b.png'}]}]}),[src,'https://dashboard.iconapp.site/b.png']);
});
test('oversized streamed responses are cancelled before saving',async()=>{
 const res=new Response(Buffer.alloc(10*1024*1024+1));await assert.rejects(()=>boundedBytes(res),/too large/);
});
