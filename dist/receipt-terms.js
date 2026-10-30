export function receiptTerms(q){
 const items=q.items?.length?q.items:[q];
 return [
 ['GARANTÍA POR REPUESTO',items.map((item,i)=>`${q.items?.length?(i+1)+'. ':''}${item.product}: ${item.warranty||'Plazo no registrado; aplica la garantía legal'}.`).join('\n')],
 ['1. Plazo y comienzo','El plazo indicado corresponde a la cotización y se cuenta desde la entrega efectiva del repuesto, no desde el adelanto. Se respeta el mínimo legal de 30 días hábiles; si se ofreció un plazo mayor, prevalece el mayor.'],
 ['2. Cobertura y revisión','La garantía comercial cubre defectos de fabricación. Todos los repuestos se entregan revisados y verificados en funcionamiento por PitStop. Esta revisión no elimina la cobertura por defectos que se manifiesten después de la entrega ni los derechos legales del consumidor.'],
 ['3. Daños no cubiertos','No cubre daños causados por manipulación del cliente o de terceros, golpes, instalación incorrecta, uso indebido, modificaciones o uso contrario a las especificaciones. La exclusión debe corresponder a la causa del daño; instalar o manipular normalmente el repuesto no anula por sí solo la garantía.'],
 ['4. Compatibilidad e instalación','Verificá la referencia, modelo y especificaciones antes de instalar. Se recomienda instalación por personal competente y seguir las indicaciones del fabricante. Si notás una anomalía, suspendé el uso y contactanos antes de intervenir la pieza.'],
 ['5. Solicitud de garantía','Contactá a PitStop al +506 8865-8421 o pitstoprepuestoscr@gmail.com. Indicá el número de comprobante, repuesto y descripción de la falla; aportá fotos o videos cuando sea posible. Coordinaremos la recepción y evaluación del producto y la solución que corresponda conforme a la normativa aplicable.'],
 ['6. Pago, entrega y comprobante','El monto recibido y el saldo pendiente son los indicados en este comprobante. El saldo se cancela al entregar, salvo acuerdo distinto documentado. El envío indicado es gratuito. Las fechas de llegada son estimadas; cualquier cambio se comunicará al cliente. Este comprobante acredita el pago y no sustituye el documento fiscal que corresponda.'],
 ['7. Derechos del cliente','Estas condiciones no limitan los derechos irrenunciables del consumidor, la garantía legal ni las soluciones que correspondan por incumplimiento. No constituyen una renuncia a reclamar por falta de conformidad o defectos del producto.']
 ];
}
export async function receiptTermsPages(q,logo){
 const pages=[];let canvas,c,y;
 function page(){canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1697;c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,1200,1697);c.fillStyle='#101114';c.fillRect(0,0,1200,190);c.drawImage(logo,45,0,180,180);c.fillStyle='#fff';c.font='bold 32px Arial';c.fillText('TÉRMINOS Y CONDICIONES',270,85);c.font='23px Arial';c.fillText('Comprobante '+q.number,270,130);c.fillStyle='#dd1222';c.fillRect(0,190,1200,8);y=255;}
 async function finish(){c.fillStyle='#667080';c.font='20px Arial';c.fillText('PITSTOP REPUESTOS · Condiciones de venta y garantía',70,1640);const b=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95));pages.push(new Uint8Array(await b.arrayBuffer()));}
 function wrap(s){c.font='25px Arial';const lines=[];for(const paragraph of s.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(c.measureText(next).width<=1060){line=next;continue;}if(line)lines.push(line);line='';for(const ch of word){if(c.measureText(line+ch).width>1060){lines.push(line);line='';}line+=ch;}}if(line)lines.push(line);}return lines;}
 page();for(const [heading,body]of receiptTerms(q)){const lines=wrap(body);if(y+100>1550){await finish();page();}c.fillStyle='#d9142c';c.font='bold 26px Arial';c.fillText(heading,70,y);y+=40;for(const line of lines){if(y>1540){await finish();page();}c.fillStyle='#292d35';c.font='25px Arial';c.fillText(line,70,y);y+=34;}y+=24;}await finish();return pages;
}
