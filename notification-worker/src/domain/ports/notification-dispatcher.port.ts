import { Notification } from '../entities/notification.entity';

/**
 * Port: dispatch a rendered notification over a specific channel.
 * Adapters: SendGrid, AWS SES, Firebase FCM, APNs, in-app store.
 */
export interface INotificationDispatcher {
  /**
   * Sends the notification.
   * Implementations must be idempotent — duplicate calls with the same
   * notificationId should be no-ops.
   *
   * @throws {TransientDeliveryError} for retriable failures.
   * @throws {PermanentDeliveryError} for non-retriable failures.
   */
  dispatch(notification: Notification): Promise<void>;
}

export const EMAIL_DISPATCHER = 'EMAIL_DISPATCHER';
export const PUSH_DISPATCHER = 'PUSH_DISPATCHER';
export const IN_APP_DISPATCHER = 'IN_APP_DISPATCHER';
