import {copyMessage} from './clipboard.js';
function text(node){return typeof node.text==='string'?node.text:(node.children??[]).map(text).join('');}
const cellText=node=>text(node).replace(/\s+/g,' ').trim().replace(/\|/g,'\\|');
const nestedTable=node=>node.tag==='table'||(node.children??[]).some(nestedTable);
function rows(node){return (node.children??[]).flatMap(child=>child.tag==='tr'?[child]:['tbody','thead','tfoot'].includes(child.tag)?rows(child):[]);}
function serialize(node){
 if(typeof node.text==='string')return node.text;
 if(node.tag==='br')return '\n';
 if(node.tag==='hr')return '\n\n';
 if(node.tag==='table'){
  const sections=[];let group=[];
  const flush=()=>{if(!group.length)return;const width=Math.max(...group.map(row=>row.length));const line=row=>'| '+Array.from({length:width},(_,i)=>row[i]??'').join(' | ')+' |';sections.push(line(Array(width).fill(''))+'\n'+line(Array(width).fill('---'))+'\n'+group.map(line).join('\n'));group=[];};
  for(const row of rows(node)){
   const cells=(row.children??[]).filter(child=>['td','th'].includes(child.tag));
   if(cells.length<2||cells.some(cell=>(cell.children??[]).some(nestedTable))){flush();for(const cell of cells){const value=(cell.children??[]).map(serialize).join('').trim();if(value)sections.push(value);}}
   else group.push(cells.map(cellText));
  }
  flush();return '\n\n'+sections.join('\n\n')+'\n\n';
 }
 const value=(node.children??[]).map(serialize).join('');
 if(/^h[1-6]$/.test(node.tag))return '\n\n'+value.trim()+'\n\n';
 if(['p','div','li'].includes(node.tag))return value+'\n';
 return value;
}
export function vehicleMarkdown(report){return report.map(serialize).join('\n').replace(/\n[ \t]+\n/g,'\n\n').replace(/\n{3,}/g,'\n\n').trim();}
export async function copyVehicleReport(report,html){
 const plain=vehicleMarkdown(report);
 try{
  if(navigator.clipboard?.write&&typeof ClipboardItem!=='undefined'){
   await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([plain],{type:'text/plain'}),'text/html':new Blob([html],{type:'text/html'})})]);return;
  }
 }catch{}
 await copyMessage(plain);
}
