import { setupPageReveal } from '../page-reveal.js';

// Only a visible container in the active tab may request encrypted media.
export function setupLazyMedia(root, mediaUrl) {
  const motion = matchMedia('(prefers-reduced-motion:reduce)');
  const mobile = matchMedia('(max-width:963px)');
  const containers = [...root.querySelectorAll('.bank-media')];
  const pending = new Map();
  const rerun = new Set();
  let disposed = false;
  const resolve = value => value.startsWith('tbank-media:')
    ? mediaUrl(value.slice('tbank-media:'.length))
    : Promise.resolve(new URL(value, import.meta.url).href);
  function visible(el) {
    const rect = el.getBoundingClientRect();
    return !el.closest('[hidden]') && rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight;
  }
  async function load(container) {
    if (disposed || !visible(container)) return;
    if (pending.has(container)) { rerun.add(container); return; }
    const request = (async () => {
      container.setAttribute('aria-busy', 'true');
      try {
        for (const img of container.querySelectorAll('img:not(.video-poster)')) {
          const source = [...(img.closest('picture')?.querySelectorAll('source') || [])]
            .find(source => !source.media || matchMedia(source.media).matches);
          const value = source?.dataset.srcset || img.dataset.src;
          if (!value || img.dataset.loaded === value) continue;
          const url = await resolve(value);
          if (disposed) return;
          img.loading = 'eager'; // IntersectionObserver already selected this visible image.
          img.src = url;
          await img.decode();
          if (disposed) return;
          img.dataset.loaded = value;
          setupPageReveal(container);
        }
        for (const video of container.querySelectorAll('video')) {
          if (video.dataset.poster && !video.poster) {
            const posterUrl = await resolve(video.dataset.poster);
            if (disposed) return;
            video.poster = posterUrl;
          }
          if (motion.matches || !visible(container)) { video.pause(); continue; }
          if (!video.getAttribute('src') && video.dataset.src) {
            const url = await resolve(video.dataset.src);
            if (disposed) return;
            if (motion.matches || !visible(container)) continue;
            video.src = url;
            video.preload = 'metadata';
          }
          video.play().catch(() => {});
        }
        if (disposed) return;
        container.classList.add('spoiler--open');
        container.querySelector('.spoiler-preview')?.remove();
        container.querySelector('.spoiler-trigger')?.remove();
        container.removeAttribute('data-media-error');
      } catch {
        // Keep this asset's placeholder; an error must never relock the case.
        if (!disposed) container.dataset.mediaError = 'true';
      } finally {
        container.removeAttribute('aria-busy');
      }
    })();
    pending.set(container, request);
    await request;
    pending.delete(container);
    if (rerun.delete(container)) void load(container);
  }
  function refresh() {
    for (const container of containers) {
      for (const video of container.querySelectorAll('video')) {
        if (motion.matches || !visible(container)) video.pause();
      }
      if (visible(container)) void load(container);
    }
  }
  const observer = new IntersectionObserver(refresh);
  containers.forEach(container => observer.observe(container));
  motion.addEventListener('change', refresh);
  mobile.addEventListener('change', refresh);
  return {
    refresh,
    dispose() {
      disposed = true;
      observer.disconnect();
      motion.removeEventListener('change', refresh);
      mobile.removeEventListener('change', refresh);
      containers.forEach(container => container.querySelectorAll('video').forEach(video => video.pause()));
    },
  };
}
