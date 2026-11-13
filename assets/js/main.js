/* Інтерактив головної: меню, «Нагору», роботи (карусель, відео, стрічка),
   перегляд на весь екран, поява «Етапів роботи», паралакс постера.
   Підключається й на works.html: там спрацьовують меню та перегляд. */

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const desktop = window.matchMedia('(min-width: 1024px)');

/* Мобільне меню */
function initMenu() {
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('site-nav');
  if (!burger || !nav) return;

  const setOpen = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    nav.classList.toggle('is-open', open);
  };

  burger.addEventListener('click', () => setOpen(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      burger.focus();
    }
  });
  desktop.addEventListener('change', () => setOpen(false));
}

/* «Нагору» з'являється, коли перший екран прокручено */
function initToTop() {
  const btn = document.querySelector('.to-top');
  const hero = document.querySelector('.hero');
  if (!btn || !hero || !('IntersectionObserver' in window)) {
    if (btn) btn.removeAttribute('data-hidden');
    return;
  }
  new IntersectionObserver(([entry]) => {
    btn.toggleAttribute('data-hidden', entry.isIntersecting);
  }).observe(hero);
}

/* Квадратні точки: створює кнопки й повертає функцію підсвічування */
function makeDots(root, count, label, onPick) {
  root.innerHTML = '';
  const buttons = Array.from({ length: count }, (_, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `${label} ${k + 1} з ${count}`);
    b.addEventListener('click', () => onPick(k));
    root.append(b);
    return b;
  });
  return (current) => buttons.forEach((b, k) => b.setAttribute('aria-current', String(k === current)));
}

const CAROUSEL = Array.from({ length: 7 }, (_, k) => `assets/img/works/carousel-${k + 1}.jpg`);

const LIGHTBOX_ITEMS = {
  creative: () => [{ src: 'assets/img/works/creative-1.jpg', alt: 'Статичний креатив «Працюй з дому як хочеш»' }],
  carousel: () => CAROUSEL.map((src, k) => ({ src, alt: `Карусель, слайд ${k + 1} з ${CAROUSEL.length}` })),
  motion: () => [{ src: 'assets/video/motion-1.mp4', poster: 'assets/img/works/motion-1-poster.jpg', alt: 'Моушн-креатив', video: true }],
};

let carouselIndex = 0;

/* Карусель у картці роботи */
function initCarousel() {
  const root = document.querySelector('[data-carousel]');
  if (!root) return;
  const img = root.querySelector('[data-carousel-img]');
  const num = root.querySelector('[data-carousel-num]');
  root.querySelector('[data-carousel-total]').textContent = CAROUSEL.length;

  const go = (k) => {
    carouselIndex = (k + CAROUSEL.length) % CAROUSEL.length;
    img.src = CAROUSEL[carouselIndex];
    img.alt = `Карусель, слайд ${carouselIndex + 1} з ${CAROUSEL.length}`;
    num.textContent = carouselIndex + 1;
    markDot(carouselIndex);
  };
  const markDot = makeDots(root.querySelector('[data-carousel-dots]'), CAROUSEL.length, 'Слайд', go);

  root.querySelector('[data-carousel-prev]').addEventListener('click', () => go(carouselIndex - 1));
  root.querySelector('[data-carousel-next]').addEventListener('click', () => go(carouselIndex + 1));
  go(0);
}

/* Моушн: грає, коли видно, і має свою кнопку пауза/відтворення */
function initVideo() {
  document.querySelectorAll('[data-video-toggle]').forEach(bindVideo);
}

function bindVideo(toggle) {
  const video = toggle.parentElement.querySelector('video');

  const sync = () => {
    const playing = !video.paused;
    toggle.classList.toggle('is-playing', playing);
    toggle.textContent = playing ? '❚❚' : '▶';
    toggle.setAttribute('aria-label', playing ? 'Пауза' : 'Відтворити відео');
  };
  const play = () => video.play().catch(() => {});

  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  toggle.addEventListener('click', () => (video.paused ? play() : video.pause()));

  if (!reduceMotion && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio > 0.4) play();
      else video.pause();
    }, { threshold: [0, 0.4, 1] }).observe(video);
  }
}

