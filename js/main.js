/* ═══════════════════════════════════════════════════════════
   main.js  —  Core controller
   Page loader · Cursor · Nav · Mobile menu · Scroll ·
   FAQ · Billing toggle · Form · Chat widget
   Australia Digital Centre  ·  Kinetic Dashboard theme
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── Utilities ──────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, ev, fn, opts) => el?.addEventListener(ev, fn, opts);
const off = (el, ev, fn) => el?.removeEventListener(ev, fn);

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

function lerp(a, b, t) { return a + (b - a) * t; }

/* ─── Page Loader ────────────────────────────────────────── */
(function initLoader() {
  const loader = $('#page-loader');
  const bar    = $('#loader-bar');
  const label  = $('#loader-label');
  if (!loader) return;

  const steps = [
    { pct: 20,  text: 'Loading assets…' },
    { pct: 55,  text: 'Connecting to command centre…' },
    { pct: 80,  text: 'Initialising dashboard…' },
    { pct: 100, text: 'Ready.' },
  ];

  let step = 0;

  function advance() {
    if (step >= steps.length) return done();
    const { pct, text } = steps[step++];
    if (bar)   bar.style.width = pct + '%';
    if (label) label.textContent = text;
    const delay = step === steps.length ? 220 : 280 + Math.random() * 200;
    setTimeout(advance, delay);
  }

  function done() {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.classList.add('loaded');
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, 300);
  }

  // Start after a brief pause so fonts load
  setTimeout(advance, 180);
})();

