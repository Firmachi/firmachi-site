import { REELS } from './reels.js';
import { createCarousel } from './carousel.js';
import { createPlayer } from './player.js';

const reelsRoot = document.querySelector('[data-reels]');
const playerRoot = document.querySelector('[data-player]');

if (reelsRoot && playerRoot) {
  let carousel;

  const player = createPlayer({
    root: playerRoot,
    reels: REELS,
    /* Stepping inside the player drags the carousel along, so closing it
       leaves the page on the reel the visitor was last looking at. */
    onStep: (index) => carousel.goTo(index),
  });

  carousel = createCarousel({
    root: reelsRoot,
    onActivate: (index) => player.open(index),
  });
}
