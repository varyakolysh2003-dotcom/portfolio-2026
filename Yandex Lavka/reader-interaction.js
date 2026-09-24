import '/assets/vendor/lottie-light.min.js';
import { translatePage } from '/i18n.js';

export function setupReaderInteraction(cart) {
  const page = document.documentElement;
  const pointer = matchMedia('(any-hover:hover) and (any-pointer:fine)');
  let previous = -1;
  try { previous = Number(sessionStorage.getItem('lavka-last-cursor') ?? -1); } catch { /* Optional preference. */ }
  const choices = [1,2,3,4,5].filter(value => value !== previous);
  const variant = choices[Math.floor(Math.random() * choices.length)];
  try { sessionStorage.setItem('lavka-last-cursor', String(variant)); } catch { /* Optional preference. */ }
  page.style.setProperty('--lavka-cursor', `url("/assets/yandex-lavka/cursors/item-${variant}.png") 16 16, auto`);
  page.classList.add('lavka-cursor');

  const footer = cart.closest('.case-end');
  const container = document.createElement('div');
  container.className = 'cart-confetti';
  container.setAttribute('aria-hidden', 'true');
  footer.append(container);
  const animation = window.lottie.loadAnimation({
    container,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: '/assets/yandex-lavka/confetti.json',
  });
  let celebrated = false;
  let ready = false;
  let queued = false;
  animation.addEventListener('DOMLoaded', () => {
    ready = true;
    if (queued) playConfetti();
  });
  animation.addEventListener('complete', () => {
    container.classList.remove('is-playing');
  });
  function celebrate() {
    if (celebrated) return;
    celebrated = true;
    page.classList.remove('lavka-cursor');
    const message = 'Well done, you made it to the end!';
    footer.querySelectorAll(':scope > p').forEach(label => { label.textContent = message; });
    footer.querySelector('#cart-status').textContent = message;
    translatePage();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!ready) { queued = true; return; }
    playConfetti();
  }
  function playConfetti() {
    queued = false;
    container.classList.add('is-playing');
    animation.goToAndPlay(0, true);
  }
  cart.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && pointer.matches) celebrate();
  });
  cart.addEventListener('click', celebrate);
}
