export function costaRicaPhone(value){
 if(typeof value!=='string')throw new Error('Revisa el teléfono del cliente. Debe tener +506 y 8 dígitos.');
 let phone=value.trim().replace(/[\s().-]/g,'');
 if(/^\d{8}$/.test(phone))phone='506'+phone;
 if(!/^\+?506\d{8}$/.test(phone))throw new Error('Revisa el teléfono del cliente. Debe tener +506 y 8 dígitos.');
 return phone.replace(/^\+/,'');
}
export function whatsappQuotation(item){
 const phone=costaRicaPhone(item?.customerPhone),total=item?.totalCrcMinor;
 if(!Number.isSafeInteger(total)||total<=0)throw new Error('Calcula la cotización en colones antes de enviarla.');
 const product=String(item.product||'').trim().replace(/\s+/g,' ');
 if(!product)throw new Error('Falta el nombre del repuesto. Calcula nuevamente.');
 const advance=Math.min(total,Math.ceil(total/500000)*100000),balance=total-advance;
 const crc=minor=>'₡'+new Intl.NumberFormat('es-CR',{minimumFractionDigits:0,maximumFractionDigits:2}).format(minor/100);
 const message=`Perfecto, excelente. 👍🏻 Ya confirmamos que el repuesto es el correcto y podemos solicitarlo por encargo como pedido especial.

El precio del repuesto (${product}) sería de ${crc(total)} y para realizar el pedido se requiere un adelanto del 20%, redondeado hacia arriba (${crc(advance)}). El restante ${crc(balance)} se cancela al momento de la entrega personal.

⏱️ Tiempo estimado de llegada: 8–12 días
🛡️ Garantía: 1 mes

Una vez realizado el adelanto, procedemos a encargarlo. ¡Muchas gracias por la confianza!`;
 return {phone,message,total,advance,balance,url:`https://wa.me/${phone}?text=${encodeURIComponent(message)}`};
}
