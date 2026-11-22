const seller=document.querySelector('.seller-panel'),presence=document.querySelector('.presence-panel');if(seller&&presence){const group=document.createElement('div');group.className='seller-workbar';seller.before(group);group.append(seller,presence);}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const sections=[document.querySelector('.calculator'),document.querySelector('.result'),document.querySelector('.recovery-panel')];
sections.forEach((el,i)=>el.id=['calc-data','calc-result','calc-history'][i]);
const cards=document.querySelectorAll('.page-heading,.seller-panel,.presence-panel,.calculator,.result,.recovery-panel');
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&!reduced.matches){e.target.animate([{opacity:.65,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'cubic-bezier(.2,.7,.2,1)'});}},{threshold:.12});cards.forEach(el=>observer.observe(el));
const result=document.getElementById('result-data');new MutationObserver(()=>{if(!result.hidden&&!reduced.matches)result.animate([{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'ease-out'});}).observe(result,{attributes:true,attributeFilter:['hidden']});
