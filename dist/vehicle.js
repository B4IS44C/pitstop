import {copyVehicleReport,vehicleMarkdown} from './vehicle-copy.js?v=20261001-vehicle1';
const allowed=new Set(['h1','h2','h3','h4','h5','h6','p','div','span','table','tbody','thead','tfoot','tr','td','th','br','hr','b','strong','i','em','ul','ol','li']);
function reportNode(value){
 if(typeof value.text==='string')return document.createTextNode(value.text);
 const element=document.createElement(allowed.has(value.tag)?value.tag:'span');
 for(const key of ['colspan','rowspan'])if(['td','th'].includes(value.tag)&&Number.isInteger(value[key])&&value[key]>0&&value[key]<=20)element.setAttribute(key,String(value[key]));
 for(const child of value.children??[])element.append(reportNode(child));
 return element;
}
export function setupVehicle({getApi,checkSeller,sellerInfo}){
 const $=id=>document.getElementById(id),tabs=[$('tab-quotes'),$('tab-vehicle')];
 function activate(tab){
  for(const item of tabs){const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;$(item.getAttribute('aria-controls')).hidden=!selected;}
 }
 for(const tab of tabs){tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const target=event.key==='Home'?tabs[0]:event.key==='End'?tabs[1]:tabs.find(item=>item!==tab);activate(target);target.focus();}});}
 let busy=false,lastReport,copyBusy=false;
 $('copy-vehicle').addEventListener('click',async()=>{
  if(!lastReport||copyBusy||busy)return;copyBusy=true;$('copy-vehicle').disabled=true;
  const snapshot=lastReport;$('vehicle-copy-manual').hidden=true;
  try{await copyVehicleReport(snapshot,$('vehicle-document').innerHTML);if(lastReport===snapshot)$('vehicle-copy-state').textContent='Información copiada. Pégala donde la necesites.';}
  catch{if(lastReport===snapshot){$('vehicle-copy-manual').value=vehicleMarkdown(snapshot);$('vehicle-copy-manual').hidden=false;$('vehicle-copy-manual').focus();$('vehicle-copy-manual').select();$('vehicle-copy-state').textContent='Selecciona y copia el texto con Ctrl+C o mantén presionado y elige Copiar.';}}
  finally{copyBusy=false;$('copy-vehicle').disabled=false;}
 });
 $('vehicle-plate').addEventListener('input',()=>{$('vehicle-report').hidden=true;$('vehicle-state').textContent='';});
 $('vehicle-class').addEventListener('change',()=>{$('vehicle-report').hidden=true;$('vehicle-state').textContent='';});
 $('vehicle-form').addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  if(!checkSeller()){$('vehicle-state').textContent='Escribe tu nombre en Vendedor para consultar.';return;}
  const api=getApi();if(!api){$('vehicle-state').textContent='Todavía no hay conexión. Espera unos segundos o recarga la página.';return;}
  const plate=$('vehicle-plate').value.trim().toUpperCase(),vehicleClass=$('vehicle-class').value;
  if(!/^[A-Z0-9]{1,6}$/.test(plate)){$('vehicle-state').textContent='Ingresa la placa con hasta 6 letras o números, sin espacios ni guiones.';return;}
  busy=true;$('vehicle-fields').disabled=true;$('vehicle-report').hidden=true;$('vehicle-document').replaceChildren();$('vehicle-state').textContent='Consultando el Registro Nacional… Puede tardar unos momentos.';$('vehicle-submit').textContent='Consultando…';
  try{
   const {data}=await api('consultVehicle')({plate,vehicleClass,...sellerInfo()});
   lastReport=data.report;$('vehicle-copy-state').textContent='';$('vehicle-copy-manual').hidden=true;
   for(const node of data.report)$('vehicle-document').append(reportNode(node));
   $('vehicle-report-title').textContent=`Resultado · ${vehicleClass?vehicleClass+' ':''}${plate}`;
   $('vehicle-date').textContent='Consultado: '+new Intl.DateTimeFormat('es-CR',{timeZone:'America/Costa_Rica',dateStyle:'medium',timeStyle:'short'}).format(new Date(data.consultedAt));
   $('vehicle-report').hidden=false;$('vehicle-state').textContent='Consulta completada.';
  }catch(error){const known=['functions/resource-exhausted','functions/invalid-argument','functions/unavailable','functions/not-found','functions/aborted','functions/unauthenticated'];$('vehicle-state').textContent=known.includes(error.code)?error.message:'No se pudo completar la consulta. Revisa tu conexión e intenta nuevamente.';}
  finally{busy=false;$('vehicle-fields').disabled=false;$('vehicle-submit').textContent='Consultar vehículo';}
 });
}
