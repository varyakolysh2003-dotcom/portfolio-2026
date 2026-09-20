export function setupIconInteractions(container) {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let topLayer = 1;
  for (const icon of container.querySelectorAll('.study-icon')) {
    let x = 0, y = 0, gesture = null, spring = null;
    const place = () => { icon.style.translate = `${x}px ${y}px`; };
    const constrain = () => {
      x = Math.max(-icon.offsetLeft, Math.min(x, container.clientWidth - icon.offsetLeft - icon.offsetWidth));
      y = Math.max(-icon.offsetTop, Math.min(y, container.clientHeight - icon.offsetTop - icon.offsetHeight));
      place();
    };
    function bounce() {
      spring?.cancel();
      if (!reducedMotion.matches) spring = icon.animate(
        [{ scale: '.92' }, { scale: '1.09', offset: .38 }, { scale: '.98', offset: .68 }, { scale: '1' }],
        { duration: 440, easing: 'ease-out' }
      );
    }
    icon.draggable = false;
    icon.tabIndex = 0;
    icon.setAttribute('role', 'button');
    icon.setAttribute('aria-label', `${icon.alt}. Drag to move; use arrow keys, or Escape to reset.`);
    icon.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || gesture) return;
      spring?.cancel();
      gesture = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x, y };
      icon.setPointerCapture(event.pointerId);
      icon.classList.add('is-dragging');
      icon.style.zIndex = String(++topLayer);
    });
    icon.addEventListener('pointermove', event => {
      if (!gesture || event.pointerId !== gesture.id) return;
      x = gesture.x + event.clientX - gesture.startX;
      y = gesture.y + event.clientY - gesture.startY;
      constrain();
    });
    function release(event) {
      if (!gesture || event.pointerId !== gesture.id) return;
      gesture = null;
      icon.classList.remove('is-dragging');
      if (icon.hasPointerCapture(event.pointerId)) icon.releasePointerCapture(event.pointerId);
      bounce();
    }
    icon.addEventListener('pointerup', release);
    icon.addEventListener('pointercancel', release);
    icon.addEventListener('lostpointercapture', release);
    icon.addEventListener('keydown', event => {
      const moves = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] };
      if (moves[event.key]) {
        event.preventDefault();
        x += moves[event.key][0]; y += moves[event.key][1]; constrain();
      } else if (event.key === 'Escape') { x = 0; y = 0; place(); }
      else if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
        event.preventDefault(); bounce(); icon.click();
      }
    });
    new ResizeObserver(() => { if (!gesture) { x = 0; y = 0; place(); } }).observe(container);
  }
}
