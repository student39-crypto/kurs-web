/* «Відгуки»: 9 переписок із клієнтами. На мобільному — стрічка з прокруткою вбік,
   на десктопі — по 3 на сторінку зі стрілками й точками.
   Повідомлення «друкуються», коли картка з'являється на екрані. */

const REVIEWS = [
  { phrase: 'Оперативна та якісна робота', msgs: [
    { t: 'Дякую за оперативну та якісну роботу!) все виконано вчасно та відповідає нашому запиту 😍 чудове відео для нашого просування 🔥 дякуємо вам 🙏', time: '13:40', fwd: true, react: '🔥', key: true },
  ] },
  { phrase: 'Мені дуже подобається анімація', msgs: [
    { t: 'Мені дуже подобається анімація появлення всіх об\'єктів, клієнтці потрібно так і зробити', time: '15:04', reply: '▶ Відео', key: true },
    { t: 'Я скинув файл', time: '15:04', react: '👍' },
  ] },
  { phrase: 'Чудова робота. Немає правок', msgs: [
    { t: 'Чудова робота 😍', time: '8:00', key: true },
    { t: 'Немає правок)', time: '8:00', key: true },
    { t: 'Дякую! Чекаю на фідбек від клієнта 😁', time: '8:02', out: true },
  ] },
  { phrase: 'Сподобалось, як ти зробила\nминулу роботу', msgs: [
    { t: 'Супер!', time: '15:10' },
    { t: 'Я просто не хотів іншому делегувати', time: '15:10' },
    { t: 'мені сподобалось як ти зробила минулу роботу', time: '15:10', key: true },
  ] },
  { phrase: 'Я задоволений', msgs: [
    { t: 'Мені теж дуже сподобалося, ще раз дякую, ти супер! Звичайно ж буду рада ще попрацювати!👍', time: '15:00', react: '❤️', out: true },
    { t: 'Тобі дякую за чудову роботу)', time: '15:01', react: '❤️' },
    { t: 'Я задоволений)', time: '15:02', key: true },
  ] },
  { phrase: 'По анімації бомба', msgs: [
    { t: 'По шрифтам все гуд', time: '19:17' },
    { t: 'По анімації бомба', time: '19:17', key: true },
    { t: 'Все інше супер', time: '19:39' },
  ] },
  { phrase: 'Буду звертатись ще', msgs: [
    { t: 'Кошти надіслав)', time: '14:45', react: '❤️' },
    { t: 'Радий був з тобою попрацювати)', time: '14:48' },
    { t: 'Буду звертатись ще', time: '14:48', key: true },
  ] },
  { phrase: 'Все вийшло супер', msgs: [
    { t: 'Все вийшло супер, в мене зауважень немає 😊', time: '15:14', reply: 'Овочечистка.psd', replyFile: true, key: true },
    { t: 'Дуже дякую!!!', time: '15:15', react: '😺', out: true },
  ] },
  { phrase: 'Клієнтці подобається', msgs: [
    { t: 'Все окей, не переживай)', time: '13:08', react: '❤️' },
    { t: 'Клієнтці подобається', time: '13:10', react: '👍', key: true },
    { t: 'Залишаємо цей варіант і все)', time: '13:33', fwd: true },
  ] },
];

const PER_PAGE = 3;
const TYPE_STEP = 2;      // символів за такт
const TYPE_TICK = 32;     // мс
const MSG_PAUSE = 10;     // пауза між повідомленнями, у «символах»

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function renderMessage(m) {
  const row = el('div', `chat__row${m.out ? ' chat__row--out' : ''}`);
  const bubble = el('div', `chat__bubble${m.key ? ' chat__bubble--key' : ''}`);

  if (m.fwd) {
    const fwd = el('span', 'chat__fwd', 'Переслано від ');
    const avatar = el('span', 'chat__avatar', 'S');
    avatar.setAttribute('aria-hidden', 'true');
    fwd.append(avatar, 'SMM');
    bubble.append(fwd);
  }

  if (m.reply) {
    const reply = el('span', 'chat__reply');
    const quoted = el('span', null, m.reply);
    if (m.replyFile) {
      quoted.insertAdjacentHTML('afterbegin', '<svg aria-hidden="true" width="11" height="13" viewBox="0 0 11 13" fill="currentColor"><path d="M0 0h7l4 4v9H0z"/></svg>');
    }
    reply.append(el('b', null, 'Елена'), quoted);
    bubble.append(reply);
  }

  const text = el('span', 'chat__text');
  const typed = el('span', 'chat__typed');
  typed.setAttribute('aria-hidden', 'true');
  text.append(el('span', 'chat__ghost', m.t), typed);
  bubble.append(text);

  const meta = el('span', 'chat__meta');
  if (m.react) meta.append(el('span', 'chat__react', m.react));
  meta.append(el('span', 'chat__time', m.time + (m.out ? ' ✓✓' : '')));
  bubble.append(meta);

  row.append(bubble);
  return { row, typed, chars: Array.from(m.t) };
}

