const selector=document.getElementById('recovery-type');
selector.addEventListener('change',()=>{
 const sale=selector.value==='sale';
 document.getElementById('recovery-quote').hidden=sale;
 document.getElementById('recovery-sale').hidden=!sale;
});
