const crc=value=>'₡'+new Intl.NumberFormat('es-CR',{maximumFractionDigits:2}).format(value/100);
export async function quotationImage(q){
 const logo=new Image();logo.src=new URL('./assets/logo.jpeg',import.meta.url).href;await logo.decode();
 const canvas=document.createElement('canvas');canvas.width=1200;
 const ctx=canvas.getContext('2d');
 const font=(size=28,bold=false)=>{ctx.font=`${bold?'700':'400'} ${size}px Arial, sans-serif`;};
 function wrap(text,width,size=28){font(size);const lines=[];let line='';for(const word of String(text).replace(/\s+/g,' ').trim().split(' ')){for(const char of (line?' ':'')+word){if(ctx.measureText(line+char).width>width){lines.push(line.trim());line='';}line+=char;}}if(line)lines.push(line.trim());return lines;}
 const product=wrap(q.product,700),rowHeight=Math.max(105,product.length*38+48);
 canvas.height=1580+rowHeight;
 const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 const text=(value,x,y,size=28,color='#202126',bold=false,align='left')=>{font(size,bold);ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(value,x,y);};
 rect(0,0,1200,canvas.height,'#ffffff');rect(0,0,1200,290,'#090a0c');rect(0,290,1200,12,'#e20a18');
 ctx.drawImage(logo,46,8,280,280);
 text('COTIZACIÓN',1130,105,58,'#ffffff',true,'right');
 text(q.number,1130,162,28,'#ffffff',true,'right');
 const date=new Intl.DateTimeFormat('es-CR',{timeZone:'America/Costa_Rica',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(q.issuedAt));
 text('Fecha: '+date,1130,210,25,'#c4c6cc',false,'right');
 text('COTIZADO PARA',70,365,21,'#dd1222',true);
 text('Cliente · +'+q.customerPhone,70,410,30,'#202126',true);
 text('Repuestos por encargo · Pedido especial',70,458,25,'#5f626b');
 rect(70,510,1060,62,'#dd1222');text('DESCRIPCIÓN',92,551,23,'#fff',true);text('IMPORTE',1108,551,23,'#fff',true,'right');
 let y=572;product.forEach((line,i)=>text(line,92,y+45+i*38,28));
 text(crc(q.productMinor),1108,y+45,30,'#202126',true,'right');y+=rowHeight;
 rect(70,y,1060,2,'#e8e9ec');text('Envío',92,y+50);text('GRATIS',240,y+50,24,'#dd1222',true);text(crc(q.shippingMinor),1108,y+50,28,'#202126',false,'right');y+=90;
 rect(70,y,1060,2,'#e8e9ec');text('Subtotal',730,y+54,27);text(crc(q.subtotalMinor),1108,y+54,30,'#202126',true,'right');y+=86;
 rect(70,y,1060,104,'#101114');text('TOTAL',94,y+65,30,'#fff',true);text(crc(q.totalMinor),1106,y+69,48,'#fff',true,'right');y+=164;
 text('CONDICIONES DE PAGO',70,y,23,'#dd1222',true);y+=28;
 const rows=[['Total',q.totalMinor],['Adelanto · 20%',q.advanceMinor],['Saldo pendiente',q.balanceMinor]];
 for(const [label,amount] of rows){rect(70,y,1060,66,label.startsWith('Adelanto')?'#fff0f1':'#f4f5f7');text(label,94,y+43,27,'#202126',true);text(crc(amount),1106,y+43,30,'#202126',true,'right');y+=70;}
 y+=40;text('Con el adelanto procedemos a encargar tu repuesto.',70,y,26);
 text('El saldo se cancela al momento de la entrega personal.',70,y+40,26);y+=108;
 text('LLEGADA ESTIMADA',70,y,20,'#dd1222',true);text(q.arrival,70,y+40,30,'#202126',true);
 text('GARANTÍA',680,y,20,'#dd1222',true);text(q.warranty,680,y+40,30,'#202126',true);
 rect(70,canvas.height-100,1060,2,'#e8e9ec');text('Gracias por la confianza.',70,canvas.height-48,26,'#5f626b');text('CALIDAD QUE TE MUEVE',1130,canvas.height-48,21,'#dd1222',true,'right');
 return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No se pudo crear la imagen.')),'image/png'));
}

