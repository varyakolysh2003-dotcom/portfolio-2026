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

  const labels = document.querySelectorAll('.case-end > p');
  const status = document.querySelector('#cart-status');
  let reached = false;
  let pending = false;
  let registered = false;
  async function request(method) {
    const response = await fetch('/api/lavka/readers', { method, credentials:'same-origin', cache:'no-store' });
    if (!response.ok) throw new Error('Counter unavailable');
    const data = await response.json();
    if (!Number.isSafeInteger(data.count) || data.count < 0) throw new Error('Invalid counter');
    return data;
  }
  // Establish the anonymous cookie before recording the first interaction.
  const ready = request('GET').catch(() => null);
  function showCount(count) {
    const text = `You're one of ${count.toLocaleString('en-US')} who made it to the end!`;
    labels.forEach(label => { label.textContent = text; });
    status.textContent = text;
  }
  async function register() {
    reached = true;
    page.classList.remove('lavka-cursor');
    if (pending || registered) return;
    pending = true;
    try {
      await ready;
      showCount((await request('POST')).count);
      registered = true;
    } catch {
      labels.forEach(label => { label.textContent = 'You made it to the end! Tap the cart to load the reader count.'; });
    } finally { pending = false; }
  }
  cart.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && pointer.matches) register(); });
  cart.addEventListener('click', register);
  // Refresh the shared total when another visitor finishes while this page is open.
  const timer = setInterval(async () => {
    if (!reached || !registered || document.hidden) return;
    try { showCount((await request('GET')).count); } catch { /* Keep the last confirmed total. */ }
  }, 15000);
  window.addEventListener('pagehide', () => clearInterval(timer), { once:true });
}
