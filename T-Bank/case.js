import { decryptCase } from './decrypt.js';
import { setupLanguage, translatePage, addTranslations } from '../i18n.js';
import { setupSoundEffects } from '../sound-effects.js';
import { setupPageReveal, setupVideoLoading } from '../page-reveal.js';
import { setupSpoilers } from './spoiler.js';

setupSoundEffects(document.querySelector('.sound'));
const form=document.querySelector('#password-form');
const input=document.querySelector('#case-password');
input.value='';
const access=document.querySelector('.bank-access');
const tablist=document.querySelector('.bank-tabs');
const tabs=[...tablist.querySelectorAll('[data-case]')];
const status=document.querySelector('#page-status');
let authorized=false;
let busy=false;
let loadingMain;
let caseCopy;
let unlockedCase;
function updateIntro(name) {
  const intro=document.querySelector('.bank-intro');
  intro.querySelectorAll('section').forEach(section=>section.remove());
  for(const key of ['context','result']) {
    const section=document.createElement('section');section.className='bank-context';
    const heading=document.createElement('h2');heading.textContent=key==='context'?'Context':'Result';
    const paragraph=document.createElement('p');paragraph.textContent=caseCopy[name][key];
    section.append(heading,paragraph);intro.append(section);
  }
}
function openPassword() {
  input.focus();
}
const reveal=setupSpoilers(openPassword);
form.addEventListener('click',openPassword);

async function unlock() {
  caseCopy=unlockedCase.copy;
  addTranslations(caseCopy.translations || []);
  document.querySelectorAll('#profile-cases .bank-article').forEach((article,index)=>{
    article.querySelectorAll('.bank-caption p').forEach(p=>{p.textContent=caseCopy.profile.captions[index];});
    article.querySelectorAll('.bank-caption h2').forEach(h=>{h.textContent='Profile settings';});
  });
  await reveal(unlockedCase.mediaUrl);
  setupPageReveal();
  updateIntro('profile');
  authorized=true;
  access.hidden=true;tablist.hidden=false;
  document.querySelector('#profile-cases').setAttribute('aria-labelledby','tab-profile');
  translatePage();
}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy || !input.value)return;
  busy=true;input.readOnly=true;form.setAttribute('aria-busy','true');
  try {
    const pending=decryptCase(input.value);input.value='';
    unlockedCase=await pending;
    await unlock();input.value='';input.blur();
  } catch {unlockedCase?.dispose();unlockedCase=undefined;input.value='';input.blur();}
  finally {busy=false;input.readOnly=false;form.removeAttribute('aria-busy');}
});

const motion=matchMedia('(prefers-reduced-motion:reduce)');
function updateVideos() {
  for(const video of document.querySelectorAll('video')) {
    if(motion.matches || video.closest('[hidden]'))video.pause();
    else if(video.getAttribute('src'))video.play().catch(()=>{});
  }
}
motion.addEventListener('change',updateVideos);
async function selectTab(tab) {
  if(!authorized)return;
  const name=tab.dataset.case;
  if(name==='main' && !document.querySelector('#main-cases').children.length) {
    if(!loadingMain)loadingMain=(async()=>{
      const content=document.createElement('template');
      content.innerHTML=unlockedCase.main;
      for(const element of content.content.querySelectorAll('[src],[srcset],[poster]')) {
        for(const attribute of ['src','srcset','poster']) {
          const value=element.getAttribute(attribute);
          if(value?.startsWith('tbank-media:'))element.setAttribute(attribute,unlockedCase.mediaUrl(value.slice('tbank-media:'.length)));
          else if(value?.startsWith('../assets/'))element.setAttribute(attribute,new URL(value,import.meta.url).href);
        }
      }
      const images=[...content.content.querySelectorAll('img')];
      for(const [index,image] of images.entries()) {
        image.decoding='async';
        image.loading=index===0?'eager':'lazy';
        if(index===0)image.fetchPriority='high';
      }
      for(const video of content.content.querySelectorAll('video')) {
        video.dataset.src=video.getAttribute('src');video.removeAttribute('src');video.preload='none';
      }
      document.querySelector('#main-cases').replaceChildren(content.content);
    })();
    try {await loadingMain;}catch(problem){status.hidden=false;status.textContent=problem.message;return;}finally{loadingMain=null;}
  }
  status.hidden=true;
  for(const item of tabs){const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;document.querySelector(`#${item.dataset.case}-cases`).hidden=!selected;}
  updateIntro(name);
  translatePage();
  updateVideos();
  window.scrollTo({top:0,behavior:'instant'});
  setupPageReveal();
  setupVideoLoading(document.querySelectorAll('#main-cases video:not([data-loading-ready])'));
}
for(const tab of tabs) {
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',event=>{
    let index=tabs.indexOf(tab);
    if(event.key==='ArrowRight'||event.key==='ArrowLeft')index=1-index;
    else if(event.key==='Home')index=0;
    else if(event.key==='End')index=1;
    else return;
    event.preventDefault();tabs[index].focus();selectTab(tabs[index]);
  });
}
// A restored history entry must not bring back previously revealed content.
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
setupPageReveal();

setupLanguage();

window.addEventListener('pagehide',()=>unlockedCase?.dispose());
