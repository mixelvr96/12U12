/** Поднимайте число при правках `data/*.json`, иначе браузер может отдавать старый кэш без переносов/текста. */
const DATA_JSON_VERSION = '43';
const MARKETERS_URL = `data/marketers.json?v=${DATA_JSON_VERSION}`;
const TEAM_URL = `data/team.json?v=${DATA_JSON_VERSION}`;

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

function renderFunFactsBlock(m) {
  const raw = m.funFacts;
  if (!raw) return '';
  const items = Array.isArray(raw.items) ? raw.items : Array.isArray(raw) ? raw : [];
  const clean = items.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 3);
  if (!clean.length) return '';
  const titleRaw =
    raw && typeof raw === 'object' && !Array.isArray(raw) && raw.title != null
      ? String(raw.title).trim()
      : 'Fun Facts';
  const title = escapeHtml(titleRaw || 'Fun Facts');
  const list = clean.map((f) => `<li class="marketer-fun-facts__item">${escapeHtml(f)}</li>`).join('');
  return `<aside class="marketer-fun-facts" aria-label="${title}">
    <h2 class="marketer-fun-facts__title">${title}</h2>
    <ol class="marketer-fun-facts__list">${list}</ol>
  </aside>`;
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

  let bodyInner;
  if (!m.polaroidCaption && m.status === 'published' && tail.length > 0) {
    const nameLine = escapeHtml(tail[0]);
    const rest = tail.slice(1).map((ln) => escapeHtml(ln)).join('<br>');
    bodyInner = `<span class="polaroid-caption__name">${nameLine}</span>`;
    if (rest) bodyInner += '<br>' + rest;
  } else {
    bodyInner = tail.map((ln) => escapeHtml(ln)).join('<br>');
  }

  const body =
    bodyInner.length > 0 ? `<span class="polaroid-caption__body">${bodyInner}</span>` : '';
  const companyTrimmed =
    m.company && String(m.company).trim() ? String(m.company).trim() : '';
  const companyHtml =
    !m.polaroidCaption && m.status === 'published' && companyTrimmed
      ? `<span class="polaroid-caption__company">${escapeHtml(companyTrimmed)}</span>`
      : '';
  return `<span class="polaroid-caption__kicker">${kicker}</span>${body ? '<br>' + body : ''}${companyHtml}`;
}

