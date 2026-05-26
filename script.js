(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------------- Matrix Rain ---------------- */
  const canvas = document.getElementById('matrix');
  const ctx = canvas.getContext('2d', { alpha: false });

  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let w = 0, h = 0;
  let columns = 0;
  let drops = [];
  let rafId = null;

  function resizeMatrix() {
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * DPR);
    canvas.height = Math.floor(h * DPR);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    columns = Math.floor(w / 18);
    drops = new Array(columns).fill(0).map(() => Math.floor(Math.random() * h / 18));
  }

  function randChar() {
    const chars = '01アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%&@';
    return chars[Math.floor(Math.random() * chars.length)];
  }

  function stepMatrix() {
    ctx.fillStyle = 'rgba(5,5,5,0.08)';
    ctx.fillRect(0, 0, w, h);

    // Neon rain
    for (let i = 0; i < columns; i++) {
      const x = i * 18;
      const y = drops[i] * 18;

      const g = (i % 7 === 0) ? 'rgba(0,255,255,.85)' : 'rgba(0,255,65,.85)';
      ctx.fillStyle = g;
      ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace';
      ctx.fillText(randChar(), x, y);

      // occasional bright streak
      if (Math.random() < 0.03) {
        ctx.fillStyle = 'rgba(0,255,65,.95)';
        ctx.fillText(randChar(), x, y - 18);
      }

      if (y > h && Math.random() < 0.05) {
        drops[i] = 0;
      } else {
        drops[i] += 1;
      }
    }

    rafId = requestAnimationFrame(stepMatrix);
  }

  /* ---------------- Boot sequence ---------------- */
  const boot = $('#boot');
  const bootLines = $('#boot-lines');
  const bootStatus = $('#boot-status');

  const bootSteps = [
    { text: 'Initializing Cyber Security Portfolio...', status: 'OK' },
    { text: 'Loading Network Modules...', status: 'OK' },
    { text: 'Connecting to Secure Server...', status: 'OK' },
    { text: 'Verifying Neon Console Integrity...', status: 'OK' },
    { text: 'Access Granted...', status: 'OK' }
  ];

  function typeLine(el, text, opts = {}) {
    const { speed = 18, onDone } = opts;
    el.textContent = '';
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, speed);
  }

  async function runBoot() {
    let totalDelay = 0;
    for (const step of bootSteps) {
      const line = document.createElement('div');
      line.className = 'boot-line';
      bootLines.appendChild(line);
      typeLine(line, step.text, {
        speed: 14,
        onDone: () => {
          bootStatus.textContent = step.status;
        }
      });
      // Rough timing so we don't need precise timers.
      const approx = Math.max(520, step.text.length * 14);
      totalDelay += approx;
      await new Promise(r => setTimeout(r, approx));
    }

    await new Promise(r => setTimeout(r, 350));
    boot.classList.add('hidden');

    // Reveal app content
    const app = $('#app');
    app.removeAttribute('aria-hidden');

    // Start background
    try {
      resizeMatrix();
      stepMatrix();
    } catch {
      // ignore
    }
  }

  /* ---------------- Scroll reveals ---------------- */
  function applyRevealAnimations() {
    const sections = $$('.section-reveal');
    const items = [...sections];

    // Add directional classes by attribute mapping in CSS or by JS variants
    items.forEach((el, idx) => {
      // alternate reveal styles for variety
      if (idx % 3 === 1) el.classList.add('reveal-left');
      else if (idx % 3 === 2) el.classList.add('reveal-right');
      else el.classList.add('reveal-scale');
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            observer.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );

    items.forEach(el => observer.observe(el));
  }

  /* ---------------- Active nav ---------------- */
  function setActiveSection() {
    const links = $$('[data-nav-link]');
    const sections = links
      .map(a => $(a.getAttribute('href')))
      .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
      // Choose most visible intersecting entry
      const visible = entries.filter(e => e.isIntersecting);
      if (!visible.length) return;

      visible.sort((a, b) => (b.intersectionRatio - a.intersectionRatio));
      const top = visible[0].target;

      links.forEach(a => {
        const sel = a.getAttribute('href');
        const sec = $(sel);
        if (sec === top) a.classList.add('active');
        else a.classList.remove('active');
      });
    }, { threshold: [0.15, 0.25, 0.35] });

    sections.forEach(sec => observer.observe(sec));
  }

  /* ---------------- Smooth anchor scrolling ---------------- */
  function smoothNav() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute('href');
      const target = $(hash);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Close mobile menu
      $('#navLinks')?.classList.remove('mobile-open');
      $('#navToggle')?.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---------------- Mobile nav ---------------- */
  function mobileNav() {
    const toggle = $('#navToggle');
    const links = $('#navLinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('mobile-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    // Close on resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) {
        links.classList.remove('mobile-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------------- Typing + glitch management ---------------- */
  function startTyping() {
    const el = $('#typing');
    if (!el) return;

    const roles = [
      'Network Security Enthusiast',
      'Aspiring Penetration Tester',
      'Security Testing Practitioner'
    ];

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      const current = roles[roleIndex];

      if (!deleting) {
        el.textContent = current.slice(0, charIndex++);
        if (charIndex > current.length) {
          deleting = true;
          setTimeout(tick, 1100);
          return;
        }
      } else {
        el.textContent = current.slice(0, charIndex--);
        if (charIndex <= 0) {
          deleting = false;
          roleIndex = (roleIndex + 1) % roles.length;
        }
      }

      const delay = deleting ? 40 : 70;
      setTimeout(tick, delay + Math.random() * 30);
    };

    tick();
  }

  /* ---------------- Custom cursor with particles ---------------- */
  function cursorFX() {
    const cursor = $('#cursor');
    if (!cursor) return;

    const ring = cursor.querySelector('.cursor-ring');
    const core = cursor.querySelector('.cursor-core');

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const particles = [];

    function makeParticle(px, py) {
      const p = document.createElement('span');
      p.className = 'cursor-particle';
      p.style.left = px + 'px';
      p.style.top = py + 'px';
      document.body.appendChild(p);
      particles.push(p);
      setTimeout(() => {
        p.remove();
        const idx = particles.indexOf(p);
        if (idx >= 0) particles.splice(idx, 1);
      }, 520);
    }

    // Inject particle CSS once
    if (!document.getElementById('cursor-particle-style')) {
      const style = document.createElement('style');
      style.id = 'cursor-particle-style';
      style.textContent = `
        .cursor-particle{
          position:fixed;
          width:6px;height:6px;border-radius:999px;
          background: rgba(0,255,65,.9);
          box-shadow: 0 0 16px rgba(0,255,65,.45);
          transform: translate(-50%,-50%);
          pointer-events:none;
          animation: particleFade .52s ease-out forwards;
          z-index:9998;
        }
        @keyframes particleFade{
          0%{opacity:1; transform: translate(-50%,-50%) scale(.85)}
          100%{opacity:0; transform: translate(-50%,-50%) scale(1.7) translate(0,-14px)}
        }
      `;
      document.head.appendChild(style);
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function loop() {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;

      if (!reduceMotion) {
        if (Math.random() < 0.16) makeParticle(x, y);
      }

      requestAnimationFrame(loop);
    }

    window.addEventListener('mousemove', (e) => {
      tx = e.clientX;
      ty = e.clientY;

      // hover expand
      const isHover = e.target && (e.target.closest('button,a,input,textarea,select,[role="button"]'));
      cursor.classList.toggle('cursor-hover', Boolean(isHover));

      if (isHover && ring) ring.style.opacity = 1;
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      cursor.classList.remove('cursor-hover');
    });

    requestAnimationFrame(loop);
  }

  /* ---------------- Data & render ---------------- */
  const SKILLS = [
    { title: 'Networking', icon: '🌐', level: 92 },
    { title: 'TCP/IP', icon: '📡', level: 88 },
    { title: 'IPv4 Addressing', icon: '🧭', level: 84 },
    { title: 'Subnetting', icon: '🧩', level: 82 },
    { title: 'VLAN', icon: '🏷️', level: 80 },
    { title: 'Inter-VLAN Routing', icon: '🔀', level: 78 },
    { title: 'Trunking', icon: '🚉', level: 76 },
    { title: 'DHCP', icon: '🎛️', level: 82 },
    { title: 'DNS', icon: '🔎', level: 79 },
    { title: 'Routing & Switching', icon: '🧠', level: 86 },
    { title: 'Wireless Security', icon: '📶', level: 74 },
    { title: 'Cisco Packet Tracer', icon: '🟦', level: 80 },

    { title: 'Cybersecurity', icon: '🛡️', level: 90 },
    { title: 'Vulnerability Assessment', icon: '🧪', level: 86 },
    { title: 'Security Testing', icon: '🧬', level: 82 },
    { title: 'Footprinting', icon: '🛰️', level: 77 },
    { title: 'Reconnaissance', icon: '🔍', level: 80 },
    { title: 'Web Application Security', icon: '🌐', level: 81 },
    { title: 'Traffic Analysis', icon: '📈', level: 84 },
    { title: 'Security Monitoring', icon: '🧾', level: 75 },
    { title: 'Penetration Testing', icon: '⚡', level: 79 },

    { title: 'Operating Systems', icon: '💻', level: 85 },
    { title: 'Windows Server', icon: '🪟', level: 83 },
    { title: 'Windows 10/11', icon: '🪟', level: 87 },
    { title: 'Linux', icon: '🐧', level: 76 },
    { title: 'Kali Linux', icon: '🦊', level: 72 },

    { title: 'Programming', icon: '⌨️', level: 74 },
    { title: 'Python', icon: '🐍', level: 70 },
    { title: 'C Programming', icon: '🧱', level: 66 },
    { title: 'HTML', icon: '🧱', level: 78 },
    { title: 'CSS', icon: '🎨', level: 76 },
    { title: 'JavaScript', icon: '⚙️', level: 73 },
    { title: 'WordPress', icon: '🛠️', level: 62 },

    { title: 'Security Tools', icon: '🧰', level: 86 },
    { title: 'Nmap', icon: '🧭', level: 88 },
    { title: 'Wireshark', icon: '🛰️', level: 84 },
    { title: 'Burp Suite', icon: '🧼', level: 82 },
    { title: 'Sherlock', icon: '🕵️', level: 66 },
    { title: 'CyberChef', icon: '🧬', level: 64 },
    { title: 'DirBuster', icon: '🗂️', level: 68 },
    { title: 'Whois', icon: '📌', level: 70 },
    { title: 'nslookup', icon: '🧮', level: 72 },
    { title: 'DNSDumpster', icon: '🧪', level: 65 },

    { title: 'Learning Platforms', icon: '🎓', level: 80 },
    { title: 'TryHackMe', icon: '🟩', level: 82 },
    { title: 'PortSwigger Academy', icon: '🟦', level: 84 },
    { title: 'DVWA', icon: '🎛️', level: 78 }
  ];

  const PROJECTS = [
    {
      title: 'Enterprise Network Design and Implementation',
      desc: 'Configured VLAN segmentation, inter-VLAN routing, DHCP services, and performed traffic analysis for secure enterprise networking.',
      tech: ['Cisco Packet Tracer', 'VLANs', 'Routing', 'Switching', 'DHCP', 'Wireshark'],
      responsibilities: [
        'VLAN Segmentation',
        'Inter-VLAN Routing',
        'Trunk Links',
        'DHCP Configuration',
        'Wireless Security',
        'Traffic Analysis',
        'Windows Server Administration and Active Directory Management'
      ]
    },
    {
      title: 'Active Directory & Network Traffic Analysis',
      desc: 'Built AD DS environment with user/group/OU management and validated configuration with DNS/DHCP and monitoring.',
      tech: ['Windows Server', 'Active Directory', 'DHCP', 'DNS', 'Group Policy'],
      responsibilities: [
        'AD DS Setup',
        'User Management',
        'Group Management',
        'OU Configuration',
        'Domain Joining',
        'Security Policies',
        'Network Traffic Analysis and Monitoring'
      ]
    },
    {
      title: 'Web Application Security Testing Labs',
      desc: 'Conducted reconnaissance and performed web security testing for common vulnerabilities in legal training environments.',
      tech: ['Wireshark', 'TCP/IP', 'DNS', 'HTTP'],
      responsibilities: [
        'Packet Capture',
        'Traffic Analysis',
        'Abnormal Behavior Detection',
        'Report Generation',
        'Web Application Security Testing Labs'
      ],
      areas: ['SQL Injection', 'XSS', 'Broken Access Control', 'Authentication Vulnerabilities', 'Business Logic Flaws']
    }
  ];

  const CERTS = [
    { title: 'AI for Beginners', org: 'HP LIFE & HP Foundation', year: '2026' },
    { title: 'Professional Networking for Career Success', org: 'HP LIFE & HP Foundation', year: '2026' },
    { title: 'CCNA: Introduction to Networks', org: 'Cisco Networking Academy', year: '2025' },
    { title: 'Introduction to Python', org: 'Cisco Networking Academy', year: '2025' }
  ];

  const ACHIEVEMENTS = [
    '[✓] Completed TryHackMe cybersecurity labs',
    '[✓] Practiced Web Security using PortSwigger Academy',
    '[✓] Conducted SQL Injection and XSS testing in legal lab environments',
    '[✓] Designed enterprise networking projects',
    '[✓] Performed network traffic analysis with Wireshark',
    '[✓] Built Active Directory administration skills'
  ];

  function renderSkills() {
    const grid = $('#skillsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const s of SKILLS) {
      const card = document.createElement('div');
      card.className = 'glass skill-card section-item';

      card.innerHTML = `
        <div class="card-glow" aria-hidden="true"></div>
        <div class="skill-title">
          <div class="skill-ico" aria-hidden="true"><span>${s.icon}</span></div>
          <div>${s.title}</div>
        </div>
        <div class="skill-desc">Hover for neon verification • Target: ${s.level}%</div>
        <div class="progress">
          <div class="label"><span>Competency</span><span>${s.level}%</span></div>
          <div class="bar" aria-label="Skill competency">
            <i style="width:${s.level}%"></i>
          </div>
        </div>
      `;

      // glow mouse-position
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.querySelector('.card-glow').style.setProperty('--x', x + '%');
        card.querySelector('.card-glow').style.setProperty('--y', y + '%');
      });

      grid.appendChild(card);
    }
  }

  function renderProjects() {
    const grid = $('#projectsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    PROJECTS.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'glass project-card';

      const techChips = (p.tech || []).map(t => `<span class="chip">${t}</span>`).join('');
      const resp = (p.responsibilities || []).map(r => `<li>${r}</li>`).join('');
      const areas = p.areas ? `<div class="section-subtitle" style="margin:10px 0 0;color:rgba(231,255,233,.7);font-weight:800">Key Areas: ${p.areas.join(', ')}</div>` : '';
      const extra = p.areas || p.areas === '' ? '' : '';

      card.innerHTML = `
        <div class="card-glow" aria-hidden="true"></div>
        <div class="project-title">${p.title}</div>
        <div class="tech">${techChips}</div>
        <div class="skill-desc">${p.desc}</div>
        <ul class="list">${resp}</ul>
        ${areas}
        ${extra}
      `;

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.querySelector('.card-glow').style.setProperty('--x', x + '%');
        card.querySelector('.card-glow').style.setProperty('--y', y + '%');
      });

      grid.appendChild(card);
    });
  }

  function renderCerts() {
    const grid = $('#certsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    CERTS.forEach(c => {
      const card = document.createElement('div');
      card.className = 'glass cert-card';
      card.innerHTML = `
        <div class="card-glow" aria-hidden="true"></div>
        <div class="badge">
          <span class="mark" aria-hidden="true"></span>
          <span>${c.title}</span>
        </div>
        <div class="cert-meta">${c.org} • ${c.year}</div>
      `;
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.querySelector('.card-glow').style.setProperty('--x', x + '%');
        card.querySelector('.card-glow').style.setProperty('--y', y + '%');
      });
      grid.appendChild(card);
    });
  }

  function renderAchievements() {
    const body = $('#logBody');
    if (!body) return;
    body.innerHTML = '';

    const base = document.createDocumentFragment();
    ACHIEVEMENTS.forEach((line) => {
      const div = document.createElement('div');
      div.className = 'log-line';
      div.textContent = line;
      base.appendChild(div);
    });
    body.appendChild(base);

    const lines = $$('.log-line', body);
    lines.forEach((el, i) => {
      setTimeout(() => el.classList.add('show'), 250 + i * 320);
    });
  }

  /* ---------------- Contact form (demo) ---------------- */
  function contactFX() {
    const form = $('#contactForm');
    const status = $('#formStatus');
    const copyBtn = $('#copyEmailBtn');

    copyBtn?.addEventListener('click', async () => {
      const email = 'siddacharya63@gmail.com';
      try {
        await navigator.clipboard.writeText(email);
        copyBtn.textContent = 'Copied ✓';
        setTimeout(() => (copyBtn.textContent = 'Copy Email'), 1200);
      } catch {
        status.textContent = 'Clipboard blocked by browser. Copy manually.';
        setTimeout(() => (status.textContent = ''), 2200);
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();

      const sendBtn = $('#sendBtn');
      status.textContent = '';

      // cyber send animation
      if (sendBtn) sendBtn.classList.add('sending');

      setTimeout(() => {
        if (sendBtn) sendBtn.classList.remove('sending');
        status.textContent = `secure_send(): Message queued (demo). Thanks, ${name || 'operator'}!`;
        form.reset();
      }, 900);
    });
  }

  /* ---------------- Init Intersection Observer for typed items ---------------- */
  function animateBarsOnView() {
    const bars = $$('.bar > i');
    if (!bars.length) return;

    // Set to 0 initially
    const targets = bars.map(i => {
      const w = i.style.width || getComputedStyle(i).width;
      const pct = i.style.width.includes('%') ? parseFloat(i.style.width) : null;
      i.dataset.targetPct = pct ?? '0';
      i.style.width = '0%';
      return i;
    });

    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target;
        const pct = parseFloat(el.dataset.targetPct || '0');
        el.style.width = pct + '%';
        observer.unobserve(el);
      }
    }, { threshold: 0.18 });

    targets.forEach(i => observer.observe(i));
  }

  /* ---------------- Run ---------------- */
  function init() {
    // Prevent cursor hover class on touch devices
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse) {
      const c = $('#cursor');
      if (c) c.style.display = 'none';
    } else {
      cursorFX();
    }

    runBoot();

    // If reduced motion, avoid canvas/typing intensity
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion) startTyping();
    else {
      const el = $('#typing');
      if (el) el.textContent = 'Security Testing Practitioner';
    }

    renderSkills();
    renderProjects();
    renderCerts();
    renderAchievements();

    applyRevealAnimations();
    setActiveSection();
    smoothNav();
    mobileNav();
    contactFX();
    animateBarsOnView();

    window.addEventListener('resize', () => {
      // Only resize matrix if it's active
      if (rafId) resizeMatrix();
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

