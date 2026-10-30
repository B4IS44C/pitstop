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
 function wrap(s){c.font='22px Arial';const lines=[];for(const paragraph of s.split('\n')){let line='';for(const word of paragraph.split(/\s+/)){const next=line?line+' '+word:word;if(c.measureText(next).width<=1060){line=next;continue;}if(line)lines.push(line);line='';for(const ch of word){if(c.measureText(line+ch).width>1060){lines.push(line);line='';}line+=ch;}}if(line)lines.push(line);}return lines;}
 page();for(const [heading,body]of receiptTerms(q)){const lines=wrap(body);if(y+100>1550){await finish();page();}c.fillStyle='#d9142c';c.font='bold 26px Arial';c.fillText(heading,70,y);y+=34;for(const line of lines){if(y>1540){await finish();page();}c.fillStyle='#292d35';c.font='22px Arial';c.fillText(line,70,y);y+=29;}y+=17;}await finish();pages.push(await signaturePage(q,logo));return pages;
}

async function signaturePage(q,logo){
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1697;const c=canvas.getContext('2d');
 c.fillStyle='#fff';c.fillRect(0,0,1200,1697);c.fillStyle='#101114';c.fillRect(0,0,1200,190);c.drawImage(logo,45,0,180,180);
 function text(s,y,size=25,color='#292d35'){c.fillStyle=color;c.font=`${size}px Arial`;c.fillText(s,70,y);}
 c.fillStyle='#fff';c.font='bold 30px Arial';c.fillText('ACEPTACIÓN Y PAGO FINAL',270,85);c.font='23px Arial';c.fillText('Comprobante '+q.number,270,130);
 c.fillStyle='#dd1222';c.fillRect(0,190,1200,8);
 const money=n=>new Intl.NumberFormat('es-CR',{style:'currency',currency:q.currency||'CRC'}).format(Number(n||0)/100);
 text('Completar al entregar el pedido y recibir el pago final.',260,27);
 text('Cliente: '+(q.customerName||'________________________________'),320);
 text('Teléfono: '+(q.customerPhone||'_______________________________'),365);
 text('Identificación: ___________________________________________',420);
 text('Fecha de entrega: _________________________________________',475);
 text('ACEPTACIÓN DE CONDICIONES',565,28,'#d9142c');
 ['Declaro que recibí y leí los términos y condiciones adjuntos, incluyendo',
  'el plazo de garantía de cada repuesto, su cobertura y exclusiones.',
  'Acepto estas condiciones sin renunciar a mis derechos legales.',
  'La garantía comienza en la fecha de entrega efectiva registrada arriba.'].forEach((s,i)=>text(s,615+i*36));
 text('CONSTANCIA DE CANCELACIÓN DEL SALDO',820,28,'#d9142c');
 text('Total del pedido: '+money(q.totalMinor),875);
 text('Pagos registrados en este comprobante: '+money(q.paidMinor??q.advanceMinor),920);
 text('Saldo por cancelar antes de la entrega: '+money(q.balanceMinor),965);
 text('Monto recibido en la entrega: ______________________________',1030);
 text('Fecha / medio de pago / referencia: ________________________',1080);
 text('Saldo restante después de este pago: _______________________',1130);
 text('PitStop confirma la cancelación total únicamente si el saldo restante',1195,23);
 text('es cero y su representante firma esta constancia de pago.',1230,23);
 c.strokeStyle='#667080';c.lineWidth=2;c.beginPath();c.moveTo(70,1390);c.lineTo(540,1390);c.moveTo(660,1390);c.lineTo(1130,1390);c.stroke();
 text('Firma del cliente',1430);c.fillText('Firma de quien recibe · PitStop',660,1430);
 text('Nombre: ______________________',1485,22);c.fillText('Nombre: ______________________',660,1485);
 text('Esta hoja sin completar ni firmar no acredita el pago del saldo.',1570,22,'#667080');
 text('PITSTOP REPUESTOS · Gracias por tu confianza.',1640,20,'#667080');
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.95));return new Uint8Array(await blob.arrayBuffer());
}
