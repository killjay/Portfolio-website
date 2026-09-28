// Café Cal motion demos.
// Every value below is copied from MPAnimation in Tokens.swift (iOS) or Motion.kt (Android).
// One virtual clock drives every demo so the Speed control can slow any moment mid-flight.

(() => {
  const root = document.querySelector('[data-motion-page]');
  if (!root) return;

  const osReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const M = { speed: 1, reduced: osReduced };

  /* ---------- Clock ---------- */
  const Clock = { t: 0, last: null, subs: new Set() };
  const frame = (ts) => {
    if (Clock.last == null) Clock.last = ts;
    const dt = Math.min(64, ts - Clock.last);
    Clock.last = ts;
    Clock.t += dt * M.speed;
    Clock.subs.forEach((f) => f(Clock.t));
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  /* ---------- Curves ---------- */
  const bezier = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (u) => ((ax * u + bx) * u + cx) * u;
    const sy = (u) => ((ay * u + by) * u + cy) * u;
    const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let u = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(u) - x;
        if (Math.abs(e) < 1e-5) return sy(u);
        const d = dx(u);
        if (Math.abs(d) < 1e-6) break;
        u -= e / d;
      }
      let lo = 0, hi = 1; u = x;
      while (hi - lo > 1e-5) { if (sx(u) < x) lo = u; else hi = u; u = (lo + hi) / 2; }
      return sy(u);
    };
  };
  // SwiftUI's named curves
  const E = {
    linear: (t) => t,
    easeIn: bezier(0.42, 0, 1, 1),
    easeOut: bezier(0, 0, 0.58, 1),
    easeInOut: bezier(0.42, 0, 0.58, 1),
  };

  // Animation.spring(response:dampingFraction:), unit mass.
  // stiffness = (2π / response)², damping = 4π · ζ / response, so ω₀ = 2π / response.
  const springCurve = (response, zeta) => {
    const w = (2 * Math.PI) / response;
    if (zeta < 1) {
      const wd = w * Math.sqrt(1 - zeta * zeta);
      return (t) => 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
    }
    return (t) => 1 - Math.exp(-w * t) * (1 + w * t);
  };
  const settleTime = (fn) => {
    let last = 0;
    for (let t = 0; t < 6; t += 1 / 240) if (Math.abs(1 - fn(t)) > 0.001) last = t;
    return last + 1 / 240;
  };
  const spring = (response, zeta) => {
    const fn = springCurve(response, zeta);
    return { spring: true, fn, dur: settleTime(fn) };
  };
  const smooth = (d) => spring(d, 1); // .smooth(duration:) is a spring with zero bounce

  /* ---------- Scoped animation runner ---------- */
  // A scope owns every animation of one demo run, so Replay can cancel them cleanly.
  const scope = () => {
    const s = { dead: false, subs: new Set() };
    s.kill = () => { s.dead = true; s.subs.forEach((f) => Clock.subs.delete(f)); s.subs.clear(); };
    s.wait = (ms) => new Promise((res) => {
      const start = Clock.t;
      const f = (t) => { if (t - start >= ms) { Clock.subs.delete(f); s.subs.delete(f); if (!s.dead) res(); } };
      s.subs.add(f); Clock.subs.add(f);
    });
    // curve: an easing fn with seconds, or a spring object
    s.anim = ({ curve = E.easeOut, dur = 300, delay = 0, update, loop = false, reverse = false }) =>
      new Promise((res) => {
        const isSpring = curve && curve.spring;
        const totalMs = isSpring ? curve.dur * 1000 : dur;
        const start = Clock.t + delay;
        const f = (t) => {
          if (t < start) return;
          let e = t - start;
          let cycle = Math.floor(e / totalMs);
          if (!loop && e >= totalMs) {
            update(isSpring ? 1 : curve(1));
            Clock.subs.delete(f); s.subs.delete(f);
            if (!s.dead) res();
            return;
          }
          let local = (e % totalMs) / totalMs;
          if (reverse && cycle % 2 === 1) local = 1 - local;
          update(isSpring ? curve.fn(local * curve.dur) : curve(local));
        };
        s.subs.add(f); Clock.subs.add(f);
      });
    return s;
  };

  const lerp = (a, b, p) => a + (b - a) * p;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  /* ---------- Haptic cue ---------- */
  // The web can't tap your wrist, so haptics show as a label beside the phone.
  // On Android browsers navigator.vibrate adds a real buzz.
  const haptic = (demo, label, ms = 8) => {
    const cue = $('.mo-haptic', demo);
    if (cue) {
      cue.textContent = label;
      cue.classList.remove('is-on');
      void cue.offsetWidth;
      cue.classList.add('is-on');
    }
    if (!M.reduced && navigator.vibrate && M.speed === 1) { try { navigator.vibrate(ms); } catch (e) {} }
  };

  /* ---------- Detent click ---------- */
  // A synthesized stand-in for the Taptic Engine: a short noise transient for the "tk"
  // plus a low sine thump that drops in pitch, both gone in ~25ms.
  // The AudioContext is only created inside a user gesture, so nothing plays uninvited.
  const Tick = { ctx: null, noise: null, last: 0 };
  const unlockAudio = () => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!Tick.ctx) {
      Tick.ctx = new AC();
      const len = Math.floor(Tick.ctx.sampleRate * 0.01);
      Tick.noise = Tick.ctx.createBuffer(1, len, Tick.ctx.sampleRate);
      const d = Tick.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    if (Tick.ctx.state === 'suspended') Tick.ctx.resume();
  };
  const tick = (strength = 1) => {
    const ac = Tick.ctx;
    if (!ac || ac.state !== 'running') return;
    const now = ac.currentTime;
    if (now - Tick.last < 0.018) return; // fast flings: don't smear clicks together
    Tick.last = now;

    const out = ac.createGain();
    out.gain.value = 0.5 * strength;
    out.connect(ac.destination);

    // Transient: filtered noise, the crisp edge of the detent
    const src = ac.createBufferSource();
    src.buffer = Tick.noise;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2600 + 600 * strength; bp.Q.value = 1.4;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.35, now);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.008);
    src.connect(bp).connect(ng).connect(out);
    src.start(now); src.stop(now + 0.012);

    // Body: a tiny pitch-dropping thump, the "weight" you feel
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.02);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.0001, now);
    og.gain.exponentialRampToValueAtTime(0.6, now + 0.002);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    osc.connect(og).connect(out);
    osc.start(now); osc.stop(now + 0.03);
  };

  /* ---------- Global controls ---------- */
  const demos = [];
  const setSeg = (group, value) => {
    $$('button', group).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
  };
  $$('[data-control]').forEach((group) => {
    const key = group.dataset.control;
    setSeg(group, key === 'speed' ? String(M.speed) : M.reduced ? 'on' : 'off');
    group.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (key === 'speed') M.speed = parseFloat(b.dataset.value);
      if (key === 'reduced') { M.reduced = b.dataset.value === 'on'; demos.forEach((d) => d.replay && d.replay()); }
      $$(`[data-control="${key}"]`).forEach((g) => setSeg(g, b.dataset.value));
    });
  });

  // Play each demo once when it first scrolls into view.
  const autoplay = (el, play) => {
    if (!('IntersectionObserver' in window)) { play(); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); play(); } });
    }, { threshold: 0.45 });
    io.observe(el);
  };

  /* =========================================================
     1. Splash: reveal, hold, exit
     ========================================================= */
  (() => {
    const demo = $('[data-demo="splash"]');
    if (!demo) return;
    const l1 = $('.sp-line--1', demo), l2 = $('.sp-line--2', demo);
    const acc = $('.sp-acc', demo), tag = $('.sp-tag', demo);
    const word = $('.sp-word', demo), splash = $('.sp-screen', demo), home = $('.sp-home', demo);
    const FEATHER = 0.22, RISE = 0.14;
    let s = null;

    const wipe = (el, p) => {
      const b = p * (1 + FEATHER), a = b - FEATHER;
      el.style.setProperty('--a', (a * 100).toFixed(2) + '%');
      el.style.setProperty('--b', (b * 100).toFixed(2) + '%');
      el.style.transform = `translateY(${((1 - p) * RISE).toFixed(4)}em)`;
    };
    const reset = () => {
      wipe(l1, 0); wipe(l2, 0);
      acc.style.opacity = 0; acc.style.transform = 'translateY(-0.34em)';
      tag.style.opacity = 0; tag.style.transform = 'translateY(0.12em)';
      word.style.transform = 'scale(1)';
      splash.style.opacity = 1; splash.style.transform = 'scale(1)';
      home.style.opacity = 0;
      [l1, l2].forEach((l) => (l.style.opacity = 1));
    };

    const play = async () => {
      if (s) s.kill();
      s = scope();
      reset();
      if (M.reduced) {
        // Reduce Motion: every layer lands in place and only fades
        [l1, l2].forEach((l) => { wipe(l, 1); l.style.opacity = 0; });
        acc.style.transform = 'none';
        const f = (v) => { [l1, l2, acc, tag].forEach((l) => (l.style.opacity = v)); tag.style.transform = 'none'; };
        await s.anim({ curve: E.easeIn, dur: 300, update: f });
        await s.wait(2200);
      } else {
        // Beat 1: reveal (splashReveal easeOut 0.7s, 0.18s line stagger)
        s.anim({ curve: E.easeOut, dur: 700, update: (p) => wipe(l1, p) });
        s.anim({ curve: E.easeOut, dur: 700, delay: 180, update: (p) => wipe(l2, p) });
        // Accent drop at 0.62s: .smooth(0.44) for travel, easeIn 0.16 for fade
        s.anim({ curve: E.easeIn, dur: 160, delay: 620, update: (p) => (acc.style.opacity = p) });
        s.anim({ curve: smooth(0.44), delay: 620, update: (p) => (acc.style.transform = `translateY(${(-0.34 * (1 - p)).toFixed(4)}em)`) });
        // Tagline at 0.9s, easeOut 0.5
        s.anim({ curve: E.easeOut, dur: 500, delay: 900, update: (p) => { tag.style.opacity = p; tag.style.transform = `translateY(${(0.12 * (1 - p)).toFixed(4)}em)`; } });
        await s.wait(1050);
        // Beat 2: hold. Breathe to 1.012 on easeInOut 2.6s while auth loads
        s.anim({ curve: E.easeInOut, dur: 2600, loop: true, reverse: true, update: (p) => (word.style.transform = `scale(${1 + 0.012 * p})`) });
        await s.wait(2600);
      }
      // Beat 3: exit, scale 1.06 + fade on easeInOut 0.45
      await s.anim({
        curve: E.easeInOut, dur: M.reduced ? 300 : 450,
        update: (p) => {
          splash.style.opacity = 1 - p;
          if (!M.reduced) splash.style.transform = `scale(${1 + 0.06 * p})`;
          home.style.opacity = p;
        },
      });
      await s.wait(1600);
      play();
    };
    const d = { replay: play };
    demos.push(d);
    $('[data-act="replay"]', demo).addEventListener('click', play);
    reset();
    autoplay(demo, play);
  })();

  /* =========================================================
     2. Capture: the real recording, tied to the Speed and Reduce Motion controls
     ========================================================= */
  (() => {
    const demo = $('[data-demo="capture"]');
    if (!demo) return;
    const v = $('video', demo);
    let started = false;
    Clock.subs.add(() => { if (v.playbackRate !== M.speed) v.playbackRate = M.speed; });
    const play = () => {
      started = true;
      v.currentTime = 0;
      // Reduce Motion: hold on the first frame until someone asks for it
      if (M.reduced) { v.pause(); return; }
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    };
    $('[data-act="video-replay"]', demo).addEventListener('click', () => {
      v.currentTime = 0;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    });
    demos.push({ replay: () => { if (started) play(); } });
    autoplay(demo, play);
  })();

  /* =========================================================
     3. Calculating → plan reveal
     ========================================================= */
  (() => {
    const demo = $('[data-demo="calc"]');
    if (!demo) return;
    const calc = $('.calc-view', demo), reveal = $('.calc-reveal', demo);
    const pct = $('.calc-pct', demo), fill = $('.calc-fill', demo), status = $('.calc-status span', demo);
    const rings = $$('.calc-ring', demo), vals = $$('.calc-val', demo);
    const btns = $$('[data-act="calc"]', demo);
    const lines = ['Analyzing your profile…', 'Calculating nutrition targets…', 'Customizing your plan…', 'Almost ready…'];
    const dur = 5000; // first run; the app shortens regenerations to 1.2s
    let s = null;

    const reset = () => {
      calc.style.opacity = 1; calc.style.visibility = 'visible';
      reveal.style.opacity = 0; reveal.style.visibility = 'hidden';
      pct.textContent = '0%'; fill.style.width = '0%';
      status.textContent = lines[0]; status.style.opacity = 1;
      rings.forEach((r) => (r.style.strokeDashoffset = 1));
      vals.forEach((v) => (v.style.opacity = 0));
    };

    const run = async () => {
      if (s) s.kill();
      s = scope();
      reset();
      btns.forEach((b) => (b.disabled = true));
      if (M.reduced) {
        // Reduce Motion: the timeline is paused, progress is set to 1
        pct.textContent = '100%'; fill.style.width = '100%'; status.textContent = lines[3];
        await s.wait(Math.min(dur, 1200));
      } else {
        let stage = 0;
        await s.anim({
          curve: E.linear, dur,
          update: async (p) => {
            pct.textContent = Math.round(p * 100) + '%';
            fill.style.width = p * 100 + '%';
            const next = Math.min(3, Math.floor(p * 4));
            if (next !== stage) {
              stage = next;
              const text = lines[next];
              // Status line swaps at 25/50/75% on easeInOut 0.3
              s.anim({ curve: E.easeInOut, dur: 150, update: (q) => (status.style.opacity = 1 - q) })
                .then(() => { status.textContent = text; return s.anim({ curve: E.easeInOut, dur: 150, update: (q) => (status.style.opacity = q) }); });
            }
          },
        });
      }
      // Overlay swap: opacity cross-fade, easeInOut 0.3
      reveal.style.visibility = 'visible';
      await s.anim({ curve: E.easeInOut, dur: 300, update: (p) => { calc.style.opacity = 1 - p; reveal.style.opacity = p; } });
      calc.style.visibility = 'hidden';
      if (M.reduced) {
        rings.forEach((r) => (r.style.strokeDashoffset = 0));
        vals.forEach((v) => (v.style.opacity = 1));
      } else {
        // Rings trace each macro card: trim 0 → 1 on easeOut 1.2s, 0.15s after the reveal
        haptic(demo, 'success', 30);
        rings.forEach((r) => s.anim({ curve: E.easeOut, dur: 1200, delay: 150, update: (p) => (r.style.strokeDashoffset = 1 - p) }));
        vals.forEach((v, i) => s.anim({ curve: E.easeOut, dur: 400, delay: 250 + i * 70, update: (p) => { v.style.opacity = p; v.style.transform = `translateY(${6 * (1 - p)}px)`; } }));
      }
      await s.wait(1400);
      btns.forEach((b) => (b.disabled = false));
    };

    btns.forEach((b) => b.addEventListener('click', run));
    demos.push({ replay: run });
    reset();
    autoplay(demo, run);
  })();

  /* =========================================================
     4. Ruler picker: detents you can feel
     ========================================================= */
  (() => {
    const demo = $('[data-demo="ruler"]');
    if (!demo) return;
    const canvas = $('.rl-canvas', demo), readout = $('.rl-readout', demo), sub = $('.rl-sub', demo);
    const ctx = canvas.getContext('2d');
    const MIN = 40, MAX = 150, STEP = 0.5, CURRENT = 78, RECOMMENDED = 68;
    const GAP = 11; // 16pt in the app, scaled to the demo phone
    let value = 72;
    let offset = (value - MIN) / STEP * GAP; // px scrolled
    let lastStep = Math.round(offset / GAP);
    let dpr = 1, W = 0, H = 0;
    let s = null;

    const size = () => {
      dpr = window.devicePixelRatio || 1;
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      draw();
    };
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const center = W / 2;
      const first = Math.floor((offset - center) / GAP) - 1;
      const last = Math.ceil((offset + center) / GAP) + 1;
      for (let i = first; i <= last; i++) {
        const v = MIN + i * STEP;
        if (v < MIN || v > MAX) continue;
        const x = center + i * GAP - offset;
        const major = v % 5 === 0, medium = v % 1 === 0;
        const h = major ? 36 : medium ? 22 : 11;
        ctx.globalAlpha = major ? 0.6 : medium ? 0.32 : 0.18;
        ctx.fillStyle = '#2C2C2E';
        const w = major ? 1.5 : 0.75;
        ctx.fillRect(x - w / 2, 8, w, h * 0.72);
        if (major) {
          ctx.globalAlpha = 0.5;
          ctx.font = '500 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(v), x, 8 + 36 * 0.72 + 13);
        }
      }
      ctx.globalAlpha = 1;
    };

    // .contentTransition(.numericText()): changed digits roll, unchanged ones stay put
    const digits = [];
    const setReadout = (v) => {
      const text = v.toFixed(1);
      while (digits.length < text.length) { const c = document.createElement('span'); c.className = 'rl-digit'; readout.insertBefore(c, readout.lastElementChild); digits.push({ el: c, ch: '' }); }
      while (digits.length > text.length) digits.pop().el.remove();
      const up = v > value;
      text.split('').forEach((ch, i) => {
        const d = digits[i];
        if (d.ch === ch) return;
        d.el.querySelectorAll('.is-out').forEach((x) => x.remove());
        const old = d.el.lastElementChild;
        const n = document.createElement('i'); n.textContent = ch;
        d.el.appendChild(n); d.ch = ch;
        if (M.reduced || !old) { if (old) old.remove(); return; }
        old.classList.add('is-out');
        const dir = up ? -1 : 1;
        const sc = scope();
        sc.anim({ curve: E.easeInOut, dur: 120, update: (p) => {
          n.style.transform = `translateY(${-dir * 60 * (1 - p)}%)`; n.style.opacity = p;
          old.style.transform = `translateY(${dir * 60 * p}%)`; old.style.opacity = 1 - p;
        } }).then(() => old.remove());
      });
      value = v;
      const diff = CURRENT - v;
      sub.textContent = diff > 0 ? `That's ${diff.toFixed(1)} kg to lose` : diff < 0 ? `That's ${(-diff).toFixed(1)} kg to gain` : 'Maintain your weight';
    };

    const onMove = () => {
      offset = Math.max(0, Math.min((MAX - MIN) / STEP * GAP, offset));
      const step = Math.round(offset / GAP);
      if (step !== lastStep) {
        lastStep = step;
        const v = MIN + step * STEP;
        setReadout(v);
        haptic(demo, 'medium impact · per step', 4);
        tick(v % 5 === 0 ? 1 : v % 1 === 0 ? 0.75 : 0.55);
      }
      draw();
    };

    let dragging = false, lastX = 0;
    canvas.addEventListener('pointerdown', (e) => {
      if (s) s.kill();
      unlockAudio();
      dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      offset -= e.clientX - lastX; lastX = e.clientX;
      onMove();
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      const from = offset, to = Math.round(offset / GAP) * GAP;
      s = scope();
      s.anim({ curve: E.easeOut, dur: 120, update: (p) => { offset = lerp(from, to, p); draw(); } });
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      unlockAudio();
      offset += (e.key === 'ArrowRight' ? 1 : -1) * GAP;
      onMove();
    });

    // "Use recommended": the ruler glides there on easeOut 0.25 and clicks through every value
    $('[data-act="recommend"]', demo).addEventListener('click', () => {
      if (s) s.kill();
      unlockAudio();
      s = scope();
      const from = offset, to = (RECOMMENDED - MIN) / STEP * GAP;
      if (M.reduced) { offset = to; onMove(); return; }
      s.anim({ curve: E.easeOut, dur: 250, update: (p) => { offset = lerp(from, to, p); onMove(); } });
    });

    setReadout(value);
    if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas); else size();
    demos.push({ replay: () => {} });
  })();

  /* =========================================================
     5. Celebrate, or don't
     ========================================================= */
  (() => {
    const demo = $('[data-demo="celebrate"]');
    if (!demo) return;
    const sheet = $('.cb-sheet', demo), glow = $('.cb-glow', demo), disc = $('.cb-disc', demo);
    const check = $('.cb-check', demo), texts = $$('.cb-fade', demo);
    const toast = $('.cb-toast', demo), idle = $('.cb-idle', demo);
    const canvas = $('.cb-confetti', demo), ctx = canvas.getContext('2d');
    const note = $('.mo-demo__note', demo);
    // Goal accent first, then protein, carbs, fats, streak, success, burned, steps
    const PALETTE = ['#5A9A4E', '#4ADE80', '#60A5FA', '#FACC15', '#FBBF24', '#34C759', '#FB923C', '#4CD964'];
    let s = null;

    const reset = () => {
      sheet.style.visibility = 'hidden'; sheet.style.opacity = 0;
      glow.style.transform = 'scale(0.6)'; glow.style.opacity = 0;
      disc.style.transform = 'scale(0.4)'; disc.style.opacity = 0;
      check.style.strokeDashoffset = 1;
      texts.forEach((t) => (t.style.opacity = 0));
      toast.style.transform = 'translateY(-140%)'; toast.style.opacity = 0;
      idle.style.opacity = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    // ConfettiBurst: 90 rectangles, upper half-circle, gravity 0.7·t², spin ±4.7 rad/s, 1.6–2.4s lives
    const confetti = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      const k = W / 393; // app points → demo px
      const parts = Array.from({ length: 90 }, () => {
        const a = Math.PI + Math.random() * Math.PI; // upward hemisphere
        const sp = 0.45 + Math.random() * 0.55;
        return {
          x0: 0.5 + (Math.random() - 0.5) * 0.06, y0: 0.42 + Math.random() * 0.04,
          vx: Math.cos(a) * sp * 0.6, vy: Math.sin(a) * sp,
          w: (8 + Math.random() * 8) * k, h: (6 + Math.random() * 4) * k,
          rot: Math.random() * Math.PI, spin: (Math.random() * 2 - 1) * 4.7,
          life: 1.6 + Math.random() * 0.8, color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        };
      });
      return s.anim({
        curve: E.linear, dur: 2400,
        update: (p) => {
          const t = p * 2.4;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.clearRect(0, 0, W, H);
          const fade = 1 - p;
          parts.forEach((q) => {
            if (t > q.life) return;
            const x = (q.x0 + q.vx * t) * W;
            const y = (q.y0 + q.vy * t * 0.5 + 0.7 * t * t * 0.5) * H;
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, (q.life - t) / 0.4)) * fade;
            ctx.translate(x, y); ctx.rotate(q.rot + q.spin * t);
            ctx.fillStyle = q.color;
            ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
            ctx.restore();
          });
        },
      });
    };

    const goal = async () => {
      if (s) s.kill();
      reset();
      s = scope();
      idle.style.opacity = 0;
      sheet.style.visibility = 'visible';
      haptic(demo, 'success', 30);
      if (M.reduced) {
        // Reduce Motion: no confetti, instant state
        sheet.style.opacity = 1;
        glow.style.transform = disc.style.transform = 'none';
        glow.style.opacity = disc.style.opacity = 1;
        check.style.strokeDashoffset = 0;
        texts.forEach((t) => (t.style.opacity = 1));
        note.textContent = 'Reduce Motion. The reward is the words, not the particles.';
        return;
      }
      s.anim({ curve: E.easeOut, dur: 200, update: (p) => (sheet.style.opacity = p) });
      // Disc and glow: cardEntry spring(0.4, 0.85) after 0.05s
      const entry = spring(0.4, 0.85);
      s.anim({ curve: entry, delay: 50, update: (p) => { glow.style.opacity = p; glow.style.transform = `scale(${0.6 + 0.4 * p})`; } });
      s.anim({ curve: entry, delay: 50, update: (p) => { disc.style.opacity = Math.min(1, p * 1.5); disc.style.transform = `scale(${0.4 + 0.6 * p})`; } });
      // Checkmark traces at 0.27s, easeOut 0.38
      s.anim({ curve: E.easeOut, dur: 380, delay: 270, update: (p) => (check.style.strokeDashoffset = 1 - p) });
      // Copy fades at 0.25 / 0.30 / 0.45 on fadeIn (easeIn 0.3)
      [250, 300, 450].forEach((d, i) => texts[i] && s.anim({ curve: E.easeIn, dur: 300, delay: d, update: (p) => (texts[i].style.opacity = p) }));
      await s.wait(120);
      note.textContent = 'Protein goal. A full celebration, once per day. Tap Nice to close.';
      await confetti();
    };

    const cap = async () => {
      if (s) s.kill();
      reset();
      s = scope();
      // Sugar cap: no sheet, no confetti. An info toast drops in (easeOut 0.4) with a light tap.
      haptic(demo, 'light impact', 6);
      note.textContent = 'Sugar cap. It still interrupts. It just doesn’t shout.';
      await s.anim({ curve: E.easeOut, dur: M.reduced ? 1 : 400, update: (p) => { toast.style.opacity = p; toast.style.transform = M.reduced ? 'none' : `translateY(${-140 * (1 - p)}%)`; } });
      await s.wait(2600);
      await s.anim({ curve: E.easeIn, dur: M.reduced ? 1 : 300, update: (p) => { toast.style.opacity = 1 - p; if (!M.reduced) toast.style.transform = `translateY(${-140 * p}%)`; } });
    };

    $$('[data-act="goal"]', demo).forEach((b) => b.addEventListener('click', goal));
    $('[data-act="dismiss"]', demo).addEventListener('click', () => { if (s) s.kill(); reset(); });
    $$('[data-act="cap"]', demo).forEach((b) => b.addEventListener('click', cap));
    demos.push({ replay: reset });
    reset();
  })();

  /* =========================================================
     6. Spring lab: one token, three platforms
     ========================================================= */
  (() => {
    const demo = $('[data-demo="lab"]');
    if (!demo) return;
    const canvas = $('.lab-plot', demo), ctx = canvas.getContext('2d');
    const rIn = $('[name="response"]', demo), zIn = $('[name="damping"]', demo);
    const rOut = $('[data-out="response"]', demo), zOut = $('[data-out="damping"]', demo);
    const swift = $('[data-code="swift"]', demo), compose = $('[data-code="compose"]', demo), css = $('[data-code="css"]', demo);
    const dot = $('.lab-dot', demo), settleOut = $('[data-out="settle"]', demo);
    let s = null;

    const render = () => {
      const r = parseFloat(rIn.value), z = parseFloat(zIn.value);
      rOut.textContent = r.toFixed(2); zOut.textContent = z.toFixed(2);
      const sp = spring(r, z);
      const stiffness = Math.pow((2 * Math.PI) / r, 2);
      swift.textContent = `.spring(response: ${r.toFixed(2)}, dampingFraction: ${z.toFixed(2)})`;
      compose.textContent = `spring(dampingRatio = ${z.toFixed(2)}f, stiffness = ${Math.round(stiffness)}f)`;
      const n = 24, pts = [];
      for (let i = 0; i <= n; i++) pts.push(+sp.fn((i / n) * sp.dur).toFixed(3));
      pts[n] = 1;
      css.textContent = `${Math.round(sp.dur * 1000)}ms linear(${pts.join(', ')})`;
      settleOut.textContent = `${Math.round(sp.dur * 1000)} ms`;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const T = 1.5, pad = 14;
      const X = (t) => pad + (t / T) * (W - pad * 2);
      const Y = (v) => H - pad - v * (H - pad * 2) * 0.78;
      ctx.strokeStyle = 'rgba(26,27,29,.14)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(pad, Y(1)); ctx.lineTo(W - pad, Y(1)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(pad, Y(0)); ctx.lineTo(W - pad, Y(0)); ctx.stroke();
      ctx.strokeStyle = '#C8632E'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) { const t = (i / 200) * T; const v = sp.fn(t); i ? ctx.lineTo(X(t), Y(v)) : ctx.moveTo(X(t), Y(v)); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(26,27,29,.45)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('1.5s', W - pad - 24, H - 2);
      ctx.fillText('target', pad, Y(1) - 5);
      return sp;
    };

    const play = () => {
      const sp = render();
      if (s) s.kill();
      s = scope();
      // leave room for up to 25% overshoot inside the lane
      const track = (dot.parentElement.clientWidth - 10 - dot.offsetWidth) / 1.25;
      if (M.reduced) { dot.style.transform = `translateX(${track}px)`; return; }
      dot.style.transform = 'translateX(0)';
      s.wait(200).then(() => s.anim({ curve: sp, update: (p) => (dot.style.transform = `translateX(${p * track}px)`) }));
    };

    [rIn, zIn].forEach((i) => i.addEventListener('input', () => { $$('[data-preset]', demo).forEach((b) => b.setAttribute('aria-pressed', 'false')); render(); }));
    [rIn, zIn].forEach((i) => i.addEventListener('change', play));
    $$('[data-preset]', demo).forEach((b) => b.addEventListener('click', () => {
      const [r, z] = b.dataset.preset.split(',');
      rIn.value = r; zIn.value = z;
      $$('[data-preset]', demo).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      play();
    }));
    $('[data-act="lab-play"]', demo).addEventListener('click', play);
    if ('ResizeObserver' in window) new ResizeObserver(render).observe(canvas);
    demos.push({ replay: play });
    render();
  })();
})();
