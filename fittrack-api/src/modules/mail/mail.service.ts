import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from!: string;
  private appUrl!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.from = this.config.get<string>('mail.from')!;
    this.appUrl = this.config.get<string>('mail.appUrl')!;
    const host = this.config.get<string>('mail.smtpHost');

    if (!host) {
      this.logger.warn('SMTP_HOST is empty — mail goes to logs only (dev mode).');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('mail.smtpPort'),
      secure: this.config.get<boolean>('mail.smtpSecure'),
      auth: {
        user: this.config.get<string>('mail.smtpUser'),
        pass: this.config.get<string>('mail.smtpPass'),
      },
    });
  }

  /**
   * Письмо со ссылкой для сброса пароля. Если SMTP не сконфигурирован —
   * ссылка просто пишется в лог, чтобы можно было вручную проверить flow в dev.
   */
  async sendPasswordReset(email: string, token: string): Promise<void> {
    const link = `${this.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const subject = 'FitTrack — восстановление пароля';
    const text = [
      'Здравствуйте!',
      '',
      'Вы запросили сброс пароля в FitTrack.',
      `Перейдите по ссылке (срок действия — 30 минут):`,
      link,
      '',
      'Если это были не вы — просто проигнорируйте письмо.',
      '— Команда FitTrack',
    ].join('\n');

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1f2937;">Восстановление пароля</h2>
        <p>Вы запросили сброс пароля в FitTrack. Чтобы задать новый пароль, перейдите по ссылке (она действует 30 минут):</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background:#3b82f6;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
            Сбросить пароль
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Если кнопка не работает, скопируйте ссылку:<br>
          <span style="word-break:break-all;">${link}</span>
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;">
        <p style="color:#9ca3af;font-size:12px;">Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
      </div>
    `;

    if (!this.transporter) {
      this.logger.warn(`[mail-stub] To=${email} | Subject=${subject} | Reset link: ${link}`);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(`Password reset email sent to ${email} (id=${info.messageId})`);
    } catch (err) {
      // Не пробрасываем — пользователь не должен узнать что email не доставлен
      this.logger.error(`Failed to send password reset to ${email}: ${(err as Error).message}`);
    }
  }
}
