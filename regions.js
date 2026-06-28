// ── regions.js ────────────────────────────────────────────────────────────────

const EL_BG = {
  Анемо: '#34d39918',
  Гео: '#fbbf2418',
  Электро: '#a78bfa18',
  Дендро: '#84cc1618',
  Гидро: '#38bdf818',
  Пиро: '#ef444418',
  Крио: '#7dd3fc18',
};

document.getElementById('regions-grid').innerHTML = REGIONS.map(r => `
  <div class="region-card">
    <div class="region-top" style="background:linear-gradient(135deg,${EL_BG[r.element] || '#111c3520'},#0e1528)">
      <span class="region-emoji">${r.emoji}</span>
      <div>
        <h3>${r.name}</h3>
        <div class="region-nation">${r.nation} · <strong style="color:var(--text-main)">${r.element}</strong></div>
      </div>
    </div>
    <div class="region-body">
      <div class="region-archon"><span>Архонт: </span>${r.archon}</div>
      ${r.desc}
      <div class="r-tags">${r.tags.map(t => `<span class="r-tag">${t}</span>`).join('')}</div>
    </div>
  </div>`).join('');

const u = getUser();
if (u) { document.getElementById('auth-btn').textContent = '👤 ' + u.name; }
