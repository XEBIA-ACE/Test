import sgMail from '@sendgrid/mail';
import { INotificationProvider, SendResult } from '../../domain/interfaces/INotificationProvider';
import { Notification } from '../../domain/models/Notification';
import { logger } from '../logging/logger';

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export class EmailProvider implements INotificationProvider {
  constructor(private readonly config: EmailConfig) {
    sgMail.setApiKey(config.apiKey);
  }

  async send(notification: Notification): Promise<SendResult> {
    try {
      const msg = {
        to: notification.recipient.email!,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        subject: notification.payload.subject || 'Notification',
        text: notification.payload.body,
        html: this.formatHtmlBody(notification.payload.body),
        customArgs: {
          notificationId: notification.id
        }
      };

      const response = await sgMail.send(msg);

      logger.info(
        { notificationId: notification.id, messageId: response[0].headers['x-message-id'] },
        'Email sent via SendGrid'
      );

      return {
        success: true,
        messageId: response[0].headers['x-message-id'] as string
      };
    } catch (error: any) {
      logger.error(
        { notificationId: notification.id, error: error.message },
        'Failed to send email'
      );

      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  validateRecipient(notification: Notification): boolean {
    const email = notification.recipient.email;

    if (!email) {
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private formatHtmlBody(text: string): string {
    // Convert plain text to basic HTML
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
            ${text.replace(/\n/g, '<br>')}
          </div>
        </body>
      </html>
    `;
  }
}
