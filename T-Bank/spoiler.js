import { setupTextSpoiler } from './text-spoiler.js';
export function setupSpoilers(openPassword) {
  const textEffects=new Map();
  const spoilers=[...document.querySelectorAll('.spoiler')];
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-visible',entry.isIntersecting)));
  for(const spoiler of spoilers) {
    const isText=spoiler.classList.contains('text-spoiler');
    if(isText) {
      for(const child of spoiler.children)child.setAttribute('aria-hidden','true');
      const trigger=document.createElement('button');trigger.type='button';trigger.className='spoiler-trigger';trigger.setAttribute('aria-label','Enter password to reveal this text');spoiler.append(trigger);
      trigger.addEventListener('click',openPassword);
      textEffects.set(spoiler,setupTextSpoiler(spoiler));
      continue;
    }
    const blur=document.createElement('div');blur.className='blur-block';blur.setAttribute('aria-hidden','true');
    const dots=document.createElement('div');dots.className='dots';dots.setAttribute('aria-hidden','true');
    const fragment=document.createDocumentFragment();
    for(let i=0;i<(isText?40:150);i++) {
      const dot=document.createElement('div');dot.className='dot';
      const size=1+Math.random()*3;
      Object.assign(dot.style,{top:`${Math.random()*100}%`,left:`${Math.random()*100}%`,width:`${size}px`,height:`${size}px`,animationDelay:`${-Math.random()*4}s`,animationDuration:`${1.5+Math.random()*2.5}s`});
      fragment.append(dot);
    }
    dots.append(fragment);spoiler.append(blur,dots);observer.observe(spoiler);
    spoiler.querySelector('.spoiler-trigger').addEventListener('click',openPassword);
  }
  return async function reveal() {
    await Promise.all(spoilers.map(async spoiler=>{
      if(spoiler.classList.contains('spoiler--open'))return;
      if(spoiler.classList.contains('text-spoiler'))return;
      let picture=spoiler.querySelector('picture');
      if(!picture) {
        picture=document.createElement('picture');
        const source=document.createElement('source');source.media='(max-width:963px)';source.srcset=`/api/tbank/media/${spoiler.dataset.mobile}`;
        source.width=311;source.height=Number(spoiler.style.getPropertyValue('--mobile-height'));
        const img=document.createElement('img');img.alt='T-Bank profile interface';img.src=`/api/tbank/media/${spoiler.dataset.desktop}`;
        img.width=600;img.height=Number(spoiler.style.getPropertyValue('--media-height'));
        img.decoding='async';
        img.loading=spoiler.getBoundingClientRect().top<innerHeight?'eager':'lazy';
        if(img.loading==='eager')img.fetchPriority='high';
        picture.append(source,img);spoiler.prepend(picture);
      }
      // Waiting for an offscreen lazy image would block password submission
      // until the visitor scrolls to every image in the case.
      const image=picture.querySelector('img');
      if(image.loading!=='lazy')await image.decode();
      spoiler.querySelector('.spoiler-preview')?.remove();
      spoiler.classList.add('spoiler--open');
      spoiler.querySelector('.spoiler-trigger')?.remove();observer.unobserve(spoiler);
    }));
    for(const spoiler of spoilers.filter(item=>item.classList.contains('text-spoiler'))) {
      textEffects.get(spoiler)?.();
      for(const child of spoiler.querySelectorAll('h2,p'))child.removeAttribute('aria-hidden');
      spoiler.classList.add('spoiler--open');
      spoiler.querySelector('.spoiler-trigger')?.remove();observer.unobserve(spoiler);
    }
  };
}
