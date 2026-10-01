const channel='pitstop-registry-request';
const post=data=>window.postMessage({channel,...data},location.origin);
export function registryExtensionReady(){
 return new Promise(resolve=>{
  const id=crypto.randomUUID();let timer;
  const done=ready=>{clearTimeout(timer);window.removeEventListener('message',receive);resolve(ready);};
  const receive=event=>{if(event.source===window&&event.origin===location.origin&&event.data?.channel==='pitstop-registry-response'&&event.data.id===id)done(event.data.type==='ready');};
  window.addEventListener('message',receive);timer=setTimeout(()=>done(false),1800);post({type:'ping',id});
 });
}
export async function vehicleBrowserLookup(input,{reserve,release,progress}){
 if(!await registryExtensionReady())throw new Error('Instala y activa el complemento PitStop en Chrome u Opera de escritorio y recarga esta página.');
 const id=crypto.randomUUID();
 try{return await new Promise((resolve,reject)=>{
  let timer,finished=false,reserving=false;
  const done=(error,data)=>{if(finished)return;finished=true;clearTimeout(timer);window.removeEventListener('message',receive);error?reject(new Error(error)):resolve(data);};
  const receive=async event=>{
   if(event.source!==window||event.origin!==location.origin||event.data?.channel!=='pitstop-registry-response'||event.data.id!==id)return;
   const message=event.data;
   if(message.type==='progress')progress(String(message.message??''));
   else if(message.type==='result')done(null,message.data);
   else if(message.type==='error')done(String(message.error||'No se pudo completar la consulta.'));
   else if(message.type==='reserve'&&!reserving){
    reserving=true;
    try{await reserve(id);if(!finished)post({type:'reserveResult',id,ok:true});else await release(id);}
    catch(error){if(!finished)post({type:'reserveResult',id,ok:false,error:error.message||'No se pudo reservar la consulta.'});}
    finally{reserving=false;}
   }
  };
  window.addEventListener('message',receive);timer=setTimeout(()=>{post({type:'cancel',id});done('La consulta venció. Revisa el acceso al Registro y vuelve a intentar.');},240000);
  post({type:'start',id,plate:input.plate,vehicleClass:input.vehicleClass});
 });}finally{await release(id).catch(()=>{});}
}
