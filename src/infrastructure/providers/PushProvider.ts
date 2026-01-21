import admin from 'firebase-admin';
import { INotificationProvider, SendResult } from '../../domain/interfaces/INotificationProvider';
import { Notification } from '../../domain/models/Notification';
import { logger } from '../logging/logger';

export interface PushConfig {
  projectId: string;
  privateKeyPath?: string;
  serviceAccountJson?: string;
}

export class PushProvider implements INotificationProvider {
  private initialized = false;

  constructor(private readonly config: PushConfig) {
    this.initialize();
  }

  private initialize(): void {
    try {
      if (this.config.serviceAccountJson) {
        const serviceAccount = JSON.parse(this.config.serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.config.projectId
        });
      } else if (this.config.privateKeyPath) {
        const serviceAccount = require(this.config.privateKeyPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: this.config.projectId
        });
      } else {
        logger.warn('Firebase credentials not configured, push notifications will fail');
        return;
      }

      this.initialized = true;
      logger.info('Firebase Admin SDK initialized');
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to initialize Firebase Admin SDK');
    }
  }

  async send(notification: Notification): Promise<SendResult> {
    if (!this.initialized) {
      return {
        success: false,
        error: 'Firebase not initialized'
      };
    }

    try {
      const message: admin.messaging.Message = {
        token: notification.recipient.deviceToken!,
        notification: {
          title: notification.payload.title || 'Notification',
          body: notification.payload.body
        },
        data: {
          notificationId: notification.id,
          ...(notification.payload.data || {})
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);

      logger.info(
        { notificationId: notification.id, messageId: response },
        'Push notification sent via FCM'
      );

      return {
        success: true,
        messageId: response
      };
    } catch (error: any) {
      logger.error(
        { notificationId: notification.id, error: error.message },
        'Failed to send push notification'
      );

      return {
        success: false,
        error: error.message || 'Failed to send push notification'
      };
    }
  }

  validateRecipient(notification: Notification): boolean {
    const deviceToken = notification.recipient.deviceToken;

    if (!deviceToken) {
      return false;
    }

    // FCM tokens are typically 152-163 characters
    return deviceToken.length >= 100 && deviceToken.length <= 200;
  }
}
