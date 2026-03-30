const MARKETERS_URL = 'data/marketers.json';
const TEAM_URL = 'data/team.json';

async function loadMarketers() {
  const res = await fetch(MARKETERS_URL);
  if (!res.ok) throw new Error('Failed to load');
  return res.json();
}

async function loadTeam() {
  const res = await fetch(TEAM_URL);
  if (!res.ok) throw new Error('Failed to load team');
  return res.json();
}

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderHeroDescription(hero) {
  if (!hero) return '';
  if (typeof hero === 'string') {
    return escapeHtml(hero).replace(/\n/g, '<br>');
  }
  if (hero.title != null && typeof hero.body === 'string') {
    return (
      '<em class="hero-title-phrase">' +
      escapeHtml(hero.title) +
      '</em>' +
      escapeHtml(hero.body).replace(/\n/g, '<br>')
    );
  }
  return '';
}

function getInterviewIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id ? parseInt(id, 10) : null;
}

function findMarketer(marketers, id) {
  return marketers.find((m) => m.id === id || String(m.id) === String(id));
}

function photoPlaceholder() {
  return `
            <div class="tile-photo-placeholder">
              <span class="tile-photo-placeholder__soon">—</span>
            </div>`;
}

function polaroidMonthLine(m) {
  if (m.polaroidMonth && String(m.polaroidMonth).trim()) {
    return String(m.polaroidMonth).trim().toUpperCase();
  }
  const raw = (m.monthEdition || '').trim();
  if (!raw) return '';
  const head = raw.replace(/\s+edition\s*$/i, '').trim();
  return head ? head.toUpperCase() : '';
}

/** 01/ MONTH · имя фамилия · должность (или для soon: 02/ MONTH + COMING SOON) */
function polaroidCaptionText(m) {
  if (m.polaroidCaption) return m.polaroidCaption;
  const num = String(m.id).padStart(2, '0');
  const month = polaroidMonthLine(m);
  const line1 = month ? `${num}/ ${month}` : `${num}/`;

  if (m.status === 'published') {
    const name = `${m.name || ''} ${m.surname || ''}`.trim();
    const role = (m.role || '').trim();
    return `${line1}\n${name}\n${role}`;
  }

  return `${line1}\nCOMING SOON`;
}

function renderPolaroidCaptionHtml(m) {
  const cap = polaroidCaptionText(m);
  const lines = cap.split(/\n/);
  const kicker = escapeHtml(lines[0] || '');
  const tail = lines
    .slice(1)
    .map((ln) => ln.trim())
    .filter((ln) => ln.length > 0);
  const bodyInner = tail.map((ln) => escapeHtml(ln)).join('<br>');
  const body =
    bodyInner.length > 0 ? `<span class="polaroid-caption__body">${bodyInner}</span>` : '';
  return `<span class="polaroid-caption__kicker">${kicker}</span>${body ? '<br>' + body : ''}`;
}

function renderPolaroidCard(m, tiltIndex) {
  const capHtml = renderPolaroidCaptionHtml(m);
  const isPub = m.status === 'published';
  const tiltCls =
    tiltIndex >= 1 && tiltIndex <= 6 ? ` polaroid-tilt--${tiltIndex}` : '';
  const isLead = isPub && Number(m.id) === 1;
  const readPill = isLead
    ? `<span class="polaroid-read-pill"><span class="polaroid-read-pill__text">read</span></span>`
    : '';
  const leadCls = isLead ? ' polaroid-card--lead' : '';

  const inner = `
    <div class="polaroid-frame">
      <div class="polaroid-photo-area">
        ${readPill}
      </div>
      <p class="polaroid-caption">${capHtml}</p>
    </div>`;

  if (isPub) {
    return `
      <article class="polaroid-card${tiltCls}${leadCls}">
        <a class="polaroid-link" href="marketer.html?id=${m.id}">${inner}</a>
      </article>`;
  }
  return `
    <article class="polaroid-card polaroid-card--soon${tiltCls}" aria-label="Coming soon">
      ${inner}
    </article>`;
}

