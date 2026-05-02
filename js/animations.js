/* ═══════════════════════════════════════════════════════════
   animations.js  —  Scroll reveal · Hero particles ·
   Stat counters · Typewriter terminal · Sparklines ·
   Number ticking · Section entrance orchestration
   Australia Digital Centre  ·  Kinetic Dashboard theme
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── Scroll Reveal (IntersectionObserver) ───────────────── */
(function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.reveal, .reveal-left, .reveal-right, .reveal-scale'
  );
  if (!targets.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  });

  targets.forEach(el => observer.observe(el));
})();

/* ─── Stat Counters ──────────────────────────────────────── */
(function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  function animateCounter(el) {
    const target  = parseInt(el.dataset.count, 10);
    const suffix  = el.dataset.suffix || '';
    const dur     = 1600;
    const start   = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / dur, 1);
      // Ease out quart
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(eased * target);
      el.textContent = current.toLocaleString() + suffix;
      el.classList.add('counting');
      if (progress < 1) requestAnimationFrame(tick);
      else el.classList.remove('counting');
    }

    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
})();

/* ─── Hero Particle System ───────────────────────────────── */
(function initHeroParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles, raf;
  let paused = false;

  const PARTICLE_COUNT = 55;
  const MAX_DIST       = 140;
  const PARTICLE_COLOR = '245,158,11';   // amber
  const LINE_COLOR     = '180,140,60';

  class Particle {
    constructor() { this.reset(true); }

    reset(random = false) {
      this.x  = random ? Math.random() * W : (Math.random() > 0.5 ? -4 : W + 4);
      this.y  = Math.random() * H;
      this.r  = 1 + Math.random() * 2;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.opacity = 0.2 + Math.random() * 0.5;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${PARTICLE_COLOR},${this.opacity})`;
      ctx.fill();
    }
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width  = rect.width  * dpr;
    H = canvas.height = rect.height * dpr;
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);
    W = rect.width;
    H = rect.height;
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > MAX_DIST) continue;
        const alpha = (1 - dist / MAX_DIST) * 0.18;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(${LINE_COLOR},${alpha})`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();
      }
    }
  }

  function render() {
    if (paused) { raf = requestAnimationFrame(render); return; }
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    raf = requestAnimationFrame(render);
  }

  // Pause when hero is out of view
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    const visObs = new IntersectionObserver(entries => {
      paused = !entries[0].isIntersecting;
    }, { threshold: 0 });
    visObs.observe(heroSection);
  }

  init();
  render();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  }, { passive: true });
})();

/* ─── Terminal Typewriter ────────────────────────────────── */
(function initTerminal() {
  const output = document.getElementById('terminal-output');
  if (!output) return;

  const LINES = [
    { type: 'cmd',  text: './adc-status --live' },
    { type: 'ok',   text: '✓ Endpoint monitoring: ACTIVE (8/10 online)' },
    { type: 'ok',   text: '✓ ACSC E8 compliance: MATURITY LEVEL 2' },
    { type: 'ok',   text: '✓ Azure AU East: CONNECTED (99.97% uptime)' },
    { type: 'ok',   text: '✓ Backups: VERIFIED (3h ago, all snapshots clean)' },
    { type: 'warn', text: '⚠ Endpoint WIN-LT-004: Patch pending (low risk)' },
    { type: 'ok',   text: '✓ Firewall rules: 1,847 active, 0 violations' },
    { type: 'info', text: '→ Threats blocked today: 12 (142 this month)' },
    { type: 'ok',   text: '✓ MFA: Enforced on all 23 accounts' },
    { type: 'info', text: '→ Next security review: 2025-06-15' },
    { type: 'ok',   text: '✓ All systems operational.' },
  ];

  const COLOR_MAP = {
    cmd:  'terminal-cmd',
    ok:   'terminal-out-ok',
    warn: 'terminal-out-warn',
    info: 'terminal-out-info',
  };

  let lineIdx = 0;
  let charIdx = 0;
  let currentEl = null;
  let timer = null;
  let started = false;

  function buildLine(line) {
    const row    = document.createElement('div');
    row.className = 'terminal-line';

    if (line.type === 'cmd') {
      const prompt = document.createElement('span');
      prompt.className = 'terminal-prompt';
      prompt.textContent = '→';
      row.appendChild(prompt);
    }

    const text = document.createElement('span');
    text.className = COLOR_MAP[line.type] || 'terminal-cmd';
    row.appendChild(text);

    output.appendChild(row);
    return text;
  }

  function typeChar() {
    if (lineIdx >= LINES.length) {
      // Add blinking cursor at end
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      output.appendChild(cursor);
      return;
    }

    const line = LINES[lineIdx];

    if (charIdx === 0) {
      currentEl = buildLine(line);
    }

    if (charIdx < line.text.length) {
      currentEl.textContent += line.text[charIdx];
      charIdx++;
      output.scrollTop = output.scrollHeight;
      // Faster for output lines, realistic for command
      const delay = line.type === 'cmd' ? 45 : 8;
      timer = setTimeout(typeChar, delay);
    } else {
      charIdx = 0;
      lineIdx++;
      // Pause between lines
      const pause = line.type === 'cmd' ? 280 : 60;
      timer = setTimeout(typeChar, pause);
    }
  }

  // Start when terminal scrolls into view
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      setTimeout(typeChar, 600);
      obs.disconnect();
    }
  }, { threshold: 0.4 });

  obs.observe(output);
})();

