/* m-anti-debug.js — Anti-análisis: debugger loop + detección DevTools por dimension gap.
   Swallow silencioso (no nukea el DOM). Solo reporta detección. */
(function(G){
if(!G)return; if(G._M&&G._M.adbg)return; G._M=G._M||{}; G._M.adbg=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var reported={};
function fire(reason){if(reported[reason])return;reported[reason]=1;exfil('anti-debug',{fired:reason,loc:location.pathname})}
// 1. debugger loop (ralentiza inspección) — con throttle para no colgar UX
setInterval(function(){var s=new Date();(function(){}).constructor('debugger')();if(new Date()-s>100)fire('debugger-pause')},4000);
// 2. detección DevTools por gap de dimensiones (outer - inner > umbral)
setInterval(function(){
var wThresh=window.outerWidth-window.innerWidth>160;
var hThresh=window.outerHeight-window.innerHeight>160;
if(wThresh&&hThresh)fire('devtools-docked');
},2000);
// 3. detección por console redefinition (cuando DevTools abre, ciertos objetos cambian)
var _log=console.log;var devtools=/./;devtools.toString=function(){fire('console-opened');return''};
setInterval(function(){try{_log(devtools);_log('%c',devtools)}catch(e){}},3000);
// 4. detección de overrides de funciones nativas (analistas monkey-patchan)
if(console.log.toString().indexOf('native code')<0)fire('console-log-overridden');
exfil('anti-debug-boot',{hooked:true});
}catch(e){hx('m-adbg-err',{m:e.message})}
})(window.__GE__);
