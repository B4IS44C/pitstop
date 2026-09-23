import {firebaseConfig,region,appCheckSiteKey} from './config.js';
const $=id=>document.getElementById(id);
const money=(minor,currency='USD')=>new Intl.NumberFormat('es-CR',{style:'currency',currency}).format(minor/100);
let api,requestId,pendingPayload;
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function clearResult(){$('result-data').hidden=true;$('result-empty').hidden=false;}
function currencyChanged(){const crc=$('currency').value==='CRC';$('cost-symbol').textContent=crc?'₡':'$';$('cost-hint').textContent=crc?'Monto en colones (CRC)':'Monto en dólares (USD)';$('exchange-rate').required=crc;}
$('currency').addEventListener('change',currencyChanged);
function renderResult(item){
 $('result-empty').hidden=true;$('result-data').hidden=false;
 const crc=item.currency==='CRC';
 $('total').textContent=money(crc?item.totalCrcMinor:item.totalCents,item.currency);
 $('total-caption').textContent=crc?'Colones costarricenses · CRC':'Dólares estadounidenses · USD';
 $('conversion').hidden=!item.exchangeRateCents;
 if(item.exchangeRateCents){$('converted-total').textContent=`Equivalente: ${money(crc?item.totalCents:item.totalCrcMinor,crc?'USD':'CRC')}`;$('used-rate').textContent=`US$ 1 = ${money(item.exchangeRateCents,'CRC')} · Tipo de cambio ingresado`;}
 $('result-product').textContent=item.product;$('result-cost').textContent=money(item.inputCostMinor,item.currency);$('result-weight').textContent=`${item.weightGrams/1000} kg`;
}
$('new').addEventListener('click',()=>{$('product').value='';$('cost').value='';$('weight').value='';requestId=undefined;pendingPayload=undefined;clearResult();$('product').focus();});

$('calculator-form').addEventListener('submit',async e=>{
 e.preventDefault();const clean=id=>$(id).value.trim().replace(',','.');
 const product=$('product').value.trim(),cost=clean('cost'),weight=clean('weight'),currency=$('currency').value,exchangeRate=clean('exchange-rate');
 if(product.length<3||!/^\d{1,9}(\.\d{1,2})?$/.test(cost)||Number(cost)<=0||!/^\d{1,4}(\.\d{1,3})?$/.test(weight)||Number(weight)<=0||Number(weight)>1000){notice('Revisa el nombre (mínimo 3 caracteres), el costo positivo (2 decimales) y el peso (hasta 1.000 kg, con 3 decimales).',true);return;}
 if((currency==='CRC'&&!exchangeRate)||(exchangeRate&&(!/^\d{1,5}(\.\d{1,2})?$/.test(exchangeRate)||Number(exchangeRate)<1||Number(exchangeRate)>10000))){notice('Ingresa un tipo de cambio entre ₡1 y ₡10.000 por dólar, con hasta 2 decimales.',true);return;}
 const payload=JSON.stringify({product,cost,weight,currency,exchangeRate:exchangeRate||null});
 if(payload!==pendingPayload){requestId=crypto.randomUUID();pendingPayload=payload;}
 $('fields').disabled=true;$('calculate').textContent='Calculando…';clearResult();
 try{const {data}=await api('calculate')({...JSON.parse(payload),requestId});renderResult(data);notice('Tu cotización está lista.');requestId=undefined;pendingPayload=undefined;}
 catch(error){const messages={'functions/resource-exhausted':'Espera unos segundos antes de realizar otro cálculo.','functions/invalid-argument':'Revisa los importes y el tipo de cambio. El costo convertido debe ser de al menos US$ 0,01 y no superar US$ 999.999,99.','functions/unauthenticated':'No se pudo validar la sesión. Recarga la página.'};notice(messages[error.code]||'No se pudo completar el cálculo. Revisa tu conexión e intenta de nuevo.',true);}
 finally{$('fields').disabled=false;$('calculate').innerHTML='Calcular repuesto <span aria-hidden="true">↗</span>';}
});
async function start(){
 if(!firebaseConfig.apiKey||!firebaseConfig.appId||!appCheckSiteKey){notice('La calculadora está pendiente de activación por administración.');return;}
 try{
  const base='https://www.gstatic.com/firebasejs/12.19.0/';
  const [app,authentication,functions,check]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-functions.js'),import(base+'firebase-app-check.js')]);
  const firebase=app.initializeApp(firebaseConfig);
  check.initializeAppCheck(firebase,{provider:new check.ReCaptchaEnterpriseProvider(appCheckSiteKey),isTokenAutoRefreshEnabled:true});
  const auth=authentication.getAuth(firebase);await authentication.setPersistence(auth,authentication.browserSessionPersistence);await authentication.signInAnonymously(auth);
  const backend=functions.getFunctions(firebase,region);api=name=>functions.httpsCallable(backend,name);
  $('fields').disabled=false;notice('Ingresa el costo en la moneda de tu elección.');
 }catch{notice('No se pudo conectar la calculadora. Revisa tu conexión o inténtalo más tarde.',true);}
}
currencyChanged();start();

