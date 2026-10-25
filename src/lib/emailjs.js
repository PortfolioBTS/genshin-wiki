// Необязательная отправка писем через EmailJS. Без переменных окружения
// сайт работает в демо-режиме и в сеть ничего не отправляет.

const KEYS = [
  'VITE_EMAILJS_PUBLIC_KEY',
  'VITE_EMAILJS_SERVICE_ID',
  'VITE_EMAILJS_TEMPLATE_VERIFY',
  'VITE_EMAILJS_TEMPLATE_PROPOSAL',
];

export function isEmailConfigured(env = import.meta.env) {
  return KEYS.every((key) => typeof env[key] === 'string' && env[key].trim() !== '');
}

async function send(template, params, env) {
  if (!isEmailConfigured(env)) return false;
  try {
    const { send: emailjsSend } = await import('@emailjs/browser');
    await emailjsSend(env.VITE_EMAILJS_SERVICE_ID, template, params, {
      publicKey: env.VITE_EMAILJS_PUBLIC_KEY,
    });
    return true;
  } catch (error) {
    console.warn('EmailJS: письмо не отправлено', error);
    return false;
  }
}

export function sendVerifyCode({ toEmail, code, userName }, env = import.meta.env) {
  return send(
    env.VITE_EMAILJS_TEMPLATE_VERIFY,
    { to_email: toEmail, code, user_name: userName },
    env,
  );
}

export function sendProposal(params, env = import.meta.env) {
  return send(
    env.VITE_EMAILJS_TEMPLATE_PROPOSAL,
    { ...params, date: new Date().toLocaleString('ru-RU') },
    env,
  );
}
