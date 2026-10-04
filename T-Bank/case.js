import { decryptCase } from './decrypt.js';
import { setupLanguage, translatePage, addTranslations } from '../i18n.js';
import { setupSoundEffects } from '../sound-effects.js';
import { setupPageReveal } from '../page-reveal.js';
import { setupLazyMedia } from './lazy-media.js';
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
const mediaLoaders = new Map();
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

function unlock() {
  caseCopy=unlockedCase.copy;
  addTranslations(caseCopy.translations || []);
  document.querySelectorAll('#profile-cases .bank-article').forEach((article,index)=>{
    article.querySelectorAll('.bank-caption').forEach(caption=>{
      const block=caseCopy.profile.blocks?.[index]?.[Number(caption.dataset.block || 0)];
      caption.querySelector('p').textContent=block?.body || caseCopy.profile.captions[index] || '';
      caption.querySelector('h2').textContent=block?.title || 'Profile settings';
    });
  });
  reveal();
  updateIntro('profile');
  authorized=true;
  access.hidden=true;tablist.hidden=false;
  document.querySelector('#profile-cases').setAttribute('aria-labelledby','tab-profile');
  translatePage();
  mediaLoaders.set('profile', setupLazyMedia(document.querySelector('#profile-cases'), unlockedCase.mediaUrl));
}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy || !input.value)return;
  busy=true;input.readOnly=true;form.setAttribute('aria-busy','true');
  try {
    const pending=decryptCase(input.value);input.value='';
    unlockedCase=await pending;
    unlock();input.value='';input.blur();
  } catch {unlockedCase?.dispose();unlockedCase=undefined;input.value='';input.blur();}
  finally {busy=false;input.readOnly=false;form.removeAttribute('aria-busy');}
});

function selectTab(tab) {
  if(!authorized)return;
  const name=tab.dataset.case;
  if(name==='main' && !document.querySelector('#main-cases').children.length) {
    const content=document.createElement('template');
    content.innerHTML=unlockedCase.main;
    for(const element of content.content.querySelectorAll('[src],[srcset],[poster]')) {
      for(const attribute of ['src','srcset','poster']) {
        const value=element.getAttribute(attribute);
        if (!value) continue;
        element.dataset[attribute]=value;
        element.removeAttribute(attribute);
      }
    }
    for(const video of content.content.querySelectorAll('video')) {
      video.autoplay=false;
      video.preload='none';
    }
    document.querySelector('#main-cases').replaceChildren(content.content);
    mediaLoaders.set('main', setupLazyMedia(document.querySelector('#main-cases'), unlockedCase.mediaUrl));
  }
  status.hidden=true;
  for(const item of tabs){const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;document.querySelector(`#${item.dataset.case}-cases`).hidden=!selected;}
  updateIntro(name);
  translatePage();
  window.scrollTo({top:0,behavior:'instant'});
  for (const loader of mediaLoaders.values()) loader.refresh();
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

window.addEventListener('pagehide',()=>{
  for (const loader of mediaLoaders.values()) loader.dispose();
  unlockedCase?.dispose();
});
