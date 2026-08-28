/* Modal reel player.

   Shows the reel's video when one is configured, and the "not uploaded yet"
   empty state otherwise. Esc closes; the arrow keys step through reels and keep
   the carousel underneath in sync. */

export function createPlayer({ root, reels, onStep }) {
  const video = root.querySelector('[data-player-video]');
  const empty = root.querySelector('[data-player-empty]');
  const kicker = root.querySelector('[data-player-kicker]');
  const title = root.querySelector('[data-player-title]');

  let index = 0;
  let lastFocused = null;

  const isOpen = () => !root.hidden;

  function render() {
    const reel = reels[index];
    kicker.textContent = reel.kicker;
    title.textContent = reel.title;

    if (reel.video) {
      video.src = reel.video;
      video.poster = reel.poster;
      video.hidden = false;
      empty.hidden = true;
      video.play().catch(() => {
        /* Autoplay with sound is routinely blocked; the controls still work. */
      });
    } else {
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.hidden = true;
      empty.hidden = false;
    }
  }

  function open(i) {
    index = i;
    lastFocused = document.activeElement;
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    render();
    root.querySelector('[data-player-close]')?.focus();
  }

  function close() {
    if (!isOpen()) return;
    video.pause();
    root.hidden = true;
    document.body.style.overflow = '';
    lastFocused?.focus();
  }

  function step(delta) {
    index = ((index + delta) % reels.length + reels.length) % reels.length;
    render();
    onStep?.(index);
  }

  root.addEventListener('click', (event) => {
    if (event.target === root) close();
  });

  root.querySelector('[data-player-close]')?.addEventListener('click', close);
  root.querySelector('[data-player-prev]')?.addEventListener('click', () => step(-1));
  root.querySelector('[data-player-next]')?.addEventListener('click', () => step(1));

  window.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'ArrowRight') {
      step(1);
    } else if (event.key === 'ArrowLeft') {
      step(-1);
    }
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = root.querySelectorAll('button, [href], video[controls]');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return { open, close, isOpen };
}
