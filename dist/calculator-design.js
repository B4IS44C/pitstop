const seller=document.querySelector('.seller-panel'),presence=document.querySelector('.presence-panel');if(seller&&presence){const group=document.createElement('div');group.className='seller-workbar';seller.before(group);group.append(seller,presence);}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const sections=[document.querySelector('.calculator'),document.querySelector('.result'),document.querySelector('.recovery-panel')];
sections.forEach((el,i)=>el.id=['calc-data','calc-result','calc-history'][i]);
const nav=document.createElement('nav');nav.className='calc-nav';nav.setAttribute('aria-label','Secciones de la calculadora');
const icons=['<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 8h8M8 12h2m4 0h2M8 16h2m4 0h2"/>','<path d="m5 12 4 4L19 6"/><rect x="3" y="3" width="18" height="18" rx="4"/>','<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>'];
nav.innerHTML=sections.map((el,i)=>`<a href="#${el.id}" aria-current="${i===0}"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[i]}</svg>${['Cotizar','Resultado','Buscar'][i]}</a>`).join('');document.body.append(nav);
nav.querySelectorAll('a').forEach((a,i)=>a.addEventListener('click',e=>{e.preventDefault();if(i===2)sections[i].open=true;sections[i].scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});nav.querySelectorAll('a').forEach(b=>b.setAttribute('aria-current',String(a===b)));}));
const cards=document.querySelectorAll('.page-heading,.seller-panel,.presence-panel,.calculator,.result,.recovery-panel');
const observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting&&!reduced.matches){e.target.animate([{opacity:.65,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'cubic-bezier(.2,.7,.2,1)'});}},{threshold:.12});cards.forEach(el=>observer.observe(el));
const result=document.getElementById('result-data');new MutationObserver(()=>{if(!result.hidden&&!reduced.matches)result.animate([{opacity:.4,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300,easing:'ease-out'});}).observe(result,{attributes:true,attributeFilter:['hidden']});