function renderPolaroidCard(m, tiltIndex) {
  const capHtml = renderPolaroidCaptionHtml(m);
  const isPub = m.status === 'published';
  const tiltCls =
    tiltIndex >= 1 && tiltIndex <= 12 ? ` polaroid-tilt--${tiltIndex}` : '';
  const isLead = isPub && Number(m.id) === 1;
  const readPill = isLead
    ? `<span class="polaroid-read-pill"><span class="polaroid-read-pill__text">read</span></span>`
    : '';
  const leadCls = isLead ? ' polaroid-card--lead' : '';

  const photoAlt = [m.name, m.surname].filter(Boolean).join(' ').trim();
  const photoHtml =
    isPub && m.photo
      ? `<img class="polaroid-photo" src="${escapeHtml(m.photo)}" alt="${escapeHtml(photoAlt || 'Marketer photo')}" loading="lazy" width="300" height="300">`
      : '';

  const inner = `
    <div class="polaroid-frame">
      <div class="polaroid-photo-area">
        ${photoHtml}
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

/** Внутренняя HTML цитаты миссии (кавычки — через CSS ::before/::after у .mission-quote) */
function buildMissionQuoteInnerHtml(mission) {
  if (!mission || !mission.quote) return '';
  const parts = mission.quote.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const rest = parts.slice(1).join('\n\n');
    return (
      escapeHtml(parts[0]) +
      '<br><br><span class="mission-quote-accent">' +
      escapeHtml(rest) +
      '</span>'
    );
  }
  return escapeHtml(mission.quote);
}

/** Цитата между двумя рядами полароидов на Our team (компактнее, чем на About) */
function renderTeamMissionQuoteBand(mission) {
  if (!mission || !mission.quote) return '';
  const inner = buildMissionQuoteInnerHtml(mission);
  return `<div class="team-mission-band">
    <blockquote class="mission-quote mission-quote--team">${inner}</blockquote>
  </div>`;
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

function renderHomeMediaInsightsHeading() {
  return `
    <section class="home-forbes-quote home-forbes-quote--left home-forbes-quote--media-insights" aria-label="Media insights">
      <blockquote class="home-forbes-quote__inner">
        <p class="home-forbes-quote__media-heading">Media insights</p>
      </blockquote>
    </section>`;
}

function renderHomeForbesQuote() {
  const text =
    'Influencer marketers are no longer just campaign managers – they are brand relationship architects.';
  return `
    <section class="home-forbes-quote home-forbes-quote--left" aria-label="Quote from Forbes">
      <blockquote class="home-forbes-quote__inner" cite="https://www.forbes.com/">
        <p class="home-forbes-quote__body">${escapeHtml(text)}</p>
        <footer class="home-forbes-quote__src">Forbes</footer>
      </blockquote>
    </section>`;
}

function renderHomeBusinessInsiderQuote() {
  const text = 'The job has evolved into managing talent, data, and brand safety all at once.';
  return `
    <section class="home-forbes-quote home-forbes-quote--right" aria-label="Quote from Business Insider">
      <blockquote class="home-forbes-quote__inner" cite="https://www.businessinsider.com/">
        <p class="home-forbes-quote__body">${escapeHtml(text)}</p>
        <footer class="home-forbes-quote__src">Business Insider</footer>
      </blockquote>
    </section>`;
}

function renderHomeGuardianQuote() {
  const text =
    'For marketers, working with influencers means navigating authenticity, transparency, and risk.';
  return `
    <section class="home-forbes-quote home-forbes-quote--left" aria-label="Quote from The Guardian">
      <blockquote class="home-forbes-quote__inner" cite="https://www.theguardian.com/">
        <p class="home-forbes-quote__body">${escapeHtml(text)}</p>
        <footer class="home-forbes-quote__src">The Guardian</footer>
      </blockquote>
    </section>`;
}

/** Пустые ячейки: 1-й ряд — 01–06 (апр–сен), 2-й — 07–12 (окт–мар) */
const POLAROID_VACANT_SLOT_MONTHS = [
  [
    { num: '01', month: 'APRIL' },
    { num: '02', month: 'MAY' },
    { num: '03', month: 'JUNE' },
    { num: '04', month: 'JULY' },
    { num: '05', month: 'AUGUST' },
    { num: '06', month: 'SEPTEMBER' },
  ],
  [
    { num: '07', month: 'OCTOBER' },
    { num: '08', month: 'NOVEMBER' },
    { num: '09', month: 'DECEMBER' },
    { num: '10', month: 'JANUARY' },
    { num: '11', month: 'FEBRUARY' },
    { num: '12', month: 'MARCH' },
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
    tiltIndex >= 1 && tiltIndex <= 12 ? ` polaroid-tilt--${tiltIndex}` : '';
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

/** Сетка 2×6: сверху 01–06 (апр–сен), снизу 07–12 (окт–мар); вертикальный скролл двигает ленту влево */
function renderPolaroidGridHtml(marketers) {
  const top = [...marketers.slice(0, 6)];
  const bottom = [...marketers.slice(6, 12)];
  while (top.length < 6) top.push(null);
  while (bottom.length < 6) bottom.push(null);

  let tilt = 0;
  const cell = (m, rowIdx, colIdx) => {
    tilt += 1;
    if (!m) return renderPolaroidVacantSlot(tilt, rowIdx, colIdx);
    return renderPolaroidCard(m, tilt);
  };

  return `${top.map((m, i) => cell(m, 0, i)).join('')}${bottom.map((m, i) => cell(m, 1, i)).join('')}`;
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
  </section>${renderHomeMediaInsightsHeading()}${renderHomeForbesQuote()}${renderHomeBusinessInsiderQuote()}${renderHomeGuardianQuote()}`;
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

function closingCodaWithEllipsis(text) {
  const t = String(text).trim();
  if (!t) return '';
  if (/\.\.\.\s*$/.test(t)) return t;
  if (/\u2026\s*$/.test(t)) return t;
  if (t.endsWith('.')) return `${t.slice(0, -1)}...`;
  return `${t}...`;
}

function renderClosingCoda(m) {
  const c = m.closingCoda;
  if (!c || !String(c.prompt || '').trim()) return '';
  const parts = String(c.prompt)
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const ansRaw = c.answer != null ? String(c.answer).trim() : '';

  let leadPara = '';
  let questionPara = '';
  if (parts.length >= 2) {
    const questionPart = parts.pop();
    const leadJoined = parts.join('\n\n');
    leadPara = `<p class="marketer-closing-coda__lead">${escapeHtml(closingCodaWithEllipsis(leadJoined)).replace(/\n/g, '<br>')}</p>`;
    questionPara = `<p class="marketer-closing-coda__lead marketer-closing-coda__question-line">${escapeHtml(questionPart).replace(/\n/g, '<br>')}</p>`;
  } else if (parts.length === 1) {
    leadPara = `<p class="marketer-closing-coda__lead">${escapeHtml(closingCodaWithEllipsis(parts[0])).replace(/\n/g, '<br>')}</p>`;
  }

  const answerBlock = ansRaw
    ? `<div class="marketer-closing-coda__answer-quoted">
      <p class="marketer-closing-coda__answer-line">${escapeHtml(ansRaw)}</p>
    </div>`
    : '';

  return `<section class="marketer-story-continuation marketer-closing-coda" aria-label="Closing question">
    <div class="marketer-closing-coda__inner">${leadPara}${questionPara}${answerBlock}</div>
  </section>`;
}

const SECTION_CAROUSEL_ARROW_PREV = `<button type="button" class="carousel-arrow prev" aria-label="Previous"><svg class="carousel-arrow__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 6L9 12 15 18"/></svg></button>`;
const SECTION_CAROUSEL_ARROW_NEXT = `<button type="button" class="carousel-arrow next" aria-label="Next"><svg class="carousel-arrow__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 6L15 12 9 18"/></svg></button>`;

function renderEmbeddedStoryQaPanel(m) {
  const cards = m.qaCards || [];
  if (!cards.length) return '';
  const n = cards.length;
  const slidesHtml = cards
    .map(
      (qa, i) => `
    <div class="section-slide" data-section-index="${i}" style="display:${i === 0 ? 'block' : 'none'}">
      <div class="section-panel">
        <h3>${escapeHtml(qa.question)}</h3>
        <div class="section-body">${escapeHtml(qa.answer).replace(/\n/g, '<br>')}</div>
      </div>
    </div>`
    )
    .join('');
  return `
    <div class="sections-carousel sections-carousel--story-qa" data-sections-count="${n}" role="region" aria-label="Quick answers">
      ${SECTION_CAROUSEL_ARROW_PREV}
      <div class="sections-slides">${slidesHtml}</div>
      ${SECTION_CAROUSEL_ARROW_NEXT}
    </div>`;
}

function renderStoryContinuation(m) {
  const topics = m.storyTopics || [];
  const bioTitle = escapeHtml(m.bioTitle || 'Tell us about yourself');
  const bioBody = escapeHtml(m.bio || '').replace(/\n/g, '<br>');
  const anchor = m.qaCardsStoryAfterTitle && String(m.qaCardsStoryAfterTitle).trim();
  const hasStoryQa = anchor && (m.qaCards || []).length > 0;

  let storyQaPlaced = false;
  const topicsHtml = topics
    .map((t) => {
      const title = String(t.title || '').trim();
      const article = `
    <article class="story-topic-panel">
      <h3>${escapeHtml(t.title)}</h3>
      <div class="story-topic-panel__body">${escapeHtml(t.content).replace(/\n/g, '<br>')}</div>
    </article>`;
      if (hasStoryQa && title === anchor) {
        storyQaPlaced = true;
        return `${article}${renderEmbeddedStoryQaPanel(m)}`;
      }
      return article;
    })
    .join('');

  const storyQaFallback =
    hasStoryQa && !storyQaPlaced ? renderEmbeddedStoryQaPanel(m) : '';

  const hasLead = (m.bio && String(m.bio).trim()) || (m.bioTitle && String(m.bioTitle).trim());
  if (!hasLead && !topicsHtml && !storyQaFallback) return '';
  const leadPanel = hasLead
    ? `<article class="story-topic-panel story-topic-panel--lead">
      <h3>${bioTitle}</h3>
      <div class="story-topic-panel__body">${bioBody}</div>
    </article>`
    : '';
  return `<section class="marketer-story-continuation" aria-label="Interview">
      <p class="marketer-story-kicker">Interview</p>
      ${leadPanel}${topicsHtml}${storyQaFallback}
    </section>`;
}

function renderMarketerPage(m) {
  if (!m || m.status !== 'published') {
    return '<p class="error">Профиль недоступен или ещё не опубликован.</p>';
  }

  const fullName = `${escapeHtml(m.name)} ${escapeHtml(m.surname)}`;
  const roleHtml = (() => {
    const role = m.role && String(m.role).trim() ? escapeHtml(String(m.role).trim()) : '';
    const company = m.company && String(m.company).trim() ? escapeHtml(String(m.company).trim()) : '';
    const rows = [];
    if (role) rows.push(`<span class="role-line__row">${role}</span>`);
    if (company) rows.push(`<span class="role-line__row">${company}</span>`);
    return rows.join('');
  })();

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
  const qaInStory = !!(m.qaCardsStoryAfterTitle && String(m.qaCardsStoryAfterTitle).trim());
  const hasQaHero = (m.qaCards || []).length > 0 && !qaInStory;

  const heroPhoto = m.photo
    ? `<img class="hero-img" src="${escapeHtml(m.photo)}" alt="" decoding="async">`
    : photoPlaceholder();

  const introHtml = `<p class="col-left__intro${m.intro && String(m.intro).trim() ? '' : ' col-left__intro--empty'}">${m.intro && String(m.intro).trim() ? escapeHtml(m.intro) : ''}</p>`;

  const photoBlock = (extraClass) => `<div class="col-photo${extraClass ? ` ${extraClass}` : ''}">
            <div class="photo-frame photo-frame--hero-profile">
              ${heroPhoto}
            </div>
          </div>`;

  const heroGridClass = `marketer-hero-grid${hasQaHero ? '' : ' marketer-hero-grid--no-qa'}`;

  const funFactsHtml = renderFunFactsBlock(m);

  const heroBodyWithQa = `<div class="col-left col-left--body">
          ${photoBlock('')}
        </div>`;

  const heroMainNoQa = `
        <div class="col-left__head">
          <h1 class="full-name">${fullName}</h1>
          ${roleHtml ? `<p class="role-line">${roleHtml}</p>` : ''}
          ${introHtml}
          ${funFactsHtml}
        </div>
        ${photoBlock('col-photo--hero-rail')}`;

  const heroMainWithQa = `
        <div class="col-left__head">
          <h1 class="full-name">${fullName}</h1>
          ${roleHtml ? `<p class="role-line">${roleHtml}</p>` : ''}
          ${introHtml}
          ${funFactsHtml}
        </div>
        ${heroBodyWithQa}`;

  return `
    <div class="marketer-page">
      <div class="${heroGridClass}">
        ${hasQaHero ? heroMainWithQa : heroMainNoQa}
        ${
          hasQaHero
            ? `<div class="col-qa">
          <div class="qa-row qa-row--hero">${qaHtml}</div>
        </div>`
            : ''
        }
      </div>

      ${renderStoryContinuation(m)}

      <div class="sections-carousel" data-sections-count="${nSections}">
        ${SECTION_CAROUSEL_ARROW_PREV}
        <div class="sections-slides">${sectionsHtml}</div>
        ${SECTION_CAROUSEL_ARROW_NEXT}
      </div>

      ${renderClosingCoda(m)}

      ${
        (m.quotes || []).length > 0
          ? `<div class="quotes-block" data-quotes-count="${(m.quotes || []).length}">
        ${quotesHtml}
        <div class="quote-dots">${dotsHtml}</div>
      </div>`
          : ''
      }
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
  if (!slides.length) return;

  let cur = 0;
  const total = slides.length;

  function show(i) {
    cur = (i + total) % total;
    slides.forEach((s, j) => {
      s.style.display = j === cur ? 'block' : 'none';
    });
  }

  if (prev) prev.addEventListener('click', () => show(cur - 1));
  if (next) next.addEventListener('click', () => show(cur + 1));

  let touchStartX = null;
  root.addEventListener(
    'touchstart',
    (e) => {
      if (e.changedTouches.length === 1) touchStartX = e.changedTouches[0].clientX;
    },
    { passive: true }
  );
  root.addEventListener(
    'touchend',
    (e) => {
      if (touchStartX == null || e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) < 48) return;
      if (dx > 0) show(cur - 1);
      else show(cur + 1);
    },
    { passive: true }
  );
}

function renderTeamMemberCard(mem, idx) {
  const tilt = (idx % 12) + 1;
  const spotlightCls = idx === 3 ? ' team-person--polaroid-spotlight' : '';
  const photoSrc = mem.photo
    ? (() => {
        const base = String(mem.photo);
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}v=${DATA_JSON_VERSION}`;
      })()
    : '';
  const photoInner = mem.photo
    ? `<img class="polaroid-photo" src="${escapeHtml(photoSrc)}" alt="${escapeHtml(mem.name || 'Team member')}" loading="lazy" width="300" height="300">`
    : `<div class="tile-photo-placeholder team-polaroid-placeholder"><span class="tile-photo-placeholder__soon">—</span></div>`;
  const commentBlock =
    mem.comment && String(mem.comment).trim()
      ? `<p class="comment">${escapeHtml(mem.comment)}</p>`
      : '';
  const company = mem.company != null ? String(mem.company).trim() : '';
  const companyHtml = company
    ? `<span class="polaroid-caption__company">${escapeHtml(company)}</span>`
    : '';
  return `
    <article class="team-person team-person--polaroid polaroid-card polaroid-tilt--${tilt}${spotlightCls}">
      <div class="polaroid-frame team-polaroid-frame">
        <div class="polaroid-photo-area">
          ${photoInner}
        </div>
        <p class="polaroid-caption team-polaroid-caption">
          <span class="polaroid-caption__kicker">${escapeHtml(mem.name || '')}</span><br>
          <span class="polaroid-caption__body">${escapeHtml(mem.role || '')}</span>${companyHtml}
        </p>
      </div>
      ${commentBlock}
    </article>`;
}

