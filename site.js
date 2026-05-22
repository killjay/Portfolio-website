// Nav border on scroll
const nav = document.querySelector('.nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Scroll progress bar — appears on pages that include .cs-progress
(() => {
  const bar = document.querySelector('.cs-progress__bar');
  if (!bar) return;
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
})();

// Scroll-reveal — opt-in via .reveal, IntersectionObserver, respects reduced motion
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!prefersReduced && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}

// Copyright year
const yearEl = document.querySelector('[data-year]');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Image lightbox — click any in-content image to expand with prev/next/close
(() => {
  const images = Array.from(document.querySelectorAll('main img'))
    .filter((img) => !img.closest('a') && !img.classList.contains('no-zoom'));
  if (!images.length) return;

  images.forEach((img) => img.classList.add('is-zoomable'));

  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image preview');
  overlay.innerHTML = `
    <div class="lightbox__stage">
      <img class="lightbox__img" alt="">
      <button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous image">‹</button>
      <button class="lightbox__btn lightbox__next" type="button" aria-label="Next image">›</button>
      <button class="lightbox__btn lightbox__close" type="button" aria-label="Close preview">×</button>
      <div class="lightbox__counter" aria-hidden="true"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const imgEl     = overlay.querySelector('.lightbox__img');
  const prevBtn   = overlay.querySelector('.lightbox__prev');
  const nextBtn   = overlay.querySelector('.lightbox__next');
  const closeBtn  = overlay.querySelector('.lightbox__close');
  const counterEl = overlay.querySelector('.lightbox__counter');

  let current = -1;
  let lastFocused = null;

  const render = () => {
    const src = images[current];
    imgEl.src = src.currentSrc || src.src;
    imgEl.alt = src.alt || '';
    counterEl.textContent = `${current + 1} / ${images.length}`;
    counterEl.hidden = images.length < 2;
    const single = images.length < 2;
    prevBtn.disabled = single;
    nextBtn.disabled = single;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
  };

  const open = (index) => {
    current = index;
    lastFocused = document.activeElement;
    render();
    document.body.classList.add('is-lightbox-open');
    overlay.classList.add('is-open');
    closeBtn.focus();
  };

  const close = () => {
    overlay.classList.remove('is-open');
    document.body.classList.remove('is-lightbox-open');
    imgEl.src = '';
    current = -1;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };

  const step = (delta) => {
    if (images.length < 2) return;
    current = (current + delta + images.length) % images.length;
    render();
  };

  images.forEach((img, i) => {
    img.addEventListener('click', () => open(i));
  });

  prevBtn.addEventListener('click', (e) => { e.stopPropagation(); step(-1); });
  nextBtn.addEventListener('click', (e) => { e.stopPropagation(); step(1); });
  closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('lightbox__stage')) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape')       { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
  });
})();

// Case study TOC — sticky left rail with scroll-spy.
// Auto-builds from .cs-section blocks inside .container--prose so project
// pages get this for free without HTML changes.
(() => {
  const proseRoot = document.querySelector('.container--prose');
  if (!proseRoot) return;

  const entries = Array.from(proseRoot.querySelectorAll('.cs-section'))
    .map((sec) => {
      const titleEl = sec.querySelector('.cs-section__title');
      if (!titleEl) return null;
      const title = titleEl.textContent.trim();
      if (!sec.id) {
        sec.id =
          'sec-' +
          title
            .toLowerCase()
            .replace(/&/g, 'and')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
      }
      return { id: sec.id, title, el: sec };
    })
    .filter(Boolean);

  if (entries.length < 2) return;

  const toc = document.createElement('aside');
  toc.className = 'cs-toc';
  toc.setAttribute('aria-label', 'On this page');
  toc.innerHTML =
    '<div class="cs-toc__label">On this page</div>' +
    '<ol class="cs-toc__list">' +
    entries
      .map(
        (e) =>
          `<li><a class="cs-toc__link" href="#${e.id}" data-target="${e.id}">${e.title}</a></li>`
      )
      .join('') +
    '</ol>';
  document.body.appendChild(toc);

  const links = new Map();
  toc.querySelectorAll('.cs-toc__link').forEach((a) => links.set(a.dataset.target, a));

  const setActive = (id) => {
    links.forEach((a, key) => a.classList.toggle('is-active', key === id));
  };

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (obs) => {
        const visible = obs
          .filter((o) => o.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );
    entries.forEach((e) => spy.observe(e.el));
  }

  setActive(entries[0].id);

  // Visibility bounds: TOC appears once the reader hits the first section's
  // top edge and disappears once the last section's bottom passes the trigger.
  const firstSec = entries[0].el;
  const lastSec = entries[entries.length - 1].el;
  const TOP_OFFSET = 120; // matches .cs-toc top in CSS

  let ticking = false;
  const updateBounds = () => {
    ticking = false;
    const trigger = window.scrollY + TOP_OFFSET;
    const firstTop = firstSec.getBoundingClientRect().top + window.scrollY;
    const lastBottom = lastSec.getBoundingClientRect().bottom + window.scrollY;
    const inRange = trigger >= firstTop && trigger <= lastBottom;
    toc.classList.toggle('is-ready', inRange);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateBounds);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateBounds();
})();
