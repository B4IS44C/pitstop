(() => {
  const script = document.currentScript;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const base = new URL('.', script.src);
  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.setAttribute('data-pitstop-intro', '');
  Object.assign(overlay.style, {position:'fixed', inset:'0', zIndex:'2147483647', background:'#000', display:'grid', placeItems:'center', pointerEvents:'none', opacity:'1', transition:'opacity 250ms ease'});
  const video = document.createElement('video');
  video.muted = true; video.autoplay = true; video.playsInline = true; video.preload = 'auto';
  video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
  Object.assign(video.style, {width:'min(92vw, 560px)', maxHeight:'90vh', objectFit:'contain'});
  for (const [file,type] of [['pitstop-intro.webm','video/webm'],['pitstop-intro.mp4','video/mp4']]) {
    const source = document.createElement('source'); source.src = new URL(file, base); source.type = type; video.append(source);
  }
  overlay.append(video); document.body.append(overlay);
  let tick, deadline;
  const finish = () => {clearTimeout(deadline);cancelAnimationFrame(tick);video.pause();overlay.remove();};
  // Never delay access to the page if downloading or autoplay fails.
  deadline = setTimeout(finish, 2800);
  video.addEventListener('playing', () => {
    clearTimeout(deadline); deadline = setTimeout(finish, 2100);
    const frame = () => {if(video.currentTime >= 1.75) overlay.style.opacity='0';tick=requestAnimationFrame(frame);}; frame();
  }, {once:true});
  video.addEventListener('ended', finish, {once:true}); video.addEventListener('error', finish, {once:true});
  video.play().catch(finish);
})();
