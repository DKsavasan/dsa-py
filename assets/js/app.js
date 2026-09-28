/* dsa.py — app shell: routing, sidebar, topic pages, code panel, player UI, liquid glass. */
(function () {
  'use strict';
  const DSA = window.DSA;
  const U = DSA.util;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = DSA.escapeHTML;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('dsapy:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('dsapy:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  // inline markdown: `code`, **bold**
  const md = (s) => esc(String(s || ''))
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  const LEGEND = {
    active: 'Current', current: 'Current', compare: 'Comparing', swap: 'Swapping', visited: 'Visited',
    frontier: 'Waiting (queue/stack)', done: 'Done', sorted: 'Sorted', found: 'Found', path: 'Path', pivot: 'Pivot',
    min: 'Min so far', max: 'Max so far', bad: 'Rejected', dim: 'Out of range', new: 'New', removed: 'Removed',
    range: 'Window', start: 'Start', target: 'Target', match: 'Match', tree: 'Tree edge', relax: 'Relaxing', read: 'Reading',
  };

  /* Big-O class -> colour bucket */
  function oClass(s) {
    const t = String(s).replace(/\s+/g, ' ').toLowerCase();
    if (/n!|2\^n|2ⁿ|n\^2|n²|n\^3|n³|k\^n|v\^3|v³|v ?\* ?e|ve\b|n ?\* ?m|m ?\* ?n|n·m|m·n|v·e/.test(t)) return 'o-bad';
    if (/n log n|n·log n|e log|log n\)\s*\*|n log k|nlogn|e ?\+ ?v\) ?log|v\) ?log|log v/.test(t)) return 'o-mid';
    if (/o\(1\)/.test(t) && !/n/.test(t.replace('o(1)', ''))) return 'o-good';
    if (/^o\(log|o\(log [nk]\)$|o\(h\)|α|alpha/.test(t)) return 'o-ok';
    if (/o\(/.test(t)) return 'o-lin';
    return '';
  }
  const badge = (s) => `<span class="obadge ${oClass(s)}">${esc(s)}</span>`;

  /* ---------------- data ---------------- */
  function sorted(kind) {
    const order = DSA.categoryOrder[kind] || [];
    const cats = [];
    DSA[kind].forEach((e) => { if (!cats.includes(e.category)) cats.push(e.category); });
    cats.sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    return cats.map((c) => ({ cat: c, items: DSA[kind].filter((e) => e.category === c).sort((a, b) => a.order - b.order) }));
  }
  const flat = (kind) => sorted(kind).flatMap((g) => g.items);
  const find = (kind, id) => DSA[kind].find((e) => e.id === id);
  const prefix = { ds: 'd', algo: 'a' };
  const hashFor = (e) => '#' + prefix[e.kind] + '.' + e.id;

  /* ---------------- liquid glass ---------------- */
  function glassify(scope) {
    $$('.lg, .lg-seg', scope).forEach((el) => {
      if (el.__glass) return;
      el.__glass = true;
      // wrap bare text so it paints above the glass layers
      Array.from(el.childNodes).forEach((n) => {
        if (n.nodeType === 3 && n.textContent.trim()) {
          const sp = document.createElement('span');
          sp.textContent = n.textContent;
          el.replaceChild(sp, n);
        }
      });
      const fx = document.createElement('span');
      fx.className = 'lg-fx';
      fx.setAttribute('aria-hidden', 'true');
      fx.innerHTML = '<span class="lg-blur"></span><span class="lg-tint"></span><span class="lg-shine"></span>';
      el.prepend(fx);
      if (el.classList.contains('lg-seg')) {
        const ind = document.createElement('span');
        ind.className = 'lg-ind';
        ind.setAttribute('aria-hidden', 'true');
        ind.innerHTML = '<span class="lg-fx"><span class="lg-blur"></span><span class="lg-tint"></span><span class="lg-shine"></span></span>';
        fx.after(ind);
      }
      el.addEventListener('pointermove', (ev) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((ev.clientX - r.left) / r.width) * 100 + '%');
        el.style.setProperty('--my', ((ev.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }
  // Slide a segmented control's glass blob to the active item with a liquid stretch.
  function segTo(seg, target, animate) {
    const ind = $('.lg-ind', seg);
    if (!ind) return;
    if (!target) { ind.style.opacity = '0'; ind._l = null; return; }
    const l = target.offsetLeft, w = target.offsetWidth, t = target.offsetTop, hh = target.offsetHeight;
    const pl = ind._l, pw = ind._w;
    ind.style.opacity = '1';
    ind.style.width = w + 'px';
    ind.style.height = hh + 'px';
    ind.style.transform = `translate(${l}px, ${t}px)`;
    if (animate && pl != null && !reduced && (pl !== l || pw !== w) && ind.animate) {
      const minL = Math.min(pl, l), maxR = Math.max(pl + pw, l + w);
      ind.animate([
        { transform: `translate(${pl}px, ${t}px) scaleY(1)`, width: pw + 'px' },
        { transform: `translate(${minL}px, ${t}px) scaleY(0.86)`, width: maxR - minL + 'px', offset: 0.42 },
        { transform: `translate(${l}px, ${t}px) scaleY(1.04)`, width: w + 'px', offset: 0.78 },
        { transform: `translate(${l}px, ${t}px) scaleY(1)`, width: w + 'px' },
      ], { duration: 620, easing: 'cubic-bezier(.25,.9,.3,1)' });
    }
    ind._l = l; ind._w = w;
  }

  /* ---------------- theme ---------------- */
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }
  function isDark() {
    const t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyTheme(store.get('theme', null));
  $('#themeBtn').addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    store.set('theme', next);
    applyTheme(next);
  });

  /* ---------------- sidebar ---------------- */
  let sideKind = 'ds';
  function renderSidebar(activeId) {
    const q = $('#filterInput').value.trim().toLowerCase();
    const groups = sorted(sideKind);
    const html = groups.map((g) => {
      const items = g.items.filter((e) => !q || (e.title + ' ' + (e.tags || []).join(' ') + ' ' + g.cat).toLowerCase().includes(q));
      if (!items.length) return '';
      return `<div class="side-group"><div class="side-cat">${esc(g.cat)}</div>${items.map((e) =>
        `<a class="side-item${e.id === activeId ? ' on' : ''}" href="${hashFor(e)}" data-id="${e.id}"><span>${esc(e.title)}</span>${e.variants && e.variants.length > 1 ? `<i title="${e.variants.length} versions">${e.variants.length}</i>` : ''}</a>`).join('')}</div>`;
    }).join('');
    $('#sideList').innerHTML = html || '<p class="side-empty">No topics match.</p>';
    $('#sideTitle').innerHTML = `${sideKind === 'ds' ? 'Data Structures' : 'Algorithms'} <em>${DSA[sideKind].length}</em>`;
    const on = $('.side-item.on');
    if (on) {
      const list = $('#sideList');
      const r = on.getBoundingClientRect(), lr = list.getBoundingClientRect();
      if (r.top < lr.top || r.bottom > lr.bottom) on.scrollIntoView({ block: 'center' });
    }
  }
  $('#filterInput').addEventListener('input', () => renderSidebar(current && current.entry ? current.entry.id : null));

  // Show / hide the topic list. Wide screens collapse the column; narrow screens use a drawer.
  const narrow = window.matchMedia ? window.matchMedia('(max-width: 960px)') : { matches: false };
  let sideOpen = store.get('sideOpen', window.innerWidth >= 1500);
  function applySide(animate) {
    document.body.classList.toggle('side-closed', !sideOpen);
    $('#menuBtn').setAttribute('aria-expanded', String(narrow.matches ? document.body.classList.contains('drawer-open') : sideOpen));
    if (animate) setTimeout(() => window.dispatchEvent(new Event('resize')), 480);
  }
  function toggleSide(force) {
    if (narrow.matches) {
      document.body.classList.toggle('drawer-open', force);
    } else {
      sideOpen = force == null ? !sideOpen : force;
      store.set('sideOpen', sideOpen);
    }
    applySide(true);
  }
  const closeDrawer = () => { document.body.classList.remove('drawer-open'); applySide(false); };
  $('#menuBtn').addEventListener('click', () => toggleSide());
  $('#sideClose').addEventListener('click', () => (narrow.matches ? closeDrawer() : toggleSide(false)));
  $('#scrim').addEventListener('click', closeDrawer);
  $('#sideList').addEventListener('click', (e) => { if (e.target.closest('.side-item')) closeDrawer(); });
  applySide(false);

  /* ---------------- dropdown menus on the top nav ---------------- */
  const mega = $('#mega'), megaCard = $('#megaCard');
  let megaKind = null, tOpen = null, tClose = null;
  function megaHTML(kind) {
    const groups = sorted(kind);
    const label = kind === 'ds' ? 'Data Structures' : 'Algorithms';
    return `<div class="mega-head"><span>${label} · ${DSA[kind].length} topics</span><a href="#${kind}">See all as cards →</a></div>
      <div class="mega-cols">${groups.map((g) => `<div class="mega-col"><h4>${esc(g.cat)}</h4>${g.items.map((e) =>
        `<a href="${hashFor(e)}" class="${current && current.entry === e ? 'on' : ''}">${esc(e.title)}</a>`).join('')}</div>`).join('')}</div>`;
  }
  function openMega(kind) {
    clearTimeout(tClose);
    const tab = $(`#navTabs a[data-menu="${kind}"]`);
    $$('#navTabs a[data-menu]').forEach((a) => a.classList.toggle('menu-open', a === tab));
    if (megaKind === kind && !mega.hidden) return;
    megaKind = kind;
    megaCard.innerHTML = megaHTML(kind);
    mega.hidden = false;
    megaCard.classList.remove('in'); void megaCard.offsetWidth; megaCard.classList.add('in');
    tab.setAttribute('aria-expanded', 'true');
  }
  function closeMega() {
    clearTimeout(tOpen); clearTimeout(tClose);
    if (mega.hidden) return;
    mega.hidden = true;
    megaKind = null;
    $$('#navTabs a[data-menu]').forEach((a) => { a.classList.remove('menu-open'); a.setAttribute('aria-expanded', 'false'); });
  }
  const laterClose = () => { clearTimeout(tOpen); clearTimeout(tClose); tClose = setTimeout(closeMega, 220); };
  $$('#navTabs a[data-menu]').forEach((a) => {
    a.addEventListener('pointerenter', (ev) => {
      if (ev.pointerType !== 'mouse') return;
      clearTimeout(tClose); clearTimeout(tOpen);
      tOpen = setTimeout(() => openMega(a.dataset.menu), mega.hidden ? 140 : 0);
    });
    a.addEventListener('pointerleave', laterClose);
    a.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); openMega(a.dataset.menu); const f = $('.mega-col a', megaCard); if (f) f.focus(); }
    });
    a.addEventListener('click', closeMega);
  });
  mega.addEventListener('pointerenter', () => clearTimeout(tClose));
  mega.addEventListener('pointerleave', laterClose);
  mega.addEventListener('click', (ev) => { if (ev.target.closest('a')) closeMega(); });
  mega.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { const t = $(`#navTabs a[data-menu="${megaKind}"]`); closeMega(); if (t) t.focus(); } });

  /* ---------------- nav tabs ---------------- */
  function setNav(tab) {
    $$('#navTabs a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
    segTo($('#navTabs'), $(`#navTabs a[data-tab="${tab}"]`), true);
  }

  /* ---------------- pages ---------------- */
  let current = null; // {entry, variantIdx, player}

  function homePage() {
    const nDS = DSA.ds.length, nA = DSA.algo.length;
    const nAnim = DSA.algo.reduce((s, e) => s + (e.variants ? e.variants.length : 1), 0);
    const cheats = [
      ['list', 'x[i], x.append(v), x.pop()', 'O(1)'], ['list', 'x.insert(0, v), x.pop(0), v in x', 'O(n)'],
      ['dict / set', 'd[k], k in d, d[k] = v', 'O(1)'], ['deque', 'q.append, q.popleft', 'O(1)'],
      ['heapq', 'heappush, heappop', 'O(log n)'], ['heapq', 'heapify(x)', 'O(n)'],
      ['sort', 'x.sort(), sorted(x)', 'O(n log n)'], ['bisect', 'bisect_left(x, v)', 'O(log n)'],
      ['str', 's + t in a loop', 'O(n²)'], ['str', "''.join(parts)", 'O(n)'],
    ];
    return `
    <section class="home">
      <div class="hero">
        <p class="eyebrow">Python · Interview refresher</p>
        <h1 class="hero-title">Every structure.<br>Every classic algorithm.<br><span>One screen each.</span></h1>
        <p class="hero-sub">Pick a topic, press play, and watch the code run line by line next to what it does to the data. Each page gives you the idea, the Big-O, and idiomatic Python you can type from memory.</p>
        <div class="hero-cta">
          <a class="lg btn-lg" href="#ds"><span class="lbl">Data Structures</span><span class="cnt">${nDS}</span></a>
          <a class="lg btn-lg" href="#algo"><span class="lbl">Algorithms</span><span class="cnt">${nA}</span></a>
        </div>
      </div>
      <div class="home-grid">
        <div class="panel home-card">
          <h2>Python Big-O you should know cold</h2>
          <table class="cheat">
            <thead><tr><th>Type</th><th>Operation</th><th>Time</th></tr></thead>
            <tbody>${cheats.map(([a, b, c]) => `<tr><td>${esc(a)}</td><td><code>${esc(b)}</code></td><td>${badge(c)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="panel home-card">
          <h2>How to use it</h2>
          <ul class="howto">
            <li><kbd>Space</kbd><span>play / pause the animation</span></li>
            <li><kbd>←</kbd><kbd>→</kbd><span>step backward / forward</span></li>
            <li><kbd>[</kbd><kbd>]</kbd><span>previous / next topic</span></li>
            <li><kbd>/</kbd><span>search every topic</span></li>
          </ul>
          <p class="muted">${nAnim} animated walkthroughs. Toggles switch between versions of the same algorithm (iterative vs recursive, BFS vs DFS) and the explanation, complexity, and code switch with them.</p>
        </div>
      </div>
    </section>`;
  }

  function indexPage(kind) {
    const groups = sorted(kind);
    const title = kind === 'ds' ? 'Data Structures' : 'Algorithms';
    const sub = kind === 'ds'
      ? 'What each structure looks like, how to create it in Python, and what every operation costs.'
      : 'Animated walkthroughs. The highlighted line in the code is the line that produced the picture.';
    return `<section class="index">
      <header class="index-head"><p class="eyebrow">${groups.length} categories · ${DSA[kind].length} topics</p><h1>${title}</h1><p class="summary">${sub}</p></header>
      ${groups.map((g) => `<div class="index-group"><h2>${esc(g.cat)}</h2><div class="cards">${g.items.map((e) => {
        const cx = kind === 'ds' ? (e.ops && e.ops[0] ? e.ops[0].time : '') : (e.complexity && (typeof e.complexity.time === 'string' ? e.complexity.time : e.complexity.time && (e.complexity.time.avg || e.complexity.time.worst))) || (e.variants && e.variants[0].complexity && e.variants[0].complexity.time && (typeof e.variants[0].complexity.time === 'string' ? e.variants[0].complexity.time : e.variants[0].complexity.time.avg || e.variants[0].complexity.time.worst));
        return `<a class="card" href="${hashFor(e)}"><span class="card-t">${esc(e.title)}</span><span class="card-s">${md(firstSentence(e.summary))}</span><span class="card-f">${cx ? badge(cx) : ''}${e.variants && e.variants.length > 1 ? `<span class="vcount">${e.variants.length} versions</span>` : ''}</span></a>`;
      }).join('')}</div></div>`).join('')}
    </section>`;
  }
  const firstSentence = (s) => { s = String(s || ''); const m = s.match(/^(.+?[.!?])(\s|$)/); return m ? m[1] : s; };

  function variantOf(entry, i) {
    const v = entry.variants && entry.variants[i];
    return v ? Object.assign({}, entry, v, { id: entry.id, kind: entry.kind, variants: entry.variants, vid: v.id, vlabel: v.label }) : Object.assign({}, entry);
  }

  function complexityHTML(e) {
    const out = [];
    const c = e.complexity;
    if (c) {
      const LBL = { best: 'Best', avg: 'Average', worst: 'Worst' };
      const kindOf = (k) => (LBL[k] ? LBL[k] + ' case' : k);
      if (c.time) out.push('<span class="cx-lab">Time</span>');
      if (c.time && typeof c.time === 'object') {
        Object.keys(c.time).forEach((k) => {
          if (c.time[k]) out.push(`<div class="cx-item" title="Time · ${esc(kindOf(k))}"><span>${esc(LBL[k] || k)}</span>${badge(c.time[k])}</div>`);
        });
      } else if (c.time) out.push(`<div class="cx-item" title="Time"><span>All cases</span>${badge(c.time)}</div>`);
      if (c.space) out.push(`<span class="cx-lab">Space</span><div class="cx-item" title="Extra memory"><span>Memory</span>${badge(c.space)}</div>`);
      if (c.stable != null) out.push(`<div class="cx-item"><span>Stable</span><span class="obadge ${c.stable ? 'o-good' : 'o-plain'}">${c.stable ? 'Yes' : 'No'}</span></div>`);
      if (c.inPlace != null) out.push(`<div class="cx-item"><span>In place</span><span class="obadge ${c.inPlace ? 'o-good' : 'o-plain'}">${c.inPlace ? 'Yes' : 'No'}</span></div>`);
      if (c.note) out.push(`<div class="cx-note">${md(c.note)}</div>`);
    }
    let ops = '';
    if (e.ops && e.ops.length) {
      ops = `<div class="ops">${e.ops.map((o) => `<div class="op"><code>${esc(o.op)}</code>${badge(o.time)}${o.note ? `<span class="op-note">${md(o.note)}</span>` : ''}</div>`).join('')}</div>`;
      if (e.space && !c) out.push(`<div class="cx-item"><span>Space</span>${badge(e.space)}</div>`);
    }
    return { chips: out.join(''), ops };
  }

  function topicPage(entry, vi) {
    const e = variantOf(entry, vi);
    const cx = complexityHTML(e);
    const kindLabel = entry.kind === 'ds' ? 'Data Structures' : 'Algorithms';
    const animated = typeof e.trace === 'function';
    const list = flat(entry.kind);
    const idx = list.indexOf(entry);
    const prev = list[idx - 1], next = list[idx + 1];
    const fields = animated && e.input && e.input.fields ? e.input.fields : [];
    const fileName = (e.file || entry.id.replace(/-/g, '_')) + '.py';
    return `<article class="topic" data-kind="${entry.kind}">
      <header class="topic-head">
        <p class="eyebrow"><a href="#${entry.kind}">${kindLabel}</a><span>/</span>${esc(entry.category)}</p>
        <div class="title-row">
          <h1>${esc(entry.title)}</h1>
          ${entry.variants && entry.variants.length > 1 ? `<div class="lg-seg variant-seg" id="variantSeg" role="tablist" aria-label="Implementation">${entry.variants.map((v, i) => `<button role="tab" data-vi="${i}" class="${i === vi ? 'on' : ''}" aria-selected="${i === vi}">${esc(v.label)}</button>`).join('')}</div>` : ''}
        </div>
        <p class="summary" id="summary">${md(e.summary)}</p>
        ${cx.chips ? `<div class="cx" id="cx">${cx.chips}</div>` : ''}
        ${cx.ops ? `<details class="ops-wrap" open><summary>Operations &amp; cost</summary>${cx.ops}</details>` : ''}
      </header>

      <section class="stage">
        <div class="panel viz-pane">
          <div class="pane-head">
            <span class="pane-title">${animated ? 'Walkthrough' : 'What it looks like'}</span>
            <div class="legend" id="legend"></div>
          </div>
          ${fields.length ? `<form class="inputs" id="inputs">${fields.map((f) => `<label class="field"><span>${esc(f.label || f.key)}</span><input id="in-${f.key}" data-key="${f.key}" data-type="${f.type || 'array'}" spellcheck="false" autocomplete="off"></label>`).join('')}
            <button type="submit" class="lg btn-sm">Run</button>${e.input.random ? '<button type="button" class="lg btn-sm" id="shuffleBtn">Shuffle</button>' : ''}<span class="in-err" id="inErr"></span></form>` : ''}
          <div class="viz-area" id="vizArea"></div>
          <div class="aux" id="aux"></div>
          ${animated ? `
          <div class="caption" id="caption"><span class="cap-step" id="capStep"></span><span class="cap-msg" id="capMsg"></span></div>
          <div class="controls">
            <button class="lg icon-btn" id="bFirst" aria-label="Restart"><svg viewBox="0 0 20 20" width="15" height="15"><path d="M4 4v12M16 4L7 10l9 6z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></button>
            <button class="lg icon-btn" id="bPrev" aria-label="Step back"><svg viewBox="0 0 20 20" width="15" height="15"><path d="M13 4l-7 6 7 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button class="lg play-btn" id="bPlay" aria-label="Play"><svg class="i-play" viewBox="0 0 20 20" width="16" height="16"><path d="M6 3.8v12.4L16 10z" fill="currentColor"/></svg><svg class="i-pause" viewBox="0 0 20 20" width="16" height="16"><path d="M6 4h2.6v12H6zM11.4 4H14v12h-2.6z" fill="currentColor"/></svg><span id="playLbl">Play</span></button>
            <button class="lg icon-btn" id="bNext" aria-label="Step forward"><svg viewBox="0 0 20 20" width="15" height="15"><path d="M7 4l7 6-7 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button class="lg icon-btn" id="bLast" aria-label="Jump to end"><svg viewBox="0 0 20 20" width="15" height="15"><path d="M16 4v12M4 4l9 6-9 6z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg></button>
            <input type="range" class="scrub" id="scrub" min="0" max="0" value="0" aria-label="Timeline">
            <button class="lg btn-sm speed-btn" id="speedBtn" title="Playback speed">1×</button>
          </div>` : (e.visualCaption ? `<p class="caption static">${md(e.visualCaption)}</p>` : '')}
        </div>

        <div class="code-pane${animated ? ' debugging' : ''}">
          <div class="vs-tabs"><div class="vs-tab on"><svg viewBox="0 0 16 16" width="14" height="14"><path fill="#3b82c4" d="M7.9 1C4.3 1 4.5 2.6 4.5 2.6v1.6H8v.5H3.1S1 4.5 1 8.1s1.8 3.4 1.8 3.4h1.1V9.9s-.1-1.8 1.8-1.8h3s1.7 0 1.7-1.7V2.9S10.7 1 7.9 1zM6 2.1a.6.6 0 110 1.1.6.6 0 010-1.1z"/><path fill="#f5c843" d="M8.1 15c3.6 0 3.4-1.6 3.4-1.6v-1.6H8v-.5h4.9S15 11.5 15 7.9s-1.8-3.4-1.8-3.4h-1.1v1.6s.1 1.8-1.8 1.8h-3s-1.7 0-1.7 1.7v3.5S5.3 15 8.1 15zm1.9-1.1a.6.6 0 110-1.1.6.6 0 010 1.1z"/></svg><span>${esc(fileName)}</span></div>
            <button class="vs-copy" id="copyBtn" title="Copy code">Copy</button></div>
          <div class="vs-crumbs">dsa.py <span>›</span> ${entry.kind === 'ds' ? 'data_structures' : 'algorithms'} <span>›</span> ${esc(fileName)}${e.vlabel ? ` <span>›</span> ${esc(e.vlabel)}` : ''}</div>
          <div class="vs-editor" id="editor"></div>
          ${animated ? `<div class="vs-panel"><div class="vs-panel-h"><span>Variables</span><span class="vs-dim" id="frameLbl"></span></div><div class="vs-vars" id="vars"></div></div>` : ''}
          <div class="vs-status"><span>${animated ? '⏵ Debugging' : 'main'}</span><span id="lnCol">Ln 1, Col 1</span><span>Python 3.12</span><span>UTF-8</span></div>
        </div>
      </section>

      <section class="notes-row" id="notesRow">${notesHTML(e)}</section>

      <nav class="pager">
        ${prev ? `<a class="lg pager-btn" href="${hashFor(prev)}"><span class="pg-dir">← Previous</span><span class="pg-t">${esc(prev.title)}</span></a>` : '<span></span>'}
        ${next ? `<a class="lg pager-btn next" href="${hashFor(next)}"><span class="pg-dir">Next →</span><span class="pg-t">${esc(next.title)}</span></a>` : '<span></span>'}
      </nav>
    </article>`;
  }

  function notesHTML(e) {
    const blocks = [];
    if (e.notes && e.notes.length) blocks.push(`<div class="panel note-card"><h3>Key points</h3><ul>${e.notes.map((n) => `<li>${md(n)}</li>`).join('')}</ul></div>`);
    if (e.tips && e.tips.length) blocks.push(`<div class="panel note-card"><h3>Interview tips</h3><ul>${e.tips.map((n) => `<li>${md(n)}</li>`).join('')}</ul></div>`);
    if (e.problems && e.problems.length) blocks.push(`<div class="panel note-card"><h3>Practice problems</h3><div class="probs">${e.problems.map((p) => `<span class="prob">${md(p)}</span>`).join('')}</div></div>`);
    return blocks.join('');
  }

  /* ---------------- code panel ---------------- */
  function renderCode(e) {
    const parsed = DSA.parseCode(e.code || '# (no code)');
    const html = DSA.highlightPython(parsed.text);
    $('#editor').innerHTML = `<div class="vs-lines">${html.map((l, i) => `<div class="ln" data-n="${i + 1}"><span class="gut"><i class="bp"></i>${i + 1}</span><span class="src">${l || ' '}</span></div>`).join('')}</div>`;
    $('#copyBtn').onclick = () => {
      const done = () => { $('#copyBtn').textContent = 'Copied'; setTimeout(() => ($('#copyBtn').textContent = 'Copy'), 1400); };
      try {
        navigator.clipboard.writeText(parsed.text).then(done, () => selectCode());
      } catch (err) { selectCode(); }
    };
    $('#editor').onclick = (ev) => {
      const ln = ev.target.closest('.ln');
      if (!ln) return;
      $$('.ln.sel', $('#editor')).forEach((x) => x.classList.remove('sel'));
      ln.classList.add('sel');
      $('#lnCol').textContent = `Ln ${ln.dataset.n}, Col 1`;
    };
    return parsed;
  }
  function selectCode() {
    const r = document.createRange();
    r.selectNodeContents($('#editor'));
    const s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }
  function lineNumbers(line, anchors) {
    const arr = [].concat(line == null ? [] : line);
    return arr.map((l) => (typeof l === 'number' ? l : anchors[l])).filter((n) => n != null);
  }
  function highlightLines(nums) {
    const ed = $('#editor');
    $$('.ln.cur', ed).forEach((x) => x.classList.remove('cur', 'cur-first'));
    nums.forEach((n, k) => {
      const ln = $(`.ln[data-n="${n}"]`, ed);
      if (ln) { ln.classList.add('cur'); if (k === 0) ln.classList.add('cur-first'); }
    });
    if (nums.length) {
      $('#lnCol').textContent = `Ln ${nums[0]}, Col 1`;
      const ln = $(`.ln[data-n="${nums[0]}"]`, ed);
      if (ln) {
        const top = ln.offsetTop, bottom = top + ln.offsetHeight;
        if (top < ed.scrollTop + 20 || bottom > ed.scrollTop + ed.clientHeight - 20) {
          ed.scrollTo({ top: Math.max(0, top - ed.clientHeight / 3), behavior: reduced ? 'auto' : 'smooth' });
        }
      }
    }
  }

  /* ---------------- aux + vars ---------------- */
  function auxHTML(aux) {
    if (!aux || !aux.length) return '';
    return aux.map((row) => {
      const items = row.items || [];
      const kind = row.kind || 'list';
      const chips = items.map((it, i) => {
        const o = it !== null && typeof it === 'object' && !Array.isArray(it) && 'v' in it ? it : { v: it };
        const txt = typeof o.v === 'string' && !row.quote ? o.v : U.py(o.v);
        const st = o.s || (row.states && row.states[i]);
        return `<span class="chip${st ? ' s-' + st : ''}">${esc(txt)}</span>`;
      }).join('');
      const pre = kind === 'queue' ? '<span class="aux-end">front</span>' : '';
      const post = kind === 'stack' ? '<span class="aux-end">top</span>' : kind === 'queue' ? '<span class="aux-end">back</span>' : '';
      return `<div class="aux-row"><span class="aux-label">${esc(row.label || kind)}</span><div class="aux-items">${pre}${chips || '<span class="aux-empty">empty</span>'}${post}</div></div>`;
    }).join('');
  }
  function varsHTML(vars, prevVars) {
    if (!vars) return '<div class="vs-empty">No local variables yet</div>';
    return Object.keys(vars).map((k) => {
      const v = vars[k];
      const txt = v && typeof v === 'object' && 'raw' in v ? String(v.raw) : U.py(v);
      const changed = prevVars && JSON.stringify(prevVars[k]) !== JSON.stringify(v);
      return `<div class="var${changed ? ' changed' : ''}"><span class="vk">${esc(k)}</span><span class="vo">=</span><span class="vv">${esc(txt)}</span></div>`;
    }).join('');
  }

  /* ---------------- topic controller ---------------- */
  function openTopic(entry, forceVi, prevInd) {
    if (current && current.player) current.player.pause();
    const saved = forceVi != null ? forceVi : store.get('v:' + entry.id, 0);
    const vi = entry.variants && saved < entry.variants.length ? saved : 0;
    $('#main').innerHTML = topicPage(entry, vi);
    glassify($('#main'));
    current = { entry, vi };
    const seg = $('#variantSeg');
    if (seg) {
      if (prevInd && prevInd.l != null) {
        const ind = $('.lg-ind', seg);
        ind._l = prevInd.l; ind._w = prevInd.w;
        segTo(seg, $('button.on', seg), true);
      } else requestAnimationFrame(() => segTo(seg, $('button.on', seg), false));
      $$('button', seg).forEach((b) => b.addEventListener('click', () => switchVariant(+b.dataset.vi)));
    }
    if (prevInd) ['#summary', '#cx', '#notesRow'].forEach((sel) => { const el = $(sel); if (el) el.classList.add('swap'); });
    loadVariant(vi, true);
  }

  // Rebuild the whole page for the new variant so every part (inputs, ops, captions,
  // code, animation) matches it; the toggle blob glides from its old spot.
  function switchVariant(vi) {
    if (!current || vi === current.vi) return;
    store.set('v:' + current.entry.id, vi);
    const ind = $('#variantSeg .lg-ind');
    const y = window.scrollY;
    openTopic(current.entry, vi, ind ? { l: ind._l, w: ind._w } : {});
    window.scrollTo(0, y);
  }

  function readInputs(e) {
    const inp = {};
    let err = '';
    $$('#inputs input').forEach((el) => {
      const key = el.dataset.key, type = el.dataset.type;
      const raw = el.value.trim();
      if (type === 'number') {
        const n = Number(raw);
        if (raw === '' || !isFinite(n)) err = `${key} must be a number`;
        inp[key] = n;
      } else if (type === 'text') {
        inp[key] = raw;
      } else {
        const parts = raw.replace(/[[\]]/g, '').split(/[\s,]+/).filter(Boolean);
        const nums = parts.map(Number);
        if (nums.some((n) => !isFinite(n))) err = `${key}: use numbers separated by commas`;
        const f = e.input.fields.find((x) => x.key === key);
        const max = (f && f.max) || 12;
        if (nums.length > max) err = `${key}: keep it to ${max} numbers or fewer so the animation stays readable`;
        if (f && f.min && nums.length < f.min) err = `${key}: needs at least ${f.min} numbers`;
        inp[key] = nums;
      }
    });
    return { inp, err };
  }
  function writeInputs(e, inp) {
    $$('#inputs input').forEach((el) => {
      const v = inp[el.dataset.key];
      el.value = Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v);
    });
  }

  function loadVariant(vi, first) {
    const e = variantOf(current.entry, vi);
    const parsed = renderCode(e);
    current.parsed = parsed;
    const animated = typeof e.trace === 'function';
    if (!animated) {
      const views = e.visuals || (e.visual ? [e.visual] : []);
      DSA.viz.mount($('#vizArea'), views);
      const st = new Set();
      views.forEach((v) => DSA.viz.statesIn(v, st));
      $('#legend').innerHTML = e.legend === false ? '' : legendHTML(st, e.legend);
      $('#aux').innerHTML = auxHTML(e.aux);
      return;
    }
    if (!current.player) {
      // fresh page: build player
    }
    const player = new DSA.Player((f, i, n) => showFrame(f, i, n));
    if (current.player) current.player.pause();
    current.player = player;
    player.speed = store.get('speed', 1);
    player.onState = (p) => {
      const b = $('#bPlay');
      if (!b) return;
      b.classList.toggle('playing', p.playing);
      $('#playLbl').textContent = p.playing ? 'Pause' : p.i >= p.frames.length - 1 && p.frames.length > 1 ? 'Replay' : 'Play';
      const sc = $('#scrub');
      sc.max = Math.max(0, p.frames.length - 1);
      sc.value = p.i;
      sc.style.setProperty('--p', p.frames.length > 1 ? (p.i / (p.frames.length - 1)) * 100 + '%' : '0%');
    };
    const run = (inp) => {
      let frames;
      try {
        frames = e.trace(U.clone(inp), U) || [];
        $('#inErr') && ($('#inErr').textContent = '');
      } catch (err) {
        console.error(err);
        if ($('#inErr')) $('#inErr').textContent = 'That input broke the animation: ' + err.message;
        return;
      }
      current.prevVars = null;
      const st = new Set();
      frames.forEach((f) => { (f.views || (f.view ? [f.view] : [])).forEach((v) => DSA.viz.statesIn(v, st)); (f.aux || []).forEach((a) => DSA.viz.statesIn(a, st)); });
      $('#legend').innerHTML = e.legend === false ? '' : legendHTML(st, e.legend);
      $('#vizArea').innerHTML = '';
      player.load(frames);
    };
    const inputKey = 'in:' + current.entry.id + ':' + (e.vid || '');
    let inp = (e.input && e.input.default) ? U.clone(e.input.default) : {};
    if (e.input && e.input.fields && $('#inputs')) {
      const savedIn = store.get(inputKey, null);
      if (savedIn) e.input.fields.forEach((f) => { if (f.key in savedIn) inp[f.key] = savedIn[f.key]; });
      writeInputs(e, inp);
      const form = $('#inputs');
      form.onsubmit = (ev) => {
        ev.preventDefault();
        const r = readInputs(e);
        if (r.err) { $('#inErr').textContent = r.err; return; }
        store.set(inputKey, r.inp);
        run(r.inp);
        player.play();
      };
      const sh = $('#shuffleBtn');
      if (sh) sh.onclick = () => {
        const r = e.input.random();
        writeInputs(e, r);
        store.set(inputKey, r);
        run(r);
      };
    }
    run(inp);
    bindControls(player);
  }

  function legendHTML(st, custom) {
    const labels = Object.assign({}, LEGEND, custom || {});
    const seen = new Set();
    return Array.from(st).filter((s) => labels[s] && !['dim'].includes(s)).map((s) => {
      const l = labels[s];
      if (seen.has(l)) return '';
      seen.add(l);
      return `<span class="lg-item"><i class="dot s-${s}"></i>${esc(l)}</span>`;
    }).join('');
  }

  function showFrame(f, i, n) {
    const views = f.views || (f.view ? [f.view] : []);
    try { DSA.viz.mount($('#vizArea'), views); } catch (err) { console.error(err); }
    $('#aux').innerHTML = auxHTML(f.aux);
    $('#capStep').textContent = `${i + 1}/${n}`;
    const msg = $('#capMsg');
    msg.innerHTML = md(f.msg);
    msg.classList.remove('swap'); void msg.offsetWidth; msg.classList.add('swap');
    highlightLines(lineNumbers(f.line, current.parsed.anchors));
    $('#vars').innerHTML = varsHTML(f.vars, current.prevVars);
    $('#frameLbl').textContent = `step ${i + 1} of ${n}`;
    current.prevVars = f.vars;
  }

  function bindControls(player) {
    $('#bPlay').onclick = () => player.toggle();
    $('#bNext').onclick = () => { player.pause(); player.next(); };
    $('#bPrev').onclick = () => player.prev();
    $('#bFirst').onclick = () => player.first();
    $('#bLast').onclick = () => player.last();
    $('#scrub').oninput = (ev) => { const to = +ev.target.value; player.pause(); player.seek(to); };
    const SPEEDS = [0.5, 1, 2, 4];
    const sb = $('#speedBtn');
    const showSpeed = () => { sb.textContent = player.speed + '×'; sb.setAttribute('aria-label', `Speed ${player.speed}×, click to change`); };
    sb.onclick = () => {
      const i = SPEEDS.indexOf(player.speed);
      player.setSpeed(SPEEDS[(i + 1) % SPEEDS.length]);
      store.set('speed', player.speed);
      showSpeed();
    };
    showSpeed();
    player.onState(player);
  }

  /* ---------------- router ---------------- */
  function route() {
    const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'home';
    let entry = null;
    let tab = 'home';
    if (h === 'ds' || h === 'algo') {
      tab = h;
      if (current && current.player) current.player.pause();
      current = null;
      $('#main').innerHTML = indexPage(h);
      if (sideKind !== h) $('#filterInput').value = '';
      sideKind = h;
    } else if (/^[da]\./.test(h)) {
      const kind = h[0] === 'd' ? 'ds' : 'algo';
      entry = find(kind, h.slice(2));
      tab = kind;
      if (sideKind !== kind) $('#filterInput').value = '';
      sideKind = kind;
      if (entry) openTopic(entry);
      else { $('#main').innerHTML = indexPage(kind); current = null; }
    } else {
      if (current && current.player) current.player.pause();
      current = null;
      $('#main').innerHTML = homePage();
    }
    glassify($('#main'));
    setNav(tab);
    renderSidebar(entry ? entry.id : null);
    document.body.dataset.tab = tab;
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = entry ? `${entry.title} · dsa.py` : 'dsa.py';
  }
  window.addEventListener('hashchange', () => { closeMega(); route(); });

  /* ---------------- search palette ---------------- */
  const all = () => [...flat('ds'), ...flat('algo')];
  let palIdx = 0;
  function openPalette() {
    $('#palette').hidden = false;
    $('#paletteInput').value = '';
    palIdx = 0;
    renderPalette();
    setTimeout(() => $('#paletteInput').focus(), 10);
  }
  function closePalette() { $('#palette').hidden = true; }
  function score(e, q) {
    if (!q) return 1;
    const hay = (e.title + ' ' + e.category + ' ' + (e.tags || []).join(' ') + ' ' + e.id).toLowerCase();
    if (e.title.toLowerCase().startsWith(q)) return 3;
    if (hay.includes(q)) return 2;
    let i = 0;
    for (const ch of hay) if (ch === q[i]) i++;
    return i === q.length ? 1 : 0;
  }
  function renderPalette() {
    const q = $('#paletteInput').value.trim().toLowerCase();
    const res = all().map((e) => ({ e, s: score(e, q) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 12);
    palIdx = Math.min(palIdx, Math.max(0, res.length - 1));
    $('#paletteList').innerHTML = res.map(({ e }, i) => `<a class="pal-item${i === palIdx ? ' on' : ''}" href="${hashFor(e)}"><span>${esc(e.title)}</span><em>${e.kind === 'ds' ? 'Data structure' : 'Algorithm'} · ${esc(e.category)}</em></a>`).join('') || '<p class="pal-empty">Nothing found</p>';
  }
  $('#paletteInput').addEventListener('input', () => { palIdx = 0; renderPalette(); });
  $('#paletteInput').addEventListener('keydown', (ev) => {
    const items = $$('.pal-item');
    if (ev.key === 'ArrowDown') { palIdx = Math.min(items.length - 1, palIdx + 1); renderPalette(); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp') { palIdx = Math.max(0, palIdx - 1); renderPalette(); ev.preventDefault(); }
    else if (ev.key === 'Enter') { const it = items[palIdx]; if (it) { location.hash = it.getAttribute('href'); closePalette(); } }
    else if (ev.key === 'Escape') closePalette();
  });
  $('#palette').addEventListener('click', (ev) => { if (ev.target.id === 'palette' || ev.target.closest('.pal-item')) closePalette(); });
  $('#searchBtn').addEventListener('click', openPalette);

  /* ---------------- keyboard ---------------- */
  document.addEventListener('keydown', (ev) => {
    const tag = (ev.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || ev.target.isContentEditable;
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); openPalette(); return; }
    if (typing) return;
    if (ev.key === '/') { ev.preventDefault(); openPalette(); return; }
    if (ev.key === 'Escape') { closePalette(); closeDrawer(); closeMega(); return; }
    if (ev.key === 'b' && !ev.metaKey && !ev.ctrlKey && !ev.altKey) { toggleSide(); return; }
    const p = current && current.player;
    if (ev.key === ' ' && p) { ev.preventDefault(); p.toggle(); }
    else if (ev.key === 'ArrowRight' && p) { ev.preventDefault(); p.pause(); p.next(); }
    else if (ev.key === 'ArrowLeft' && p) { ev.preventDefault(); p.prev(); }
    else if ((ev.key === ']' || ev.key === '[') && current && current.entry) {
      const list = flat(current.entry.kind);
      const i = list.indexOf(current.entry) + (ev.key === ']' ? 1 : -1);
      if (list[i]) location.hash = hashFor(list[i]);
    }
  });

  window.addEventListener('resize', () => {
    ['#navTabs', '#variantSeg'].forEach((s) => { const seg = $(s); if (seg) segTo(seg, $('.on', seg), false); });
  });

  /* ---------------- boot ---------------- */
  glassify(document);
  route();
  // fonts shift the tab widths once loaded
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => window.dispatchEvent(new Event('resize')));
})();
