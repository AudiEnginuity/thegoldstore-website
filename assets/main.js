// ---------- Scroll progress + scrollspy ----------
const progressBar = document.getElementById('scrollProgress');
const navAnchors = document.querySelectorAll('.nav-links a[href*="#"]');
const sectionEls = [...navAnchors].map(a => {
  const id = a.getAttribute('href').split('#')[1];
  return id ? document.getElementById(id) : null;
}).filter(Boolean);

function onScroll() {
  if (progressBar) {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    progressBar.style.width = scrolled + '%';
  }
  let current = sectionEls[0];
  sectionEls.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 140) current = sec;
  });
  navAnchors.forEach(a => a.classList.remove('active'));
  if (current) {
    navAnchors.forEach(a => {
      if (a.getAttribute('href').endsWith('#' + current.id)) a.classList.add('active');
    });
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- Intro splash: emblem docks from center into hero position ----------
(function introSplash() {
  const overlay = document.getElementById('introOverlay');
  const targetRing = document.querySelector('.hero-emblem .emblem-ring');
  if (!overlay) return;

  const finish = () => {
    overlay.classList.add('io-hidden');
    document.documentElement.style.overflow = '';
    setTimeout(() => overlay.remove(), 800);
  };

  try {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadyPlayed = sessionStorage.getItem('introPlayed');
    if (reduced || alreadyPlayed || !targetRing) { finish(); return; }

    sessionStorage.setItem('introPlayed', '1');
    document.documentElement.style.overflow = 'hidden';

    const wrapper = overlay.querySelector('.intro-emblem');
    const cloneRing = overlay.querySelector('.emblem-ring');
    const baseWidth = cloneRing.offsetWidth;

    // Safety net: if anything goes wrong, never leave the site permanently covered
    const safety = setTimeout(finish, 6500);

    // Step 1: dissolve in (fade + un-blur) from nothing, rather than popping in instantly
    requestAnimationFrame(() => {
      requestAnimationFrame(() => wrapper.classList.add('io-in'));
    });

    // Step 2: after materializing, hold in place so it registers, then dock into the hero
    setTimeout(() => {
      const targetRect = targetRing.getBoundingClientRect();
      const cloneRect = cloneRing.getBoundingClientRect();
      const targetScale = targetRect.width / baseWidth;
      const dx = (targetRect.left + targetRect.width / 2) - (cloneRect.left + cloneRect.width / 2);
      const dy = (targetRect.top + targetRect.height / 2) - (cloneRect.top + cloneRect.height / 2);

      wrapper.style.transition = 'transform 1s cubic-bezier(.65,0,.35,1)';
      overlay.style.transition = 'opacity .6s ease .55s';
      requestAnimationFrame(() => {
        wrapper.style.transform = `translate(${dx}px, ${dy}px) scale(${targetScale})`;
        overlay.classList.add('io-hidden');
      });

      setTimeout(() => { clearTimeout(safety); finish(); }, 1150);
    }, 2650);
  } catch (e) {
    finish();
  }
})();


document.querySelectorAll('.brand-name').forEach(el => {
  // First text node only (excludes the nested subtitle span)
  const firstText = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  if (firstText) {
    el.classList.add('shine-text');
    el.setAttribute('data-text', firstText.textContent.trim());
  }
});

// ---------- Hero staggered word reveal (DOM-safe, preserves <em> gradient text intact) ----------
document.querySelectorAll('.hero h1').forEach(h1 => {
  let wordIndex = 0;
  function wrapWords(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/(\s+)/).filter(p => p.length);
      const frag = document.createDocumentFragment();
      parts.forEach(part => {
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'word-reveal';
          span.style.animationDelay = (0.35 + wordIndex * 0.07) + 's';
          span.textContent = part;
          wordIndex++;
          frag.appendChild(span);
        }
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'EM') {
        // Treat the whole <em> phrase as one reveal unit so its gradient
        // text stays a single continuous run instead of being split apart.
        const span = document.createElement('span');
        span.className = 'word-reveal';
        span.style.animationDelay = (0.35 + wordIndex * 0.07) + 's';
        wordIndex++;
        node.replaceWith(span);
        span.appendChild(node);
      } else {
        [...node.childNodes].forEach(wrapWords);
      }
    }
  }
  [...h1.childNodes].forEach(wrapWords);

  // Apply the shine-sweep overlay to the <em> phrase now that it's intact inside its wrapper span
  const em = h1.querySelector('em');
  if (em) {
    em.classList.add('shine-text');
    em.setAttribute('data-text', em.textContent);
  }
});

