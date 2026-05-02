/* ============================================================
   AUSTRALIA DIGITAL CENTRE — Main JavaScript
   script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------------------------
     1. NAV — scroll effect
  ---------------------------------------------------------- */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    });
  }

  /* ----------------------------------------------------------
     2. NAV — active link highlighting on scroll
  ---------------------------------------------------------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  const setActiveLink = () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = '#' + section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === current) link.classList.add('active');
    });
  };
  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();

  /* ----------------------------------------------------------
     3. MOBILE MENU
  ---------------------------------------------------------- */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
  }

  /* ----------------------------------------------------------
     4. SMOOTH SCROLL for all anchor links
  ---------------------------------------------------------- */
  const navHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
  ) || 68;

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top, behavior: 'smooth' });
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (hamburger)  hamburger.classList.remove('open');
      }
    });
  });

  /* ----------------------------------------------------------
     5. FADE-UP — Intersection Observer
  ---------------------------------------------------------- */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach(el => observer.observe(el));
  }

  /* ----------------------------------------------------------
     5b. STAT COUNTERS — animate numbers on scroll
  ---------------------------------------------------------- */
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (statNumbers.length) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const duration = 1800;
        const start = performance.now();
        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => counterObserver.observe(el));
  }

  /* ----------------------------------------------------------
     6. CONTACT FORM
  ---------------------------------------------------------- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = contactForm.querySelector('.form-submit');
      btn.textContent = 'Sending…';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = '✓ Message sent — we\'ll be in touch soon!';
        btn.style.background = '#22c55e';
        contactForm.reset();
      }, 1400);
    });
  }

  /* ----------------------------------------------------------
     7. CLOSE MOBILE MENU helper (inline onclick)
  ---------------------------------------------------------- */
  window.closeMobileMenu = () => {
    if (mobileMenu) mobileMenu.classList.remove('open');
    if (hamburger)  hamburger.classList.remove('open');
  };

  /* ----------------------------------------------------------
     9. HERO PARTICLE SYSTEM
  ---------------------------------------------------------- */
  const canvas = document.getElementById('heroParticles');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(true); }
      reset(init) {
        this.x  = Math.random() * canvas.width;
        this.y  = init ? Math.random() * canvas.height : canvas.height + 10;
        this.r  = Math.random() * 1.5 + 0.3;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = -(Math.random() * 0.4 + 0.15);
        this.alpha = Math.random() * 0.5 + 0.1;
        this.life = 0;
        this.maxLife = Math.random() * 300 + 200;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        if (this.life > this.maxLife || this.y < -10) this.reset(false);
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,155,0,${this.alpha * Math.sin(Math.PI * this.life / this.maxLife)})`;
        ctx.fill();
      }
    }

    // Create 80 particles
    for (let i = 0; i < 80; i++) particles.push(new Particle());

    // Draw connecting lines between close particles
    const drawLines = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(245,155,0,${0.06 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLines();
      particles.forEach(p => { p.update(); p.draw(); });
      animId = requestAnimationFrame(animate);
    };
    animate();

    // Pause when hero scrolls out of view (perf)
    const heroEl = document.getElementById('hero');
    if (heroEl) {
      const heroObs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) animate();
        else cancelAnimationFrame(animId);
      });
      heroObs.observe(heroEl);
    }
  }

  /* ----------------------------------------------------------
     10. TILT EFFECT — hero card & team cards
  ---------------------------------------------------------- */
  document.querySelectorAll('.hero-card-main, .team-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      card.style.transform = `perspective(800px) rotateY(${dx * 5}deg) rotateX(${-dy * 4}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ----------------------------------------------------------
     11. MAGNETIC BUTTONS — primary CTA buttons
  ---------------------------------------------------------- */
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width  / 2);
      const dy = e.clientY - (rect.top  + rect.height / 2);
      btn.style.transform = `translate(${dx * 0.18}px, ${dy * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
      setTimeout(() => { btn.style.transition = ''; }, 400);
    });
  });


  /* ==========================================================
     8. RULE-BASED CHATBOT — Decision Tree
     No API key needed. Works immediately.
     To edit responses/options: update the TREE object below.
  ========================================================== */

  // ── Decision Tree ────────────────────────────────────────
  // Each node has: bot message, then options (label + next node id).
  // Nodes with no options show a "Start over" button.
  const TREE = {
    start: {
      msg: "G'day! 👋 I'm the ADC assistant. What can I help you with today?",
      options: [
        { label: '📦 Packages & Pricing',   next: 'packages'   },
        { label: '🛠️ Our Services',          next: 'services'   },
        { label: '🔒 Cybersecurity',         next: 'security'   },
        { label: '📅 Book a Free Audit',     next: 'audit'      },
        { label: '📞 Contact Us',            next: 'contact'    },
      ],
    },

    // ── Packages branch ──────────────────────────────────
    packages: {
      msg: 'We have three month-to-month packages — no lock-in contracts. Which would you like to know more about?',
      options: [
        { label: '🟢 The Base — $299/mo',          next: 'pkg_base'    },
        { label: '⭐ The Fort — $799/mo',           next: 'pkg_fort'    },
        { label: '🚀 Command Centre — $1,799/mo',   next: 'pkg_command' },
        { label: '🤔 Help me choose',               next: 'pkg_choose'  },
        { label: '← Back',                          next: 'start'       },
      ],
    },
    pkg_base: {
      msg: '🟢 The Base — $299/mo\n\nPerfect for brand new businesses & sole traders.\n\n✔ ABN & ASIC registration guidance\n✔ .com.au domain\n✔ Professional email (2 accounts)\n✔ Social media handle security\n✔ 3-page mobile website\n✔ Business banking referral\n✔ 30-day email support\n\nAlternative: $149 setup + $199/mo.',
      options: [
        { label: '📅 Get Started',   next: 'audit'    },
        { label: '← All Packages',   next: 'packages' },
      ],
    },
    pkg_fort: {
      msg: '⭐ The Fort — $799/mo (Most Popular)\n\nBuilt for established small businesses.\n\n✔ Everything in The Base\n✔ 24/7 endpoint monitoring (10 devices)\n✔ Wi-Fi assessment & configuration\n✔ Cloud migration to AU data centre\n✔ Daily backups, 30-day retention\n✔ ACSC Essential Eight Phase 1\n✔ Monthly IT health report\n✔ Priority helpdesk — 4-hr response SLA',
      options: [
        { label: '📅 Get Started',   next: 'audit'    },
        { label: '← All Packages',   next: 'packages' },
      ],
    },
    pkg_command: {
      msg: '🚀 Command Centre — $1,799/mo\n\nFor growth-stage businesses ready to scale.\n\n✔ Everything in The Fort\n✔ 1 custom AI workflow automated\n✔ Full ACSC Essential Eight assessment\n✔ SD-WAN failover & secure VPN\n✔ Quarterly cybersecurity review\n✔ Privacy Act compliance check\n✔ Dedicated account manager\n✔ Monthly 1-hr strategy session',
      options: [
        { label: '📅 Get Started',   next: 'audit'    },
        { label: '← All Packages',   next: 'packages' },
      ],
    },
    pkg_choose: {
      msg: "Not sure which tier fits? Tell us a bit about your business:",
      options: [
        { label: "🌱 Just starting out",          next: 'rec_base'    },
        { label: "🏢 Established, need security", next: 'rec_fort'    },
        { label: "📈 Growing & want AI tools",    next: 'rec_command' },
        { label: '← All Packages',                next: 'packages'    },
      ],
    },
    rec_base: {
      msg: "Based on what you've told us, **The Base at $299/mo** sounds like a great fit. It covers everything you need to get your business online properly — domain, email, website, and registrations sorted.\n\nWant to book a free Digital Health Check to confirm?",
      options: [
        { label: '📅 Yes, book a free audit', next: 'audit'    },
        { label: '← All Packages',            next: 'packages' },
      ],
    },
    rec_fort: {
      msg: "Sounds like **The Fort at $799/mo** is your match. You get 24/7 security monitoring, cloud migration to Australian servers, and a 4-hour helpdesk SLA — everything an established SMB needs.\n\nWant to book a free Digital Health Check?",
      options: [
        { label: '📅 Yes, book a free audit', next: 'audit'    },
        { label: '← All Packages',            next: 'packages' },
      ],
    },
    rec_command: {
      msg: "You sound ready for **Command Centre at $1,799/mo**. It adds a custom AI workflow, a dedicated account manager, and quarterly strategy sessions on top of full security coverage.\n\nWant to book a free Digital Health Check?",
      options: [
        { label: '📅 Yes, book a free audit', next: 'audit'    },
        { label: '← All Packages',            next: 'packages' },
      ],
    },

    // ── Services branch ───────────────────────────────────
    services: {
      msg: 'ADC covers your entire digital stack — no need to manage multiple vendors. What area interests you?',
      options: [
        { label: '🌐 Online Presence & Website',   next: 'svc_web'      },
        { label: '☁️ Cloud & Infrastructure',      next: 'svc_cloud'    },
        { label: '🤖 AI Automation',               next: 'svc_ai'       },
        { label: '🖥️ Managed IT Support',          next: 'svc_it'       },
        { label: '← Back',                         next: 'start'        },
      ],
    },
    svc_web: {
      msg: '🌐 Online Presence Setup\n\nWe handle everything to get your business found online:\n\n✔ ABN & ASIC business name guidance\n✔ .com.au domain procurement & management\n✔ Professional business email\n✔ Social media handle security (FB, IG, LinkedIn)\n✔ 3-page mobile-optimised website\n✔ Business banking referral',
      options: [
        { label: '📅 Get started', next: 'audit'    },
        { label: '← Services',    next: 'services'  },
      ],
    },
    svc_cloud: {
      msg: '☁️ Cloud Migration & Infrastructure\n\nWe migrate your business to secure Australian cloud infrastructure:\n\n✔ Azure Australia East or AWS ap-southeast-2\n✔ Your data never leaves Australian shores\n✔ Daily backups with 30-day retention\n✔ SD-WAN failover & secure VPN (Command Centre)',
      options: [
        { label: '📅 Get started', next: 'audit'    },
        { label: '← Services',    next: 'services'  },
      ],
    },
    svc_ai: {
      msg: '🤖 Custom AI Workflows\n\nAvailable on our Command Centre plan, we build and deploy one fully custom AI agent workflow for your business — think automated quoting, scheduling, follow-ups, or data entry.\n\nWe identify what saves you the most time, then build it.',
      options: [
        { label: '📅 Book a free audit', next: 'audit'    },
        { label: '← Services',          next: 'services'  },
      ],
    },
    svc_it: {
      msg: '🖥️ Managed IT & 24/7 Monitoring\n\n✔ Up to 10 devices monitored around the clock\n✔ Next-gen antivirus (NGAV)\n✔ Priority helpdesk — 4-hour response SLA\n✔ Monthly IT health reports\n✔ MFA enforcement across your team',
      options: [
        { label: '📅 Get started', next: 'audit'    },
        { label: '← Services',    next: 'services'  },
      ],
    },

    // ── Security branch ───────────────────────────────────
    security: {
      msg: 'Cybersecurity is built into every ADC package from day one. What would you like to know?',
      options: [
        { label: '🛡️ What is ACSC Essential Eight?', next: 'sec_e8'     },
        { label: '🔒 How is my data protected?',     next: 'sec_data'   },
        { label: '🇦🇺 Australian data sovereignty',  next: 'sec_au'     },
        { label: '← Back',                           next: 'start'      },
      ],
    },
    sec_e8: {
      msg: '🛡️ ACSC Essential Eight\n\nThe Essential Eight is the Australian Government\'s (ACSC) baseline framework to protect businesses from common cyber threats.\n\nADC aligns every client to this framework from day one — it\'s not an add-on, it\'s built in. Measures include:\n\n✔ Multi-factor authentication (MFA)\n✔ Application control\n✔ Patch management\n✔ Encrypted backups\n✔ Next-gen antivirus',
      options: [
        { label: '📅 Get protected today', next: 'audit'    },
        { label: '← Cybersecurity',        next: 'security' },
      ],
    },
    sec_data: {
      msg: '🔒 How your data is protected\n\n✔ Encrypted backups with 30-day retention\n✔ MFA enforced across all accounts\n✔ NGAV (next-gen antivirus) on all monitored devices\n✔ 24/7 endpoint monitoring\n✔ All data hosted on Australian soil\n✔ Australian Privacy Act compliant',
      options: [
        { label: '📅 Book a free audit', next: 'audit'    },
        { label: '← Cybersecurity',      next: 'security' },
      ],
    },
    sec_au: {
      msg: '🇦🇺 Australian Data Sovereignty\n\nAll ADC client data is hosted exclusively on Australian infrastructure:\n\n✔ Microsoft Azure Australia East\n✔ AWS ap-southeast-2 (Sydney)\n\nYour data never leaves Australian shores — guaranteed. This also keeps you aligned with the Australian Privacy Act.',
      options: [
        { label: '📅 Get started', next: 'audit'    },
        { label: '← Cybersecurity', next: 'security' },
      ],
    },

    // ── Audit branch ──────────────────────────────────────
    audit: {
      msg: "📅 Free Digital Health Check\n\nWe'll audit your current digital setup — website, email, security, and IT — and give you an honest recommendation. No obligation, no jargon.\n\nClick below to jump to our contact form and book yours now 👇",
      options: [
        { label: '📋 Go to Contact Form', next: 'go_contact' },
        { label: '← Back to start',      next: 'start'      },
      ],
    },
    go_contact: {
      msg: "Perfect! Scroll down to the contact form and select 'Free Digital Health Check' from the dropdown. We'll get back to you within one business day. 🙌",
      options: [
        { label: '← Back to start', next: 'start' },
      ],
      action: 'scrollToContact',
    },

    // ── Contact branch ────────────────────────────────────
    contact: {
      msg: '📞 Get In Touch\n\n📧 hello@australiadigitalcentre.com.au\n🕐 Mon–Fri, 9am–6pm AEST\n📍 Melbourne, Victoria, Australia\n\nOr use our contact form and we\'ll reply within one business day.',
      options: [
        { label: '📋 Go to Contact Form', next: 'go_contact' },
        { label: '← Back to start',      next: 'start'      },
      ],
    },
  };

  // ── DOM refs ─────────────────────────────────────────────
  const chatTrigger  = document.getElementById('chatTrigger');
  const chatWindow   = document.getElementById('chatWindow');
  const chatClose    = document.getElementById('chatClose');
  const chatMessages = document.getElementById('chatMessages');
  const chatBadge    = document.getElementById('chatBadge');

  // Hide the text input area — not needed for rule-based bot
  const chatInputArea = chatWindow ? chatWindow.querySelector('.chat-input-area') : null;
  if (chatInputArea) chatInputArea.style.display = 'none';

  if (!chatTrigger) return;

  // ── Helpers ───────────────────────────────────────────────

  /** Append a bot message bubble */
  function appendBot(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg bot';

    const avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar';
    avatar.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><path d="M4 10L8.5 14.5L16 6" stroke="#F59B00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    bubble.style.whiteSpace = 'pre-wrap';
    bubble.textContent = text;

    wrapper.append(avatar, bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /** Append a user choice bubble */
  function appendUser(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg user';

    const avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar';
    avatar.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke="#0C1B3A" stroke-width="1.5"/><path d="M3 17c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#0C1B3A" stroke-width="1.5" stroke-linecap="round"/></svg>`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    bubble.textContent = text;

    wrapper.append(avatar, bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /** Show typing dots briefly, then render the node */
  function showTypingThen(callback, delay = 600) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg bot chat-typing';

    const avatar = document.createElement('div');
    avatar.className = 'chat-msg-avatar';
    avatar.innerHTML = `<svg viewBox="0 0 20 20" fill="none"><path d="M4 10L8.5 14.5L16 6" stroke="#F59B00" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    bubble.innerHTML = `<span class="chat-typing-dot"></span><span class="chat-typing-dot"></span><span class="chat-typing-dot"></span>`;

    wrapper.append(avatar, bubble);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      wrapper.remove();
      callback();
    }, delay);
  }

  /** Render a tree node: bot message + option buttons */
  function renderNode(nodeId) {
    const node = TREE[nodeId];
    if (!node) return;

    // Run any side-effect actions
    if (node.action === 'scrollToContact') {
      setTimeout(() => {
        const target = document.getElementById('contact');
        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 400);
    }

    appendBot(node.msg);

    if (node.options && node.options.length) {
      const row = document.createElement('div');
      row.className = 'chat-quick-replies';
      row.style.flexDirection = 'column';
      row.style.alignItems = 'flex-start';

      node.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'chat-chip';
        btn.textContent = opt.label;
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.addEventListener('click', () => {
          // Remove all option rows
          chatMessages.querySelectorAll('.chat-quick-replies').forEach(r => r.remove());
          appendUser(opt.label);
          showTypingThen(() => renderNode(opt.next));
        });
        row.appendChild(btn);
      });

      chatMessages.appendChild(row);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // ── Open / Close ──────────────────────────────────────────
  let isOpen    = false;
  let welcomed  = false;

  function openChat() {
    isOpen = true;
    chatWindow.classList.add('open');
    chatWindow.setAttribute('aria-hidden', 'false');
    chatTrigger.classList.add('open');
    chatBadge.classList.add('hidden');

    if (!welcomed) {
      welcomed = true;
      showTypingThen(() => renderNode('start'), 500);
    }
  }

  function closeChat() {
    isOpen = false;
    chatWindow.classList.remove('open');
    chatWindow.setAttribute('aria-hidden', 'true');
    chatTrigger.classList.remove('open');
  }

  chatTrigger.addEventListener('click', () => isOpen ? closeChat() : openChat());
  chatClose.addEventListener('click', closeChat);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen) closeChat();
  });

});