import seed from '../data/menu-backup.json' with {type:'json'};
import {redisMenuStore} from '../lib/menu-store.js';
import {completeMenu} from '../lib/menu-service.js';
import {archiveMenuImages,imageArchiveStatus,blobImageStore} from '../lib/blob-images.js';
import {createImageArchive,imageSources} from '../lib/image-archive.js';
export default async function handler(request,response){
 if(request.method!=='GET'){response.setHeader('Allow','GET');return response.status(405).json({status:false});}
 response.setHeader('Cache-Control','public, max-age=0, s-maxage=30, must-revalidate');
 try{
  const saved=await redisMenuStore()?.read();const bundle=completeMenu(saved)?saved:seed;
  const status=await imageArchiveStatus(bundle);
  if(status.configured){const {waitUntil}=await import('@vercel/functions');waitUntil(archiveMenuImages(bundle).catch(()=>{}));}
  if(request.query?.verify==='1'&&status.archived){
   const isolated=createImageArchive({store:blobImageStore(),now:()=>Date.now()+2*86400000,request:async(url,options)=>{if(new URL(url).hostname==='dashboard.iconapp.site')throw new Error('Isolated source outage');return fetch(url,options);}});
   try{const sample=await isolated.load(imageSources(bundle)[0]);status.sourceOutageSample=sample.origin==='archive'&&sample.bytes.length>0?'passed':'failed';}catch{status.sourceOutageSample='failed';}
  }
  return response.status(200).json(status);
 }catch{response.setHeader('Cache-Control','no-store');return response.status(503).json({status:false,reason:'image-storage-unavailable'});}
}
