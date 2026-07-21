// 'almost' Emacs isearch engine. Pure, tested.
// Case folding is emacs smart-case: case-insensitive unless query has an uppercase letter.

export function caseFold(query) { return query === query.toLowerCase(); }

export function findAll(text, query) {
  if (!query) return [];
  const fold = caseFold(query);
  const hay = fold ? text.toLowerCase() : text;
  const needle = fold ? query.toLowerCase() : query;
  const out = [];
  let i = 0;
  for (;;) {
    const j = hay.indexOf(needle, i);
    if (j === -1) break;
    out.push(j);
    i = j + 1;
  }
  return out;
}

export function createSearch() {
  return { query: '', dir: 1, cur: -1, failing: false, wrapped: false, active: false };
}

// recompute matches after query change; keep position near current point
export function extend(s, text, newQuery, fromPos = 0) {
  s.query = newQuery;
  s.active = true;
  s.failing = false;
  const m = findAll(text, newQuery);
  if (!m.length) { s.cur = -1; s.failing = newQuery !== ''; return m; }
  const start = s.cur >= 0 ? s.cur : fromPos;
  let idx = s.dir === 1 ? m.findIndex((p) => p >= start) : m.length - 1;
  if (s.dir === -1) { const k = m.filter((p) => p <= start); idx = k.length ? m.indexOf(k[k.length - 1]) : -1; }
  if (idx === -1) { s.failing = true; s.curIdx = s.dir === 1 ? m.length - 1 : 0; }
  else s.curIdx = idx;
  s.cur = m[s.curIdx] ?? -1;
  return m;
}

// C-s / C-r repeat: move to next match in dir; fail at end; repeat-after-fail wraps
export function repeat(s, matches, dir) {
  s.active = true;
  if (dir !== s.dir) { s.dir = dir; s.failing = false; }
  if (!matches.length) { s.failing = true; return; }
  const next = s.curIdx + dir;
  if (next < 0 || next >= matches.length) {
    if (s.failing) { // second C-s after fail -> wrap, like emacs
      s.curIdx = dir === 1 ? 0 : matches.length - 1;
      s.cur = matches[s.curIdx];
      s.failing = false;
      s.wrapped = true;
    } else {
      s.failing = true;
    }
  } else {
    s.curIdx = next;
    s.cur = matches[next];
  }
}

// the echo-area line, faithful to emacs wording
export function echoLine(s) {
  if (!s.active) return '';
  const parts = [];
  if (s.failing) parts.push('Failing');
  if (s.wrapped) parts.push(s.failing ? 'overwrapped' : 'Wrapped');
  let p = parts.join(' ');
  const base = `I-search${s.dir === -1 ? ' backward' : ''}: ${s.query}`;
  if (!p) return base;
  p = p[0].toUpperCase() + p.slice(1).toLowerCase();
  return `${p} ${base[0].toLowerCase()}${base.slice(1)}`.replace('i-search', 'I-search');
}

export function countLabel(s, matches) {
  if (!s.active || !matches.length) return '';
  return `${(s.curIdx ?? 0) + 1}/${matches.length}`;
}
