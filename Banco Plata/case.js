import { addTranslations, setupLanguage } from '/i18n.js';
import { translations } from './content.js';
import { setupVideoLoading } from '/page-reveal.js';

addTranslations(translations);
const tabs = [...document.querySelectorAll('.plata-tabs [role="tab"]')];
function selectTab(tab) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
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
    selectTab(tabs[index]);
    tabs[index].focus();
  });
}

// Scale each composed design as one unit to retain its original crops and proportions.
const resize = new ResizeObserver(entries => {
  for (const { target, contentRect } of entries) target.style.setProperty('--art-scale', contentRect.width / 600);
});
for (const media of document.querySelectorAll('.plata-media')) {
  media.style.setProperty('--art-scale', media.clientWidth / 600);
  resize.observe(media);
}
setupLanguage();
setupVideoLoading([...document.querySelectorAll('.plata-atm-video')]);
