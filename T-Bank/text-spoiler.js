// Line measurement adapter for spoilerjs ParticleManager; password controls reveal.
import { ParticleManager } from './text-particles.js';
export function setupTextSpoiler(element) {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let layers=[],frame=0,visible=false,opened=false,last=0;
  function stop(){cancelAnimationFrame(frame);frame=0;}
  function draw(time=0){
    frame=0;
    if(opened || !visible || document.hidden)return;
    if(time-last>=1000/30 || motion.matches){
      last=time;
      for(const {canvas,ctx,manager,width,height} of layers){ctx.clearRect(0,0,width,height);manager.update();manager.draw(ctx);}
    }
    if(!motion.matches)frame=requestAnimationFrame(draw);
  }
  function start(){stop();draw(performance.now());}
  function measure(){
    if(opened)return;
    stop();layers.forEach(({canvas})=>canvas.remove());layers=[];
    const origin=element.getBoundingClientRect();
    if(!origin.width || !origin.height)return;
    for(const text of element.querySelectorAll('h2,p')){
      const walker=document.createTreeWalker(text,NodeFilter.SHOW_TEXT);
      const color=getComputedStyle(text).color;
      while(walker.nextNode()){
        const range=document.createRange();range.selectNodeContents(walker.currentNode);
        for(const box of range.getClientRects()){
          if(!box.width || !box.height)continue;
          const canvas=document.createElement('canvas');canvas.className='text-particles';canvas.setAttribute('aria-hidden','true');
          const dpr=devicePixelRatio||1;canvas.width=Math.ceil(box.width*dpr);canvas.height=Math.ceil(box.height*dpr);
          Object.assign(canvas.style,{left:`${box.left-origin.left}px`,top:`${box.top-origin.top}px`,width:`${box.width}px`,height:`${box.height}px`});
          element.append(canvas);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
          const manager=new ParticleManager({scale:1,minVelocity:.01,maxVelocity:.05,particleLifetime:120,density:8,textColor:color},box.width,box.height);
          layers.push({canvas,ctx,manager,width:box.width,height:box.height});
        }
      }
    }
    start();
  }
  const resize=new ResizeObserver(measure);resize.observe(element);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();});intersection.observe(element);
  const visibility=()=>start();document.addEventListener('visibilitychange',visibility);
  motion.addEventListener('change',start);
  document.fonts.ready.then(measure);
  return ()=>{
    opened=true;stop();resize.disconnect();intersection.disconnect();
    document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',start);
    layers.forEach(({canvas})=>canvas.remove());layers=[];
  };
}
