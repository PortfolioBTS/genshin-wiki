let hideTimer;

export function showToast(message, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.append(toast);
  }
  toast.textContent = message;
  toast.className = isError ? 'toast error show' : 'toast show';
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
