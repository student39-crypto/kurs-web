/* «Приклади робіт» (works.html): галерея з фільтром ?type=creatives|carousels|motion.
   Десктоп — по 3 роботи зі стрілками, мобільна — стрічка вбік із точками.
   Використовує makeDots, bindVideo, openLightbox і desktop з main.js. */

const WORKS_IMG = 'assets/img/works/';
const WORKS_VIDEO = 'assets/video/';

const creative = (n, alt) => ({ kind: 'creative', src: `${WORKS_IMG}creative-${n}.jpg`, alt: `Статичний креатив: ${alt}` });
const motion = (n, alt) => ({
  kind: 'motion',
  src: `${WORKS_VIDEO}motion-${n}.mp4`,
  poster: `${WORKS_IMG}motion-${n}-poster.jpg`,
  alt: `Моушн-креатив: ${alt}`,
});
const carousel = (title, name, count) => ({
  kind: 'carousel',
  title,
  slides: Array.from({ length: count }, (_, k) => `${WORKS_IMG}${name}-${k + 1}.jpg`),
});

const CREATIVES = [
  creative(2, 'Glasses — Reveal your inner feline'),
  creative(3, 'Порядок у бухгалтерії без вашої участі'),
  creative(4, 'Create your own game — курс для дітей'),
  creative(5, 'Power Bank — clean energy'),
  creative(6, 'Gentle sun, serious protection — SPF 50+'),
  creative(7, 'Ready to move in — апартаменти'),
  creative(8, 'Зелень matcha & coffee — сезонне меню'),
  creative(9, 'New journeys, timeless style — сумка'),
  creative(10, 'Елітний корм для птиці'),
];

const CAROUSELS = [
  carousel('Патчі для контролю апетиту', 'patches', 4),
  carousel('Сонячні станції «Колорит»', 'kolorit', 4),
  carousel('Вікна у Харкові', 'windows', 3),
];

const MOTIONS = [
  motion(2, 'шаурма'),
  motion(3, 'Eyelashes'),
  motion(4, 'reading'),
  motion(5, 'анімований глобус'),
  motion(6, 'Подаруй їй спогади'),
  motion(7, 'Smart Watch'),
];

/* «Усі»: добірка впереміш; карусель тут — лише обкладинка */
const WORKS = {
  all: [
    creative(1, 'Працюй з дому як хочеш'),
    { ...CAROUSELS[1], cover: true },
    motion(1, 'Хочеш так само?'),
    CREATIVES[0],
    MOTIONS[0],
    CREATIVES[1],
    CREATIVES[2],
    MOTIONS[1],
    CREATIVES[3],
  ],
  creatives: CREATIVES,
  carousels: CAROUSELS,
  motion: MOTIONS,
};

const PER_PAGE = 3;

const slideAlt = (c, k) => `${c.title}, слайд ${k + 1} з ${c.slides.length}`;
const slidesForLightbox = (c) => c.slides.map((src, k) => ({ src, alt: slideAlt(c, k) }));

const fromHtml = (html) => document.createRange().createContextualFragment(html.trim()).firstElementChild;

const zoomButton = (label) => `
  <button type="button" class="work__zoom" aria-label="${label}">
    <span class="work__hint" aria-hidden="true">⤢ Збільшити</span>
  </button>`;

/* Картка роботи; group — роботи того ж типу для гортання в перегляді */
function workCard(it, group, filter) {
  if (it.kind === 'motion') {
    const fig = fromHtml(`
      <figure class="works__item">
        <div class="work">
          <video src="${it.src}" poster="${it.poster}" muted loop playsinline preload="metadata" aria-label="${it.alt}"></video>
          ${zoomButton('Збільшити моушн')}
          <button type="button" class="work__play" aria-label="Відтворити відео" data-video-toggle>▶</button>
          <span class="label-dark work__type">▶ Моушн</span>
        </div>
      </figure>`);
    const list = group.map((m) => ({ src: m.src, poster: m.poster, alt: m.alt, video: true }));
    const zoom = fig.querySelector('.work__zoom');
    zoom.addEventListener('click', () => openLightbox(list, group.indexOf(it), zoom));
    bindVideo(fig.querySelector('[data-video-toggle]'));
    return fig;
  }

  if (it.kind === 'carousel' && it.cover) {
    const fig = fromHtml(`
      <figure class="works__item">
        <div class="work">
          <img src="${it.slides[0]}" alt="Карусель «${it.title}»: обкладинка" loading="lazy">
          ${zoomButton('Збільшити карусель')}
          <span class="label-dark work__type">Карусель</span>
        </div>
      </figure>`);
    const zoom = fig.querySelector('.work__zoom');
    zoom.addEventListener('click', () => openLightbox(slidesForLightbox(it), 0, zoom));
    return fig;
  }

  if (it.kind === 'carousel') return carouselCard(it);

  // Мітку «Креатив» на десктопі показуємо лише серед усіх робіт
  const fig = fromHtml(`
    <figure class="works__item">
      <div class="work">
        <img src="${it.src}" alt="${it.alt}" loading="lazy">
        ${zoomButton('Збільшити креатив')}
        <span class="label-dark work__type${filter === 'all' ? '' : ' only-mobile'}">Креатив</span>
      </div>
    </figure>`);
  const list = group.map(({ src, alt }) => ({ src, alt }));
  const zoom = fig.querySelector('.work__zoom');
  zoom.addEventListener('click', () => openLightbox(list, group.indexOf(it), zoom));
  return fig;
}

