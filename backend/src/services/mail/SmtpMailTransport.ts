/**
 * SmtpMailTransport — nodemailer-backed MailTransport.
 *
 * Reads SMTP config from config.smtp (host/port/secure/auth/from). The transport
 * is created lazily on first send so the app boots fine with no SMTP configured;
 * isConfigured() gates the mail features in routes and the admin UI.
 */

import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config/config';
import { MailTransport, OutboundMail } from './MailTransport';

export class SmtpMailTransport implements MailTransport {
  readonly name = 'smtp';

  private transporter: Transporter | null = null;

  isConfigured(): boolean {
    return Boolean(config.smtp.host);
  }

  private getTransporter(): Transporter {
    if (!this.isConfigured()) {
      throw new Error('SMTP is not configured (set SMTP_HOST)');
    }
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
      });
    }
    return this.transporter;
  }

  async send(mail: OutboundMail): Promise<{ messageId: string }> {
    const info = await this.getTransporter().sendMail({
      from: config.smtp.from,
      to: mail.to,
      cc: mail.cc,
      replyTo: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return { messageId: info.messageId };
  }
}

/** Singleton transport used across the app. */
export const mailTransport: MailTransport = new SmtpMailTransport();
