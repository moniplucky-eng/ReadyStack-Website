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
      msg: `G'day. I'm the ReadyStack assistant. What do you need help with?`,
      opts: [
        { label: 'Online presence setup', next: 'presence' },
        { label: 'Cybersecurity', next: 'cyber' },
        { label: 'Website design & hosting', next: 'website' },
        { label: 'Managed IT support', next: 'it' },
        { label: 'Email & domain setup', next: 'email' },
        { label: 'Website maintenance', next: 'maintenance' },
        { label: 'Request a quote', next: 'quote' },
      ],
    },
    presence: {
      msg: `**Online Presence** is for businesses that need the essentials set up properly: domain, business email, secured website and social profile basics.`,
      opts: [{ label: 'Open Online Presence page', next: '_online_presence' }, { label: 'Request quote', next: 'quote' }, { label: 'Back', next: 'start' }],
    },
    cyber: {
      msg: `**ACSC Cybersecurity** adds practical protection across your website, email, domain and business access: MFA guidance, email security records, SSL, backups and access controls.`,
      opts: [{ label: 'Open Cybersecurity page', next: '_acsc_cybersecurity' }, { label: 'Request security review', next: 'quote' }, { label: 'Back', next: 'start' }],
    },
    website: {
      msg: `**Website Design, Build & Hosting** covers 1–3 page starter websites, custom design requests, secure hosting, SSL and domain connection. A frontend landing page can be delivered in around 3 days when assets are ready.`,
      opts: [{ label: 'Open Website page', next: '_website_design_build_hosting' }, { label: 'Request website quote', next: 'quote' }, { label: 'Back', next: 'start' }],
    },
    it: {
      msg: `**Managed IT Support** is for small businesses that need help with devices, access, email, network issues and on-site service requests.`,
      opts: [{ label: 'Open Managed IT page', next: '_managed_it' }, { label: 'Book IT support call', next: 'quote' }, { label: 'Back', next: 'start' }],
    },
    email: {
      msg: `**Email & Domain Setup** gives your business professional email on your own domain. Google Workspace is usually best for small businesses, with Microsoft 365 available if preferred. DNS setup is included; old email migration is not included in the standard setup.`,
      opts: [{ label: 'Open Email & Domain page', next: '_email_domain_setup' }, { label: 'Set up business email', next: 'quote' }, { label: 'Back', next: 'start' }],
    },
    maintenance: {
      msg: `**Website Updates & Maintenance** is monthly support for updates, catalogue/product changes, uptime monitoring, SSL checks and practical website care after launch.`,
      opts: [{ label: 'Open Maintenance page', next: '_website_updates_maintenance' }, { label: 'Ask about monthly support', next: 'quote' }, { label: 'Back', next: 'start' }],
    },
    quote: {
      msg: `Send a short message with what you need. We'll recommend the right ReadyStack service path.`,
      opts: [{ label: 'Open contact form', next: '_form' }, { label: 'View services', next: '_services' }, { label: 'Back', next: 'start' }],
    },
  };

  function isServicePage() {
    return /\/(online-presence|acsc-cybersecurity|website-design-build-hosting|managed-it|email-domain-setup|website-updates-maintenance|website-design|website-redesign|email-setup|website-maintenance)\/index\.html$/.test(window.location.pathname);
  }

  function pagePath(path) {
    return (isServicePage() ? '../' : '') + path;
  }

  function homeHash(id) {
    return isServicePage() ? `../index.html#${id}` : `#${id}`;
  }

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
          const contact = document.getElementById('contact');
          if (contact) contact.scrollIntoView({ behavior: 'smooth' });
          else window.location.href = homeHash('contact');
          return;
        }

        const serviceRoutes = {
          _online_presence: 'online-presence/index.html',
          _acsc_cybersecurity: 'acsc-cybersecurity/index.html',
          _website_design_build_hosting: 'website-design-build-hosting/index.html',
          _managed_it: 'managed-it/index.html',
          _email_domain_setup: 'email-domain-setup/index.html',
          _website_updates_maintenance: 'website-updates-maintenance/index.html',
        };
        if (serviceRoutes[opt.next]) {
          window.location.href = pagePath(serviceRoutes[opt.next]);
          return;
        }
        if (opt.next === '_services') {
          closeChat();
          const services = document.getElementById('services');
          if (services) services.scrollIntoView({ behavior: 'smooth' });
          else window.location.href = homeHash('services');
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

/* ─── Date/Time & Weather ─────────────────────────── */
(function initHeroDateTime() {
  const dateEl = document.getElementById('live-date');
  const timeEl = document.getElementById('live-time');

  if (!dateEl || !timeEl) return;

  function update() {
    const now = new Date();

    dateEl.textContent = now.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });

    timeEl.textContent = now.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  update();
  setInterval(update, 1000);
})();