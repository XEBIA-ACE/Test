import { ProjectEvent } from '../entities/project-event.entity';
import { NotificationChannel } from '../enums/notification-channel.enum';

/**
 * Port: render notification content from a template.
 */
export interface ITemplateRenderer {
  /**
   * Renders the subject line for the given event and channel.
   */
  renderSubject(event: ProjectEvent, channel: NotificationChannel): Promise<string>;

  /**
   * Renders the body for the given event and channel.
   */
  renderBody(event: ProjectEvent, channel: NotificationChannel): Promise<string>;
}

export const TEMPLATE_RENDERER = 'TEMPLATE_RENDERER';
