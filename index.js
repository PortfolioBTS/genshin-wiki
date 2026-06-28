// ── index.js ──────────────────────────────────────────────────────────────────

const u = getUser();
if (u) {
  const b = document.getElementById('auth-btn');
  b.textContent = '👤 ' + u.name;
  b.href = 'auth.html';
}
