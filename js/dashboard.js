/* ═══════════════════════════════════════════════════════════
   dashboard.js  —  Network Topology · Score Ring · E8 Radar ·
   Endpoint List · Alert Feed · Live Clock · Data Simulation
   Australia Digital Centre  ·  Kinetic Dashboard theme
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── Live Clock ─────────────────────────────────────────── */
(function initClock() {
  const el = document.getElementById('dash-clock');
  if (!el) return;

  function tick() {
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, '0');
    const mm  = String(now.getMinutes()).padStart(2, '0');
    const ss  = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `${hh}:${mm}:${ss} AEST`;
  }

  tick();
  setInterval(tick, 1000);
})();

/* ─── Network Topology Canvas ────────────────────────────── */
(function initNetworkTopology() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, raf;

  const COLORS = {
    nodeFill:     '#1C1C1E',
    nodeStroke:   'rgba(245,158,11,0.9)',
    nodeCenter:   '#F59E0B',
    edge:         'rgba(245,158,11,0.15)',
    edgeActive:   'rgba(245,158,11,0.55)',
    ring:         'rgba(245,158,11,0.18)',
    packetAmber:  '#F59E0B',
    packetBlue:   '#3B82F6',
    labelColor:   'rgba(255,255,255,0.55)',
    warnFill:     'rgba(239,68,68,0.15)',
    warnStroke:   'rgba(239,68,68,0.8)',
  };

  // Node definitions — positions are % of canvas dimensions
  const NODE_DEFS = [
    { id: 'fw',    label: 'Firewall',    pct: [0.50, 0.12], r: 10, status: 'ok',   ring: true  },
    { id: 'sw1',   label: 'Core SW',     pct: [0.28, 0.32], r: 8,  status: 'ok',   ring: false },
    { id: 'sw2',   label: 'Edge SW',     pct: [0.72, 0.32], r: 8,  status: 'ok',   ring: false },
    { id: 'srv1',  label: 'Web Server',  pct: [0.16, 0.55], r: 7,  status: 'ok',   ring: false },
    { id: 'srv2',  label: 'DB Server',   pct: [0.38, 0.62], r: 7,  status: 'warn', ring: false },
    { id: 'srv3',  label: 'API Server',  pct: [0.62, 0.62], r: 7,  status: 'ok',   ring: false },
    { id: 'srv4',  label: 'Backup',      pct: [0.84, 0.55], r: 7,  status: 'ok',   ring: false },
    { id: 'az',    label: 'Azure AU',    pct: [0.50, 0.82], r: 9,  status: 'ok',   ring: true  },
    { id: 'ep1',   label: 'Endpoints',   pct: [0.18, 0.82], r: 6,  status: 'ok',   ring: false },
    { id: 'ep2',   label: 'Remote',      pct: [0.82, 0.82], r: 6,  status: 'ok',   ring: false },
  ];

  const EDGES = [
    ['fw',  'sw1'], ['fw',  'sw2'],
    ['sw1', 'srv1'], ['sw1', 'srv2'],
    ['sw2', 'srv3'], ['sw2', 'srv4'],
    ['srv2', 'az'], ['srv3', 'az'],
    ['sw1', 'ep1'], ['sw2', 'ep2'],
    ['az',  'ep1'], ['az',  'ep2'],
  ];

  let nodes = [];
  let packets = [];
  let pulseT = 0;

  class Packet {
    constructor(fromNode, toNode) {
      this.from   = fromNode;
      this.to     = toNode;
      this.t      = 0;
      this.speed  = 0.008 + Math.random() * 0.008;
      this.color  = Math.random() > 0.3 ? COLORS.packetAmber : COLORS.packetBlue;
      this.r      = 2.5;
    }

    update() { this.t = Math.min(this.t + this.speed, 1); }
    done()   { return this.t >= 1; }

    draw() {
      const x = this.from.x + (this.to.x - this.from.x) * this.t;
      const y = this.from.y + (this.to.y - this.from.y) * this.t;
      ctx.beginPath();
      ctx.arc(x, y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur  = 6;
      ctx.fill();
      ctx.shadowBlur  = 0;
    }
  }

  function resize() {
    const dpr  = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    buildNodes();
  }

  function buildNodes() {
    nodes = NODE_DEFS.map(def => ({
      ...def,
      x:       def.pct[0] * W,
      y:       def.pct[1] * H,
      pulse:   Math.random() * Math.PI * 2,
    }));
  }

  function nodeById(id) {
    return nodes.find(n => n.id === id);
  }

  function spawnPacket() {
    const edge = EDGES[Math.floor(Math.random() * EDGES.length)];
    const from = nodeById(edge[0]);
    const to   = nodeById(edge[1]);
    if (from && to) {
      packets.push(new Packet(from, to));
      // 40% chance reverse
      if (Math.random() < 0.4) packets.push(new Packet(to, from));
    }
  }

  let lastSpawn = 0;

  function drawEdges() {
    EDGES.forEach(([aId, bId]) => {
      const a = nodeById(aId);
      const b = nodeById(bId);
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = COLORS.edge;
      ctx.lineWidth   = 1;
      ctx.stroke();
    });
  }

  function drawNodes(t) {
    nodes.forEach(node => {
      const isWarn = node.status === 'warn';
      const pulseFactor = Math.sin(t * 2 + node.pulse);

      // Outer ring pulse
      if (node.ring) {
        const ringR = node.r + 8 + pulseFactor * 4;
        ctx.beginPath();
        ctx.arc(node.x, node.y, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = isWarn ? COLORS.warnStroke : COLORS.ring;
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle   = isWarn ? COLORS.warnFill : COLORS.nodeFill;
      ctx.strokeStyle = isWarn ? COLORS.warnStroke : COLORS.nodeStroke;
      ctx.lineWidth   = 1.5;
      ctx.fill();
      ctx.stroke();

      // Center dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isWarn ? 'rgba(239,68,68,0.9)' : COLORS.nodeCenter;
      ctx.fill();

      // Label
      ctx.font         = '9px Inter, sans-serif';
      ctx.fillStyle    = COLORS.labelColor;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label, node.x, node.y + node.r + 3);
    });
  }

  function render(ts) {
    pulseT = ts * 0.001;
    ctx.clearRect(0, 0, W, H);

    drawEdges();

    // Spawn packets periodically
    if (ts - lastSpawn > 900) {
      spawnPacket();
      lastSpawn = ts;
    }

    // Update & draw packets
    packets = packets.filter(p => !p.done());
    packets.forEach(p => { p.update(); p.draw(); });

    drawNodes(pulseT);

    raf = requestAnimationFrame(render);
  }

  // Only animate when hero section is visible
  const hero = document.getElementById('hero');
  let visible = true;
  if (hero) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(render);
    }, { threshold: 0 }).observe(hero);
  }

  resize();
  raf = requestAnimationFrame(render);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  }, { passive: true });
})();