function renderMarketerTile(m) {
  if (m.status === 'published') {
    const href = `marketer.html?id=${m.id}`;
    const inner = m.photo
      ? `<img class="tile-photo" src="${escapeHtml(m.photo)}" alt="" loading="lazy" width="300" height="300">`
      : photoPlaceholder();
    return `
        <div class="marketer-tile">
          <a class="tile-link" href="${href}">
            <div class="photo-frame">
              ${inner}
            </div>
            <p class="tile-name">${escapeHtml(m.name)} ${escapeHtml(m.surname)}</p>
            <p class="tile-role">${escapeHtml(m.role)}${m.company ? ' · ' + escapeHtml(m.company) : ''}</p>
          </a>
        </div>`;
  }
  const monthLabel = escapeHtml(m.monthEdition || '');

  if (m.samplePhoto) {
    return `
        <div class="marketer-tile">
          <div class="photo-frame">
            <img class="tile-photo" src="${escapeHtml(m.samplePhoto)}" alt="" loading="lazy" width="300" height="300">
          </div>
          ${m.sampleName ? `<p class="tile-sample-name">${escapeHtml(m.sampleName)}</p>` : ''}
          ${m.sampleRole ? `<p class="tile-sample-role">${escapeHtml(m.sampleRole)}</p>` : ''}
          ${monthLabel ? `<p class="tile-edition-label">${monthLabel}</p>` : ''}
        </div>`;
  }

  return `
        <div class="marketer-tile">
          <div class="photo-frame">
            <div class="tile-photo-placeholder">
              <span class="tile-photo-placeholder__soon">Coming Soon</span>
            </div>
          </div>
          ${monthLabel ? `<p class="tile-edition-label">${monthLabel}</p>` : ''}
        </div>`;
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function renderAboutIntro(data) {
  let paras = data.aboutIntro && Array.isArray(data.aboutIntro.paragraphs) ? data.aboutIntro.paragraphs : null;
  if (!paras || paras.length === 0) {
    if (data.heroDescription && String(data.heroDescription).trim()) {
      paras = [String(data.heroDescription).trim()];
    } else {
      return '<p class="block-text">Project overview is being updated.</p>';
    }
  }
  return paras
    .map((raw) => {
      const text = String(raw || '').trim();
      if (!text) return '';
      return `<p class="block-text">${escapeHtml(text)}</p>`;
    })
    .filter(Boolean)
    .join('');
}

function renderMissionBlock(data) {
  const mission = data.mission;
  if (!mission || !mission.quote) return '';
  const rawTitle = mission.title != null ? String(mission.title).trim() : '';
  const title = rawTitle ? escapeHtml(rawTitle) : '';
  const parts = mission.quote.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  let quoteHtml;
  if (parts.length >= 2) {
    const rest = parts.slice(1).join('\n\n');
    quoteHtml =
      escapeHtml(parts[0]) +
      '<br><br><span class="mission-quote-accent">' +
      escapeHtml(rest) +
      '</span>';
  } else {
    quoteHtml = escapeHtml(mission.quote);
  }
  const labelledBy = title ? ' aria-labelledby="mission-heading"' : '';
  const heading = title ? `<h2 id="mission-heading" class="mission-heading">${title}</h2>` : '';
  return `
    <section class="mission-section" id="mission"${labelledBy}>
      ${heading}
      <blockquote class="mission-quote">${quoteHtml}</blockquote>
    </section>`;
}

function renderWhyTwelveBlock(data) {
  const w = data.whyTwelve;
  if (!w || !w.title) return '';
  const img =
    w.image &&
    `<div class="why-twelve-media-inner">
      <img class="why-twelve-img" src="${escapeHtml(w.image)}" alt="${escapeHtml(w.imageAlt || '')}" loading="lazy" width="900" height="700">
    </div>`;
  const paras = (w.paragraphs || [])
    .map((p) => `<p class="why-twelve-p">${escapeHtml(p)}</p>`)
    .join('');
  let closing = '';
  if (w.closingParagraph) {
    const c = w.closingParagraph;
    closing = `<p class="why-twelve-p">${escapeHtml(c.before)}<em class="why-twelve-em">${escapeHtml(c.emphasis)}</em>${escapeHtml(c.after)}</p>`;
  }
  return `
    <section class="why-twelve-section" aria-labelledby="why-twelve-heading">
      <div class="why-twelve-inner">
        <div class="why-twelve-media">${img || ''}</div>
        <div class="why-twelve-copy">
          <h2 id="why-twelve-heading" class="why-twelve-title">${escapeHtml(w.title)}</h2>
          ${paras}
          ${closing}
        </div>
      </div>
    </section>`;
}

function renderHomeForbesQuote() {
  const line1 = 'Influencer marketers are no longer just campaign managers –';
  const line2 = 'they are brand relationship architects';
  return `
    <section class="home-forbes-quote home-forbes-quote--left" aria-label="Quote from Forbes">
      <blockquote class="home-forbes-quote__inner" cite="https://www.forbes.com/">
        <p>${escapeHtml(line1)}<br>${escapeHtml(line2)}</p>
        <footer class="home-forbes-quote__src">Forbes</footer>
      </blockquote>
    </section>`;
}

function renderHomeBusinessInsiderQuote() {
  const line1 = 'The job has evolved into managing talent, data,';
  const line2 = 'and brand safety all at once';
  return `
    <section class="home-forbes-quote home-forbes-quote--right" aria-label="Quote from Business Insider">
      <blockquote class="home-forbes-quote__inner" cite="https://www.businessinsider.com/">
        <p>${escapeHtml(line1)}<br>${escapeHtml(line2)}</p>
        <footer class="home-forbes-quote__src">Business Insider</footer>
      </blockquote>
    </section>`;
}

/** Слот «Coming soon …» — справа в сетке, курсив, без рамки полароида */
function renderPolaroidSoonSlot() {
  return `
    <article class="polaroid-card polaroid-card--text-soon polaroid-card--soon-aside" aria-label="Coming soon">
      <p class="polaroid-soon-inline">Coming soon …</p>
    </article>`;
}

/** Месяцы пустых ячеек: 1-й ряд — апр–июн (выпуски 01–03), 2-й — июль–сен (выпуски 04–06) */
const POLAROID_VACANT_SLOT_MONTHS = [
  [
    { num: '01', month: 'APRIL' },
    { num: '02', month: 'MAY' },
    { num: '03', month: 'JUNE' },
  ],
  [
    { num: '04', month: 'JULY' },
    { num: '05', month: 'AUGUST' },
    { num: '06', month: 'SEPTEMBER' },
  ],
];

function renderPolaroidVacantCaptionHtml(rowIdx, colIdx) {
  const spec = POLAROID_VACANT_SLOT_MONTHS[rowIdx]?.[colIdx];
  if (!spec) return '';
  const kicker = `${spec.num}/ ${spec.month}`;
  return `<span class="polaroid-caption__kicker">${escapeHtml(kicker)}</span><br><span class="polaroid-caption__body">${escapeHtml('COMING SOON')}</span>`;
}

/** Пустой слот (рамка полароида + подпись месяца) */
function renderPolaroidVacantSlot(tiltIndex, rowIdx, colIdx) {
  const tiltCls =
    tiltIndex >= 1 && tiltIndex <= 6 ? ` polaroid-tilt--${tiltIndex}` : '';
  const spec = POLAROID_VACANT_SLOT_MONTHS[rowIdx]?.[colIdx];
  const capHtml = renderPolaroidVacantCaptionHtml(rowIdx, colIdx);
  const ariaMonth = spec
    ? spec.month.charAt(0) + spec.month.slice(1).toLowerCase()
    : 'Edition';
  const aria = escapeHtml(`${ariaMonth} edition, coming soon`);
  return `
    <article class="polaroid-card polaroid-card--vacant${tiltCls}" aria-label="${aria}">
      <div class="polaroid-frame">
        <div class="polaroid-photo-area polaroid-photo-area--vacant"></div>
        <p class="polaroid-caption">${capHtml}</p>
      </div>
    </article>`;
}

/** Сетка 2×3 (три месяца сверху, три следующих снизу) + колонка «Coming soon» справа; общий горизонтальный скролл */
function renderPolaroidGridHtml(marketers) {
  const top = [...marketers.slice(0, 3)];
  const bottom = [...marketers.slice(3, 6)];
  while (top.length < 3) top.push(null);
  while (bottom.length < 3) bottom.push(null);

  let tilt = 0;
  const cell = (m, rowIdx, colIdx) => {
    tilt += 1;
    if (!m) return renderPolaroidVacantSlot(tilt, rowIdx, colIdx);
    return renderPolaroidCard(m, tilt);
  };

  return `${top.map((m, i) => cell(m, 0, i)).join('')}${bottom.map((m, i) => cell(m, 1, i)).join('')}${renderPolaroidSoonSlot()}`;
}

function renderHomeGrid(data) {
  const marketers = data.marketers || [];
  if (!marketers.length) {
    return '<p class="loading">Пока нет карточек.</p>';
  }
  return `<section class="polaroid-scroll-driver" data-polaroid-scroll aria-label="12 UNDER 12 lineup">
    <div class="polaroid-sticky-viewport">
      <div class="polaroid-track">
        ${renderPolaroidGridHtml(marketers)}
      </div>
    </div>
  </section>${renderHomeForbesQuote()}${renderHomeBusinessInsiderQuote()}`;
}

function initPolaroidScroll(driver) {
  if (!driver || !driver.hasAttribute('data-polaroid-scroll')) return;

  const track = driver.querySelector('.polaroid-track');
  const viewport = driver.querySelector('.polaroid-sticky-viewport');
  if (!track || !viewport) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    driver.classList.add('polaroid-scroll-driver--reduced');
    return;
  }

  function update() {
    const rect = driver.getBoundingClientRect();
    const total = driver.offsetHeight - window.innerHeight;
    if (total <= 0) return;
    let progress = -rect.top / total;
    progress = Math.max(0, Math.min(1, progress));
    const vw = viewport.clientWidth || document.documentElement.clientWidth;
    const maxX = Math.max(0, track.scrollWidth - vw);
    const x = -progress * maxX;
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => update());
    ro.observe(track);
    ro.observe(viewport);
  }
  requestAnimationFrame(() => requestAnimationFrame(update));
}

