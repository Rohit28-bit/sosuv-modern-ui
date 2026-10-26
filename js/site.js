/**
 * SOSUV — site interactions
 * Header state, mobile menu, platform accordion, scroll reveal,
 * office clocks, FIX wire decoder, contact form.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initPlatforms();
  initReveal();
  initOffices();
  initWire();
  initContactForm();
  initNewsletter();
  initQuotes();
  initWireBackground();
  initInlineVideos();
  initTyper();
  initHeroSlideshow();
});

/* ---------- Footer newsletter ---------- */
function initNewsletter() {
  const form = document.getElementById('newsletterForm');
  const note = document.getElementById('nlNote');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.querySelector('input').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      note.textContent = 'Please enter a valid email.';
      return;
    }
    // TODO: connect to your mailing service (Mailchimp, Buttondown, etc.)
    window.location.href = `mailto:sales@sosuvconsulting.com?subject=${encodeURIComponent('Newsletter sign-up')}&body=${encodeURIComponent(`Please add ${email} to the Sosuv engineering notes.`)}`;
    note.textContent = 'Thanks — opening your email client to confirm.';
    form.reset();
  });
}

/* ---------- Header ---------- */
function initHeader() {
  const header = document.querySelector('.site-header');
  const btn = header.querySelector('.menu-btn');

  const panels = [...document.querySelectorAll('[data-media]')];
  const stacks = [...document.querySelectorAll('[data-stack]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Each video panel is sticky; the stack after it slides over it.
  // --p goes 0 → 1 as the stack covers the panel. Videos pause once covered.
  const onScroll = () => {
    const hh = header.offsetHeight;
    const vh = window.innerHeight;

    const overContent = stacks.some(s => {
      const r = s.getBoundingClientRect();
      return r.top <= hh && r.bottom > hh;
    });
    header.classList.toggle('on-media', !overContent);
    header.classList.toggle('scrolled', overContent);

    panels.forEach(panel => {
      const next = panel.nextElementSibling;
      const pr = panel.getBoundingClientRect();
      const nextTop = next ? next.getBoundingClientRect().top : vh;
      const p = Math.min(1, Math.max(0, 1 - nextTop / vh));
      if (!reduceMotion) panel.style.setProperty('--p', p.toFixed(3));

      const visible = pr.bottom > 0 && pr.top < vh && nextTop > 0;
      const video = panel.querySelector('video');
      if (!video) return;
      if (visible && video.paused) video.play().catch(() => {});
      else if (!visible && !video.paused) video.pause();
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  btn.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  header.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => {
    header.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));
}

/* ---------- Platforms: list + detail panel ---------- */
// Desktop: hover or click a name to show its panel. Phones: tap to open/close.
function initPlatforms() {
  const items = [...document.querySelectorAll('.pf-item')];
  if (!items.length) return;
  const desktop = window.matchMedia('(min-width: 901px)');

  function activate(item, toggle = false) {
    const closing = toggle && item.classList.contains('active') && !desktop.matches;
    items.forEach(it => {
      const on = it === item && !closing;
      it.classList.toggle('active', on);
      it.querySelector('.pf-tab').setAttribute('aria-expanded', String(on));
    });
  }

  items.forEach(item => {
    const tab = item.querySelector('.pf-tab');
    tab.addEventListener('click', () => activate(item, true));
    tab.addEventListener('mouseenter', () => { if (desktop.matches) activate(item); });
    tab.addEventListener('focus', () => { if (desktop.matches) activate(item); });
  });

  // Always keep one panel open on desktop
  desktop.addEventListener('change', () => {
    if (desktop.matches && !items.some(it => it.classList.contains('active'))) activate(items[0]);
  });
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(el => io.observe(el));
}

/* ---------- Office clocks ---------- */
function initOffices() {
  const offices = document.querySelectorAll('.office[data-tz]');

  function tick() {
    const now = new Date();
    offices.forEach(o => {
      const tz = o.dataset.tz;
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(now);
      const get = type => (parts.find(p => p.type === type) || {}).value;
      const h = parseInt(get('hour'), 10) % 24;
      const m = parseInt(get('minute'), 10);
      const day = get('weekday');

      const decimal = h + m / 60;
      const weekend = day === 'Sat' || day === 'Sun';
      const open = !weekend && decimal >= parseFloat(o.dataset.open) && decimal < parseFloat(o.dataset.close);

      o.querySelector('.t').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      o.querySelector('.dot').classList.toggle('open', open);
      o.querySelector('.state').textContent = open ? 'Market open' : 'Market closed';
    });
  }
  tick();
  setInterval(tick, 15000);
}

/* ---------- FIX wire decoder ---------- */
const FIX_TAGS = {
  6: 'AvgPx', 8: 'BeginString', 9: 'BodyLength', 10: 'CheckSum', 11: 'ClOrdID', 14: 'CumQty',
  17: 'ExecID', 31: 'LastPx', 32: 'LastQty', 34: 'MsgSeqNum', 35: 'MsgType', 37: 'OrderID',
  38: 'OrderQty', 39: 'OrdStatus', 40: 'OrdType', 41: 'OrigClOrdID', 44: 'Price', 49: 'SenderCompID',
  52: 'SendingTime', 54: 'Side', 55: 'Symbol', 56: 'TargetCompID', 58: 'Text', 59: 'TimeInForce',
  60: 'TransactTime', 150: 'ExecType', 151: 'LeavesQty'
};

const FIX_ENUMS = {
  35: { 0: 'Heartbeat', A: 'Logon', 5: 'Logout', D: 'New Order Single', 8: 'Execution Report', F: 'Cancel Request', G: 'Cancel/Replace Request', 3: 'Reject' },
  39: { 0: 'New', 1: 'Partially filled', 2: 'Filled', 4: 'Canceled', 5: 'Replaced', 8: 'Rejected' },
  40: { 1: 'Market', 2: 'Limit', 3: 'Stop', 4: 'Stop limit' },
  54: { 1: 'Buy', 2: 'Sell', 5: 'Sell short' },
  59: { 0: 'Day', 1: 'Good till cancel', 3: 'Immediate or cancel', 4: 'Fill or kill', 6: 'Good till date' },
  150: { 0: 'New', 4: 'Canceled', 5: 'Replaced', 8: 'Rejected', F: 'Trade' }
};

const SOH = '\x01';

function splitFields(raw) {
  return raw.trim().replace(/\|/g, SOH).split(SOH).filter(Boolean).map(f => {
    const i = f.indexOf('=');
    return i < 0 ? { tag: f, value: '' } : { tag: f.slice(0, i), value: f.slice(i + 1) };
  });
}

// BodyLength: bytes after the 9= field up to and including the SOH before 10=.
// CheckSum: sum of all bytes before the 10= field, mod 256.
function computeTrailer(fields) {
  const body = fields.filter(f => !['8', '9', '10'].includes(f.tag)).map(f => `${f.tag}=${f.value}${SOH}`).join('');
  const head = fields.filter(f => f.tag === '8').map(f => `${f.tag}=${f.value}${SOH}`).join('');
  const bodyLength = new TextEncoder().encode(body).length;
  const pre = new TextEncoder().encode(`${head}9=${bodyLength}${SOH}${body}`);
  const checksum = String(pre.reduce((s, b) => s + b, 0) % 256).padStart(3, '0');
  return { bodyLength: String(bodyLength), checksum };
}

function normalise(raw) {
  const fields = splitFields(raw);
  const { bodyLength, checksum } = computeTrailer(fields);
  return fields.map(f => {
    if (f.tag === '9') return `9=${bodyLength}`;
    if (f.tag === '10') return `10=${checksum}`;
    return `${f.tag}=${f.value}`;
  }).join('|') + '|';
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Standard header and trailer tags; everything else is message body.
const HEADER_TAGS = new Set(['8', '9', '35', '34', '43', '49', '50', '52', '56', '57', '97', '115', '122', '128']);
const TRAILER_TAGS = new Set(['10', '89', '93']);
const kindOf = tag => HEADER_TAGS.has(tag) ? 'header' : TRAILER_TAGS.has(tag) ? 'trailer' : 'body';

function initWire() {
  const input = document.getElementById('wireInput');
  const out = document.getElementById('wireOut');
  const strip = document.getElementById('wireStrip');
  const status = document.getElementById('wireStatus');
  const presets = document.querySelectorAll('.wire-presets button');
  if (!input) return;

  function render() {
    const fields = splitFields(input.value);
    if (!fields.length) {
      out.innerHTML = '';
      strip.innerHTML = '';
      status.innerHTML = '<span>Waiting for a message…</span>';
      return;
    }

    strip.innerHTML = fields.map((f, i) =>
      `<span class="tok k-${kindOf(f.tag)}" data-i="${i}"><b>${escapeHtml(f.tag)}=</b>${escapeHtml(f.value)}</span>`
    ).join('');

    out.innerHTML = fields.map((f, i) => {
      const kind = kindOf(f.tag);
      const name = FIX_TAGS[f.tag] || 'Custom / unknown';
      const meaning = FIX_ENUMS[f.tag] && FIX_ENUMS[f.tag][f.value];
      return `<div class="wire-field k-${kind}" data-i="${i}" style="--d:${i * 28}ms">
        <span class="top"><span class="tag">${escapeHtml(f.tag)}</span><span class="kind">${kind}</span></span>
        <span class="name">${escapeHtml(name)}</span>
        <span class="val">${escapeHtml(f.value)}</span>
        ${meaning ? `<span class="meaning">${escapeHtml(meaning)}</span>` : ''}
      </div>`;
    }).join('');

    const expected = computeTrailer(fields);
    const got9 = (fields.find(f => f.tag === '9') || {}).value;
    const got10 = (fields.find(f => f.tag === '10') || {}).value;
    const msgType = (fields.find(f => f.tag === '35') || {}).value;
    const typeName = msgType && FIX_ENUMS[35][msgType];
    const mark = (ok, label, detail) => `<span class="pill ${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✕'} ${label}${detail}</span>`;

    status.innerHTML = [
      `<span class="pill">${fields.length} fields</span>`,
      typeName ? `<span class="pill">${escapeHtml(typeName)}</span>` : '',
      mark(fields[0] && fields[0].tag === '8', 'BeginString first', ''),
      mark(got9 === expected.bodyLength, 'BodyLength', got9 === expected.bodyLength ? ` ${escapeHtml(got9)}` : ` ${escapeHtml(got9 ?? '—')} (expected ${expected.bodyLength})`),
      mark(got10 === expected.checksum, 'CheckSum', got10 === expected.checksum ? ` ${escapeHtml(got10)}` : ` ${escapeHtml(got10 ?? '—')} (expected ${expected.checksum})`)
    ].join('');
  }

  // Hovering a token highlights its field card, and vice versa
  const highlight = i => {
    document.querySelectorAll('#wire .hl').forEach(el => el.classList.remove('hl'));
    if (i == null) return;
    document.querySelectorAll(`#wire [data-i="${i}"]`).forEach(el => el.classList.add('hl'));
  };
  [strip, out].forEach(el => {
    el.addEventListener('mouseover', e => {
      const t = e.target.closest('[data-i]');
      highlight(t ? t.dataset.i : null);
    });
    el.addEventListener('mouseleave', () => highlight(null));
  });

  presets.forEach(btn => btn.addEventListener('click', () => {
    presets.forEach(b => b.classList.toggle('active', b === btn));
    input.value = normalise(btn.dataset.sample);
    render();
    cascade();
  }));

  input.addEventListener('input', () => {
    presets.forEach(b => b.classList.remove('active'));
    render();
  });

  // Replay the card entrance animation
  function cascade() {
    out.classList.remove('anim');
    void out.offsetWidth;
    out.classList.add('anim');
  }

  input.value = normalise(presets[0].dataset.sample);
  render();
  cascade();
}

/* ---------- Contact form ---------- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const note = document.getElementById('formNote');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').trim();
    const email = (data.get('email') || '').trim();

    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      note.style.color = '#f2856f';
      note.textContent = 'Please add your name and a valid work email.';
      return;
    }

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Organisation: ${data.get('org')}`,
      `Interest: ${data.get('topic')}`,
      '',
      data.get('message') || ''
    ].join('\n');

    window.location.href = `mailto:sales@sosuvconsulting.com?subject=${encodeURIComponent(`Enquiry: ${data.get('topic')}`)}&body=${encodeURIComponent(body)}`;
    note.style.color = '';
    note.textContent = 'Opening your email client…';
  });
}

/* ---------- Quotes ---------- */
// Advances when the active tab's progress bar finishes (CSS animation),
// so hover / focus pausing is handled entirely by CSS.
function initQuotes() {
  const root = document.getElementById('quotes');
  if (!root) return;
  const quotes = [...root.querySelectorAll('.q')];
  const tabs = [...root.querySelectorAll('.q-tab')];
  let index = 0;

  function show(i, focusTab = false) {
    index = (i + quotes.length) % quotes.length;
    quotes.forEach((q, n) => {
      q.classList.toggle('active', n === index);
      q.setAttribute('aria-hidden', String(n !== index));
    });
    tabs.forEach((t, n) => {
      const on = n === index;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      // Restart the progress animation on the newly active bar
      const bar = t.querySelector('.q-bar i');
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    });
    if (focusTab) tabs[index].focus();
  }

  tabs.forEach((t, n) => {
    t.addEventListener('click', () => show(n));
    t.querySelector('.q-bar i').addEventListener('animationend', () => {
      if (n === index) show(index + 1);
    });
  });

  root.querySelectorAll('.q-arrow').forEach(b =>
    b.addEventListener('click', () => show(index + parseInt(b.dataset.dir, 10)))
  );

  root.querySelector('.q-tabs').addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1, true); }
  });

  // Swipe on touch screens
  let startX = null;
  const stage = root.querySelector('.q-stage');
  stage.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });

  // Don't rotate while the section is off-screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => root.classList.toggle('paused', !entry.isIntersecting))
      .observe(root);
  }
}

