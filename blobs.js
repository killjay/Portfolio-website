// Blob characters — the cast from the TUC mood board.
// Usage: <span class="blob" data-blob="star|square|cloud|bean|ball"
//              data-color="#FFC61A" data-pose="stand|wave|walk|peek"></span>
// Renders an inline SVG with a face, stick arms and legs. All motion lives in
// site.css (.blob__*) so prefers-reduced-motion can switch it off in one place.
(() => {
  const INK = '#1C1A17';
  const NS = 'http://www.w3.org/2000/svg';

  // Body shapes, drawn in a 120 × 160 box. cx/cy is where the face sits,
  // hipY is where the legs start, armY/armX are the shoulders.
  const shapes = {
    square: {
      body: (c) => `<rect x="20" y="16" width="80" height="78" rx="26" fill="${c}" transform="rotate(-4 60 55)"/>`,
      cx: 60, cy: 50, hipY: 92, armY: 62, armX: 22,
    },
    ball: {
      body: (c) => `<circle cx="60" cy="54" r="40" fill="${c}"/>`,
      cx: 60, cy: 50, hipY: 92, armY: 62, armX: 22,
    },
    bean: {
      body: (c) => `<rect x="36" y="6" width="48" height="94" rx="24" fill="${c}"/>`,
      cx: 60, cy: 32, hipY: 98, armY: 58, armX: 38,
    },
    star: {
      body: (c) => {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 ? 19 : 40;
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          pts.push(`${(60 + r * Math.cos(a)).toFixed(1)},${(56 + r * Math.sin(a)).toFixed(1)}`);
        }
        return `<polygon points="${pts.join(' ')}" fill="${c}" stroke="${c}" stroke-width="14" stroke-linejoin="round"/>`;
      },
      cx: 60, cy: 54, hipY: 88, armY: 60, armX: 26,
    },
    cloud: {
      body: (c) => {
        let s = `<circle cx="60" cy="54" r="32" fill="${c}"/>`;
        for (let i = 0; i < 9; i++) {
          const a = (i * 2 * Math.PI) / 9;
          s += `<circle cx="${(60 + 30 * Math.cos(a)).toFixed(1)}" cy="${(54 + 30 * Math.sin(a)).toFixed(1)}" r="15" fill="${c}"/>`;
        }
        return s;
      },
      cx: 60, cy: 50, hipY: 94, armY: 64, armX: 20,
    },
  };

  const line = (x1, y1, x2, y2) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>`;

  const render = (el) => {
    const shape = shapes[el.dataset.blob] || shapes.square;
    const color = el.dataset.color || '#FFC61A';
    const pose = el.dataset.pose || 'stand';
    const { cx, cy, hipY, armY, armX } = shape;
    const rArmX = 120 - armX;

    const face = `
      <g class="blob__eyes">
        <circle cx="${cx - 9}" cy="${cy - 4}" r="3.4" fill="${INK}"/>
        <circle cx="${cx + 9}" cy="${cy - 4}" r="3.4" fill="${INK}"/>
      </g>
      <path d="M${cx - 8} ${cy + 7} Q${cx} ${cy + 14} ${cx + 8} ${cy + 7}" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"/>`;

    // Legs pivot at the hip so the walk cycle is a plain rotate.
    const legs = `
      <g class="blob__leg blob__leg--l" style="transform-origin:${cx - 11}px ${hipY}px">
        ${line(cx - 11, hipY, cx - 11, 150)}${line(cx - 11, 150, cx - 20, 150)}
      </g>
      <g class="blob__leg blob__leg--r" style="transform-origin:${cx + 11}px ${hipY}px">
        ${line(cx + 11, hipY, cx + 11, 150)}${line(cx + 11, 150, cx + 20, 150)}
      </g>`;

    const leftArm = line(armX, armY, armX - 12, armY + 26);
    const rightArm =
      pose === 'wave'
        ? `<g class="blob__wave" style="transform-origin:${rArmX}px ${armY}px">${line(rArmX, armY, rArmX + 14, armY - 26)}</g>`
        : line(rArmX, armY, rArmX + 12, armY + 26);

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '-4 -4 128 162');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.innerHTML = `${legs}<g class="blob__body">${leftArm}${rightArm}${shape.body(color)}${face}</g>`;

    el.classList.remove('blob--stand', 'blob--wave', 'blob--walk', 'blob--peek');
    el.classList.add(`blob--${pose}`);
    el.replaceChildren(svg);
  };

  // Exposed so pages can swap a character after load (home rail).
  window.renderBlob = render;
  document.querySelectorAll('.blob[data-blob]').forEach(render);
})();
