import { Notification } from '../models/Notification';

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface INotificationProvider {
  send(notification: Notification): Promise<SendResult>;
  validateRecipient(notification: Notification): boolean;
}
