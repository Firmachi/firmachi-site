/* Modal reel player.

   Shows the reel's video when one is configured, and the "not uploaded yet"
   empty state otherwise. Esc closes; the arrow keys step through reels and keep
   the carousel underneath in sync. */

/* YouTube and Vimeo pages can't go in a <video>; they need their embed player
   in an iframe. Anything else (an .mp4 path or URL) plays natively. */
function toEmbedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;

  return null;
}

/* Matches --duration-modal in styles/tokens.css: the dialog keeps its box while
   the exit transition plays, and only then goes back to display:none. */
const EXIT_MS = 250;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export function createPlayer({ root, reels, onStep }) {
  const video = root.querySelector('[data-player-video]');
  const embed = root.querySelector('[data-player-embed]');
  const empty = root.querySelector('[data-player-empty]');
  const kicker = root.querySelector('[data-player-kicker]');
  const title = root.querySelector('[data-player-title]');

  let index = 0;
  let lastFocused = null;
  let exitTimer = null;

  /* data-open, not `hidden`: during the exit the dialog is still in the layout
     but already on its way out, and reopening then should start from where it
     is rather than from scratch. */
  const isOpen = () => root.dataset.open !== undefined;

  function stopVideo() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden = true;
  }

  /* Dropping the src is what actually stops an embed — hiding it keeps playing. */
  function stopEmbed() {
    embed.removeAttribute('src');
    embed.hidden = true;
  }

  function render() {
    const reel = reels[index];
    kicker.textContent = reel.kicker;
    title.textContent = reel.title;

    stopVideo();
    stopEmbed();

    const embedUrl = reel.video ? toEmbedUrl(reel.video) : null;

    if (embedUrl) {
      embed.src = embedUrl;
      embed.hidden = false;
      empty.hidden = true;
    } else if (reel.video) {
      video.src = reel.video;
      video.poster = reel.poster;
      video.hidden = false;
      empty.hidden = true;
      video.play().catch(() => {
        /* Autoplay with sound is routinely blocked; the controls still work. */
      });
    } else {
      empty.hidden = false;
    }
  }

  function open(i) {
    index = i;
    lastFocused = document.activeElement;
    clearTimeout(exitTimer);
    root.hidden = false;
    /* Force a reflow so the browser paints the closed state once; without it
       the transition has no start value and the dialog just appears. */
    void root.offsetWidth;
    root.dataset.open = '';
    document.body.style.overflow = 'hidden';
    render();
    root.querySelector('[data-player-close]')?.focus();
  }

  function close() {
    if (!isOpen()) return;
    stopVideo();
    stopEmbed();
    delete root.dataset.open;
    document.body.style.overflow = '';
    lastFocused?.focus();

    /* Exits the way it entered — same curve, same duration, in reverse. */
    clearTimeout(exitTimer);
    exitTimer = setTimeout(
      () => {
        root.hidden = true;
      },
      reducedMotion.matches ? 0 : EXIT_MS,
    );
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