/* ─── SVG Sparklines ─────────────────────────────────────── */
(function initSparklines() {
  const sparkEl = document.getElementById('spark-uptime');
  if (!sparkEl) return;

  // Uptime sparkline — near-perfect with tiny dips
  const data = [99.94, 99.97, 99.98, 99.95, 99.99, 99.96, 99.97, 99.98, 99.99, 99.97];

  const W = 50, H = 24;
  const min = Math.min(...data) - 0.01;
  const max = Math.max(...data) + 0.01;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', pts.join(' '));
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', '#10B981');
  polyline.setAttribute('stroke-width', '1.5');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  polyline.className = 'spark-path';

  // Animated fill area
  const areaPath = [
    `M0,${H}`,
    ...data.map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      return `L${x.toFixed(1)},${y.toFixed(1)}`;
    }),
    `L${W},${H}Z`
  ].join(' ');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', areaPath);
  path.setAttribute('fill', 'url(#spark-grad)');
  path.setAttribute('opacity', '0.4');

  // Gradient def
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#10B981" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#10B981" stop-opacity="0"/>
    </linearGradient>
  `;

  sparkEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
  sparkEl.appendChild(defs);
  sparkEl.appendChild(path);
  sparkEl.appendChild(polyline);
})();

/* ─── Live Value Ticker ──────────────────────────────────── */
(function initValueTicker() {
  const threatsEl = document.getElementById('threats-count');
  if (!threatsEl) return;

  let base = 142;

  setInterval(() => {
    if (Math.random() < 0.25) {
      base++;
      threatsEl.textContent = base;
      threatsEl.classList.remove('value-ticking');
      // Force reflow to restart animation
      void threatsEl.offsetWidth;
      threatsEl.classList.add('value-ticking');
    }
  }, 4000);
})();

/* ─── Section eyebrow stagger ────────────────────────────── */
(function initSectionHeads() {
  const heads = document.querySelectorAll('.section-head');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el      = entry.target;
      const eyebrow = el.querySelector('.eyebrow');
      const h2      = el.querySelector('.section-h2');
      const sub     = el.querySelector('.section-subline');
      const toggle  = el.querySelector('.billing-toggle');

      [eyebrow, h2, sub, toggle].forEach((node, i) => {
        if (!node) return;
        node.style.transitionDelay = `${i * 80}ms`;
        node.classList.add('revealed');
      });

      obs.unobserve(el);
    });
  }, { threshold: 0.25 });

  heads.forEach(h => {
    const children = [...h.children];
    children.forEach(c => {
      if (!c.classList.contains('reveal')) {
        c.classList.add('reveal');
      }
    });
    obs.observe(h);
  });
})();

/* ─── Ambient orbs (inject into hero) ───────────────────── */
(function initOrbs() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  ['orb orb-1', 'orb orb-2'].forEach(cls => {
    const div = document.createElement('div');
    div.className = cls;
    div.setAttribute('aria-hidden', 'true');
    hero.appendChild(div);
  });
})();

/* ─── Scroll progress bar (thin amber line at top) ──────── */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    height: 2px;
    background: var(--amber);
    z-index: 9999;
    width: 0%;
    transition: width 60ms linear;
    pointer-events: none;
    transform-origin: left;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const doc  = document.documentElement;
    const pct  = (window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100;
    bar.style.width = Math.min(pct, 100) + '%';
  }, { passive: true });
})();
