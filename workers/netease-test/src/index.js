// Isolated Cloudflare Worker API adapter. No production music routes are changed.
// Requires an explicitly configured permitted HTTPS provider with compatible endpoints.
// Does not implement unlocking, session-cookie injection, or media proxying.
const json = (body, status=200) => new Response(JSON.stringify(body), {status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"https://smalljialive.github.io","x-content-type-options":"nosniff"}});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:{"access-control-allow-origin":"https://smalljialive.github.io","access-control-allow-methods":"GET, OPTIONS","access-control-allow-headers":"content-type"}});
    if(request.method!=="GET") return json({error:"METHOD_NOT_ALLOWED"},405);
    if(url.pathname==="/health") return json({status:"ok",mode:"test",providerConfigured:Boolean(env.NETEASE_PROVIDER_URL)});
    if(!["/search","/url"].includes(url.pathname)) return json({error:"NOT_FOUND"},404);
    if(!env.NETEASE_PROVIDER_URL) return json({error:"PROVIDER_NOT_CONFIGURED"},503);
    let base;
    try {base=new URL(env.NETEASE_PROVIDER_URL);if(base.protocol!=="https:"||base.username||base.password||base.search||base.hash)throw Error();}catch{return json({error:"INVALID_PROVIDER_CONFIGURATION"},503);}
    const isSearch=url.pathname==="/search";
    const keyword=(url.searchParams.get("q")||"").trim();
    const id=(url.searchParams.get("id")||"").trim();
    if(isSearch?(!keyword||keyword.length>80):(!/^\d{1,16}$/.test(id)))return json({error:"INVALID_ARGUMENT"},400);
    const dest=new URL(isSearch?"cloudsearch":"song/url/v1",base.href.endsWith("/")?base.href:base.href+"/");
    if(isSearch){dest.searchParams.set("keywords",keyword);dest.searchParams.set("limit","15");dest.searchParams.set("type","1");}
    else{dest.searchParams.set("id",id);dest.searchParams.set("level","standard");}
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),5500);
    try {
      const response=await fetch(dest,{signal:controller.signal,headers:{accept:"application/json"},redirect:"error"});
      if(!response.ok)return json({error:"PROVIDER_UNAVAILABLE"},502);
      const body=await response.json();
      if(body?.code!==200)return json({error:"PROVIDER_REJECTED"},502);
      if(isSearch) {
        const songs=Array.isArray(body?.result?.songs)?body.result.songs:[];
        return json({songs:songs.slice(0,15).filter(s=>s&&/^\d+$/.test(String(s.id))).map(s=>({id:String(s.id),name:String(s.name||""),artist:Array.isArray(s.ar)?s.ar.map(a=>a.name).filter(Boolean).join(" / "):"",album:String(s.al?.name||""),cover:String(s.al?.picUrl||"")}))});
      }
      const audio=body?.data?.[0];
      if(!audio||Number(audio.fee||0)>0||audio.freeTrialInfo||!audio.url)return json({url:null,reason:"UNAVAILABLE_OR_RESTRICTED"});
      let media;try{media=new URL(audio.url);if(media.protocol!=="https:"||media.username||media.password)throw Error();}catch{return json({url:null,reason:"INVALID_MEDIA_URL"});}
      return json({url:media.href});
    } catch{return json({error:"PROVIDER_TIMEOUT_OR_ERROR"},502);}
    finally{clearTimeout(timer);}
  }
};
