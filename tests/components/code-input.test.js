// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { codeInputHtml, initCodeInput } from '../../src/components/code-input.js';

let wrap;
let control;
let onComplete;
const digits = () => [...wrap.querySelectorAll('input')];

function typeInto(input, value) {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

beforeEach(() => {
  document.body.innerHTML = codeInputHtml('code', 'Код подтверждения');
  wrap = document.getElementById('code');
  onComplete = vi.fn();
  control = initCodeInput(wrap, onComplete);
});

describe('code input', () => {
  it('renders six labelled numeric inputs', () => {
    expect(digits()).toHaveLength(6);
    expect(digits()[0].getAttribute('inputmode')).toBe('numeric');
    expect(digits()[0].getAttribute('autocomplete')).toBe('one-time-code');
    expect(wrap.getAttribute('aria-label')).toBe('Код подтверждения');
  });

  it('keeps one digit per box and moves focus forward', () => {
    digits()[0].focus();
    typeInto(digits()[0], '57');
    expect(digits()[0].value).toBe('7');
    expect(document.activeElement).toBe(digits()[1]);
  });

  it('drops non-digits', () => {
    typeInto(digits()[0], 'a');
    expect(digits()[0].value).toBe('');
    expect(control.getValue()).toBe('');
  });

  it('fills all boxes from a paste and reports completion', () => {
    const event = new Event('paste', { bubbles: true, cancelable: true });
    event.clipboardData = { getData: () => '12 34-56' };
    digits()[0].dispatchEvent(event);
    expect(control.getValue()).toBe('123456');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('reports completion when the last digit is typed', () => {
    '12345'.split('').forEach((d, i) => typeInto(digits()[i], d));
    expect(onComplete).not.toHaveBeenCalled();
    typeInto(digits()[5], '6');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('goes back with Backspace on an empty box', () => {
    typeInto(digits()[0], '1');
    typeInto(digits()[1], '2');
    digits()[2].focus();
    digits()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(document.activeElement).toBe(digits()[1]);
    expect(digits()[1].value).toBe('');
  });

  it('clears all boxes', () => {
    typeInto(digits()[0], '1');
    control.clear();
    expect(control.getValue()).toBe('');
    expect(document.activeElement).toBe(digits()[0]);
  });
});
