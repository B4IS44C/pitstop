const crc=value=>'₡'+new Intl.NumberFormat('es-CR',{maximumFractionDigits:2}).format(value/100);
// One-page PDF with an embedded high-resolution JPEG; no external PDF service.
export function jpegPdf(jpeg,width,height){
 const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;
 const add=value=>{const bytes=typeof value==='string'?enc.encode(value):value;parts.push(bytes);length+=bytes.length;};
 const obj=(n,value)=>{offsets[n]=length;add(`${n} 0 obj\n${value}\nendobj\n`);};
 add('%PDF-1.4\n');
 obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
 obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
 offsets[4]=length;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);add(jpeg);add('\nendstream\nendobj\n');
 const scale=Math.min(595.28/width,841.89/height),w=width*scale,h=height*scale;
 const content=`q ${w.toFixed(3)} 0 0 ${h.toFixed(3)} ${((595.28-w)/2).toFixed(3)} ${(841.89-h).toFixed(3)} cm /Im0 Do Q\n`;
 obj(5,`<< /Length ${enc.encode(content).length} >>\nstream\n${content}endstream`);
 const start=length;add('xref\n0 6\n0000000000 65535 f \n');for(let i=1;i<=5;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`);
 return new Blob(parts,{type:'application/pdf'});
}
export async function paymentPdf(q){
 const logo=new Image();logo.src=new URL('./assets/logo.jpeg',import.meta.url).href;await logo.decode();
 const canvas=document.createElement('canvas');canvas.width=1200;const c=canvas.getContext('2d');
 const font=(size,bold=false)=>{c.font=`${bold?'700':'400'} ${size}px Arial, sans-serif`;};
 function wrap(value,width,size=28){font(size);const lines=[];let line='';for(const word of String(value).replace(/\s+/g,' ').trim().split(' ')){const next=line?line+' '+word:word;if(c.measureText(next).width<=width){line=next;continue;}if(line)lines.push(line);line='';for(const char of word){if(c.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}}if(line)lines.push(line);return lines;}
 const product=wrap(q.product,700),name=wrap(q.customerName||'Cliente',1060,30),productHeight=Math.max(110,product.length*38+46),nameHeight=name.length*38;
 canvas.height=Math.max(1697,1350+productHeight+nameHeight);
 const box=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const text=(value,x,y,size=28,color='#202126',bold=false,right=false)=>{font(size,bold);c.fillStyle=color;c.textAlign=right?'right':'left';c.fillText(value,x,y);};
 box(0,0,1200,canvas.height,'#fff');box(0,0,1200,290,'#090a0c');box(0,290,1200,12,'#e20a18');c.drawImage(logo,46,8,280,280);
 text('COMPROBANTE DE PAGO',1130,100,43,'#fff',true,true);text(q.number,1130,158,28,'#fff',true,true);
 const date=new Intl.DateTimeFormat('es-CR',{timeZone:'America/Costa_Rica',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(q.issuedAt));text('Fecha: '+date,1130,210,25,'#c4c6cc',false,true);
 text('RECIBIDO DE',70,365,22,'#dd1222',true);name.forEach((line,i)=>text(line,70,411+i*38,30,'#202126',true));
 let y=420+nameHeight;const phone=String(q.customerPhone).replace(/^\+?/,'+');text('Teléfono: '+phone,70,y,26,'#5f626b');y+=60;
 box(70,y,1060,62,'#dd1222');text('DESCRIPCIÓN',92,y+41,23,'#fff',true);text('IMPORTE',1108,y+41,23,'#fff',true,true);y+=62;
 product.forEach((line,i)=>text(line,92,y+45+i*38));text(crc(q.totalMinor),1108,y+45,30,'#202126',true,true);y+=productHeight;
 box(70,y,1060,2,'#e8e9ec');text('Costo del envío · GRATIS (0%)',92,y+50,27);text(crc(q.shippingMinor),1108,y+50,30,'#202126',true,true);y+=92;
 box(70,y,1060,2,'#e8e9ec');text('Total de la compra',92,y+50,28);text(crc(q.totalMinor),1108,y+50,32,'#202126',true,true);y+=92;
 box(70,y,1060,125,'#101114');text('MONTO PAGADO · ADELANTO 20%',94,y+43,24,'#fff',true);text(crc(q.paidMinor),1106,y+94,48,'#fff',true,true);y+=150;
 box(70,y,1060,90,'#fff0f1');text('SALDO PENDIENTE',94,y+56,27,'#dd1222',true);text(crc(q.balanceMinor),1106,y+56,38,'#dd1222',true,true);y+=146;
 text('El saldo pendiente se cancela al momento de la entrega personal.',70,y,26);y+=80;
 text('¡Gracias por tu compra y por confiar en PitStop!',70,y,30,'#202126',true);text('Tu adelanto nos permite encargar el repuesto para vos.',70,y+44,26,'#5f626b');
 if(q.trackingCode)text('Seguimiento: '+q.trackingCode,70,canvas.height-140,23,'#202126',true);
 box(70,canvas.height-100,1060,2,'#e8e9ec');text('PITSTOP REPUESTOS',70,canvas.height-48,23,'#202126',true);text('CALIDAD QUE TE MUEVE',1130,canvas.height-48,21,'#dd1222',true,true);
 const jpeg=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo crear el PDF.')),'image/jpeg',0.95));
 return jpegPdf(new Uint8Array(await jpeg.arrayBuffer()),canvas.width,canvas.height);
}
