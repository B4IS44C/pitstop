import {receiptFile} from './receipt-file.js';
import {firebaseConfig,region,appCheckSiteKey} from './config.js';
const $=id=>document.getElementById(id);
const money=(minor,currency='USD')=>new Intl.NumberFormat('es-CR',{style:'currency',currency}).format(minor/100);
let api,requestId,pendingPayload,lastResult,sellerDay,saleBusy=false;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Costa_Rica',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
try{const saved=JSON.parse(localStorage.getItem('pitstop-seller')||'null');if(saved?.day===today()){$('seller').value=saved.name;sellerDay=saved.day;}}catch{}
function checkSeller(){
 if(sellerDay!==today()){$('seller').value='';clearResult();notice('Escribe el nombre del vendedor para este nuevo día.',true);$('seller').focus();return false;}
 if($('seller').value.trim().length<2){notice('El vendedor es obligatorio. Escribe tu nombre.',true);$('seller').focus();return false;}return true;
}
$('seller').addEventListener('input',()=>{sellerDay=today();try{localStorage.setItem('pitstop-seller',JSON.stringify({name:$('seller').value.trim(),day:sellerDay}));}catch{}if(lastResult){clearResult();notice('Vendedor actualizado. Calcula nuevamente.');}});
for(const id of ['product','cost','weight','quote-phone','product-url'])$(id).addEventListener('input',()=>{if(lastResult){clearResult();notice('Datos actualizados. Calcula nuevamente.');}});
$('create-sale').addEventListener('click',()=>{
 if(!checkSeller()||!lastResult)return;
 $('sale-form').reset();$('customer-phone').value=lastResult.customerPhone||$('quote-phone').value;$('sale-error').textContent='';$('sale-summary').textContent=`${lastResult.product} · ${money(lastResult.totalCents)} · Vendedor: ${lastResult.seller}`;$('sale-dialog').showModal();
});
$('cancel-sale').addEventListener('click',()=>{$('sale-dialog').close();});
$('sale-dialog').addEventListener('cancel',e=>{if(saleBusy)e.preventDefault();});
$('sale-form').addEventListener('submit',async e=>{
 e.preventDefault();if(saleBusy||!lastResult||!checkSeller())return;
 const snapshot=lastResult,customer={phone:$('customer-phone').value.trim(),name:$('customer-name').value.trim(),address:$('customer-address').value.trim()};
 if(!/^\+?\d{8,15}$/.test(customer.phone.replace(/[\s().-]/g,''))){$('sale-error').textContent='Ingresa un teléfono de 8 a 15 dígitos, con código de país si corresponde.';return;}
 saleBusy=true;$('sale-fields').disabled=true;$('save-sale').textContent='Guardando…';$('sale-error').textContent='';
 try{const receipt=await receiptFile($('payment-receipt').files[0]);await api('createSale')({calculationId:snapshot.calculationId,seller:$('seller').value.trim(),sellerDay,customer,receipt});$('sale-dialog').close();removeSearchQuote(snapshot.calculationId);resetCalculation();$('sale-form').reset();notice('Venta creada. Puedes iniciar un nuevo cálculo.');$('sale-success').showModal();}
 catch(error){$('sale-error').textContent=!error.code?error.message:error.code==='functions/already-exists'?'Este cálculo ya tiene una venta registrada.':error.code==='functions/failed-precondition'?'Debes realizar un nuevo cálculo con el vendedor de hoy.':'No se confirmó el guardado. Revisa los datos e intenta nuevamente; no se duplicará la venta.';}
 finally{saleBusy=false;$('sale-fields').disabled=false;$('save-sale').textContent='Guardar venta';}
});
try{$('exchange-rate').value=localStorage.getItem('pitstop-exchange-rate')||'';}catch{}
$('exchange-rate').addEventListener('input',()=>{
 try{localStorage.setItem('pitstop-exchange-rate',$('exchange-rate').value);}catch{}
 if(lastResult){clearResult();notice('Tipo de cambio actualizado. Pulsa Calcular repuesto para actualizar tu cotización.');}
});
$('shipping-origin').addEventListener('change',()=>{if(lastResult){clearResult();notice('Origen actualizado. Pulsa Calcular repuesto para actualizar tu cotización.');}});
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function clearResult(){lastResult=undefined;$('sale-status').textContent='';$('create-sale').disabled=false;$('result-data').hidden=true;$('result-empty').hidden=false;}
function currencyChanged(){if(lastResult)renderResult(lastResult);}
$('currency').addEventListener('change',currencyChanged);
function renderResult(item){
 lastResult=item;
 $('result-empty').hidden=true;$('result-data').hidden=false;
 const crc=$('currency').value==='CRC',valid=!!item.exchangeRateCents,rate=item.exchangeRateCents;
 $('total').textContent=crc?(valid?money(Math.round(item.totalCents*rate/100),'CRC'):'—'):money(item.totalCents);
 $('total-caption').textContent=crc?(valid?'Colones costarricenses · CRC':'Conversión no disponible. Selecciona dólares o intenta de nuevo en unos momentos.'):'Dólares estadounidenses · USD';
 $('conversion').hidden=!crc||!valid;
 if(crc&&valid){$('converted-total').textContent=`Equivalente: ${money(item.totalCents)}`;$('used-rate').textContent=`US$ 1 = ${money(rate,'CRC')} · Tipo de cambio ingresado`;}
 $('result-origin').textContent=item.shippingOrigin==='COLOMBIA'?'Colombia':'USA';$('result-product').textContent=item.product;$('result-cost').textContent=money(item.costCents);$('result-weight').textContent=`${item.weightGrams/1000} kg`;
}
function resetCalculation(){$('quote-phone').value='';$('product-url').value='';$('product').value='';$('cost').value='';$('weight').value='';requestId=undefined;pendingPayload=undefined;clearResult();}
$('new').addEventListener('click',()=>{resetCalculation();notice('Ingresa los datos del siguiente repuesto.');$('product').focus();});
$('sale-success-ok').addEventListener('click',()=>{$('sale-success').close();$('product').focus();});

