// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { showToast } from '../../src/components/toast.js';

describe('showToast', () => {
  it('creates the toast, marks errors and hides after 3 seconds', () => {
    vi.useFakeTimers();
    showToast('Готово');
    const toast = document.getElementById('toast');
    expect(toast.textContent).toBe('Готово');
    expect(toast.classList.contains('show')).toBe(true);
    expect(toast.getAttribute('role')).toBe('status');
    showToast('Ошибка', true);
    expect(document.querySelectorAll('#toast')).toHaveLength(1);
    expect(toast.classList.contains('error')).toBe(true);
    vi.advanceTimersByTime(3000);
    expect(toast.classList.contains('show')).toBe(false);
    vi.useRealTimers();
  });
});
