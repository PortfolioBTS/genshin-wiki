import { readJson, writeJson } from './storage.js';

const KEY = 'gw_proposals';

const isProposal = (p) => p !== null && typeof p === 'object' && typeof p.user === 'string';

const readAll = () => {
  const list = readJson(KEY, []);
  return Array.isArray(list) ? list.filter(isProposal) : [];
};

export function addProposal({ user, page, cat, item, text }) {
  const proposal = { user, page, cat, item, text, date: new Date().toISOString() };
  writeJson(KEY, [...readAll(), proposal]);
  return proposal;
}

/** Предложения пользователя, новые первыми. */
export function getProposalsFor(email) {
  return readAll()
    .filter((p) => p.user === email)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
