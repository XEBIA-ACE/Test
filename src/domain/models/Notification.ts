export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  WEBSOCKET = 'websocket',
  SMS = 'sms'
}

export enum NotificationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface NotificationRecipient {
  userId?: string;
  email?: string;
  phoneNumber?: string;
  deviceToken?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPayload {
  subject?: string;
  body: string;
  title?: string;
  data?: Record<string, any>;
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface Notification {
  id: string;
  type: NotificationType;
  recipient: NotificationRecipient;
  payload: NotificationPayload;
  status: NotificationStatus;
  priority: NotificationPriority;
  attempts: number;
  maxAttempts: number;
  scheduledAt?: Date;
  sentAt?: Date;
  failedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationDTO {
  type: NotificationType;
  recipient: NotificationRecipient;
  payload: NotificationPayload;
  priority?: NotificationPriority;
  scheduledAt?: Date;
  metadata?: Record<string, any>;
}

export interface UpdateNotificationDTO {
  status?: NotificationStatus;
  attempts?: number;
  sentAt?: Date;
  failedAt?: Date;
  error?: string;
}
