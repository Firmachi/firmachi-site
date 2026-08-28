/* Coverflow carousel for the home-page reels strip.

   Slides never move in the DOM — only their flex `order` changes. For an active
   index `idx`, slide `i` sits at slot ((i - idx) mod N + 3) mod N, which puts
   the active slide at slot 3, dead centre of six. The slide furthest away lands
   at slot 0 and is parked (width 0, hidden), leaving a 2 + 1 + 2 arrangement.
   Width and opacity come from the distance to centre, via CSS attributes. */

const CENTRE_SLOT = 3;

export function createCarousel({ root, onActivate }) {
  const track = root.querySelector('[data-reels-track]');
  const slides = Array.from(track.querySelectorAll('[data-reel]'));
  const dots = Array.from(root.querySelectorAll('[data-dot]'));
  const count = slides.length;

  let index = 0;

  const wrap = (i) => ((i % count) + count) % count;

  function render() {
    slides.forEach((slide, i) => {
      const slot = wrap(i - index + CENTRE_SLOT);
      const parked = slot === 0;
      const distance = Math.abs(slot - CENTRE_SLOT);

      slide.style.order = String(slot);
      slide.dataset.distance = String(distance);
      slide.dataset.parked = String(parked);
      slide.setAttribute('aria-hidden', String(parked));
      slide.tabIndex = parked ? -1 : 0;
    });

    dots.forEach((dot, i) => {
      dot.setAttribute('aria-current', String(i === index));
    });
  }

  function goTo(i) {
    index = wrap(i);
    render();
  }

  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  /* A tap centres an off-centre slide; tapping the centre one opens it. */
  function activate(i) {
    if (i !== index) {
      goTo(i);
      return;
    }
    onActivate?.(index);
  }

  slides.forEach((slide, i) => {
    slide.addEventListener('click', () => activate(i));
    slide.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate(i);
      }
    });
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });

  root.querySelector('[data-reels-prev]')?.addEventListener('click', prev);
  root.querySelector('[data-reels-next]')?.addEventListener('click', next);

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    }
  });

  render();

  return {
    next,
    prev,
    goTo,
    get index() {
      return index;
    },
  };
}
