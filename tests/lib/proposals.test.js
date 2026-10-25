// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addProposal, getProposalsFor } from '../../src/lib/proposals.js';

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe('proposals', () => {
  it('stores proposals under gw_proposals with a date', () => {
    const saved = addProposal({
      user: 'a@b.c',
      page: 'Персонажи',
      cat: 'Другое',
      item: '',
      text: 't',
    });
    expect(saved.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(JSON.parse(localStorage.getItem('gw_proposals'))).toHaveLength(1);
  });

  it('returns only the user proposals, newest first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01'));
    addProposal({ user: 'a@b.c', page: 'A', cat: 'c', item: '', text: 'old' });
    vi.setSystemTime(new Date('2026-10-02'));
    addProposal({ user: 'x@y.z', page: 'B', cat: 'c', item: '', text: 'other' });
    addProposal({ user: 'a@b.c', page: 'C', cat: 'c', item: '', text: 'new' });
    expect(getProposalsFor('a@b.c').map((p) => p.text)).toEqual(['new', 'old']);
  });

  it('survives corrupted storage', () => {
    localStorage.setItem('gw_proposals', '{oops');
    expect(getProposalsFor('a@b.c')).toEqual([]);
    addProposal({ user: 'a@b.c', page: 'A', cat: 'c', item: '', text: 't' });
    expect(getProposalsFor('a@b.c')).toHaveLength(1);
  });
});
