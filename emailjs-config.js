// ═══════════════════════════════════════════════════════════════
//  НАСТРОЙКА EmailJS — ЗАПОЛНИ ПЕРЕД ИСПОЛЬЗОВАНИЕМ
//  Инструкция: https://www.emailjs.com/
//
//  1. Зарегистрируйся на emailjs.com
//  2. Add New Service → выбери Gmail → подключи time10619@gmail.com
//     Скопируй Service ID (например: service_abc123)
//  3. Email Templates → Create New Template
//     Шаблон A (подтверждение регистрации):
//       To email:  {{to_email}}
//       Subject:   Genshin Wiki — код подтверждения
//       Body:      Твой код: {{code}}  (действует 10 минут)
//       Скопируй Template ID → вставь в TEMPLATE_VERIFY ниже
//     Шаблон B (заявка от пользователя):
//       To email:  time10619@gmail.com
//       Subject:   [Genshin Wiki] Новая заявка от {{user_name}}
//       Body:      От: {{user_name}} ({{user_email}})
//                  Страница: {{page}}
//                  Категория: {{category}}
//                  Объект: {{item}}
//                  Текст: {{message}}
//                  Дата: {{date}}
//       Скопируй Template ID → вставь в TEMPLATE_PROPOSAL ниже
//  4. Account → API Keys → Public Key → вставь в PUBLIC_KEY ниже
// ═══════════════════════════════════════════════════════════════

const EMAILJS_CONFIG = {
  PUBLIC_KEY:        'YOUR_PUBLIC_KEY',       // ← заменить
  SERVICE_ID:        'YOUR_SERVICE_ID',       // ← заменить
  TEMPLATE_VERIFY:   'YOUR_TEMPLATE_VERIFY',  // ← заменить (шаблон А)
  TEMPLATE_PROPOSAL: 'YOUR_TEMPLATE_PROPOSAL',// ← заменить (шаблон Б)
  ADMIN_EMAIL:       'time10619@gmail.com',
};