function initEditionsCarousel(container) {
  const root = container.querySelector('.editions-carousel');
  if (!root) return;

  const track = root.querySelector('.ec-track');
  const prev = root.querySelector('.ec-prev');
  const next = root.querySelector('.ec-next');
  const nPages = parseInt(root.dataset.ecPages, 10) || 1;

  if (nPages <= 1) return;

  let page = 0;

  function apply() {
    root.style.setProperty('--ec-page', String(page));
    prev.disabled = page <= 0;
    next.disabled = page >= nPages - 1;
    prev.classList.toggle('is-disabled', page <= 0);
    next.classList.toggle('is-disabled', page >= nPages - 1);
  }

  prev.addEventListener('click', () => {
    if (page > 0) {
      page -= 1;
      apply();
    }
  });

  next.addEventListener('click', () => {
    if (page < nPages - 1) {
      page += 1;
      apply();
    }
  });

  apply();
}

function renderMarketerPage(m) {
  if (!m || m.status !== 'published') {
    return '<p class="error">Профиль недоступен или ещё не опубликован.</p>';
  }

  const fullName = `${escapeHtml(m.name)} ${escapeHtml(m.surname)}`;
  const roleLine = `${escapeHtml(m.role)}${m.company ? ' · ' + escapeHtml(m.company) : ''}`;

  const quotesHtml = (m.quotes || [])
    .map(
      (q, i) => `
    <div class="quote-slide" data-quote-index="${i}" style="display:${i === 0 ? 'block' : 'none'}">
      <div class="quote-panel">
        <blockquote>${escapeHtml(q.text)}</blockquote>
        ${q.caption ? `<p class="quote-caption">${escapeHtml(q.caption)}</p>` : ''}
      </div>
    </div>`
    )
    .join('');

  const dotsHtml = (m.quotes || [])
    .map(
      (_, i) =>
        `<button type="button" class="quote-dot${i === 0 ? ' active' : ''}" data-quote-dot="${i}" aria-label="Quote ${i + 1}"></button>`
    )
    .join('');

  const sectionsHtml = (m.sections || [])
    .map(
      (s, i) => `
    <div class="section-slide" data-section-index="${i}" style="display:${i === 0 ? 'block' : 'none'}">
      <div class="section-panel">
        <h3>${escapeHtml(s.title)}</h3>
        <div class="section-body">${escapeHtml(s.content).replace(/\n/g, '<br>')}</div>
      </div>
    </div>`
    )
    .join('');

  const qaHtml = (m.qaCards || [])
    .map(
      (qa) => `
    <div class="qa-card">
      <h4>${escapeHtml(qa.question)}</h4>
      <p>${escapeHtml(qa.answer)}</p>
    </div>`
    )
    .join('');

  const nSections = (m.sections || []).length;

  const heroPhoto = m.photo
    ? `<img class="hero-img" src="${escapeHtml(m.photo)}" alt="" width="600" height="600">`
    : photoPlaceholder();

  return `
    <div class="marketer-page">
      <p class="marketer-kicker">12 UNDER 12</p>
      <a href="index.html" class="btn-back">← Back</a>

      <div class="marketer-hero-grid">
        <div class="col-left">
          <h1 class="full-name">${fullName}</h1>
          <p class="role-line">${roleLine}</p>
        </div>
        <div class="col-photo">
          <div class="photo-frame">
            ${heroPhoto}
          </div>
        </div>
        <div class="col-intro">
          <p>${escapeHtml(m.intro)}</p>
        </div>
      </div>

      <div class="quotes-block" data-quotes-count="${(m.quotes || []).length}">
        ${quotesHtml}
        <div class="quote-dots">${dotsHtml}</div>
      </div>

      <section class="bio-block">
        <h2>${escapeHtml(m.bioTitle || 'Tell us about yourself')}</h2>
        <div class="bio-text">${escapeHtml(m.bio || '').replace(/\n/g, '<br>')}</div>
      </section>

      <div class="sections-carousel" data-sections-count="${nSections}">
        <button type="button" class="carousel-arrow prev" aria-label="Previous">‹</button>
        <div class="sections-slides">${sectionsHtml}</div>
        <button type="button" class="carousel-arrow next" aria-label="Next">›</button>
        <p class="section-counter"><span class="section-cur">1</span> / <span class="section-total">${nSections}</span></p>
      </div>

      <div class="qa-row">${qaHtml}</div>

      <a href="index.html" class="btn-back bottom">← Back</a>
    </div>`;
}

