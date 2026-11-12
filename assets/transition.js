/* Page transition between the turntable (index) and the work pages: the work's obi strip (colour from
   assets/obi-colors.json) sweeps across the screen carrying its track number + title, the page changes underneath,
   and the strip carries on off-screen. Forward = from the left (the obi side of the case); rewind = from the right. */
(()=>{
  /* three modes to compare (Ryan 2026-11-12): A = obi band sweep, B = plain colour fade, C = native cross-fade (View Transitions).
     Picked with the small A/B/C switch at the bottom right; stored per browser. */
  const KEY='rh-tx',MK='rh-tx-mode',MS_IN=340,MS_OUT=460,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let MODE='A';   // Ryan picked A (obi band sweep), 2026-11-12
  /* inside the site shell (index.html): page changes go to the shell, which builds the next page out of sight first */
  let SH=null;try{if(parent!==window&&parent.RH_SHELL)SH=parent.RH_SHELL;}catch(e){}
  const file=u=>u.pathname.split('/').pop()||'index.html';
  let C={};fetch('assets/obi-colors.json').then(r=>r.json()).then(j=>C=j).catch(()=>{});
  const css=`.tx{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;justify-content:space-between;padding:clamp(20px,4vw,48px);
    background:var(--c);color:var(--k);font-family:Inter,system-ui,sans-serif;pointer-events:none;will-change:clip-path}
  .tx.flat::after{display:none}
  .tx::after{content:"";position:absolute;top:0;bottom:0;left:0;width:clamp(6px,1vw,14px);background:rgba(255,255,255,.18)}
  .tx b{font:700 clamp(64px,14vw,220px)/.9 Inter,system-ui,sans-serif;letter-spacing:-.04em}
  .tx b,.tx span{display:block}
  .tx span{margin-top:.3em;font:600 clamp(18px,2.6vw,40px)/1.1 Inter,system-ui,sans-serif;text-transform:uppercase;letter-spacing:.02em;max-width:20ch}
  .tx small{font:500 13px Inter,system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:.75}
  .tx>*{transition:opacity .3s ease .1s,transform .5s cubic-bezier(.2,.7,.2,1) .05s}
  .tx.pre>*{opacity:0;transform:translateX(var(--dx))}
  .tx.done>*{opacity:0;transition:opacity .16s ease}`;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  const ink=h=>{const n=parseInt(h.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;return (0.2126*r+0.7152*g+0.0722*b)/255>.5?'#111':'#fff';};
  const clip={L0:'inset(0 100% 0 0)',R0:'inset(0 0 0 100%)',full:'inset(0 0 0 0)'};
  function panel(o){const d=document.createElement('div');d.className='tx';d.setAttribute('aria-hidden','true');
    d.style.setProperty('--c',o.c);d.style.setProperty('--k',ink(o.c));d.style.setProperty('--dx',o.dir==='back'?'40px':'-40px');
    const top=document.createElement('small');top.textContent=o.label||(o.dir==='back'?'◀◀ Rewind':'▶ Now playing');
    const n=document.createElement('b');n.textContent=o.n||'';const t=document.createElement('span');t.textContent=o.title||'';
    const mid=document.createElement('div');mid.append(n,t);d.append(top,mid);document.body.appendChild(d);return d;}
  const anim=(el,from,to,ms,ease)=>el.animate([{clipPath:from},{clipPath:to}],{duration:ms,easing:ease,fill:'forwards'}).finished;
  function arrive(o){const d=panel({...o,n:'',title:'',label:' '});d.style.clipPath=clip.full;const R=document.documentElement;R.classList.remove('tx-hold');R.style.background='';
    if(o.mode==='B'){d.classList.add('flat');requestAnimationFrame(()=>d.animate([{opacity:1},{opacity:0}],{duration:320,easing:'ease-out',fill:'forwards'}).finished.then(()=>d.remove()));return;}
    requestAnimationFrame(()=>anim(d,clip.full,o.dir==='back'?clip.L0:clip.R0,MS_OUT,'cubic-bezier(.3,0,.1,1)').then(()=>d.remove()));}
  const sameNav=(u,done)=>{location.hash=u.hash;scrollTo(0,0);SH&&SH.sync();
    const im=document.querySelector('#main img');return (im&&im.decode?Promise.race([im.decode().catch(()=>{}),new Promise(r=>setTimeout(r,450))]):Promise.resolve()).then(done);};
  window.TX={
    go(url,o){o=o||{};o.c=o.c||(C[o.slug]&&C[o.slug].bg)||'#111';
      const u=new URL(url,location.href),same=u.pathname===location.pathname;
      if(SH&&!same){SH.go(file(u)+u.hash,o);return;}
      if(reduce){if(same)location.hash=u.hash;else location.href=url;return;}
      o.mode=MODE;
      if(MODE==='C'){   // let the browser cross-fade the two pages (@view-transition in each page's head); same page: startViewTransition
        if(!same){location.href=url;return;}
        if(document.startViewTransition&&typeof window.render==='function')document.startViewTransition(()=>{history.pushState(null,'',u.hash);window.render();scrollTo(0,0);SH&&SH.sync();});
        else{location.hash=u.hash;SH&&SH.sync();}return;}
      if(MODE==='B'){const d=panel({...o,n:'',title:'',label:' '});d.classList.add('flat');
        d.animate([{opacity:0},{opacity:1}],{duration:200,easing:'ease-in',fill:'forwards'}).finished.then(()=>{
          if(same){sameNav(u,()=>{d.remove();arrive(o);});return;}
          try{sessionStorage.setItem(KEY,JSON.stringify({...o,t:Date.now()}));}catch(e){}location.href=url;});return;}
      const d=panel(o);d.classList.add('pre');d.style.clipPath=o.dir==='back'?clip.R0:clip.L0;
      requestAnimationFrame(()=>d.classList.remove('pre'));
      anim(d,o.dir==='back'?clip.R0:clip.L0,clip.full,MS_IN,'cubic-bezier(.7,0,.9,.6)').then(()=>{
        if(same){sameNav(u,()=>{d.remove();arrive(o);});return;}
        try{sessionStorage.setItem(KEY,JSON.stringify({...o,t:Date.now()}));}catch(e){}
        d.classList.add('done');setTimeout(()=>{location.href=url;},170);});
    }};
  let o=null;try{o=JSON.parse(sessionStorage.getItem(KEY)||'null');sessionStorage.removeItem(KEY);}catch(e){}
  if(!(o&&Date.now()-o.t<5000&&!reduce)){document.documentElement.classList.remove('tx-hold');document.documentElement.style.background='';}
  if(o&&Date.now()-o.t<5000&&!reduce){if(document.body)arrive(o);else addEventListener('DOMContentLoaded',()=>arrive(o));}
  /* fixed header (work / play / about): compact after the first scroll; --hdr feeds sticky offsets below it */
  {const hd=document.querySelector('header.top'),R=document.documentElement;if(hd&&!document.getElementById('tracks')){
    const onS=()=>R.classList.toggle('scrolled',scrollY>24);addEventListener('scroll',onS,{passive:true});onS();
    new ResizeObserver(()=>R.style.setProperty('--hdr',hd.offsetHeight+'px')).observe(hd);}}
  /* header nav: index / play / about get the same sweep. Colours: index #2a2ecd (site blue), play #111 (ink), about #05062a (top of the about gradient) */
  const PAGES={'index.html':{n:'Index',c:'#2a2ecd',dir:'back'},'play.html':{n:'Play',c:'#111111',dir:'fwd'},'about.html':{n:'About',c:'#05062a',dir:'fwd'}};
  document.addEventListener('click',e=>{const a=e.target.closest('header a[href]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
    const u=new URL(a.getAttribute('href'),location.href),f=u.pathname.split('/').pop()||'index.html',pg=PAGES[f];
    if(!pg||(u.pathname===location.pathname&&!u.hash)||a.getAttribute('href')==='#')return;
    e.preventDefault();TX.go(a.getAttribute('href'),{n:pg.n,title:'',label:'Ryan Hsieh',c:pg.c,dir:pg.dir});});
  addEventListener('load',()=>{['index.html','work.html','play.html','about.html','assets/works-data.js','assets/works-content.js'].forEach(h=>{
    if(location.pathname.endsWith('/'+h))return;const l=document.createElement('link');l.rel='prefetch';l.href=h;document.head.appendChild(l);});});
  /* in the shell: any other link to one of the site's pages also goes through the shell; hash changes report back */
  if(SH){document.addEventListener('click',e=>{if(e.defaultPrevented)return;const a=e.target.closest('a[href]');if(!a||a.target||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
      const u=new URL(a.getAttribute('href'),location.href);if(u.origin!==location.origin||!/\.html$/.test(u.pathname)||u.pathname===location.pathname)return;
      e.preventDefault();SH.go(file(u)+u.hash,{dir:'fwd'});});
    addEventListener('hashchange',()=>SH.sync());}
  addEventListener('pageshow',e=>{if(e.persisted)document.querySelectorAll('.tx').forEach(x=>x.remove());});
})();
