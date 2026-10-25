import { escapeHtml } from '../lib/escape-html.js';
import { iconUrls } from '../lib/images.js';

const classes = (...names) => names.filter(Boolean).join(' ');

export function placeholderHtml(text, className = '') {
  const letter =
    String(text ?? '')
      .trim()
      .charAt(0)
      .toUpperCase() || '?';
  return `<span class="${escapeHtml(classes('img-ph', className))}" aria-hidden="true">${escapeHtml(letter)}</span>`;
}

/** <img> с цепочкой запасных адресов; без адресов — сразу заглушка. */
export function imageHtml({ kind, file, alt, fallbackText, className = '' }) {
  const [src, ...rest] = iconUrls(kind, file);
  if (!src) return placeholderHtml(fallbackText, className);
  return (
    `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async"` +
    ` class="${escapeHtml(className)}" data-fallbacks="${escapeHtml(rest.join('|'))}"` +
    ` data-fallback-text="${escapeHtml(fallbackText)}" data-fallback-class="${escapeHtml(className)}">`
  );
}

const installed = new WeakSet();

function onImageError(event) {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || img.dataset.fallbacks === undefined) return;
  const [next, ...rest] = img.dataset.fallbacks.split('|').filter(Boolean);
  if (next) {
    img.dataset.fallbacks = rest.join('|');
    img.src = next;
    return;
  }
  img.outerHTML = placeholderHtml(img.dataset.fallbackText, img.dataset.fallbackClass);
}

/** Один слушатель на корень: событие error не всплывает, поэтому capture. */
export function installImageFallbacks(root = document) {
  if (installed.has(root)) return;
  installed.add(root);
  root.addEventListener('error', onImageError, true);
}