/* ─── Security Score Ring ────────────────────────────────── */
(function initScoreRing() {
  const canvas = document.getElementById('score-ring');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  const SIZE = 90;
  const dpr  = window.devicePixelRatio || 1;

  canvas.width  = SIZE * dpr;
  canvas.height = SIZE * dpr;
  canvas.style.width  = SIZE + 'px';
  canvas.style.height = SIZE + 'px';
  ctx.scale(dpr, dpr);

  const cx     = SIZE / 2;
  const cy     = SIZE / 2;
  const R      = 36;
  const SCORE  = 84;
  const START  = -Math.PI / 2;
  const FULL   = Math.PI * 2;

  let progress = 0;
  let startedEl = false;

  function draw(p) {
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, FULL);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth   = 6;
    ctx.stroke();

    // Arc fill — gradient amber → green
    const grad = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
    grad.addColorStop(0,   '#F59E0B');
    grad.addColorStop(0.6, '#10B981');

    ctx.beginPath();
    ctx.arc(cx, cy, R, START, START + FULL * (SCORE / 100) * p);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 6;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Score text
    const displayed = Math.round(SCORE * p);
    ctx.font         = `bold 22px "Space Grotesk", sans-serif`;
    ctx.fillStyle    = '#FFFFFF';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayed, cx, cy - 4);

    ctx.font         = `10px Inter, sans-serif`;
    ctx.fillStyle    = 'rgba(255,255,255,0.45)';
    ctx.fillText('/ 100', cx, cy + 12);
  }

  function animate() {
    if (progress >= 1) { draw(1); return; }
    progress += 0.016;
    draw(Math.min(progress, 1));
    requestAnimationFrame(animate);
  }

  // Trigger when score display enters viewport
  const scoreDisplay = document.getElementById('score-display');
  const target = scoreDisplay || canvas;

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !startedEl) {
      startedEl = true;
      animate();
    }
  }, { threshold: 0.3 }).observe(target);

  // Draw initial state immediately
  draw(0);
})();

