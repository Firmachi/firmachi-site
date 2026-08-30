/* Motion orchestration.

   Three jobs, all of them about *when*, never about how — the movement itself
   lives in styles/motion.css:

     1. reveal    — mark [data-reveal] / [data-reveal-group] the first time they
                    cross into view, once each.
     2. split     — rebuild [data-split] headings as word runs so they can be
                    staggered, without costing the heading its accessible name.
     3. idle      — pause the two infinite loops (beam sweep, logo marquee)
                    while they are off screen.

   The inline <head> script arms the hidden state before first paint and drops
   it again if this module never runs, so data-motion-ready is the handshake
   that says the observer is live. */

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hasObserver = 'IntersectionObserver' in window;

/* ---- Split headings ------------------------------------------------------ */

/* Splits the text of `node` in place, keeping every element child (a <br>, a
   weight-shifted <span>) where the author put it and only ever cutting text
   nodes. Returns the running word count so a heading numbers its words in
   reading order across nested elements. */
function splitInto(node, counter) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      counter = splitInto(child, counter);
      return;
    }

    if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;

    const fragment = document.createDocumentFragment();
    /* Splitting on the space but keeping it as its own text node is what lets
       the inline-block words still wrap like ordinary text. */
    child.textContent.split(/(\s+)/).forEach((piece) => {
      if (!piece) return;
      if (!piece.trim()) {
        fragment.append(piece);
        return;
      }
      const word = document.createElement('span');
      word.className = 'word';
      word.style.setProperty('--word', String(counter));
      word.textContent = piece;
      fragment.append(word);
      counter += 1;
    });

    child.replaceWith(fragment);
  });

  return counter;
}

function splitHeading(el) {
  /* The unsplit copy is what assistive technology reads; the split copy is
     decoration and is hidden from it entirely, so no one hears the heading
     word by word. */
  const accessible = document.createElement('span');
  accessible.className = 'visually-hidden';
  /* A <br> contributes no character to textContent, so reading the heading
     directly would run the two lines together — "обсудимваш проект". */
  const plain = el.cloneNode(true);
  plain.querySelectorAll('br').forEach((br) => br.replaceWith(' '));
  accessible.textContent = plain.textContent.replace(/\s+/g, ' ').trim();

  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  while (el.firstChild) visual.append(el.firstChild);

  splitInto(visual, 0);

  el.append(accessible, visual);
  el.dataset.splitReady = '';
}

if (!reduceMotion.matches) {
  document.querySelectorAll('[data-split]').forEach(splitHeading);
}

/* ---- Reveal --------------------------------------------------------------- */

const targets = document.querySelectorAll('[data-reveal], [data-reveal-group], [data-split-ready]');

root.dataset.motionReady = 'on';

if (!hasObserver) {
  targets.forEach((el) => {
    el.dataset.revealed = '';
  });
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.revealed = '';
        revealObserver.unobserve(entry.target);
      });
    },
    /* Bottom margin holds the reveal until the element is properly in view
       rather than firing on its first pixel. Elements already on screen at load
       intersect immediately, which is what turns this into the page entrance. */
    { rootMargin: '0px 0px -10% 0px', threshold: 0.02 },
  );

  targets.forEach((el) => revealObserver.observe(el));
}

/* ---- Idle the infinite loops ---------------------------------------------- */

if (hasObserver) {
  const loops = document.querySelectorAll('.beam__sweep, .marquee__track');

  const idleObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.toggleAttribute('data-idle', !entry.isIntersecting);
      });
    },
    { rootMargin: '200px 0px' },
  );

  loops.forEach((el) => idleObserver.observe(el));
}

/* A backgrounded tab keeps compositing these on some platforms. This is a
   separate flag from data-idle rather than the same one: clearing data-idle on
   the way back would resume the loops that are still off screen, and the
   observer has no reason to fire again to re-pause them. */
document.addEventListener('visibilitychange', () => {
  root.toggleAttribute('data-page-hidden', document.visibilityState === 'hidden');
});
