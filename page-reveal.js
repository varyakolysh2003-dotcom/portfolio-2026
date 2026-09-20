const motion = matchMedia('(prefers-reduced-motion: reduce)');
const seen = new WeakSet();

export function setupPageReveal(root = document) {
  for (const image of root.querySelectorAll('img:not(.video-poster):not([data-immediate])')) {
    if (seen.has(image)) continue;
    seen.add(image);
    const ready = () => {
      image.classList.remove('media-pending');
      if (!motion.matches && image.naturalWidth) {
        image.classList.add('media-entering');
        image.addEventListener('animationend', () => image.classList.remove('media-entering'), { once:true });
      }
    };
    if (image.complete) ready();
    else {
      image.classList.add('media-pending');
      image.addEventListener('load', ready, { once:true });
      image.addEventListener('error', () => image.classList.remove('media-pending'), { once:true });
    }
  }
}

export function setupVideoLoading(videos) {
  if (!videos.length) return;
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) load(entry.target);
  }, { rootMargin:'200px 0px' }) : null;
  function load(video) {
    if (motion.matches || video.closest('[hidden]')) return;
    observer?.unobserve(video);
    if (!video.getAttribute('src') && video.dataset.src) {
      video.src = video.dataset.src;
      video.preload = 'metadata';
    }
    video.play().catch(() => {});
  }
  for (const video of videos) {
    video.dataset.loadingReady='true';
    const poster = document.createElement('img');
    poster.className = `${video.className} video-poster`;
    poster.alt = '';
    poster.setAttribute('aria-hidden', 'true');
    poster.src = video.poster;
    video.parentElement.classList.add('media-host');
    video.after(poster);
    new MutationObserver(() => { poster.src = video.poster; }).observe(video, { attributes:true, attributeFilter:['poster'] });
    const showVideo = () => poster.classList.add('video-poster-ready');
    video.addEventListener('playing', () => {
      if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(showVideo);
      else showVideo();
    }, { once:true });
    if (observer) observer.observe(video); else load(video);
    const rect = video.getBoundingClientRect();
    if (rect.top < innerHeight && rect.bottom > 0) load(video);
  }
  motion.addEventListener('change', () => {
    for (const video of videos) {
      if (motion.matches) video.pause();
      else if (video.getAttribute('src')) load(video);
      else if (observer) observer.observe(video);
      else load(video);
    }
  });
}