/* Карусель зі стрілками, лічильником і точками всередині картки */
function carouselCard(c) {
  const total = c.slides.length;
  const fig = fromHtml(`
    <figure class="works__item">
      <div class="work work--carousel">
        <img src="${c.slides[0]}" alt="${slideAlt(c, 0)}" loading="lazy">
        ${zoomButton('Збільшити карусель')}
        <span class="label-dark work__type">Карусель</span>
        <span class="label-dark work__count"><span data-num>1</span> / ${total}</span>
        <button type="button" class="arrow-btn work__prev" aria-label="Попередній слайд">‹</button>
        <button type="button" class="arrow-btn work__next" aria-label="Наступний слайд">›</button>
        <div class="dots work__dots" role="group" aria-label="Слайди каруселі"></div>
      </div>
      <figcaption class="works__caption">${c.title}</figcaption>
    </figure>`);
  const img = fig.querySelector('img');
  const num = fig.querySelector('[data-num]');
  let index = 0;

  const go = (k) => {
    index = (k + total) % total;
    img.src = c.slides[index];
    img.alt = slideAlt(c, index);
    num.textContent = index + 1;
    markDot(index);
  };
  const markDot = makeDots(fig.querySelector('.work__dots'), total, 'Слайд', go);
  markDot(0);

  fig.querySelector('.work__prev').addEventListener('click', () => go(index - 1));
  fig.querySelector('.work__next').addEventListener('click', () => go(index + 1));
  const zoom = fig.querySelector('.work__zoom');
  zoom.addEventListener('click', () => openLightbox(slidesForLightbox(c), index, zoom));
  return fig;
}

const plural = (n, one, few, many) => {
  const d = n % 10, dd = n % 100;
  if (d === 1 && dd !== 11) return one;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
  return many;
};

function initGallery() {
  const list = document.querySelector('[data-gallery-list]');
  if (!list) return;
  const filterLinks = document.querySelectorAll('[data-filter]');
  const count = document.querySelector('[data-gallery-count]');
  const prev = document.querySelector('[data-gallery-prev]');
  const next = document.querySelector('[data-gallery-next]');
  const dotsRoot = document.querySelector('[data-gallery-dots]');
  const num = document.querySelector('[data-gallery-num]');

  let items = [];
  let page = 0;
  let pages = 1;
  let markDot = () => {};

  // Десктоп: видно лише картки поточної сторінки
  const showPage = (k) => {
    page = (k + pages) % pages;
    Array.from(list.children).forEach((card, i) => {
      card.classList.toggle('is-off', Math.floor(i / PER_PAGE) !== page);
    });
    if (items[0]?.kind !== 'carousel') {
      const from = page * PER_PAGE + 1;
      count.textContent = `${from}–${Math.min(from + PER_PAGE - 1, items.length)} з ${items.length}`;
    }
  };

  // Мобільна: точка й номер за прокруткою стрічки
  const syncRail = () => {
    const k = Math.min(items.length - 1, Math.round(list.scrollLeft / Math.max(1, list.clientWidth)));
    markDot(k);
    num.textContent = `${k + 1} з ${items.length}`;
  };

  const render = (filter) => {
    items = WORKS[filter];
    const cards = items.map((it) => workCard(it, items.filter((x) => x.kind === it.kind && !x.cover), filter));
    // Неповний ряд каруселей на десктопі добиваємо заглушкою
    if (filter === 'carousels' && items.length % PER_PAGE) {
      cards.push(fromHtml('<div class="works__item gallery__soon only-desktop">Наступна карусель — скоро</div>'));
    }
    list.replaceChildren(...cards);
    list.scrollLeft = 0;

    filterLinks.forEach((a) => {
      if (a.dataset.filter === filter) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (filter === 'carousels') {
      count.textContent = `${items.length} ${plural(items.length, 'карусель', 'каруселі', 'каруселей')}`;
    }
    pages = Math.ceil(cards.length / PER_PAGE);
    prev.hidden = next.hidden = pages < 2;
    showPage(0);

    markDot = makeDots(dotsRoot, items.length, 'Робота', (k) => {
      list.scrollTo({ left: list.children[k].offsetLeft - list.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    syncRail();
  };

  const filterFromUrl = () => {
    const type = new URLSearchParams(window.location.search).get('type');
    return Object.hasOwn(WORKS, type ?? '') ? type : 'all';
  };

  // Фільтри перемикаються без перезавантаження, адреса оновлюється
  filterLinks.forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (a.getAttribute('aria-current') === 'page') return;
      history.pushState(null, '', a.href);
      render(a.dataset.filter);
    });
  });
  window.addEventListener('popstate', () => render(filterFromUrl()));

  prev.addEventListener('click', () => showPage(page - 1));
  next.addEventListener('click', () => showPage(page + 1));
  list.addEventListener('scroll', syncRail, { passive: true });
  desktop.addEventListener('change', () => { list.scrollLeft = 0; syncRail(); });

  render(filterFromUrl());
}

initGallery();
