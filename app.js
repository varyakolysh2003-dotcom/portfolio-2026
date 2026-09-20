import { setupSoundEffects } from './sound-effects.js';
import { setupIconInteractions } from './icon-interactions.js';

// The gallery starts beside the profile on desktop, below it on mobile.
// Promote only images intersecting the initial viewport to eager loading.
for (const image of document.querySelectorAll('.gallery img[loading="lazy"]')) {
  if (image.getBoundingClientRect().top < innerHeight) image.loading = 'eager';
}

setupIconInteractions(document.querySelector('.icon-study'));

const links = {
  cv: '/assets/cv/Kolysh-Varvara-Resume-eng.pdf',
  tbank: '/t-bank/', lavka: '/yandex-lavka/',
  telegram: 'https://t.me/BarbaraKolysh',
  twitter: 'https://x.com/BarbaraKolysh',
  linkedin: 'https://www.linkedin.com/in/varvara-kolysh-5401492a3/'
};
for (const element of document.querySelectorAll('[data-link]')) {
  const url = links[element.dataset.link];
  if (!url) continue;
  const anchor = document.createElement('a');
  for (const { name, value } of element.attributes) anchor.setAttribute(name, value);
  anchor.href = url;
  if (element.dataset.link === 'cv') {
    anchor.download = 'Kolysh Varvara Resume_eng.pdf';
  } else if (url.startsWith('https://')) {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  anchor.replaceChildren(...element.childNodes);
  element.replaceWith(anchor);
}
const sound = document.querySelector('.sound');
setupSoundEffects(sound);
// Touch feedback remains visible after a tap and clears on the next touch
// or scrolling. Keep native link navigation intact when URLs are supplied.
let tappedComponent = null;
function clearTapFeedback() {
  tappedComponent?.classList.remove('is-tapped');
  tappedComponent = null;
}
document.addEventListener('pointerdown', (event) => {
  clearTapFeedback();
  if (event.pointerType === 'mouse') return;
  tappedComponent = event.target.closest('.text-link, .social');
  tappedComponent?.classList.add('is-tapped');
});
document.addEventListener('pointercancel', clearTapFeedback);
window.addEventListener('scroll', clearTapFeedback, { passive: true });

const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const videos = [...document.querySelectorAll('video')];
function updateMotion() {
  for (const video of videos) {
    if (motion.matches) { video.pause(); video.removeAttribute('autoplay'); }
    else video.play().catch(() => {});
  }
}
motion.addEventListener('change', updateMotion);
updateMotion();

const mobileLayout = window.matchMedia('(max-width:963px)');
function updatePosters() {
  for (const video of videos) {
    const name = video.getAttribute('src').split('/').pop().replace(/-original\.mp4$/, '');
    const asset = `/assets/${name}${mobileLayout.matches ? '-mobile' : ''}`;
    video.poster = `${asset}.png`;
  }
  updateMotion();
}
mobileLayout.addEventListener('change', updatePosters);
updatePosters();
