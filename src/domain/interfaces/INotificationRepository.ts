import { Notification, CreateNotificationDTO, UpdateNotificationDTO, NotificationStatus } from '../models/Notification';

export interface INotificationRepository {
  create(notification: CreateNotificationDTO): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByStatus(status: NotificationStatus, limit?: number): Promise<Notification[]>;
  findByRecipient(userId: string, limit?: number): Promise<Notification[]>;
  update(id: string, updates: UpdateNotificationDTO): Promise<Notification>;
  delete(id: string): Promise<void>;
  findPendingScheduled(): Promise<Notification[]>;
}
