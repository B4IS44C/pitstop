export async function copyMessage(message){
 try{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(message);return;}
 }catch{}
 const field=document.createElement('textarea');field.value=message;field.readOnly=true;
 field.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(field);
 const previous=document.activeElement;
 try{field.select();field.setSelectionRange(0,field.value.length);if(!document.execCommand('copy'))throw new Error('Copia manual requerida');}
 finally{field.remove();previous?.focus({preventScroll:true});}
}
