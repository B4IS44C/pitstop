import {firebaseConfig,region,appCheckSiteKey} from './config.js';
const $=id=>document.getElementById(id);
const money=(minor,currency='USD')=>new Intl.NumberFormat('es-CR',{style:'currency',currency}).format(minor/100);
let api,requestId,pendingPayload,lastResult,currentRate,ratePending;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Costa_Rica',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function validRate(){return currentRate?.exchangeRateDate===today();}
function showRate(){
 const valid=validRate();
 $('exchange-rate').textContent=valid?`US$ 1 = ${money(currentRate.exchangeRateCents,'CRC')}`:'No disponible';
 $('exchange-hint').textContent=valid?`${currentRate.exchangeRateSource} · ${currentRate.exchangeRateDate}. Actualización automática.`:'No se pudo obtener la tasa vigente. Puedes calcular en dólares; reintentaremos automáticamente.';
}
async function refreshRate(){
 if(!api||ratePending)return;
 ratePending=true;
 try{const {data}=await api('exchangeRate')();currentRate=data;}catch{currentRate=undefined;}
 finally{ratePending=false;showRate();if(lastResult)renderResult(lastResult);}
}
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function clearResult(){lastResult=undefined;$('result-data').hidden=true;$('result-empty').hidden=false;}
function currencyChanged(){if(lastResult)renderResult(lastResult);if($('currency').value==='CRC'&&!validRate())refreshRate();}
$('currency').addEventListener('change',currencyChanged);
function renderResult(item){
 lastResult=item;
 $('result-empty').hidden=true;$('result-data').hidden=false;
 const crc=$('currency').value==='CRC',valid=validRate(),rate=currentRate?.exchangeRateCents;
 $('total').textContent=crc?(valid?money(Math.round(item.totalCents*rate/100),'CRC'):'—'):money(item.totalCents);
 $('total-caption').textContent=crc?(valid?'Colones costarricenses · CRC':'Conversión no disponible. Selecciona dólares o intenta de nuevo en unos momentos.'):'Dólares estadounidenses · USD';
 $('conversion').hidden=!crc||!valid;
 if(crc&&valid){$('converted-total').textContent=`Equivalente: ${money(item.totalCents)}`;$('used-rate').textContent=`US$ 1 = ${money(rate,'CRC')} · Venta · ${currentRate.exchangeRateDate}`;}
 $('result-product').textContent=item.product;$('result-cost').textContent=money(item.costCents);$('result-weight').textContent=`${item.weightGrams/1000} kg`;
}
$('new').addEventListener('click',()=>{$('product').value='';$('cost').value='';$('weight').value='';requestId=undefined;pendingPayload=undefined;clearResult();notice('Ingresa los datos del siguiente repuesto.');$('product').focus();});

$('calculator-form').addEventListener('submit',async e=>{
 e.preventDefault();const clean=id=>$(id).value.trim().replace(',','.');
 const product=$('product').value.trim(),cost=clean('cost'),weight=clean('weight');
 if(product.length<3||!/^\d{1,9}(\.\d{1,2})?$/.test(cost)||Number(cost)<=0||!/^\d{1,4}(\.\d{1,3})?$/.test(weight)||Number(weight)<=0||Number(weight)>1000){notice('Revisa el nombre (mínimo 3 caracteres), el costo positivo (2 decimales) y el peso (hasta 1.000 kg, con 3 decimales).',true);return;}
 const payload=JSON.stringify({product,cost,weight,currency:'USD'});
 if(payload!==pendingPayload){requestId=crypto.randomUUID();pendingPayload=payload;}
 $('fields').disabled=true;$('calculate').textContent='Calculando…';clearResult();
 try{const {data}=await api('calculate')({...JSON.parse(payload),requestId});currentRate=data.exchangeRateCents?data:undefined;showRate();renderResult(data);notice('Tu cotización está lista.');requestId=undefined;pendingPayload=undefined;}
 catch(error){const messages={'functions/resource-exhausted':'Espera unos segundos antes de realizar otro cálculo.','functions/invalid-argument':'Revisa el costo en dólares y el peso. El costo debe ser de al menos US$ 0,01 y no superar US$ 999.999,99.','functions/unauthenticated':'No se pudo validar la sesión. Recarga la página.'};notice(messages[error.code]||'No se pudo completar el cálculo. Revisa tu conexión e intenta de nuevo.',true);}
 finally{$('fields').disabled=false;$('calculate').innerHTML='Calcular repuesto <span aria-hidden="true">↗</span>';}
});
async function start(){
 if(!firebaseConfig.apiKey||!firebaseConfig.appId||!appCheckSiteKey){notice('La calculadora está pendiente de activación.');return;}
 try{
  const base='https://www.gstatic.com/firebasejs/12.19.0/';
  const [app,authentication,functions,check]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-functions.js'),import(base+'firebase-app-check.js')]);
  const firebase=app.initializeApp(firebaseConfig);
  check.initializeAppCheck(firebase,{provider:new check.ReCaptchaEnterpriseProvider(appCheckSiteKey),isTokenAutoRefreshEnabled:true});
  const auth=authentication.getAuth(firebase);await authentication.setPersistence(auth,authentication.browserSessionPersistence);await authentication.signInAnonymously(auth);
  const backend=functions.getFunctions(firebase,region);api=name=>functions.httpsCallable(backend,name);
  $('fields').disabled=false;$('calculate').disabled=false;notice('Ingresa el costo del repuesto en dólares.');refreshRate();
 }catch{notice('No se pudo conectar la calculadora. Revisa tu conexión o inténtalo más tarde.',true);}
}
currencyChanged();start();
setInterval(()=>{if(!document.hidden)refreshRate();},15*60*1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshRate();});


