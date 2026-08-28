/* The six featured reels on the home page carousel.
   `video` is null for every entry: the design has no per-reel video URLs
   wired up yet, so the player falls back to its "not uploaded" empty state.
   Dropping a file path (or an embed URL) in here is all it takes to light up. */

export const REELS = [
  {
    id: 'artist',
    kicker: 'Музыкальный клип',
    title: 'Выступление артиста',
    poster: './assets/reel-stage-mic.jpg',
    video: null,
  },
  {
    id: 'morning',
    kicker: 'Реклама',
    title: 'Утро с папой',
    poster: './assets/reel-kid-shaving.jpg',
    video: null,
  },
  {
    id: 'dargo',
    kicker: 'Автореклама',
    title: 'Haval Dargo',
    poster: './assets/reel-taillight.jpg',
    video: null,
  },
  {
    id: 'dargo-road',
    kicker: 'Автореклама',
    title: 'Haval Dargo — в дороге',
    poster: './assets/reel-landscape-car.jpg',
    video: null,
  },
  {
    id: 'backstage',
    kicker: 'Backstage',
    title: 'Съёмочная площадка',
    poster: './assets/reel-bts-photoshoot.jpg',
    video: null,
  },
  {
    id: 'brand-e',
    kicker: 'Digital-реклама',
    title: 'Кейс бренда Е',
    poster: './assets/hero-sunburst.jpg',
    video: null,
  },
];