/* ─── Custom Cursor ──────────────────────────────────────── */
(function initCursor() {
  const cursor = $('#cursor');
  if (!cursor || window.matchMedia('(hover: none)').matches) return;

  const dot  = cursor.querySelector('.cursor-dot');
  const ring = cursor.querySelector('.cursor-ring');

  let mx = -100, my = -100;
  let rx = -100, ry = -100;
  let raf;

  on(document, 'mousemove', e => { mx = e.clientX; my = e.clientY; });

  on(document, 'mousedown', () => cursor.classList.add('cursor-click'));
  on(document, 'mouseup',   () => cursor.classList.remove('cursor-click'));

  // Interactive elements get a larger ring
  on(document, 'mouseover', e => {
    if (e.target.closest('a, button, .svc-card, .pricing-card, .testi-card, .team-card, .e8-card, .faq-q')) {
      cursor.classList.add('cursor-hover');
    }
  });

  on(document, 'mouseout', e => {
    if (e.target.closest('a, button, .svc-card, .pricing-card, .testi-card, .team-card, .e8-card, .faq-q')) {
      cursor.classList.remove('cursor-hover');
    }
  });

  function tick() {
    // Dot follows immediately
    if (dot) {
      dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
    }

    // Ring follows with lerp lag
    rx = lerp(rx, mx, 0.14);
    ry = lerp(ry, my, 0.14);
    if (ring) {
      ring.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`;
    }

    raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
})();

/* ─── Navigation ─────────────────────────────────────────── */
(function initNav() {
  const nav    = $('#nav');
  const toggle = $('#nav-toggle');
  const menu   = $('#mobile-menu');
  if (!nav) return;

  // Scroll state
  let lastY = 0;
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle('nav-scrolled', y > 20);
      lastY = y;
      ticking = false;
    });
  }

  on(window, 'scroll', onScroll, { passive: true });

  // Mobile menu
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    menu?.classList.add('open');
    toggle?.classList.add('open');
    toggle?.setAttribute('aria-expanded', 'true');
    menu?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menuOpen = false;
    menu?.classList.remove('open');
    toggle?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  on(toggle, 'click', () => menuOpen ? closeMenu() : openMenu());

  // Close on mobile link click
  $$('.mobile-link').forEach(link => on(link, 'click', closeMenu));

  // Close on outside click
  on(document, 'click', e => {
    if (menuOpen && !menu?.contains(e.target) && !toggle?.contains(e.target)) closeMenu();
  });

  // Close on Escape
  on(document, 'keydown', e => { if (e.key === 'Escape' && menuOpen) closeMenu(); });

  // Active link highlight on scroll
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link[data-nav]');
  const NAV_H    = 80;

  function updateActiveLink() {
    const y = window.scrollY + NAV_H + 40;
    let active = '';

    sections.forEach(sec => {
      if (sec.offsetTop <= y) active = sec.id;
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.nav === active);
    });
  }

  on(window, 'scroll', updateActiveLink, { passive: true });
  updateActiveLink();
})();

/* ─── Smooth Scroll ──────────────────────────────────────── */
(function initSmoothScroll() {
  on(document, 'click', e => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const id  = anchor.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : document.documentElement;
    if (!target) return;

    e.preventDefault();

    const navH   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
    const top    = target === document.documentElement
      ? 0
      : target.getBoundingClientRect().top + window.scrollY - navH;

    window.scrollTo({ top, behavior: 'smooth' });
  });
})();

/* ─── Magnetic Buttons ───────────────────────────────────── */
(function initMagnetic() {
  const magnets = $$('.magnetic');

  magnets.forEach(el => {
    on(el, 'mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * 0.32;
      const dy   = (e.clientY - cy) * 0.32;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    on(el, 'mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

/* ─── FAQ Accordion ──────────────────────────────────────── */
(function initFAQ() {
  const items = $$('.faq-item');

  items.forEach(item => {
    const trigger = item.querySelector('.faq-q');
    const answer  = item.querySelector('.faq-a');
    if (!trigger || !answer) return;

    on(trigger, 'click', () => {
      const isOpen = trigger.getAttribute('aria-expanded') === 'true';

      // Close all others
      items.forEach(other => {
        if (other === item) return;
        other.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
        other.querySelector('.faq-a')?.classList.remove('open');
      });

      // Toggle this one
      trigger.setAttribute('aria-expanded', String(!isOpen));
      answer.classList.toggle('open', !isOpen);
    });
  });
})();

/* ─── Billing Toggle ─────────────────────────────────────── */
(function initBillingToggle() {
  const toggleGroup = $('.billing-toggle');
  if (!toggleGroup) return;

  const btns    = $$('.toggle-btn', toggleGroup);
  const prices  = $$('.price-num');

  function switchBilling(mode) {
    btns.forEach(b => {
      const isActive = b.dataset.billing === mode;
      b.classList.toggle('toggle-active', isActive);
      b.setAttribute('aria-pressed', String(isActive));
    });

    prices.forEach(el => {
      const val = mode === 'annual' ? el.dataset.annual : el.dataset.monthly;
      if (!val) return;

      // Animate the number change
      el.style.opacity = '0';
      el.style.transform = 'translateY(-6px)';

      setTimeout(() => {
        el.textContent = Number(val).toLocaleString();
        el.style.transition = 'opacity .2s, transform .2s';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 120);

      setTimeout(() => { el.style.transition = ''; }, 320);
    });
  }

  btns.forEach(btn => {
    on(btn, 'click', () => switchBilling(btn.dataset.billing));
  });
})();

/* ─── Contact Form ───────────────────────────────────────── */
(function initContactForm() {
  const form    = $('#contact-form');
  const success = $('#form-success');
  const submit  = $('#form-submit');
  if (!form) return;

  function validateField(field) {
    const val = field.value.trim();
    let ok = true;

    if (field.required && !val) ok = false;
    if (field.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) ok = false;

    field.classList.toggle('invalid', !ok);
    return ok;
  }

  // Validate on blur
  $$('input, select, textarea', form).forEach(field => {
    on(field, 'blur', () => validateField(field));
    on(field, 'input', () => field.classList.remove('invalid'));
  });

  on(form, 'submit', async e => {
    e.preventDefault();

    // Validate all required fields
    const fields = $$('input[required], select[required], textarea[required]', form);
    const allValid = fields.map(validateField).every(Boolean);
    if (!allValid) {
      fields.find(f => f.classList.contains('invalid'))?.focus();
      return;
    }

    // Loading state
    submit?.classList.add('loading');
    submit.disabled = true;

    // Simulate async submission (replace with real endpoint)
    await new Promise(r => setTimeout(r, 1400));

    // Show success
    form.style.transition = 'opacity .3s';
    form.style.opacity = '0';

    setTimeout(() => {
      form.hidden = true;
      form.style.opacity = '';
      form.style.transition = '';
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  });
})();

/* ─── Chat Widget ────────────────────────────────────────── */
(function initChat() {
  const widget  = $('#chat-widget');
  const toggle  = $('#chat-toggle');
  const panel   = $('#chat-panel');
  const close   = $('#chat-close');
  const msgs    = $('#chat-messages');
  const replies = $('#chat-quick-replies');
  const badge   = $('#chat-unread');
  if (!widget || !toggle || !panel) return;

  let isOpen = false;

  /* ── Chat state machine ── */
  const BOT_DELAY = 700;

  const TREE = {
    start: {
      msg: "G'day! 👋 I'm the ADC support bot. How can I help you today?",
      opts: [
        { label: '💰 Pricing & Plans',    next: 'pricing'    },
        { label: '🛡️ Cybersecurity',       next: 'security'   },
        { label: '☁️ Cloud Migration',     next: 'cloud'      },
        { label: '🤖 AI Automation',       next: 'ai'         },
        { label: '📋 Free Digital Audit',  next: 'audit'      },
        { label: '📞 Contact a Human',     next: 'contact'    },
      ],
    },
    pricing: {
      msg: "We have three plans:\n\n• **The Base** — $299/mo (online presence, email, website)\n• **The Fort** — $799/mo (+ 24/7 monitoring, ACSC E8, cloud)\n• **Command Centre** — $1,799/mo (+ AI workflow, dedicated AM)\n\nAll month-to-month, no lock-in.",
      opts: [
        { label: 'Tell me about The Fort',         next: 'fort'    },
        { label: 'Tell me about Command Centre',   next: 'command' },
        { label: 'I want a custom quote',          next: 'audit'   },
        { label: '← Back',                        next: 'start'   },
      ],
    },
    fort: {
      msg: "**The Fort** at $799/mo is our most popular plan for established SMBs. It includes:\n\n✓ 24/7 endpoint monitoring (up to 10 devices)\n✓ ACSC Essential Eight implementation\n✓ Cloud migration to AU-hosted infrastructure\n✓ Immutable daily backups\n✓ 4-hour helpdesk SLA\n✓ Monthly IT health reports",
      opts: [
        { label: 'Get started with The Fort', next: 'audit'   },
        { label: '← Back to pricing',         next: 'pricing' },
      ],
    },
    command: {
      msg: "**Command Centre** at $1,799/mo is for growth-stage businesses. On top of The Fort, you get:\n\n✓ 1 custom AI workflow (built for your business)\n✓ Full ACSC E8 Level 2 assessment\n✓ Dedicated account manager\n✓ Monthly strategy sessions\n✓ Privacy Act compliance check\n✓ SD-WAN networking",
      opts: [
        { label: 'I want Command Centre',   next: 'audit'   },
        { label: '← Back to pricing',      next: 'pricing' },
      ],
    },
    security: {
      msg: "Security is our core. Every ADC client gets ACSC Essential Eight implementation:\n\n🔒 Multi-factor authentication\n🔒 Application control & hardening\n🔒 Patch management (apps + OS)\n🔒 Immutable backups\n🔒 24/7 EDR monitoring\n\nCommand Centre clients get a full Maturity Level 2 assessment.",
      opts: [
        { label: 'What is ACSC Essential Eight?', next: 'acsc'  },
        { label: 'Get a security audit',          next: 'audit' },
        { label: '← Back',                       next: 'start' },
      ],
    },
    acsc: {
      msg: "The ACSC Essential Eight is the Australian government's baseline cybersecurity framework — eight prioritised strategies to mitigate the most common cyber attacks.\n\nIt's not optional for businesses handling sensitive data. ADC implements it for every client as standard.",
      opts: [
        { label: 'Book a free security audit', next: 'audit'    },
        { label: '← Back to security',        next: 'security' },
      ],
    },
    cloud: {
      msg: "All ADC cloud migrations land on **100% Australian infrastructure**:\n\n☁️ Azure Australia East (Sydney)\n☁️ AWS ap-southeast-2 (Sydney)\n\nYour data never leaves Australian soil. We handle the full migration — lift-and-shift or full re-architecture.",
      opts: [
        { label: 'Start a cloud migration',  next: 'audit' },
        { label: '← Back',                  next: 'start' },
      ],
    },
    ai: {
      msg: "Our **Command Centre** plan includes one custom AI workflow built specifically for your business.\n\nPast builds include:\n• Automated invoice processing\n• Customer triage & routing\n• Compliance report generation\n• Inventory & supplier automation\n\nWe scope, build, and maintain it.",
      opts: [
        { label: 'Tell me about Command Centre', next: 'command' },
        { label: 'Book a discovery call',        next: 'audit'   },
        { label: '← Back',                      next: 'start'   },
      ],
    },
    audit: {
      msg: "A **free Digital Health Audit** is the best first step — 30 minutes, no obligation.\n\nYou'll get a scored report on your current infrastructure, security posture, and compliance gaps.\n\nUse the contact form on this page or email us at hello@australiandigitalcentre.com.au",
      opts: [
        { label: '📩 Open contact form', next: '_form'  },
        { label: '← Back',              next: 'start'  },
      ],
    },
    contact: {
      msg: "To speak with a human:\n\n📧 hello@australiandigitalcentre.com.au\n📍 Melbourne, VIC\n🕐 Mon–Fri, 8:30am–5:30pm AEST\n\nFor existing clients: 24/7 monitoring is always on.",
      opts: [
        { label: '📩 Send us a message', next: '_form' },
        { label: '← Back',              next: 'start' },
      ],
    },
  };

  /* ── Open / close ── */
  function openChat() {
    isOpen = true;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('open');
    if (badge) badge.classList.add('hidden');

    // First open: send welcome message
    if (msgs.children.length === 0) {
      setTimeout(() => sendBotMsg(TREE.start.msg, TREE.start.opts), 300);
    }
  }

  function closeChat() {
    isOpen = false;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('open');
  }

  on(toggle, 'click', () => isOpen ? closeChat() : openChat());
  on(close,  'click', closeChat);
  on(document, 'keydown', e => { if (e.key === 'Escape' && isOpen) closeChat(); });

  /* ── Message rendering ── */
  function addMsg(text, role) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg';

    const bubble = document.createElement('div');
    bubble.className = `chat-msg-bubble from-${role}`;

    // Convert **bold** markdown
    bubble.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    wrap.appendChild(bubble);
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
    return wrap;
  }

  function clearReplies() {
    replies.innerHTML = '';
  }

  function renderOptions(opts) {
    clearReplies();
    if (!opts?.length) return;

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply';
      btn.textContent = opt.label;

      on(btn, 'click', () => {
        // Show user's choice
        addMsg(opt.label, 'user');
        clearReplies();

        // Special actions
        if (opt.next === '_form') {
          closeChat();
          document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }

        // Navigate tree
        const node = TREE[opt.next];
        if (!node) return;

        // Bot typing delay
        setTimeout(() => {
          sendBotMsg(node.msg, node.opts);
        }, BOT_DELAY);
      });

      replies.appendChild(btn);
    });
  }

  function sendBotMsg(text, opts) {
    addMsg(text, 'agent');
    setTimeout(() => renderOptions(opts), 200);
  }
})();

/* ─── Hover tilt on cards ────────────────────────────────── */
(function initTilt() {
  const cards = $$('.pricing-card, .testi-card, .team-card');
  const STRENGTH = 6;

  cards.forEach(card => {
    on(card, 'mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x    = (e.clientX - rect.left) / rect.width  - 0.5;
      const y    = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${-y * STRENGTH}deg) rotateY(${x * STRENGTH}deg) translateY(-3px)`;
    });

    on(card, 'mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ─── Intersection Observer: process connector ───────────── */
(function initConnector() {
  const fill    = $('#connector-fill');
  const process = $('#process');
  if (!fill || !process) return;

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      fill.style.width = '100%';
      obs.disconnect();
    }
  }, { threshold: 0.3 });

  obs.observe(process);
})();

/* ─── Stagger .stagger-children ─────────────────────────── */
(function initStagger() {
  $$('.stagger-children').forEach(parent => {
    [...parent.children].forEach((child, i) => {
      child.style.setProperty('--i', i);
    });
  });
})();