$('calculator-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!checkSeller())return;const clean=id=>$(id).value.trim().replace(',','.');
 const product=$('product').value.trim(),cost=clean('cost'),weight=clean('weight'),exchangeRate=clean('exchange-rate'),shippingOrigin=$('shipping-origin').value;
 if(!/^\+?\d{8,15}$/.test($('quote-phone').value.trim().replace(/[\s().-]/g,''))){notice('Ingresa el teléfono completo del cliente, de 8 a 15 dígitos.',true);$('quote-phone').focus();return;}
 try{const url=new URL($('product-url').value.trim());if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error();}catch{notice('Ingresa un enlace válido del repuesto que comience con https:// o http://.',true);$('product-url').focus();return;}
 if(product.length<3||!/^\d{1,9}(\.\d{1,2})?$/.test(cost)||Number(cost)<=0||!/^\d{1,4}(\.\d{1,3})?$/.test(weight)||Number(weight)<=0||Number(weight)>1000){notice('Revisa el nombre (mínimo 3 caracteres), el costo positivo (2 decimales) y el peso (hasta 1.000 kg, con 3 decimales).',true);return;}
 if(!/^\d{1,5}(\.\d{1,2})?$/.test(exchangeRate)||Number(exchangeRate)<1||Number(exchangeRate)>10000){notice('Ingresa un tipo de cambio entre ₡1 y ₡10.000 por dólar, con hasta 2 decimales.',true);$('exchange-rate').focus();return;}
 const payload=JSON.stringify({customerPhone:$('quote-phone').value.trim(),productUrl:$('product-url').value.trim(),product,cost,weight,currency:'USD',exchangeRate,shippingOrigin,seller:$('seller').value.trim(),sellerDay});
 if(payload!==pendingPayload){requestId=crypto.randomUUID();pendingPayload=payload;}
 $('seller').disabled=true;$('fields').disabled=true;$('exchange-rate').disabled=true;$('new').disabled=true;quoteBusy=true;renderSearch();$('calculate').textContent='Calculando…';clearResult();
 try{const {data}=await api('calculate')({...JSON.parse(payload),requestId});renderResult(data);notice('Tu cotización está lista.');requestId=undefined;pendingPayload=undefined;}
 catch(error){const messages={'functions/resource-exhausted':'Espera unos segundos antes de realizar otro cálculo.','functions/invalid-argument':'Revisa el costo en dólares y el peso. El costo debe ser de al menos US$ 0,01 y no superar US$ 999.999,99.','functions/unauthenticated':'No se pudo validar la sesión. Recarga la página.'};notice(messages[error.code]||'No se pudo completar el cálculo. Revisa tu conexión e intenta de nuevo.',true);}
 finally{quoteBusy=false;renderSearch();$('seller').disabled=false;$('fields').disabled=false;$('exchange-rate').disabled=false;$('new').disabled=false;$('calculate').innerHTML='Calcular repuesto <span aria-hidden="true">↗</span>';}
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
  $('fields').disabled=false;$('calculate').disabled=false;$('search-button').disabled=false;notice('Ingresa el costo del repuesto en dólares.');
 }catch{notice('No se pudo conectar la calculadora. Revisa tu conexión o inténtalo más tarde.',true);}
}
let searchRows=[],searchCursor=null,searchPhone='',searchBusy=false,quoteBusy=false;
function removeSearchQuote(id){searchRows=searchRows.filter(row=>row.calculationId!==id);renderSearch();}
function renderSearch(){
 const target=$('quote-results');target.replaceChildren();
 for(const item of searchRows){const card=document.createElement('article'),title=document.createElement('h3'),info=document.createElement('p'),button=document.createElement('button');
 card.className='quote-card';title.textContent=item.product;info.textContent=`+${item.customerPhone} · ${new Intl.DateTimeFormat('es-CR',{timeZone:'America/Costa_Rica',dateStyle:'short',timeStyle:'short'}).format(new Date(item.createdAt))}`;button.type='button';button.textContent='Recuperar cotización';button.className='button';button.disabled=quoteBusy||saleBusy;
 button.addEventListener('click',()=>{if(!checkSeller()||quoteBusy||saleBusy)return;$('product').value=item.product;$('quote-phone').value='+'+item.customerPhone;$('product-url').value=item.productUrl;$('cost').value=(item.costCents/100).toFixed(2);$('weight').value=String(item.weightGrams/1000);$('shipping-origin').value=item.shippingOrigin;$('exchange-rate').value=(item.exchangeRateCents/100).toFixed(2);try{localStorage.setItem('pitstop-exchange-rate',$('exchange-rate').value);}catch{}requestId=undefined;pendingPayload=undefined;renderResult({...item,seller:$('seller').value.trim()});notice('Cotización recuperada con su precio y tipo de cambio originales. Ya puedes crear la venta.');$('calculator-title').scrollIntoView({behavior:'smooth',block:'start'});});
 card.append(title,info,button);target.append(card);}
 $('search-more').hidden=!searchCursor;
}
async function searchQuotes(reset=true){
 if(searchBusy||!api||!checkSeller())return;searchBusy=true;$('search-button').disabled=true;$('search-more').disabled=true;
 if(reset){searchPhone=$('search-phone').value.trim();searchRows=[];searchCursor=null;renderSearch();}
 $('search-state').textContent='Buscando cotizaciones…';
 try{const {data}=await api('searchQuotes')({phone:searchPhone,seller:$('seller').value.trim(),sellerDay,cursor:reset?null:searchCursor});searchRows=reset?data.rows:[...searchRows,...data.rows];searchCursor=data.next;renderSearch();$('search-state').textContent=searchRows.length?`${searchRows.length} cotizaciones disponibles.`:'No hay cotizaciones sin venta para este teléfono.';}
 catch(error){$('search-state').textContent=error.code==='functions/invalid-argument'?'Ingresa el teléfono completo, de 8 a 15 dígitos.':error.code==='functions/resource-exhausted'?'Espera unos segundos antes de buscar otra vez.':'No se pudo completar la búsqueda. Intenta nuevamente.';}
 finally{searchBusy=false;$('search-button').disabled=false;$('search-more').disabled=false;}
}
$('quote-search-form').addEventListener('submit',e=>{e.preventDefault();searchQuotes();});$('search-more').addEventListener('click',()=>searchQuotes(false));
currencyChanged();start();
