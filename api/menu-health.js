import seed from '../data/menu-backup.json' with {type:'json'};
import {redisMenuStore} from '../lib/menu-store.js';
import {createMenuService, completeMenu} from '../lib/menu-service.js';

// Read-only readiness check: deliberately fail an isolated source adapter,
// never the live menu service, and prove recovery from the actual Redis snapshot.
export default async function handler(request,response) {
  if(request.method!=='GET') {response.setHeader('Allow','GET');return response.status(405).json({status:false});}
  response.setHeader('Cache-Control','public, max-age=0, s-maxage=30, must-revalidate');
  try {
    const store=redisMenuStore();
    if(!store) return response.status(503).json({status:false,reason:'storage-not-configured'});
    const saved=await store.read();
    if(!completeMenu(saved)) return response.status(503).json({status:false,reason:'no-complete-snapshot'});
    let sourceFailed=false;
    const isolated=createMenuService({seed:saved,store:{read:async()=>saved,acquire:async()=>true,release:async()=>{}},freshMs:0,
      fetchSource:async()=>{sourceFailed=true;throw new Error('Isolated outage simulation');}});
    const fallback=await isolated.get();
    const recovered=sourceFailed && fallback.stale && JSON.stringify(fallback.categories)===JSON.stringify(saved.categories);
    return response.status(recovered?200:503).json({status:recovered,durableRead:true,sourceOutageSimulation:recovered?'passed':'failed',fetchedAt:saved.fetchedAt,categories:saved.categories.length,items:saved.categories.reduce((count,c)=>count+c.products.length,0)});
  } catch {
    response.setHeader('Cache-Control','no-store');
    return response.status(503).json({status:false,reason:'storage-unavailable'});
  }
}