function initQuoteCarousel(root) {
  const slides = root.querySelectorAll('.quote-slide');
  const dots = root.querySelectorAll('.quote-dot');
  if (!slides.length) return;

  let cur = 0;

  function show(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, j) => {
      s.style.display = j === cur ? 'block' : 'none';
    });
    dots.forEach((d, j) => {
      d.classList.toggle('active', j === cur);
    });
  }

  dots.forEach((d, i) => {
    d.addEventListener('click', () => show(i));
  });
}

function initSectionCarousel(root) {
  const slides = root.querySelectorAll('.section-slide');
  const prev = root.querySelector('.carousel-arrow.prev');
  const next = root.querySelector('.carousel-arrow.next');
  const curEl = root.querySelector('.section-cur');
  const totalEl = root.querySelector('.section-total');
  if (!slides.length) return;

  let cur = 0;
  const total = slides.length;
  if (totalEl) totalEl.textContent = String(total);

  function show(i) {
    cur = (i + total) % total;
    slides.forEach((s, j) => {
      s.style.display = j === cur ? 'block' : 'none';
    });
    if (curEl) curEl.textContent = String(cur + 1);
  }

  prev.addEventListener('click', () => show(cur - 1));
  next.addEventListener('click', () => show(cur + 1));
}

function renderTeamPage(data) {
  const members = (data.members || [])
    .map(
      (mem) => `
    <div class="team-person">
      <div class="photo-frame">
        ${
          mem.photo
            ? `<img class="team-photo" src="${escapeHtml(mem.photo)}" alt="" loading="lazy" width="300" height="300">`
            : photoPlaceholder()
        }
      </div>
      <h3>${escapeHtml(mem.name)}</h3>
      <p class="role">${escapeHtml(mem.role)}</p>
      <p class="comment">${escapeHtml(mem.comment)}</p>
    </div>`
    )
    .join('');

  return `
    <p class="team-intro">${escapeHtml(data.intro || '')}</p>
    <div class="team-grid">${members}</div>
  `;
}

