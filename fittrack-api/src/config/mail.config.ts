import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  // Если SMTP_HOST не задан — MailService логирует письмо в консоль (для dev/тестов).
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpSecure: process.env.SMTP_SECURE === 'true', // true для 465 (SSL), false для 587 (STARTTLS)
  from: process.env.MAIL_FROM || 'FitTrack <noreply@fittrack.local>',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
}));
