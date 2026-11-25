import {randomUUID} from 'node:crypto';

export function completeMenu(data) {
  return Boolean(data && data.failedCategoryCount === 0 && Number.isFinite(Date.parse(data.fetchedAt)) &&
    Array.isArray(data.categories) && data.categories.length &&
    new Set(data.categories.map(c=>c?.id)).size === data.categories.length &&
    data.categories.every(c=>c && c.id != null && !c.productsUnavailable && Array.isArray(c.products) && c.products.every(p=>p && p.id != null && (p.title?.ar || p.title?.en))) &&
    data.categories.some(c=>c.products.length));
}

export function createMenuService({fetchSource, seed, store=null, now=Date.now, freshMs=60000, retryMs=30000}) {
  if (!completeMenu(seed)) throw new Error('A verified complete menu backup is required');
  let lastGood=seed, inFlight=null, nextAttempt=0;
  const newer = candidate => {
    if (completeMenu(candidate) && Date.parse(candidate.fetchedAt) >= Date.parse(lastGood.fetchedAt)) lastGood=candidate;
  };
  const result = (stale, persistence) => ({...lastGood, stale, persistence});
  async function refresh() {
    let storageOK=Boolean(store), locked=false;
    const owner=randomUUID();
    if(store) {
      try {newer(await store.read());} catch {storageOK=false;}
    }
    if(now()-Date.parse(lastGood.fetchedAt)<freshMs) return result(false,storageOK?'durable':'memory');
    if(storageOK) {
      try {locked=await store.acquire(owner);if(!locked){nextAttempt=now()+5000;return result(true,'durable');}} catch {storageOK=false;}
    }
    try {
      const data=await fetchSource();
      if(!completeMenu(data)) throw new Error('Incomplete menu refresh');
      newer({...data, branch:data.branch || lastGood.branch});
      if(storageOK) {try{await store.write(lastGood);}catch{storageOK=false;}}
      nextAttempt=now()+freshMs;
      return result(false,storageOK?'durable':'memory');
    } catch {
      nextAttempt=now()+retryMs;
      return result(true,storageOK?'durable':'backup');
    } finally {
      if(locked) {try{await store.release(owner);}catch{/* lock expires automatically */}}
    }
  }
  return {
    get() {
      if(inFlight) return inFlight;
      if(now()<nextAttempt) return Promise.resolve(result(now()-Date.parse(lastGood.fetchedAt)>=freshMs,store?'configured':'memory'));
      inFlight=refresh().finally(()=>{inFlight=null;});
      return inFlight;
    }
  };
}