function renderTeamPage(teamData, marketersData) {
  const memberList = teamData.members || [];
  const mission = marketersData && marketersData.mission;
  const intro = `<p class="team-intro">${escapeHtml(teamData.intro || '')}</p>`;

  if (memberList.length === 0) {
    return `${intro}<p class="loading">Нет данных о команде.</p>`;
  }

  const mid = Math.ceil(memberList.length / 2);
  const row1 = memberList.slice(0, mid).map((m, i) => renderTeamMemberCard(m, i)).join('');
  const row2 = memberList.slice(mid).map((m, i) => renderTeamMemberCard(m, i + mid)).join('');
  const quoteBand = renderTeamMissionQuoteBand(mission);

  return `${intro}
    <div class="team-grid team-grid--row">${row1}</div>
    ${quoteBand}
    <div class="team-grid team-grid--row">${row2}</div>`;
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
        homeGrid.innerHTML = renderHomeGrid(data);
        const polaroidDriver = homeGrid.querySelector('[data-polaroid-scroll]');
        const nMarketers = (data.marketers && data.marketers.length) || 12;
        if (polaroidDriver) {
          polaroidDriver.style.height = `${Math.round(95 + Math.min(nMarketers, 12) * 22)}vh`;
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
        marketerRoot.querySelectorAll('.sections-carousel').forEach((car) => initSectionCarousel(car));
      })
      .catch(() => {
        marketerRoot.innerHTML = '<p class="error">Ошибка загрузки.</p>';
      });
  }

  const teamRoot = document.getElementById('team-root');
  if (teamRoot) {
    Promise.all([loadTeam(), loadMarketers()])
      .then(([teamData, marketersData]) => {
        teamRoot.innerHTML = renderTeamPage(teamData, marketersData);
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
          aboutBlocksRoot.innerHTML = renderWhyTwelveBlock(data);
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