function renderReview(r) {
  const fig = el('figure', 'review');
  fig.append(el('blockquote', 'review__quote', `«${r.phrase}»`));

  const chat = el('div', 'chat');
  chat.setAttribute('role', 'log');
  chat.setAttribute('aria-label', `Переписка з клієнтом: ${r.phrase.replace('\n', ' ')}`);
  const msgs = r.msgs.map(renderMessage);
  msgs.forEach((m) => chat.append(m.row));
  fig.append(chat);

  return { fig, msgs };
}

/* Друк повідомлень: картки стають у чергу, коли видно, і друкуються по одній */
function createTyper() {
  const queue = [];
  let busy = false;

  const reset = (card) => {
    card.done = false;
    card.msgs.forEach((m) => {
      m.row.classList.add('is-pending');
      m.typed.textContent = '';
    });
  };

  const finish = (card) => {
    card.done = true;
    card.fig.classList.remove('is-typing');
    card.msgs.forEach((m) => {
      m.row.classList.remove('is-pending');
      m.typed.textContent = m.chars.join('');
    });
  };

  const run = () => {
    if (busy || !queue.length) return;
    const card = queue.shift();
    if (card.done) { run(); return; }
    busy = true;
    card.fig.classList.add('is-typing');

    const caret = el('span', 'chat__caret');
    let mi = 0;
    let pos = -MSG_PAUSE;
    const timer = setInterval(() => {
      const m = card.msgs[mi];
      pos += TYPE_STEP;
      if (pos <= 0) return;
      m.row.classList.remove('is-pending');
      const n = Math.min(m.chars.length, pos);
      m.typed.textContent = m.chars.slice(0, n).join('');
      m.typed.append(caret);
      if (n < m.chars.length) return;
      caret.remove();
      mi += 1;
      pos = -MSG_PAUSE;
      if (mi < card.msgs.length) return;
      clearInterval(timer);
      finish(card);
      busy = false;
      setTimeout(run, 400);
    }, TYPE_TICK);
  };

  return {
    reset,
    finish,
    enqueue(card) {
      if (!card.done && !queue.includes(card)) queue.push(card);
      run();
    },
  };
}

function initReviews() {
  const list = document.querySelector('[data-reviews]');
  if (!list) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = window.matchMedia('(min-width: 1024px)');
  const typer = createTyper();

  const cards = REVIEWS.map(renderReview);
  cards.forEach((card) => {
    list.append(card.fig);
    if (reduceMotion || !('IntersectionObserver' in window)) typer.finish(card);
    else typer.reset(card);
  });

  const count = document.querySelector('[data-reviews-count]');
  if (count) count.textContent = REVIEWS.length;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const card = cards.find((c) => c.fig === entry.target);
        if (card) typer.enqueue(card);
      });
    }, { threshold: 0.5 });
    cards.forEach((card) => io.observe(card.fig));
  }

  // Сторінки по 3 на десктопі
  const pages = Math.ceil(cards.length / PER_PAGE);
  let page = 0;
  const show = (p) => {
    page = (p + pages) % pages;
    cards.forEach((card, k) => {
      const onPage = Math.floor(k / PER_PAGE) === page;
      card.fig.toggleAttribute('data-page-hidden', !onPage);
    });
    markDot(page);
  };
  const markDot = makeDots(document.querySelector('[data-reviews-dots]'), pages, 'Відгуки, сторінка', show);
  document.querySelector('[data-reviews-prev]').addEventListener('click', () => show(page - 1));
  document.querySelector('[data-reviews-next]').addEventListener('click', () => show(page + 1));
  show(0);
  desktop.addEventListener('change', () => show(page));
}

initReviews();
