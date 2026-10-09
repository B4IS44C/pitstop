import {initSalesSearch} from './sales-search.js?v=20261004';
import {paymentPdf} from './payment-pdf.js?v=20261004';
import {quotationImage} from './quotation-image.js?v=20261002c';
import {costaRicaPhone,whatsappQuotation} from './whatsapp.js?v=20260927-copy-message2';
import {copyMessage} from './clipboard.js';
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
$('quote-phone').addEventListener('blur',()=>{try{$('quote-phone').value='+'+costaRicaPhone($('quote-phone').value);}catch{}});
let copyBusy=false;
$('send-whatsapp').addEventListener('click',async()=>{
 if(!lastResult||quoteBusy||saleBusy||copyBusy||!checkSeller())return;
 let message;try{message=whatsappQuotation(lastResult).message;}catch(error){$('whatsapp-status').textContent=error.message;return;}
 const snapshot=lastResult;copyBusy=true;$('send-whatsapp').disabled=true;$('copy-message').hidden=true;
 try{await copyMessage(message);if(lastResult===snapshot)$('whatsapp-status').textContent='Mensaje copiado. Ya puedes pegarlo en WhatsApp.';}
 catch{if(lastResult===snapshot){$('copy-message').value=message;$('copy-message').hidden=false;$('copy-message').focus();$('copy-message').select();$('whatsapp-status').textContent='El navegador no permitió copiar. Copia el texto seleccionado con Ctrl+C o mantén presionado y elige Copiar.';}}
 finally{copyBusy=false;$('send-whatsapp').disabled=quoteBusy;}
});
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
 try{const receipt=await receiptFile($('payment-receipt').files[0]);const {data:saleResult}=await api('createSale')({terms:{arrival:$('image-arrival').value.trim(),warranty:$('image-warranty').value.trim()},calculationId:snapshot.calculationId,quoteVersion:snapshot.quoteVersion??0,seller:$('seller').value.trim(),sellerDay,customer,receipt});$('sale-dialog').close();removeSearchQuote(snapshot.calculationId);resetCalculation();$('sale-form').reset();notice('Venta creada. Puedes iniciar un nuevo cálculo.');$('sale-success').showModal();lastPaymentDocument=saleResult.paymentDocument?{...saleResult.paymentDocument,trackingCode:saleResult.trackingCode}:null;$('sale-tracking-code').value=saleResult.trackingCode||'';paymentPdfBlob=null;$('receipt-pdf-status').textContent='';$('download-receipt-pdf').hidden=!lastPaymentDocument;if(lastPaymentDocument)await downloadPaymentPdf();}
 catch(error){$('sale-error').textContent=(!error.code||error.code==='functions/invalid-argument')?error.message:error.code==='functions/already-exists'?'Este cálculo ya tiene una venta registrada.':error.code==='functions/failed-precondition'?'Recupera la cotización nuevamente: su descuento o estado pudo cambiar.':'No se confirmó el guardado. Revisa los datos e intenta nuevamente; no se duplicará la venta.';}
 finally{saleBusy=false;$('sale-fields').disabled=false;$('save-sale').textContent='Guardar venta';}
});
try{$('exchange-rate').value=localStorage.getItem('pitstop-exchange-rate')||'';}catch{}
$('exchange-rate').addEventListener('input',()=>{
 try{localStorage.setItem('pitstop-exchange-rate',$('exchange-rate').value);}catch{}
 if(lastResult){clearResult();notice('Tipo de cambio actualizado. Pulsa Calcular repuesto para actualizar tu cotización.');}
});
$('shipping-origin').addEventListener('change',()=>{if(lastResult){clearResult();notice('Origen actualizado. Pulsa Calcular repuesto para actualizar tu cotización.');}});
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function clearResult(){closeImage();lastResult=undefined;$('sale-status').textContent='';$('create-sale').disabled=false;$('result-data').hidden=true;$('result-empty').hidden=false;}
function currencyChanged(){if(lastResult)renderResult(lastResult);}
$('currency').addEventListener('change',currencyChanged);
function renderResult(item){
 lastResult=item;$('copy-message').hidden=true;$('copy-message').value='';$('whatsapp-status').textContent='Copia el texto para pegarlo en WhatsApp.';$('discount').value=String(item.discountPercent??0);
 $('result-empty').hidden=true;$('result-data').hidden=false;
 const crc=$('currency').value==='CRC',valid=!!item.exchangeRateCents,rate=item.exchangeRateCents;
 const discount=item.discountPercent??0;$('discount-summary').hidden=!discount;$('discount-summary').textContent=discount?`Antes: ${money(crc?(item.crcRoundingUnit===1000?Math.ceil(item.totalBeforeDiscountCents*rate/10000000)*100000:Math.round(item.totalBeforeDiscountCents*rate/100)):item.totalBeforeDiscountCents,crc?'CRC':'USD')} · Descuento aplicado: ${discount}%`:'';
 $('total').textContent=crc?(valid?money(item.totalCrcMinor,'CRC'):'—'):money(item.totalCents);
 $('total-caption').textContent=crc?(valid?(item.crcRoundingUnit===1000?'Colones · Redondeado hacia arriba a ₡1.000':'Colones costarricenses · CRC'):'Conversión no disponible. Selecciona dólares o intenta de nuevo en unos momentos.'):'Dólares estadounidenses · USD';
 $('conversion').hidden=!crc||!valid;
 if(crc&&valid){$('converted-total').textContent=`Total en dólares: ${money(item.totalCents)}`;$('used-rate').textContent=`US$ 1 = ${money(rate,'CRC')} · Tipo de cambio ingresado`;}
 $('result-origin').textContent=item.shippingOrigin==='COLOMBIA'?'Colombia':'USA';$('result-product').textContent=item.product;$('result-cost').textContent=money(item.costCents);$('result-weight').textContent=`${item.weightGrams/1000} kg`;
}
function resetCalculation(){$('quote-phone').value='';$('product-url').value='';$('product').value='';$('cost').value='';$('weight').value='';requestId=undefined;pendingPayload=undefined;clearResult();}
$('discount').addEventListener('change',async()=>{
 if(!lastResult||quoteBusy||saleBusy)return;
 if(!checkSeller())return;
 const snapshot=lastResult,discountPercent=Number($('discount').value);
 quoteBusy=true;for(const id of ['discount','seller','fields','exchange-rate','new','create-sale','send-whatsapp','quotation-image'])$(id).disabled=true;renderSearch();notice('Aplicando descuento…');
 try{const {data}=await api('setQuoteDiscount')({calculationId:snapshot.calculationId,customerPhone:snapshot.customerPhone,quoteVersion:snapshot.quoteVersion??0,discountPercent,seller:$('seller').value.trim(),sellerDay});renderResult(data);searchRows=searchRows.map(row=>row.calculationId===data.calculationId?{...row,...data}:row);notice(discountPercent?`Descuento del ${discountPercent}% aplicado.`:'Cotización sin descuento.');}
 catch(error){clearResult();notice(error.code==='functions/failed-precondition'?'Esta cotización ya tiene una venta.':error.code==='functions/aborted'?'La cotización cambió. Búscala y recupérala nuevamente.':'No se confirmó el descuento. Busca y recupera la cotización antes de continuar.',true);}
 finally{quoteBusy=false;for(const id of ['discount','seller','fields','exchange-rate','new','create-sale','send-whatsapp','quotation-image'])$(id).disabled=false;renderSearch();}
});
$('new').addEventListener('click',()=>{resetCalculation();notice('Ingresa los datos del siguiente repuesto.');$('product').focus();});
$('sale-success-ok').addEventListener('click',()=>{$('sale-success').close();$('product').focus();});

