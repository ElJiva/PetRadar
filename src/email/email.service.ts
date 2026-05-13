import { Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import nodemailer from 'nodemailer';
import { EmailOptions } from 'src/core/models/email-options.model';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    service: envs.MAILER_SERVICE,
    auth: {
      user: envs.MAILER_EMAIL,
      pass: envs.MAILER_PASSWORD,
    },
  });
  async sendEmail(options: EmailOptions): Promise<Boolean> {
    try {
      await this.transporter.sendMail({
        to: options.to,
        subject: options.subject,
        html: options.htmlBody,
      });
      return true;
    } catch (error) {
      console.error('[EmailService] Error al enviar correo:', error);
      return false;
    }
  }
}