function scrollToHashInDocument() {
  const id = window.location.hash.replace(/^#/, '');
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const SITE_TITLE_HOVER_VARIANTS = 8;
const SITE_TITLE_VARIANT_PREFIX = 'site-title-a--v';

function stripSiteTitleVariantClasses(el) {
  Array.from(el.classList)
    .filter((c) => c.startsWith(SITE_TITLE_VARIANT_PREFIX))
    .forEach((c) => el.classList.remove(c));
}

/** Каждое наведение на «12 UNDER 12» — следующий вариант (разные шрифты × normal/italic). */
function initSiteTitleHoverCycle() {
  document.querySelectorAll('.site-title a').forEach((a) => {
    let nextIdx = 0;
    a.addEventListener('mouseenter', () => {
      stripSiteTitleVariantClasses(a);
      a.classList.add(`${SITE_TITLE_VARIANT_PREFIX}${nextIdx}`);
      nextIdx = (nextIdx + 1) % SITE_TITLE_HOVER_VARIANTS;
    });
    a.addEventListener('mouseleave', () => {
      stripSiteTitleVariantClasses(a);
    });
  });
}

/* —— Boot —— */
window.addEventListener('hashchange', () => {
  scrollToHashInDocument();
});

document.addEventListener('DOMContentLoaded', () => {
  initSiteTitleHoverCycle();

  const homeGrid = document.getElementById('home-grid-container');
  if (homeGrid) {
    loadMarketers()
      .then((data) => {
        const hl = document.getElementById('hero-lead');
        if (hl && data.heroDescription) hl.innerHTML = renderHeroDescription(data.heroDescription);
        homeGrid.innerHTML = renderHomeGrid(data);
        const polaroidDriver = homeGrid.querySelector('[data-polaroid-scroll]');
        const nSlots = ((data.marketers && data.marketers.length) || 1) + 1;
        if (polaroidDriver) {
          polaroidDriver.style.height = `${Math.round(90 + nSlots * 20)}vh`;
        }
        initPolaroidScroll(polaroidDriver);
        queueMicrotask(() => scrollToHashInDocument());
      })
      .catch(() => {
        homeGrid.innerHTML = '<p class="error">Не удалось загрузить данные.</p>';
      });
  }

  const marketerRoot = document.getElementById('marketer-root');
  if (marketerRoot) {
    const id = getInterviewIdFromUrl();
    if (!id) {
      marketerRoot.innerHTML = '<p class="error">Не выбран профиль.</p>';
      return;
    }
    loadMarketers()
      .then((data) => {
        const m = findMarketer(data.marketers, id);
        marketerRoot.innerHTML = renderMarketerPage(m);
        const quotesBlock = marketerRoot.querySelector('.quotes-block');
        if (quotesBlock) initQuoteCarousel(quotesBlock);
        const secCar = marketerRoot.querySelector('.sections-carousel');
        if (secCar) initSectionCarousel(secCar);
      })
      .catch(() => {
        marketerRoot.innerHTML = '<p class="error">Ошибка загрузки.</p>';
      });
  }

  const teamRoot = document.getElementById('team-root');
  if (teamRoot) {
    loadTeam()
      .then((data) => {
        teamRoot.innerHTML = renderTeamPage(data);
      })
      .catch(() => {
        teamRoot.innerHTML = '<p class="error">Не удалось загрузить команду.</p>';
      });
  }

  const aboutIntroRoot = document.getElementById('about-intro-root');
  const aboutBlocksRoot = document.getElementById('about-blocks-root');
  if (aboutIntroRoot || aboutBlocksRoot) {
    loadMarketers()
      .then((data) => {
        if (aboutIntroRoot) aboutIntroRoot.innerHTML = renderAboutIntro(data);
        if (aboutBlocksRoot) {
          aboutBlocksRoot.innerHTML = `${renderMissionBlock(data)}${renderWhyTwelveBlock(data)}`;
        }
        queueMicrotask(() => scrollToHashInDocument());
      })
      .catch(() => {
        const err = '<p class="error">Could not load page content.</p>';
        if (aboutIntroRoot) aboutIntroRoot.innerHTML = err;
        if (aboutBlocksRoot) aboutBlocksRoot.innerHTML = err;
      });
  }
});
