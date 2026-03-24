import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendNewOrderNotification(
    to: string,
    merchantName: string,
    amount: number,
    description: string,
  ) {
    const info = await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: 'Nouvelle commande reçue',
      text: `Bonjour ${merchantName}, vous avez reçu une nouvelle commande de ${amount}€ : ${description}`,
    });

    this.logger.log(`Email envoyé à ${to} — ID: ${info.messageId}`);
  }

  async sendNewMerchantNotification(name: string, email: string) {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: process.env.MAIL_FROM,
      subject: 'Nouveau Merchant enregistré',
      text: `Nouveau merchant : ${name} (${email})`,
    });
  }
}
