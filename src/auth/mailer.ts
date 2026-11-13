import { Injectable, Logger } from '@nestjs/common';
import type { User } from '../users/user.types';

/** The real implementation (SMTP, or a call to communication-service) will replace the console one. */
export abstract class Mailer {
  abstract sendWelcome(user: User): Promise<void>;
}

@Injectable()
export class ConsoleMailer extends Mailer {
  private readonly logger = new Logger('Mailer');

  async sendWelcome(user: User): Promise<void> {
    // No personal data in logs (security rule): the id only.
    this.logger.log(`Confirmation email would be sent to user ${user.id}`);
  }
}