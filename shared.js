// ── Определяем активную страницу в навигации ──────────────────────────────
(function(){
  const page = location.pathname.split('/').pop() || 'index.html';
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('nav a[data-page]').forEach(a => {
      if (a.dataset.page === page) a.classList.add('active');
    });
  });
})();
