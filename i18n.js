import { translations } from './translations.js';
const normalize = value => value.replace(/\s+/g, ' ').trim();
const dictionary = new Map();
const originals = new WeakMap();
let language = new URL(location.href).searchParams.get('lang') === 'ru' ? 'ru' : 'en';
let observer;
let started = false;

export function addTranslations(pairs) {
  for (const [en, ru] of pairs) {
    dictionary.set(normalize(en), { en, ru });
    dictionary.set(normalize(ru), { en, ru });
  }
}
addTranslations(translations);

function pairFor(value) {
  const key = normalize(value);
  const pair = dictionary.get(key);
  if (pair) return pair;
  const counter = key.match(/^You're one of ([\d,]+) who made it to the end!$/);
  if (counter) return { en:value, ru:`Вы дочитали до конца! Всего читателей: ${Number(counter[1].replaceAll(',', '')).toLocaleString('ru-RU')}.` };
  const suffix = '. Drag to move; use arrow keys, or Escape to reset.';
  if (key.endsWith(suffix)) {
    const icon = dictionary.get(key.slice(0, -suffix.length));
    if (icon) return { en:value, ru:`${icon.ru}. Перетаскивайте мышью или перемещайте стрелками. Escape — сброс позиции.` };
  }
  return null;
}

function translate(node, field, read, write) {
  const current = read();
  let fields = originals.get(node);
  if (!fields) originals.set(node, fields = new Map());
  let record = fields.get(field);
  if (!record || current !== record.last) {
    const pair = pairFor(current);
    if (!pair) return;
    record = { en:normalize(current) === normalize(pair.en) ? current : pair.en, ru:pair.ru, last:current };
    fields.set(field, record);
  }
  const next = language === 'ru' && field === 'text'
    ? record.en.match(/^\s*/)[0] + record.ru + record.en.match(/\s*$/)[0]
    : record[language];
  if (current !== next) write(next);
  record.last = next;
}

export function translatePage() {
  observer?.disconnect();
  document.documentElement.lang = language;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.textContent.trim() || node.parentElement.closest('script,style,svg,canvas,.language-toggle')) continue;
    translate(node, 'text', () => node.textContent, value => { node.textContent = value; });
  }
  for (const element of document.querySelectorAll('[aria-label],[alt],[title],[placeholder]')) {
    if (element.closest('.language-toggle')) continue;
    for (const attr of ['aria-label','alt','title','placeholder']) {
      if (element.hasAttribute(attr)) translate(element, attr, () => element.getAttribute(attr), value => element.setAttribute(attr, value));
    }
  }
  const title = document.querySelector('title');
  if (title) translate(title, 'text', () => title.textContent, value => { title.textContent = value; });
  const description = document.querySelector('meta[name="description"]');
  if (description) translate(description, 'content', () => description.content, value => { description.content = value; });
  document.querySelectorAll('[lang]').forEach(element => { if (element !== document.documentElement) element.lang = language; });
  for (const link of document.querySelectorAll('a[href]')) {
    const url = new URL(link.getAttribute('href'), location.href);
    if (url.origin !== location.origin || !['/','/t-bank/','/yandex-lavka/'].includes(url.pathname)) continue;
    if (language === 'ru') url.searchParams.set('lang', 'ru'); else url.searchParams.delete('lang');
    link.setAttribute('href', url.pathname + url.search + url.hash);
  }
  for (const link of document.querySelectorAll('a[data-link="cv"]')) {
    link.href = `/assets/cv/Kolysh-Varvara-Resume-${language === 'ru' ? 'ru' : 'eng'}.pdf`;
    link.download = language === 'ru' ? 'Колыш Варвара Резюме_ru.pdf' : 'Kolysh Varvara Resume_eng.pdf';
  }
  for (const button of document.querySelectorAll('.language-toggle')) {
    button.textContent = language === 'ru' ? 'Eng' : 'Ru';
    button.setAttribute('aria-label', language === 'ru' ? 'Switch to English' : 'Переключить на русский');
    button.title = language === 'ru' ? 'Switch to English' : 'Переключить на русский';
  }
  observer?.observe(document.body, { subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['aria-label','alt','title','placeholder'] });
}

export function setupLanguage() {
  if (started) return;
  started = true;
  document.querySelectorAll('.language-toggle').forEach(button => button.addEventListener('click', () => {
    language = language === 'en' ? 'ru' : 'en';
    const url = new URL(location.href);
    if (language === 'ru') url.searchParams.set('lang','ru'); else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
    translatePage();
    window.dispatchEvent(new Event('languagechange'));
  }));
  window.addEventListener('popstate', () => {
    language = new URL(location.href).searchParams.get('lang') === 'ru' ? 'ru' : 'en';
    translatePage();
    window.dispatchEvent(new Event('languagechange'));
  });
  observer = new MutationObserver(records => {
    if (records.some(record => record.type !== 'childList' || [...record.addedNodes].some(node => node.nodeType === 3 || node.textContent.trim() || (node.nodeType === 1 && node.matches('img,a,button,input'))))) translatePage();
  });
  translatePage();
}
