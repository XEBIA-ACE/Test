import { NotificationType } from './Notification';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTemplateDTO {
  name: string;
  type: NotificationType;
  subject?: string;
  bodyTemplate: string;
  variables: string[];
}
