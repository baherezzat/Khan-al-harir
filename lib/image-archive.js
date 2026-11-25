import {createHash} from 'node:crypto';
const MAX_BYTES=10*1024*1024;
export function sourceURL(value) {
 const url=new URL(String(value));
 if(url.protocol!=='https:' || url.hostname!=='dashboard.iconapp.site' || url.port || url.username || url.password) throw new Error('Unsupported image source');
 return url.href;
}
export function imagePath(value){return 'menu-originals/v1/'+createHash('sha256').update(sourceURL(value)).digest('hex');}
export function imageSources(bundle){const found=new Set();function walk(value){if(typeof value==='string'){try{if(/\.(?:jpe?g|png|webp|gif)(?:\?|$)/i.test(value))found.add(sourceURL(value));}catch{}}else if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')Object.values(value).forEach(walk);}walk(bundle);return [...found];}
export async function boundedBytes(response){
 if(!response.ok)throw new Error('Image unavailable');
 if(Number(response.headers.get('content-length'))>MAX_BYTES)throw new Error('Image too large');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_BYTES)throw new Error('Image too large');chunks.push(Buffer.from(value));}}catch(error){await reader.cancel();throw error;}
 if(!size)throw new Error('Empty image');return Buffer.concat(chunks);
}
export function createImageArchive({store=null,request=fetch,validate=async()=>{},now=Date.now}){
 const running=new Map();
 async function load(value){
  const src=sourceURL(value),path=imagePath(src);let saved=null;
  if(store){try{saved=await store.head(path);}catch{/* source remains available during storage outages */}}
  async function readSaved(){const response=await request(saved.url,{signal:AbortSignal.timeout(10000)});return {bytes:await boundedBytes(response),contentType:saved.contentType||'application/octet-stream',origin:'archive'};}
  if(saved && now()-new Date(saved.uploadedAt).getTime()<86400000){try{return await readSaved();}catch{/* retry source if stored CDN is unavailable */}}
  try{
   const response=await request(src,{redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'image/webp,image/jpeg,image/png,image/gif'}});
   const bytes=await boundedBytes(response),contentType=(response.headers.get('content-type')||'').split(';')[0];
   if(!/^image\/(jpeg|png|webp|gif)$/.test(contentType))throw new Error('Unsupported image type');
   await validate(bytes);
   let stored=false;if(store){try{await store.put(path,bytes,contentType);stored=true;}catch{/* do not break display on a storage failure */}}
   return {bytes,contentType,origin:stored?'source-saved':'source'};
  }catch(error){if(saved)return readSaved();throw error;}
 }
 return {load(value){const key=sourceURL(value);if(!running.has(key))running.set(key,load(key).finally(()=>running.delete(key)));return running.get(key);}};
}
