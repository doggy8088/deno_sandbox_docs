function tokenizeEn(text) {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9_-]*/g) || []).filter((t) => t.length >= 2);
}

function tokenizeZh(text) {
  const chars = [...text.replace(/\s+/g, '')];
  const out = [];
  for (let i = 0; i < chars.length; i++) {
    const a = chars[i];
    if (/[\p{L}\p{N}]/u.test(a)) out.push(a.toLowerCase());
    if (i < chars.length - 1) {
      const bg = (chars[i] + chars[i + 1]).toLowerCase();
      if ([...bg].every((c) => /[\p{L}\p{N}]/u.test(c))) out.push(bg);
    }
  }
  return out;
}

let loadedIndexPromise = null;

async function loadIndex() {
  if (!loadedIndexPromise) {
    const url = document.body.dataset.searchIndex;
    loadedIndexPromise = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`Search index load failed: ${r.status}`);
      return r.json();
    });
  }
  return loadedIndexPromise;
}

function scoreResults(index, query) {
  const isEn = index.lang === 'en';
  const q = query.trim();
  if (!q) return [];
  const tokens = [...new Set((isEn ? tokenizeEn(q) : tokenizeZh(q)).concat(q.length === 1 ? [q] : []))];
  const scores = new Map();
  for (const t of tokens) {
    for (const id of index.invertedIndex[t] || []) scores.set(id, (scores.get(id) || 0) + 1);
    for (const id of index.titleTokens[t] || []) scores.set(id, (scores.get(id) || 0) + 4);
  }
  const lower = q.toLowerCase();
  return [...scores.entries()]
    .map(([id, score]) => {
      const page = index.pages[id];
      if (page.title.toLowerCase().includes(lower)) score += 6;
      if ((page.excerpt || '').toLowerCase().includes(lower)) score += 2;
      return { page, score };
    })
    .sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title))
    .slice(0, 20);
}

function renderResults(results, query) {
  const box = document.getElementById('search-results');
  if (!box) return;
  if (!query.trim()) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.hidden = false;
  if (!results.length) {
    box.innerHTML = '<div class="meta">No results</div>';
    return;
  }
  box.innerHTML = results.map(({ page }) => `
    <div class="item">
      <a href="${page.url}"><strong>${page.title}</strong></a>
      <div class="meta">${page.slug}</div>
      <div>${page.excerpt || ''}</div>
    </div>
  `).join('');
}

const input = document.getElementById('search-input');
if (input) {
  let timer = 0;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = input.value;
      if (!q.trim()) return renderResults([], '');
      try {
        const idx = await loadIndex();
        renderResults(scoreResults(idx, q), q);
      } catch (err) {
        const box = document.getElementById('search-results');
        if (box) {
          box.hidden = false;
          box.textContent = `Search unavailable: ${err.message || err}`;
        }
      }
    }, 120);
  });
}
