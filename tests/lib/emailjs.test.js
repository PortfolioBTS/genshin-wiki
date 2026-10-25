import { afterEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();
vi.mock('@emailjs/browser', () => ({ send }));

const { isEmailConfigured, sendProposal, sendVerifyCode } =
  await import('../../src/lib/emailjs.js');

const ENV = {
  VITE_EMAILJS_PUBLIC_KEY: 'pk',
  VITE_EMAILJS_SERVICE_ID: 'svc',
  VITE_EMAILJS_TEMPLATE_VERIFY: 'tpl_verify',
  VITE_EMAILJS_TEMPLATE_PROPOSAL: 'tpl_proposal',
};

afterEach(() => send.mockReset());

describe('isEmailConfigured', () => {
  it('requires all four variables', () => {
    expect(isEmailConfigured(ENV)).toBe(true);
    expect(isEmailConfigured({ ...ENV, VITE_EMAILJS_TEMPLATE_PROPOSAL: '' })).toBe(false);
    expect(isEmailConfigured({})).toBe(false);
  });
});

describe('sending', () => {
  it('does nothing without configuration', async () => {
    await expect(sendProposal({ user_name: 'x' }, {})).resolves.toBe(false);
    await expect(
      sendVerifyCode({ toEmail: 'a@b.c', code: '123456', userName: 'A' }, {}),
    ).resolves.toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it('sends the verify template with the public key', async () => {
    send.mockResolvedValue({ status: 200 });
    await expect(
      sendVerifyCode({ toEmail: 'a@b.c', code: '123456', userName: 'Аня' }, ENV),
    ).resolves.toBe(true);
    expect(send).toHaveBeenCalledWith(
      'svc',
      'tpl_verify',
      { to_email: 'a@b.c', code: '123456', user_name: 'Аня' },
      { publicKey: 'pk' },
    );
  });

  it('sends proposals with a date and reports failures as false', async () => {
    send.mockResolvedValueOnce({ status: 200 });
    await expect(sendProposal({ user_name: 'A', message: 'm' }, ENV)).resolves.toBe(true);
    const [, template, params] = send.mock.calls[0];
    expect(template).toBe('tpl_proposal');
    expect(params).toMatchObject({ user_name: 'A', message: 'm' });
    expect(params.date).toBeTruthy();

    send.mockRejectedValueOnce(new Error('network'));
    await expect(sendProposal({ user_name: 'A' }, ENV)).resolves.toBe(false);
  });
});
