import {createImageArchive,imageSources,imagePath} from './image-archive.js';
let sdkPromise;
function sdk(){return sdkPromise ||= import('@vercel/blob');}
export function blobImageStore(){
 if(!process.env.BLOB_READ_WRITE_TOKEN)return null;
 const options=()=>({token:process.env.BLOB_READ_WRITE_TOKEN,abortSignal:AbortSignal.timeout(6000)});
 return {
  async head(path){return (await sdk()).head(path,options());},
  async put(path,bytes,contentType){return (await sdk()).put(path,bytes,{...options(),access:'public',contentType,addRandomSuffix:false,allowOverwrite:true,cacheControlMaxAge:3600});},
  async list(){let cursor;const blobs=[];do{const page=await (await sdk()).list({...options(),prefix:'menu-originals/v1/',limit:1000,cursor});blobs.push(...page.blobs);cursor=page.hasMore?page.cursor:undefined;}while(cursor);return blobs;}
 };
}
const store=blobImageStore();
export const imageArchive=createImageArchive({store,validate:async bytes=>{const {default:sharp}=await import('sharp');await sharp(bytes,{limitInputPixels:40000000}).metadata();}});
let job=null;
export function archiveMenuImages(bundle){
 if(!store)return Promise.resolve({configured:false});
 if(job)return job;
 job=(async()=>{
  const sources=imageSources(bundle),blobs=await store.list(),saved=new Map(blobs.map(b=>[b.pathname,b]));
  const pending=sources.filter(src=>!saved.has(imagePath(src)));
  // Retry missing pictures first, then check old source URLs for changed bytes once daily.
  const old=sources.filter(src=>saved.has(imagePath(src))&&Date.now()-new Date(saved.get(imagePath(src)).uploadedAt).getTime()>86400000);
  const batch=[...pending,...old].slice(0,24),deadline=Date.now()+30000;let next=0,archived=0;
  await Promise.all(Array.from({length:4},async()=>{while(next<batch.length&&Date.now()<deadline){const src=batch[next++];try{const result=await imageArchive.load(src);if(result.origin==='source-saved')archived++;}catch{/* retain existing images and retry missing files on the next pass */}}}));
  return {configured:true,total:sources.length,missing:pending.length,archivedThisPass:archived};
 })().finally(()=>{job=null;});return job;
}
export async function imageArchiveStatus(bundle){
 if(!store)return {configured:false};
 const sources=imageSources(bundle),saved=new Set((await store.list()).map(b=>b.pathname));const archived=sources.filter(src=>saved.has(imagePath(src))).length;
 return {configured:true,total:sources.length,archived,missing:sources.length-archived};
}