/* ---------- Wire background: live network + price lines ---------- */
// Drifting nodes linked by fine lines, packets travelling along the links,
// and slow random-walk "price" lines scrolling underneath.
function initWireBackground() {
  const section = document.getElementById('wire');
  const canvas = section && section.querySelector('.wire-canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w = 0, h = 0, dpr = 1, nodes = [], packets = [], lines = [], running = false, raf = 0, last = 0;
  const LINK = 170;

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = section.clientWidth; h = section.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round(Math.min(46, Math.max(16, (w * h) / 26000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * 12, vy: (Math.random() - .5) * 12,
      r: Math.random() * 1.6 + 1
    }));
    packets = [];

    // Three price lines at different heights, built as random walks
    const step = 6;
    lines = [0.3, 0.55, 0.8].map((base, k) => {
      const pts = [];
      let v = 0;
      for (let x = 0; x <= w + step * 40; x += step) {
        v += (Math.random() - .5) * 6;
        v *= 0.985;
        pts.push(v);
      }
      return { base: h * base, pts, step, offset: 0, speed: 8 + k * 5, alpha: 0.16 - k * 0.035 };
    });
  }

  function spawnPacket() {
    const a = nodes[Math.floor(Math.random() * nodes.length)];
    const near = nodes.filter(b => b !== a && Math.hypot(a.x - b.x, a.y - b.y) < LINK);
    if (!near.length) return;
    const b = near[Math.floor(Math.random() * near.length)];
    packets.push({ a, b, t: 0, speed: 0.5 + Math.random() * 0.7 });
  }

  function drawLines(dt) {
    lines.forEach(l => {
      l.offset += l.speed * dt;
      // When a whole step has scrolled off, extend the walk on the right
      while (l.offset >= l.step) {
        l.offset -= l.step;
        l.pts.shift();
        let v = l.pts[l.pts.length - 1] + (Math.random() - .5) * 6;
        l.pts.push(v * 0.985);
      }
      ctx.beginPath();
      l.pts.forEach((v, i) => {
        const x = i * l.step - l.offset, y = l.base + v;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.strokeStyle = `rgba(160, 220, 255, ${l.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    ctx.clearRect(0, 0, w, h);

    drawLines(dt);

    // Move nodes, bounce softly at the edges
    nodes.forEach(n => {
      n.x += n.vx * dt; n.y += n.vy * dt;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });

    // Links
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(170, 225, 255, ${0.14 * (1 - d / LINK)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }

    // Nodes
    nodes.forEach(n => {
      ctx.fillStyle = 'rgba(200, 236, 255, .55)';
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    });

    // Packets
    if (packets.length < 14 && Math.random() < 0.08) spawnPacket();
    packets = packets.filter(p => (p.t += p.speed * dt) < 1);
    packets.forEach(p => {
      const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 8);
      g.addColorStop(0, 'rgba(160, 240, 255, .95)');
      g.addColorStop(1, 'rgba(160, 240, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    });

    if (running) raf = requestAnimationFrame(frame);
  }

  function start() { if (running || reduceMotion) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  setup();
  if (reduceMotion) { frame(performance.now()); return; }   // one static frame

  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(section);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(setup, 200); });
}

/* ---------- Inline videos (photo slots) ---------- */
// Plays muted looping videos only while on screen. If a video file is
// missing, the browser keeps showing its poster image.
function initInlineVideos() {
  const videos = document.querySelectorAll('video[data-autoplay]');
  if (!videos.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) {
        if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.25 });
  videos.forEach(v => io.observe(v));
}

/* ---------- Typing headline ---------- */
// Types each phrase, holds, deletes it, then types the next one.
function initTyper() {
  const el = document.querySelector('.typer');
  if (!el) return;
  const text = el.querySelector('.typer-text');
  let words;
  try { words = JSON.parse(el.dataset.words); } catch (e) { return; }
  if (!words.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const TYPE = 55, DELETE = 28, HOLD = 2200, GAP = 350;
  let w = 0, i = words[0].length, deleting = true;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function loop() {
    await wait(HOLD);                       // first phrase is already shown
    for (;;) {
      el.classList.add('typing');
      if (deleting) {
        while (i > 0) { text.textContent = words[w].slice(0, --i); await wait(DELETE); }
        deleting = false;
        w = (w + 1) % words.length;
        await wait(GAP);
      } else {
        while (i < words[w].length) { text.textContent = words[w].slice(0, ++i); await wait(TYPE + Math.random() * 40); }
        deleting = true;
        el.classList.remove('typing');
        await wait(HOLD);
      }
    }
  }
  loop();
}

/* ---------- Hero cinematic video-like slideshow ---------- */
function initHeroSlideshow() {
  const container = document.querySelector('.hero-slideshow');
  if (!container) return;

  const slides = container.querySelectorAll('.hero-slide');
  if (slides.length <= 1) return;

  let current = 0;
  let timer = null;
  const DURATION = 3500; // 3.5s per cut for dynamic cinematic video-reel pacing
  let isPaused = false;

  function goToSlide(nextIndex) {
    if (nextIndex === current) return;
    const prevSlide = slides[current];
    const nextSlide = slides[nextIndex];

    slides.forEach(s => s.classList.remove('fading-out'));
    prevSlide.classList.remove('active');
    prevSlide.classList.add('fading-out');

    nextSlide.classList.add('active');
    current = nextIndex;
  }

  function nextSlide() {
    goToSlide((current + 1) % slides.length);
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      if (!isPaused) nextSlide();
    }, DURATION);
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Pause playback when hero section is not visible on screen
  if ('IntersectionObserver' in window) {
    const heroPanel = document.querySelector('.video-hero');
    if (heroPanel) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isPaused = !entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      observer.observe(heroPanel);
    }
  }

  startTimer();
}
