import { setupLanguage, addTranslations, translatePage } from '/i18n.js';
import { setupSoundEffects } from '/sound-effects.js';
import { setupPageReveal } from '/page-reveal.js';
import { sections, copy } from './content.js';
import { setupReaderInteraction } from './reader-interaction.js';

addTranslations(Object.values(copy).map(({ en, ru }) => [en, ru]));
setupSoundEffects(document.querySelector('.sound'));

const tabs = [...document.querySelectorAll('[role=tab]')];
const panel = document.querySelector('#case-panel');
function selectTab(tab) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
  }
  panel.setAttribute('aria-labelledby', tab.id);
  document.querySelector('#case-heading').textContent = tab.dataset.tab === 'process' ? copy.processHeading.en : tab.dataset.tab === 'result' ? copy.resultHeading.en : tab.textContent;
  document.querySelector('#case-description').textContent = sections[tab.dataset.tab];
  document.querySelector('.case-task').hidden = tab.dataset.tab !== 'context';
  document.querySelector('.case-results').hidden = tab.dataset.tab !== 'result';
  document.querySelector('.case-process-details').hidden = tab.dataset.tab !== 'process';
  document.querySelector('.case-result-details').hidden = tab.dataset.tab !== 'result';
  panel.dataset.activeTab = tab.dataset.tab;
  translatePage();
}
for (const tab of tabs) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let index = tabs.indexOf(tab);
    if (event.key === 'ArrowRight') index = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') index = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = tabs.length - 1;
    else return;
    event.preventDefault();
    tabs[index].focus();
    selectTab(tabs[index]);
  });
}

const cart = document.querySelector('.cart-button');
setupReaderInteraction(cart);
let bounce;
function thankReader() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  bounce?.cancel();
  bounce = cart.animate([
    { transform: 'scale(1)' }, { transform: 'scale(.88)', offset: .2 },
    { transform: 'scale(1.1)', offset: .5 }, { transform: 'scale(.97)', offset: .75 },
    { transform: 'scale(1)' },
  ], { duration: 550, easing: 'ease-out' });
}
cart.addEventListener('click', thankReader);
cart.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') thankReader(); });
setupPageReveal();

selectTab(tabs[0]);
setupLanguage();