/* Мобільна стрічка робіт із точками */
function initWorksRail() {
  const rail = document.querySelector('[data-works-rail]');
  const dotsRoot = document.querySelector('[data-works-dots]');
  if (!rail || !dotsRoot) return;
  const items = rail.children;

  const markDot = makeDots(dotsRoot, items.length, 'Робота', (k) => {
    rail.scrollTo({ left: items[k].offsetLeft - rail.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  const update = () => markDot(Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth)));
  rail.addEventListener('scroll', update, { passive: true });
  update();
}

/* Перегляд роботи на весь екран; works.js відкриває його через openLightbox */
let openLightbox = () => {};

function initLightbox() {
  const root = document.querySelector('[data-lightbox-root]');
  if (!root) return;
  const stage = root.querySelector('[data-lightbox-stage]');
  const prev = root.querySelector('[data-lightbox-prev]');
  const next = root.querySelector('[data-lightbox-next]');
  const count = root.querySelector('[data-lightbox-count]');
  const close = root.querySelector('[data-lightbox-close]');
  let items = [];
  let index = 0;
  let opener = null;

  const render = () => {
    const it = items[index];
    const el = document.createElement(it.video ? 'video' : 'img');
    el.className = 'lightbox__media';
    el.src = it.src;
    if (it.video) {
      Object.assign(el, { poster: it.poster, muted: true, loop: true, controls: true, playsInline: true, autoplay: !reduceMotion });
      el.setAttribute('aria-label', it.alt);
    } else {
      el.alt = it.alt;
    }
    stage.replaceChildren(el);
    const multi = items.length > 1;
    prev.hidden = next.hidden = count.hidden = !multi;
    count.textContent = `${index + 1} / ${items.length}`;
  };

  const open = (list, start, from) => {
    items = list;
    index = start;
    opener = from;
    render();
    root.hidden = false;
    document.body.style.overflow = 'hidden';
    close.focus();
  };
  openLightbox = open;

  const hide = () => {
    root.hidden = true;
    stage.replaceChildren();
    document.body.style.overflow = '';
    if (opener) opener.focus();
  };

  const step = (d) => {
    index = (index + d + items.length) % items.length;
    render();
  };

  document.querySelectorAll('[data-lightbox]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const kind = btn.dataset.lightbox;
      open(LIGHTBOX_ITEMS[kind](), kind === 'carousel' ? carouselIndex : 0, btn);
    });
  });

  root.addEventListener('click', (e) => {
    if (e.target === root || e.target === stage) hide();
  });
  close.addEventListener('click', hide);
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));

  document.addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'Escape') hide();
    else if (e.key === 'ArrowLeft' && items.length > 1) step(-1);
    else if (e.key === 'ArrowRight' && items.length > 1) step(1);
    else if (e.key === 'Tab') {
      // Фокус лишається всередині перегляду
      const focusable = Array.from(root.querySelectorAll('button, video[controls]')).filter((el) => !el.hidden);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}

/* «Етапи роботи»: заголовок і цифри проявляються при прокрутці */
function initProcess() {
  const section = document.querySelector('.process');
  if (!section) return;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    section.classList.add('is-on');
    return;
  }
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    setTimeout(() => section.classList.add('is-on'), 60);
  }, { threshold: 0.35 });
  io.observe(section);
}

/* Постер на першому екрані м'яко рухається за курсором */
function initParallax() {
  const hero = document.querySelector('.hero');
  const poster = document.querySelector('.hero__poster');
  if (!hero || !poster || reduceMotion) return;
  let tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

  const step = () => {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    poster.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
    if (Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05) { raf = null; return; }
    raf = requestAnimationFrame(step);
  };
  const run = () => { if (!raf) raf = requestAnimationFrame(step); };

  hero.addEventListener('mousemove', (e) => {
    if (!desktop.matches) return;
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 16;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 16;
    run();
  });
  hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; run(); });
}

initMenu();
initToTop();
initCarousel();
initVideo();
initWorksRail();
initLightbox();
initProcess();
initParallax();
