import { escapeHtml } from '../lib/escape-html.js';

const LENGTH = 6;

export function codeInputHtml(id, label) {
  const inputs = Array.from(
    { length: LENGTH },
    (_, i) =>
      `<input class="code-digit" type="text" inputmode="numeric" maxlength="1" aria-label="Цифра ${i + 1}"${i === 0 ? ' autocomplete="one-time-code"' : ' autocomplete="off"'} />`,
  ).join('');
  return `<div class="code-wrap" id="${escapeHtml(id)}" role="group" aria-label="${escapeHtml(label)}">${inputs}</div>`;
}

/** Шесть полей для кода: автопереход, Backspace, стрелки и вставка целиком. */
export function initCodeInput(wrap, onComplete) {
  const inputs = [...wrap.querySelectorAll('input')];
  const getValue = () => inputs.map((input) => input.value).join('');

  const checkComplete = () => {
    const value = getValue();
    if (value.length === LENGTH) onComplete(value);
  };

  const fill = (digits, from) => {
    digits.slice(0, LENGTH - from).forEach((digit, i) => {
      inputs[from + i].value = digit;
    });
    inputs[Math.min(from + digits.length, LENGTH - 1)].focus();
  };

  wrap.addEventListener('input', (event) => {
    const index = inputs.indexOf(event.target);
    if (index < 0) return;
    const digit = event.target.value.replace(/\D/g, '').slice(-1);
    event.target.value = digit;
    if (digit && index < LENGTH - 1) inputs[index + 1].focus();
    checkComplete();
  });

  wrap.addEventListener('keydown', (event) => {
    const index = inputs.indexOf(event.target);
    if (index < 0) return;
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
      inputs[index - 1].value = '';
      inputs[index - 1].focus();
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      inputs[index - 1].focus();
    } else if (event.key === 'ArrowRight' && index < LENGTH - 1) {
      inputs[index + 1].focus();
    }
  });

  wrap.addEventListener('paste', (event) => {
    const index = inputs.indexOf(event.target);
    const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').split('');
    if (index < 0 || !digits.length) return;
    event.preventDefault();
    fill(digits, index);
    checkComplete();
  });

  return {
    getValue,
    clear() {
      inputs.forEach((input) => {
        input.value = '';
      });
      inputs[0].focus();
    },
    focus: () => inputs[0].focus(),
    markError() {
      wrap.classList.remove('shake');
      void wrap.offsetWidth;
      wrap.classList.add('shake');
    },
  };
}
