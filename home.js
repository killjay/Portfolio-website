// Home — a one-screen layout modelled on juanmoraromero.com.
// Statement line reveal, portrait cycle with an RGB split, and a looping
// gallery: the active project is a full-height square, the rest sit at 62%
// along the bottom. Wheel, drag, arrow keys and clicks all step it. On
// phones the same planes run as a vertical carousel.
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMq = window.matchMedia('(max-width: 900px)');
  const main = document.querySelector('.jh');
  if (!main) return;

  // ---------- Statement: split into masked lines ----------
  const statement = document.querySelector('[data-statement]');
  const splitStatement = () => {
    if (!statement) return;
    const html = statement.dataset.source || statement.innerHTML;
    statement.dataset.source = html;
    statement.classList.remove('is-split');
    statement.innerHTML = html;
    // Wrap every word, measure where lines break, then rebuild per line.
    // sp = whitespace before this token, so "easy" + ":" stays glued.
    const words = [];
    let pendingSpace = false;
    const walk = (node, em) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (!w.trim()) { pendingSpace = true; return; }
            words.push({ w, em, sp: pendingSpace });
            pendingSpace = false;
          });
        } else if (n.nodeType === 1) walk(n, n.tagName === 'EM');
      });
    };
    walk(statement, false);
    const word = (x) => (x.em ? `<em>${x.w}</em>` : x.w);
    statement.innerHTML = words
      .map((x, i) => `${i && x.sp ? ' ' : ''}<span data-i="${i}">${word(x)}</span>`)
      .join('');
    const lines = [];
    let top = null;
    statement.querySelectorAll('[data-i]').forEach((s) => {
      const x = words[+s.dataset.i];
      if (s.offsetTop !== top) { lines.push(''); top = s.offsetTop; }
      else if (x.sp) lines[lines.length - 1] += ' ';
      lines[lines.length - 1] += word(x);
    });
    statement.classList.add('is-split');
    statement.innerHTML = lines
      .map((l, i) => `<span class="mask"><span style="--d:${(0.08 + i * 0.07).toFixed(2)}s">${l}</span></span>`)
      .join('');
  };
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { splitStatement(); requestAnimationFrame(() => main.classList.add('is-in')); });
  } else {
    splitStatement();
    main.classList.add('is-in');
  }
  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(splitStatement, 150);
  });

  // ---------- Portrait cycle ----------
  const portrait = document.querySelector('[data-portrait]');
  const dot = document.querySelector('[data-dot]');
  const offsets = document.querySelectorAll('#jh-split feOffset');
  if (portrait && !reduced) {
    const imgs = Array.from(portrait.querySelectorAll('img'));
    let pi = 0;
    const glitch = () => {
      const start = performance.now();
      const step = (t) => {
        const k = Math.max(0, 1 - (t - start) / 360);
        const dx = (8 * k * (Math.random() > 0.5 ? 1 : -1)).toFixed(1);
        if (offsets[0]) offsets[0].setAttribute('dx', dx);
        if (offsets[1]) offsets[1].setAttribute('dx', -dx);
        if (k > 0) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    setInterval(() => {
      imgs[pi].classList.remove('is-on');
      pi = (pi + 1) % imgs.length;
      imgs[pi].classList.add('is-on');
      glitch();
      if (dot) {
        dot.classList.add('is-blip');
        setTimeout(() => dot.classList.remove('is-blip'), 380);
      }
    }, 2600);
  }

  // ---------- Gallery ----------
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;
  const planes = Array.from(stage.querySelectorAll('.jh-plane'));
  const n = planes.length;
  const ui = {
    count: document.querySelector('[data-count]'),
    title: document.querySelector('span[data-title]'),
    titleWrap: document.querySelector('[data-title-wrap]'),
    client: document.querySelector('[data-client]'),
    role: document.querySelector('[data-role]'),
    detail: document.querySelector('[data-detail]'),
    prims: document.querySelector('[data-prims]'),
    mName: document.querySelector('[data-m-name]'),
    mLink: document.querySelector('[data-m-link]'),
  };

  let p = 0;          // rendered position (float)
  let target = 0;     // where p is heading
  let active = -1;
  let W = 0, H = 0, G = 0;

  const measure = () => {
    W = stage.clientWidth;
    H = stage.clientHeight;
    G = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 13;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--gutter)';
    stage.appendChild(probe);
    G = probe.getBoundingClientRect().width || G;
    probe.remove();
    // Title starts where the first small plane starts
    if (ui.titleWrap) ui.titleWrap.style.setProperty('--title-x', `${(stage.offsetLeft + H + G).toFixed(1)}px`);
  };

  const lerp = (a, b, t) => a + (b - a) * t;
  const mod = (a, m) => ((a % m) + m) % m;

  // Desktop: horizontal, active at x=0 full height, others 62% bottom-aligned.
  const layoutDesktop = (rel) => {
    const L = H, S = H * 0.62;
    const xAt = (k) => (k <= -1 ? -(S + G) + (k + 1) * (S + G)
      : k <= 0 ? lerp(-(S + G), 0, k + 1)
      : k <= 1 ? lerp(0, L + G, k)
      : L + G + (k - 1) * (S + G));
    const size = Math.abs(rel) < 1 ? lerp(L, S, Math.abs(rel)) : S;
    return { x: xAt(rel), y: H - size, size };
  };

  // Mobile: vertical, active centred, neighbours slightly smaller.
  const layoutMobile = (rel) => {
    const A = Math.min(W * 0.8, H * 0.46), S = A * 0.9, g = 14;
    const d1 = A / 2 + g + S / 2;
    const a = Math.abs(rel);
    const dist = a <= 1 ? d1 * a : d1 + (a - 1) * (S + g);
    const size = a < 1 ? lerp(A, S, a) : S;
    return { x: (W - size) / 2, y: H / 2 + Math.sign(rel) * dist - size / 2, size };
  };

  const render = () => {
    const mobile = mobileMq.matches;
    planes.forEach((el, i) => {
      let rel = mod(i - p, n);
      if (mobile) { if (rel >= n / 2) rel -= n; }
      else if (rel >= n - 1) rel -= n;
      const { x, y, size } = mobile ? layoutMobile(rel) : layoutDesktop(rel);
      el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
      el.style.width = el.style.height = `${size.toFixed(2)}px`;
      el.tabIndex = Math.round(rel) === 0 ? 0 : -1;
    });
  };

  // Swap rail text with a quick mask slide.
  const swapText = (el, text) => {
    if (!el || el.textContent === text) return;
    el.style.transition = 'transform .25s cubic-bezier(.7,0,.84,0)';
    el.style.transitionDelay = '0s';
    el.style.transform = 'translateY(105%)';
    setTimeout(() => {
      el.textContent = text;
      el.style.transition = 'none';
      el.style.transform = 'translateY(-105%)';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
        el.style.transform = 'none';
      }));
    }, 250);
  };

  let primsT;
  const setActive = (i) => {
    if (i === active) return;
    const first = active === -1;
    active = i;
    const el = planes[i];
    const num = (k) => String(k).padStart(2, '0');
    if (ui.count) ui.count.textContent = `${num(i + 1)}/${num(n)}`;
    planes.forEach((pl, k) => pl.classList.toggle('is-active', k === i));
    if (first) return;
    swapText(ui.client, el.dataset.client);
    swapText(ui.role, el.dataset.role);
    swapText(ui.title, el.dataset.title);
    if (ui.detail) ui.detail.href = el.getAttribute('href');
    if (ui.mName) ui.mName.textContent = el.dataset.client;
    if (ui.mLink) ui.mLink.href = el.getAttribute('href');
    if (ui.prims && window.renderBlob) {
      clearTimeout(primsT);
      ui.prims.classList.add('is-out');
      primsT = setTimeout(() => {
        const spec = el.dataset.blobs.split(',');
        ui.prims.querySelectorAll('.blob').forEach((b, k) => {
          const [shape, color, pose] = (spec[k] || spec[0]).split(':');
          b.dataset.blob = shape;
          b.dataset.color = color;
          b.dataset.pose = pose || 'stand';
          window.renderBlob(b);
        });
        ui.prims.classList.remove('is-out');
      }, 320);
    }
  };

  let raf = 0;
  const tick = () => {
    p += (target - p) * (reduced ? 1 : 0.12);
    if (Math.abs(target - p) < 0.0005) p = target;
    render();
    setActive(mod(Math.round(p), n));
    raf = p === target && !dragging ? 0 : requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const go = (to) => { target = to; kick(); };

  // Wheel: one step per gesture (trackpads fire dozens of events).
  let acc = 0, locked = false, accT;
  stage.closest('.jh').addEventListener('wheel', (e) => {
    e.preventDefault();
    if (locked) return;
    acc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    clearTimeout(accT);
    accT = setTimeout(() => { acc = 0; }, 200);
    if (Math.abs(acc) > 30) {
      go(Math.round(target) + Math.sign(acc));
      acc = 0;
      locked = true;
      setTimeout(() => { locked = false; }, 650);
    }
  }, { passive: false });

  // Drag (mouse on desktop, touch on mobile)
  let dragging = false, moved = false, startPos = 0, startTarget = 0;
  const unit = () => {
    if (mobileMq.matches) { const A = Math.min(W * 0.8, H * 0.46); return A * 0.9 + 14; }
    return H * 0.62 + G;
  };
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true; moved = false;
    startPos = mobileMq.matches ? e.clientY : e.clientX;
    startTarget = target;
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const d = (mobileMq.matches ? e.clientY : e.clientX) - startPos;
    if (!moved && Math.abs(d) > 6) { moved = true; stage.classList.add('is-dragging'); }
    if (moved) { target = startTarget - d / unit(); kick(); }
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-dragging');
    if (moved) go(Math.round(target));
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  // Clicks: the active plane opens; any other plane becomes active.
  planes.forEach((el, i) => {
    el.addEventListener('click', (e) => {
      if (moved) { e.preventDefault(); moved = false; return; }
      if (i !== active) {
        e.preventDefault();
        let delta = mod(i - Math.round(target), n);
        if (delta > n / 2) delta -= n;
        go(Math.round(target) + delta);
      }
    });
  });

  window.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); go(Math.round(target) + 1); }
    if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); go(Math.round(target) - 1); }
  });

  // "View Project" pill follows the cursor over the planes
  const pill = stage.querySelector('[data-pill]');
  if (pill && window.matchMedia('(hover: hover)').matches) {
    let mx = 0, my = 0, px = 0, py = 0, on = false, prun = false;
    const follow = () => {
      px += (mx - px) * 0.2;
      py += (my - py) * 0.2;
      pill.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      prun = on || Math.abs(mx - px) > 0.5;
      if (prun) requestAnimationFrame(follow);
    };
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      mx = e.clientX - r.left - pill.offsetWidth / 2;
      my = e.clientY - r.top - pill.offsetHeight / 2;
      const over = !!e.target.closest('.jh-plane') && !dragging;
      if (over !== on) { on = over; pill.classList.toggle('is-on', on); }
      if (!prun) { if (!on) { px = mx; py = my; } prun = true; follow(); }
    });
    stage.addEventListener('pointerleave', () => { on = false; pill.classList.remove('is-on'); });
  }

  measure();
  render();
  setActive(0);
  window.addEventListener('resize', () => { measure(); render(); });
  mobileMq.addEventListener('change', () => { measure(); render(); });
})();
