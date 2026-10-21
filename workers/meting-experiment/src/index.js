// Independent experimental Cloudflare Worker. Never included in production music pages.
// Install @meting/core and bundle with Wrangler; no user cookies or music unlockers.
import Meting from '@meting/core';
const cors={'access-control-allow-origin':'https://smalljialive.github.io','cache-control':'no-store','x-content-type-options':'nosniff'};
const output=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'content-type':'application/json; charset=utf-8'}});
const deadline=(promise,ms)=>Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(Error('UPSTREAM_TIMEOUT')),ms))]);
const safeError=(error)=>{const msg=String(error?.message||'');if(msg==='UPSTREAM_TIMEOUT')return 'TIMEOUT';if(/fetch failed|network|connect/i.test(msg))return 'NETWORK';if(error instanceof SyntaxError)return 'INVALID_JSON';return 'OTHER';};
export default {
  async fetch(req){
    const url=new URL(req.url);
    if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'GET, OPTIONS'}});
    if(req.method!=='GET')return output({error:'METHOD_NOT_ALLOWED'},405);
    if(url.pathname==='/health')return output({status:'ok',adapter:'meting-core',mode:'experimental'});
    if(!['/search','/url'].includes(url.pathname))return output({error:'NOT_FOUND'},404);
    const source=url.searchParams.get('source');
    if(!['netease','kuwo'].includes(source))return output({error:'INVALID_SOURCE'},400);
    const query=(url.searchParams.get('q')||'').trim(),id=(url.searchParams.get('id')||'').trim();
    if(url.pathname==='/search'?(!query||query.length>80):(!/^[a-zA-Z0-9_-]{1,80}$/.test(id)))return output({error:'INVALID_ARGUMENT'},400);
    try {
      const client=new Meting(source);client.format(true);
      if(url.pathname==='/search'){
        const raw=await deadline(client.search(query,{page:1,limit:10}),6000);
        const results=typeof raw==='string'?JSON.parse(raw):raw;
        if(!Array.isArray(results))return output({error:'INVALID_UPSTREAM_RESPONSE',source,shape:typeof results},502);
        if(!results.length)return output({songs:[],diagnostic:{source,category:'EMPTY_UPSTREAM_LIST'}});
        return output({songs:results.slice(0,10).map(s=>({id:String(s.id||''),name:String(s.name||''),artist:Array.isArray(s.artist)?s.artist:[],url_id:String(s.url_id||s.id||''),pic_id:String(s.pic_id||''),lyric_id:String(s.lyric_id||'')})).filter(s=>s.id)});
      }
      const raw=await deadline(client.url(id,128),6000);
      const parsed=typeof raw==='string'?JSON.parse(raw):raw;
      const entry=Array.isArray(parsed)?parsed[0]:parsed;
      const candidate=typeof entry==='string'?entry:entry?.url;
      let audio;
      try{audio=new URL(candidate);if(!['https:','http:'].includes(audio.protocol)||audio.username||audio.password)throw Error();}catch{return output({url:null,reason:'NO_VALID_URL'});}
      // A URL alone does not confirm playable audio, licensing, or browser CORS.
      return output({url:audio.href,verifiedPlayback:false});
    }catch(error){return output({error:'UPSTREAM_ERROR_OR_TIMEOUT',diagnostic:{source,category:safeError(error)}},502);}
  }
};
