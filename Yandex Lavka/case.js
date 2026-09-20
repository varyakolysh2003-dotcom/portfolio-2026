import { setupSoundEffects } from '/sound-effects.js';
import { sections } from './content.js';
import { setupReaderInteraction } from './reader-interaction.js';

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
  document.querySelector('#case-heading').textContent = tab.textContent;
  document.querySelector('#case-description').textContent = sections[tab.dataset.tab];
  panel.style.setProperty('--description-height', `${{ context:177, process:255, result:138 }[tab.dataset.tab]}px`);
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