$('calculator-form').addEventListener('submit',async e=>{
 e.preventDefault();if(quoteBusy||!checkSeller())return;const clean=id=>$(id).value.trim().replace(',','.');
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
  $('fields').disabled=false;$('calculate').disabled=false;$('search-button').disabled=false;$('sales-search-button').disabled=false;notice('');
 }catch{notice('No se pudo conectar la calculadora. Revisa tu conexión o inténtalo más tarde.',true);}
}
let searchRows=[],searchCursor=null,searchPhone='',searchBusy=false,quoteBusy=false;
function removeSearchQuote(id){searchRows=searchRows.filter(row=>row.calculationId!==id);renderSearch();}
function renderSearch(){
 const target=$('quote-results');target.replaceChildren();
 for(const item of searchRows){const card=document.createElement('article'),title=document.createElement('h3'),info=document.createElement('p'),button=document.createElement('button');
 card.className='quote-card';title.textContent=item.product;info.textContent=`+${item.customerPhone} · ${new Intl.DateTimeFormat('es-CR',{timeZone:'America/Costa_Rica',dateStyle:'short',timeStyle:'short'}).format(new Date(item.createdAt))}`;button.type='button';button.textContent='Recuperar cotización';button.className='button';button.disabled=quoteBusy||saleBusy;
 button.addEventListener('click',()=>{if(!checkSeller()||quoteBusy||saleBusy)return;if(item.customerTerms){$('image-arrival').value=item.customerTerms.arrival;$('image-warranty').value=item.customerTerms.warranty;}$('product').value=item.product;$('quote-phone').value='+'+item.customerPhone;$('product-url').value=item.productUrl;$('cost').value=(item.costCents/100).toFixed(2);$('weight').value=String(item.weightGrams/1000);$('shipping-origin').value=item.shippingOrigin;$('exchange-rate').value=(item.exchangeRateCents/100).toFixed(2);try{localStorage.setItem('pitstop-exchange-rate',$('exchange-rate').value);}catch{}requestId=undefined;pendingPayload=undefined;renderResult({...item,seller:$('seller').value.trim()});notice('Cotización recuperada con su precio y tipo de cambio originales. Ya puedes crear la venta.');$('calculator-title').scrollIntoView({behavior:'smooth',block:'start'});});
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

let imageBlob=null,imageUrl=null;
function closeImage(){if($('image-dialog').open)$('image-dialog').close();if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=null;imageBlob=null;$('image-preview').removeAttribute('src');$('download-image').removeAttribute('href');}
$('close-image').addEventListener('click',closeImage);
$('quotation-image').addEventListener('click',async()=>{
 if(!lastResult||quoteBusy||saleBusy||!checkSeller())return;
 const terms={arrival:$('image-arrival').value.trim(),warranty:$('image-warranty').value.trim()};if(!terms.arrival||!terms.warranty){$('image-status').textContent='Completa la llegada estimada y la garantía.';return;}
 const snapshot=lastResult;quoteBusy=true;
 const locked=['image-arrival','image-warranty','quotation-image','discount','seller','fields','exchange-rate','new','create-sale','send-whatsapp'];
 for(const id of locked)$(id).disabled=true;renderSearch();$('image-status').textContent='Preparando cotización…';
 try{
  const {data}=await api('issueCustomerQuotation')({terms,calculationId:snapshot.calculationId,customerPhone:snapshot.customerPhone,quoteVersion:snapshot.quoteVersion??0,seller:$('seller').value.trim(),sellerDay});
  const blob=await quotationImage(data);if(lastResult!==snapshot)return;
  closeImage();imageBlob=blob;imageUrl=URL.createObjectURL(blob);$('image-preview').src=imageUrl;$('download-image').href=imageUrl;$('download-image').download='PitStop-'+data.number+'.png';$('image-copy-status').textContent='';$('image-dialog').showModal();$('image-status').textContent='Cotización lista: '+data.number;
 }catch(error){$('image-status').textContent=error.code==='functions/failed-precondition'?'La cotización cambió. Recupérala nuevamente.':'No se pudo preparar la imagen. Revisa tu conexión e intenta nuevamente.';}
 finally{quoteBusy=false;for(const id of locked)$(id).disabled=false;renderSearch();}
});
$('copy-image').addEventListener('click',async()=>{
 if(!imageBlob)return;
 $('copy-image').disabled=true;
 try{if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw new Error();await navigator.clipboard.write([new ClipboardItem({'image/png':imageBlob})]);$('image-copy-status').textContent='Imagen copiada. Abre el chat de WhatsApp y pega con Ctrl+V o Pegar.';}
 catch{$('image-copy-status').textContent='Este navegador no permitió copiar la imagen. Puedes descargar el PNG y adjuntarlo en WhatsApp.';}
 finally{$('copy-image').disabled=false;}
});

let lastPaymentDocument=null,paymentPdfBlob=null,paymentPdfBusy=false;
async function downloadPaymentPdf(){
 if(!lastPaymentDocument||paymentPdfBusy)return;
 paymentPdfBusy=true;$('download-receipt-pdf').disabled=true;$('receipt-pdf-status').textContent='Preparando comprobante PDF…';
 try{
  paymentPdfBlob??=await paymentPdf(lastPaymentDocument);
  const url=URL.createObjectURL(paymentPdfBlob),link=document.createElement('a');link.href=url;link.download='PitStop-'+lastPaymentDocument.number+'.pdf';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('receipt-pdf-status').textContent='Comprobante listo. Si no comenzó la descarga, pulsa Descargar comprobante PDF.';
 }catch{$('receipt-pdf-status').textContent='La venta se guardó. No se pudo generar el PDF; pulsa Descargar comprobante PDF para reintentar.';}
 finally{paymentPdfBusy=false;$('download-receipt-pdf').disabled=false;}
}
$('download-receipt-pdf').addEventListener('click',downloadPaymentPdf);

initSalesSearch({call:(name,payload)=>api(name)(payload),checkSeller,context:()=>({seller:$('seller').value.trim(),sellerDay})});
$('copy-sale-code').addEventListener('click',async()=>{try{await copyMessage($('sale-tracking-code').value);$('sale-code-status').textContent='Código copiado para el cliente.';}catch{$('sale-tracking-code').focus();$('sale-tracking-code').select();$('sale-code-status').textContent='Selecciona y copia el código.';}});
