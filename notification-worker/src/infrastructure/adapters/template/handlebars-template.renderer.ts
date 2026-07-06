import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { ITemplateRenderer } from '../../domain/ports/template-renderer.port';
import { ProjectEvent } from '../../domain/entities/project-event.entity';
import { NotificationChannel } from '../../domain/enums/notification-channel.enum';
import { ProjectEventType } from '../../domain/enums/project-event-type.enum';

type TemplateMap = Record<ProjectEventType, Record<NotificationChannel, { subject: string; body: string }>>;

const TEMPLATES: TemplateMap = {
  [ProjectEventType.CREATED]: {
    [NotificationChannel.EMAIL]: {
      subject: 'Project "{{projectName}}" has been created',
      body: '<p>Hello,</p><p>The project <strong>{{projectName}}</strong> (ID: {{projectId}}) was created on {{occurredAt}}.</p>',
    },
    [NotificationChannel.PUSH]: {
      subject: 'New project created',
      body: 'Project "{{projectName}}" has been created.',
    },
    [NotificationChannel.IN_APP]: {
      subject: 'Project created',
      body: 'Project "{{projectName}}" was created.',
    },
  },
  [ProjectEventType.UPDATED]: {
    [NotificationChannel.EMAIL]: {
      subject: 'Project "{{projectName}}" has been updated',
      body: '<p>Hello,</p><p>The project <strong>{{projectName}}</strong> (ID: {{projectId}}) was updated on {{occurredAt}}.</p>',
    },
    [NotificationChannel.PUSH]: {
      subject: 'Project updated',
      body: 'Project "{{projectName}}" has been updated.',
    },
    [NotificationChannel.IN_APP]: {
      subject: 'Project updated',
      body: 'Project "{{projectName}}" was updated.',
    },
  },
  [ProjectEventType.DELETED]: {
    [NotificationChannel.EMAIL]: {
      subject: 'Project "{{projectName}}" has been deleted',
      body: '<p>Hello,</p><p>The project <strong>{{projectName}}</strong> (ID: {{projectId}}) was deleted on {{occurredAt}}.</p>',
    },
    [NotificationChannel.PUSH]: {
      subject: 'Project deleted',
      body: 'Project "{{projectName}}" has been deleted.',
    },
    [NotificationChannel.IN_APP]: {
      subject: 'Project deleted',
      body: 'Project "{{projectName}}" was deleted.',
    },
  },
};

@Injectable()
export class HandlebarsTemplateRenderer implements ITemplateRenderer {
  async renderSubject(event: ProjectEvent, channel: NotificationChannel): Promise<string> {
    const tpl = TEMPLATES[event.eventType]?.[channel]?.subject ?? '{{projectName}} notification';
    return Handlebars.compile(tpl)(this.buildContext(event));
  }

  async renderBody(event: ProjectEvent, channel: NotificationChannel): Promise<string> {
    const tpl = TEMPLATES[event.eventType]?.[channel]?.body ?? '{{projectName}} — {{occurredAt}}';
    return Handlebars.compile(tpl)(this.buildContext(event));
  }

  private buildContext(event: ProjectEvent): Record<string, unknown> {
    return {
      projectId: event.projectId,
      projectName: event.projectName,
      eventType: event.eventType,
      occurredAt: event.occurredAt,
      ...event.payload,
    };
  }
}
