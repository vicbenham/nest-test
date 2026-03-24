import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MerchantRegisteredEvent } from '../events/merchants-registered.event';
import { MailService } from '../../services/mails.services';

@Injectable()
export class MerchantListener {
  constructor(private readonly mailService: MailService) {}

  @OnEvent('merchant.registered')
  async handleMerchantRegistered(event: MerchantRegisteredEvent) {
    console.log(`[LOG] Nouveau merchant inscrit :`);
    console.log(`ID     : ${event.merchantId}`);
    console.log(`Email  : ${event.email}`);
    console.log(`Nom    : ${event.name}`);

    await this.mailService.sendNewMerchantNotification(event.name, event.email);
    console.log(`[ADMIN] Notification envoyée à ${process.env.MAIL_USER}`);
  }
}