/* ─── ACSC E8 Radar Chart ────────────────────────────────── */
(function initRadarChart() {
  const canvas = document.getElementById('e8-radar');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  const SIZE = 240;
  const dpr  = window.devicePixelRatio || 1;

  canvas.width  = SIZE * dpr;
  canvas.height = SIZE * dpr;
  canvas.style.width  = SIZE + 'px';
  canvas.style.height = SIZE + 'px';
  ctx.scale(dpr, dpr);

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R  = 96;

  const AXES = [
    'App Control',
    'Patch Apps',
    'Macro Block',
    'User Admin',
    'Patch OS',
    'Multi-Factor',
    'Reg Config',
    'Backups',
  ];

  // Fort (current) and Command (target) maturity scores out of 3
  const DATA_FORT    = [2, 2, 3, 2, 2, 3, 2, 3];
  const DATA_COMMAND = [3, 3, 3, 3, 3, 3, 3, 3];

  const SIDES = AXES.length;
  let progress = 0;
  let started  = false;

  function angleOf(i) {
    return (Math.PI * 2 * i) / SIDES - Math.PI / 2;
  }

  function point(i, val, maxVal) {
    const a  = angleOf(i);
    const r  = (val / maxVal) * R;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  }

  function drawWeb() {
    const RINGS = 3;
    for (let ring = 1; ring <= RINGS; ring++) {
      const r = (ring / RINGS) * R;
      ctx.beginPath();
      for (let i = 0; i < SIDES; i++) {
        const a  = angleOf(i);
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // Spokes
    for (let i = 0; i < SIDES; i++) {
      const a  = angleOf(i);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
  }

  function drawPolygon(data, maxVal, p, fillColor, strokeColor) {
    ctx.beginPath();
    data.forEach((val, i) => {
      const v  = val * p;
      const pt = point(i, v, maxVal);
      i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.fillStyle   = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = 1.5;
    ctx.fill();
    ctx.stroke();
  }

  function drawLabels() {
    ctx.font         = '9px Inter, sans-serif';
    ctx.textBaseline = 'middle';

    AXES.forEach((label, i) => {
      const a   = angleOf(i);
      const r   = R + 14;
      const px  = cx + Math.cos(a) * r;
      const py  = cy + Math.sin(a) * r;
      ctx.fillStyle  = 'rgba(255,255,255,0.5)';
      ctx.textAlign  = Math.abs(Math.cos(a)) < 0.1 ? 'center'
                     : Math.cos(a) > 0              ? 'left'
                                                    : 'right';
      ctx.fillText(label, px, py);
    });
  }

  function render() {
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawWeb();
    drawPolygon(DATA_COMMAND, 3, progress,
      'rgba(59,130,246,0.08)',
      'rgba(59,130,246,0.3)');
    drawPolygon(DATA_FORT, 3, progress,
      'rgba(245,158,11,0.18)',
      'rgba(245,158,11,0.85)');
    drawLabels();

    if (progress < 1) {
      progress += 0.022;
      requestAnimationFrame(render);
    }
  }

  // Trigger on viewport entry
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !started) {
      started = true;
      render();
    }
  }, { threshold: 0.3 }).observe(canvas);

  // Static empty state
  ctx.clearRect(0, 0, SIZE, SIZE);
  drawWeb();
  drawLabels();
})();

/* ─── Endpoint List ──────────────────────────────────────── */
(function initEndpointList() {
  const list = document.getElementById('endpoint-list');
  if (!list) return;

  const ENDPOINTS = [
    { name: 'SRV-WEB-01',  status: 'ok',   label: 'Online'  },
    { name: 'SRV-DB-02',   status: 'warn', label: 'Patching' },
    { name: 'SRV-API-03',  status: 'ok',   label: 'Online'  },
    { name: 'WKS-LT-004',  status: 'warn', label: 'Pending' },
    { name: 'SRV-BKP-01',  status: 'ok',   label: 'Online'  },
    { name: 'SRV-FW-01',   status: 'ok',   label: 'Online'  },
    { name: 'WKS-DT-012',  status: 'ok',   label: 'Online'  },
    { name: 'SRV-MON-01',  status: 'ok',   label: 'Online'  },
  ];

  const STATUS_COLOR = {
    ok:   'var(--green)',
    warn: 'var(--amber)',
    err:  'var(--red)',
  };

  function render() {
    list.innerHTML = ENDPOINTS.map(ep => `
      <div class="ep-row">
        <span class="ep-dot" style="background:${STATUS_COLOR[ep.status]}"></span>
        <span class="ep-name">${ep.name}</span>
        <span class="ep-status">${ep.label}</span>
      </div>
    `).join('');
  }

  render();

  // Simulate occasional status change
  setInterval(() => {
    const warnIdx = ENDPOINTS.findIndex(e => e.status === 'warn');
    if (warnIdx !== -1 && Math.random() < 0.15) {
      ENDPOINTS[warnIdx].status = 'ok';
      ENDPOINTS[warnIdx].label  = 'Online';
      render();

      const epOnline = document.getElementById('ep-online');
      if (epOnline) {
        const count = ENDPOINTS.filter(e => e.status === 'ok').length;
        epOnline.textContent = count + '/' + ENDPOINTS.length;
      }
    }
  }, 12000);

  // Set initial online count
  const epOnline = document.getElementById('ep-online');
  if (epOnline) {
    const count = ENDPOINTS.filter(e => e.status === 'ok').length;
    epOnline.textContent = count + '/' + ENDPOINTS.length;
  }
})();

/* ─── Alert Feed ─────────────────────────────────────────── */
(function initAlertFeed() {
  const feed = document.getElementById('alert-feed');
  if (!feed) return;

  const ALERT_POOL = [
    { type: 'warn', msg: 'Suspicious login attempt — blocked (203.0.113.42)'    },
    { type: 'ok',   msg: 'Patch KB5031455 applied — SRV-WEB-01'                 },
    { type: 'info', msg: 'MFA challenge completed — admin@adc.com.au'            },
    { type: 'warn', msg: 'Port scan detected — source 198.51.100.7 — blocked'   },
    { type: 'ok',   msg: 'Backup verified — all 14 snapshots clean'              },
    { type: 'info', msg: 'ACSC threat feed updated — 1,204 new indicators'       },
    { type: 'ok',   msg: 'Firewall rule set pushed — 0 conflicts'                },
    { type: 'warn', msg: 'Weak cipher negotiation blocked — TLS 1.0 rejected'   },
    { type: 'ok',   msg: 'Vulnerability scan complete — 0 critical findings'     },
    { type: 'info', msg: 'Azure AD sign-in report synced — 23 accounts verified' },
    { type: 'ok',   msg: 'DNS sinkhole active — 12 domains blocked today'        },
    { type: 'warn', msg: 'USB device connected — WIN-DT-012 — auto-blocked'      },
  ];

  const COLOR = {
    ok:   'var(--green)',
    warn: 'var(--amber)',
    info: 'var(--blue)',
  };

  const ICON = {
    ok:   '✓',
    warn: '⚠',
    info: '→',
  };

  let pool    = [...ALERT_POOL].sort(() => Math.random() - 0.5);
  let shown   = [];
  const MAX   = 6;

  function timeStr() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':'
         + String(now.getMinutes()).padStart(2, '0') + ':'
         + String(now.getSeconds()).padStart(2, '0');
  }

  function addAlert(alert) {
    shown.unshift({ ...alert, time: timeStr() });
    if (shown.length > MAX) shown.pop();
    render();
  }

  function render() {
    feed.innerHTML = shown.map(a => `
      <div class="alert-item">
        <span class="alert-dot" style="background:${COLOR[a.type]}"></span>
        <span class="alert-msg">${ICON[a.type]} ${a.msg}</span>
        <span class="alert-time">${a.time}</span>
      </div>
    `).join('');
  }

  // Seed with 4 initial alerts
  for (let i = 0; i < 4; i++) {
    addAlert(pool[i % pool.length]);
  }

  // Drip in new alerts periodically
  let poolIdx = 4;
  setInterval(() => {
    if (Math.random() < 0.6) {
      addAlert(pool[poolIdx % pool.length]);
      poolIdx++;
    }
  }, 5500);
})();

/* ─── Notification Count Ticker ──────────────────────────── */
(function initNotifCount() {
  const badge = document.getElementById('notif-count');
  if (!badge) return;

  let count = 3;
  badge.textContent = count;

  setInterval(() => {
    if (Math.random() < 0.2) {
      count = Math.min(count + 1, 9);
      badge.textContent = count;
      badge.classList.remove('notif-bump');
      void badge.offsetWidth;
      badge.classList.add('notif-bump');
    }
  }, 8000);
})();

/* ─── E8 Grid Cards — Maturity Level Badges ─────────────── */
(function initE8Grid() {
  const grid = document.querySelector('.e8-grid');
  if (!grid) return;

  const CONTROLS = [
    { name: 'Application Control',     ml: 2, desc: 'Allowlisting active'    },
    { name: 'Patch Applications',      ml: 2, desc: '< 48h critical patches'  },
    { name: 'Macro Restrictions',      ml: 3, desc: 'Blocked org-wide'        },
    { name: 'User App Hardening',      ml: 2, desc: 'Browser controls active' },
    { name: 'Restrict Admin',          ml: 2, desc: 'PAM deployed'            },
    { name: 'Patch OS',                ml: 2, desc: 'Auto-update enabled'     },
    { name: 'Multi-Factor Auth',       ml: 3, desc: 'All accounts enforced'   },
    { name: 'Regular Backups',         ml: 3, desc: 'Daily verified snapshots' },
  ];

  const ML_COLOR = ['', 'var(--amber)', 'var(--blue)', 'var(--green)'];
  const ML_LABEL = ['', 'Level 1', 'Level 2', 'Level 3'];

  grid.innerHTML = CONTROLS.map(ctrl => `
    <div class="e8-card reveal">
      <div class="e8-card-head">
        <span class="e8-card-name">${ctrl.name}</span>
        <span class="e8-ml-badge" style="color:${ML_COLOR[ctrl.ml]};border-color:${ML_COLOR[ctrl.ml]}20;background:${ML_COLOR[ctrl.ml]}12">
          ${ML_LABEL[ctrl.ml]}
        </span>
      </div>
      <p class="e8-card-desc">${ctrl.desc}</p>
      <div class="e8-ml-bar">
        <div class="e8-ml-fill" style="width:${(ctrl.ml/3)*100}%;background:${ML_COLOR[ctrl.ml]}"></div>
      </div>
    </div>
  `).join('');
})();

/* ─── Service Cards — Hover metric live tick ─────────────── */
(function initServiceMetrics() {
  const cards = document.querySelectorAll('.svc-card[data-metric]');
  if (!cards.length) return;

  cards.forEach(card => {
    const metricEl = card.querySelector('.svc-live-val');
    if (!metricEl) return;

    const base  = parseFloat(card.dataset.metric);
    const unit  = card.dataset.unit || '';
    const delta = parseFloat(card.dataset.delta || '0.01');

    setInterval(() => {
      if (!card.matches(':hover')) return;
      const jitter = (Math.random() - 0.5) * delta * 2;
      const val    = (base + jitter).toFixed(2);
      metricEl.textContent = val + unit;
      metricEl.classList.remove('value-ticking');
      void metricEl.offsetWidth;
      metricEl.classList.add('value-ticking');
    }, 1800);
  });
})();

/* ─── Process Step Connectors ────────────────────────────── */
(function initConnectors() {
  const fills = document.querySelectorAll('.connector-fill');
  if (!fills.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.width = '100%';
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  fills.forEach(el => {
    el.style.width = '0%';
    obs.observe(el);
  });
})();

/* ─── Pricing FAQ Accordion ──────────────────────────────── */
(function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      // Close all
      document.querySelectorAll('.faq-q').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        const a = b.nextElementSibling;
        if (a) a.style.maxHeight = '0';
      });
      // Open clicked if it was closed
      if (!expanded) {
        btn.setAttribute('aria-expanded', 'true');
        const answer = btn.nextElementSibling;
        if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
})();

/* ─── Dashboard mini sparkline (threats over time) ──────── */
(function initThreatSparkline() {
  const svg = document.getElementById('spark-threats');
  if (!svg) return;

  const data = [8, 11, 7, 14, 9, 12, 10, 13, 11, 12];
  const W = 50, H = 24;
  const min = Math.min(...data) - 1;
  const max = Math.max(...data) + 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', pts.join(' '));
  polyline.setAttribute('fill',         'none');
  polyline.setAttribute('stroke',       '#F59E0B');
  polyline.setAttribute('stroke-width', '1.5');
  polyline.setAttribute('stroke-linecap',  'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  polyline.className = 'spark-path';

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.appendChild(polyline);
})();