// ---------- Hero parallax on scroll ----------
const emblemWrap = document.querySelector('.hero-emblem');
const heroSection = document.querySelector('.hero');
if (emblemWrap && heroSection) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      emblemWrap.style.transform = `translateY(${y * 0.18}px)`;
    }
  }, { passive: true });
}

// ---------- Contained cursor glow in hero ----------
if (heroSection && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  heroSection.appendChild(glow);
  heroSection.addEventListener('mousemove', (e) => {
    const r = heroSection.getBoundingClientRect();
    glow.style.left = (e.clientX - r.left) + 'px';
    glow.style.top = (e.clientY - r.top) + 'px';
    glow.style.opacity = '1';
  });
  heroSection.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
}


document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());

// ---------- Mobile nav ----------
const menuOpen = document.getElementById('menuOpen');
const menuClose = document.getElementById('menuClose');
const mobileNav = document.getElementById('mobileNav');
if (menuOpen) menuOpen.addEventListener('click', () => mobileNav.classList.add('open'));
if (menuClose) menuClose.addEventListener('click', () => mobileNav.classList.remove('open'));
if (mobileNav) mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));

// ---------- Scroll reveal ----------
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in'), (i % 4) * 90);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('in'));
}

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-item').forEach(item => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');
  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!isOpen) {
      item.classList.add('open');
      a.style.maxHeight = a.scrollHeight + 'px';
    }
  });
});

// ---------- Spot price ticker ----------
// To go live: set TICKER_API_URL to an endpoint that returns
// { gold: <usd per oz>, silver: <usd per oz>, platinum: <usd per oz>, goldChange: <pct>, silverChange: <pct>, platinumChange: <pct> }
// See SETUP.md for recommended free providers and why a small serverless proxy is worth adding.
const TICKER_API_URL = ""; // e.g. "/.netlify/functions/spot-prices"

const FALLBACK_PRICES = {
  gold: 2415.30, goldChange: 0.4,
  silver: 30.85, silverChange: -0.2,
  platinum: 985.10, platinumChange: 0.6
};

function renderTicker(prices, isLive) {
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const arrow = (chg) => chg >= 0
    ? `<span class="chg-up">▲ ${fmt(Math.abs(chg))}%</span>`
    : `<span class="chg-down">▼ ${fmt(Math.abs(chg))}%</span>`;

  const items = `
    <div class="ticker-item"><span class="ticker-label">${isLive ? 'Live' : 'Sample'} Spot &middot;</span> Gold <strong>$${fmt(prices.gold)}/oz</strong> ${arrow(prices.goldChange)}</div>
    <div class="ticker-item">Silver <strong>$${fmt(prices.silver)}/oz</strong> ${arrow(prices.silverChange)}</div>
    <div class="ticker-item">Platinum <strong>$${fmt(prices.platinum)}/oz</strong> ${arrow(prices.platinumChange)}</div>
    <div class="ticker-item">We buy gold, silver, platinum, coins &amp; gemstones — walk in today</div>
  `;
  track.innerHTML = items + items; // duplicate for seamless marquee loop
}

async function loadTicker() {
  if (!TICKER_API_URL) {
    renderTicker(FALLBACK_PRICES, false);
    return;
  }
  const cacheKey = 'goldstore_ticker_cache';
  const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
  if (cached && (Date.now() - cached.ts) < 4 * 60 * 60 * 1000) {
    renderTicker(cached.data, true);
    return;
  }
  try {
    const res = await fetch(TICKER_API_URL);
    const data = await res.json();
    localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
    renderTicker(data, true);
  } catch (e) {
    renderTicker(FALLBACK_PRICES, false);
  }
}
loadTicker();

// ---------- Blog teaser on homepage ----------
function renderBlogTeaser() {
  const grid = document.getElementById('blogTeaserGrid');
  if (!grid || typeof SAMPLE_POSTS === 'undefined') return;
  const posts = SAMPLE_POSTS.slice(0, 2);
  grid.innerHTML = posts.map(p => `
    <a class="blog-card reveal in" href="blog.html?post=${p.slug}">
      <div class="blog-thumb"><img src="assets/logo.png" alt=""></div>
      <div class="blog-body">
        <span class="blog-tag">${p.tag}</span>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        <div class="blog-meta"><span>${new Date(p.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} &middot; ${p.readTime}</span><span>Read More →</span></div>
      </div>
    </a>
  `).join('');
}
renderBlogTeaser();

// ---------- Magnetic card tilt ----------
function applyTilt(selector) {
  document.querySelectorAll(selector).forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `translateY(-6px) perspective(700px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  applyTilt('.trust-card, .step, .buy-card, .blog-card, .testi-card');
}
