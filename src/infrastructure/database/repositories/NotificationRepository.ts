import { DatabaseConnection } from '../connection';
import {
  Notification,
  CreateNotificationDTO,
  UpdateNotificationDTO,
  NotificationStatus
} from '../../../domain/models/Notification';
import { INotificationRepository } from '../../../domain/interfaces/INotificationRepository';
import { logger } from '../../logging/logger';

export class NotificationRepository implements INotificationRepository {
  constructor(private readonly db: DatabaseConnection) {}

  async create(dto: CreateNotificationDTO): Promise<Notification> {
    const query = `
      INSERT INTO notifications (
        id, type, recipient, payload, status, priority, attempts, max_attempts,
        scheduled_at, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const notification: Notification = {
      id: require('uuid').v4(),
      type: dto.type,
      recipient: dto.recipient,
      payload: dto.payload,
      status: dto.scheduledAt ? NotificationStatus.PENDING : NotificationStatus.PROCESSING,
      priority: dto.priority || 'medium',
      attempts: 0,
      maxAttempts: 3,
      scheduledAt: dto.scheduledAt,
      metadata: dto.metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const values = [
      notification.id,
      notification.type,
      JSON.stringify(notification.recipient),
      JSON.stringify(notification.payload),
      notification.status,
      notification.priority,
      notification.attempts,
      notification.maxAttempts,
      notification.scheduledAt,
      JSON.stringify(notification.metadata || {}),
      notification.createdAt,
      notification.updatedAt
    ];

    const result = await this.db.query(query, values);
    return this.mapRowToNotification(result.rows[0]);
  }

  async findById(id: string): Promise<Notification | null> {
    const query = 'SELECT * FROM notifications WHERE id = $1';
    const result = await this.db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToNotification(result.rows[0]);
  }

  async findByStatus(status: NotificationStatus, limit = 100): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications
      WHERE status = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.db.query(query, [status, limit]);
    return result.rows.map((row) => this.mapRowToNotification(row));
  }

  async findByRecipient(userId: string, limit = 50): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications
      WHERE recipient->>'userId' = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await this.db.query(query, [userId, limit]);
    return result.rows.map((row) => this.mapRowToNotification(row));
  }

  async update(id: string, updates: UpdateNotificationDTO): Promise<Notification> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (updates.attempts !== undefined) {
      fields.push(`attempts = $${paramCount++}`);
      values.push(updates.attempts);
    }

    if (updates.sentAt !== undefined) {
      fields.push(`sent_at = $${paramCount++}`);
      values.push(updates.sentAt);
    }

    if (updates.failedAt !== undefined) {
      fields.push(`failed_at = $${paramCount++}`);
      values.push(updates.failedAt);
    }

    if (updates.error !== undefined) {
      fields.push(`error = $${paramCount++}`);
      values.push(updates.error);
    }

    fields.push(`updated_at = $${paramCount++}`);
    values.push(new Date());

    values.push(id);

    const query = `
      UPDATE notifications
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error(`Notification ${id} not found`);
    }

    return this.mapRowToNotification(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM notifications WHERE id = $1';
    await this.db.query(query, [id]);
    logger.info({ notificationId: id }, 'Notification deleted');
  }

  async findPendingScheduled(): Promise<Notification[]> {
    const query = `
      SELECT * FROM notifications
      WHERE status = $1
        AND scheduled_at IS NOT NULL
        AND scheduled_at <= NOW()
      ORDER BY scheduled_at ASC
      LIMIT 100
    `;

    const result = await this.db.query(query, [NotificationStatus.PENDING]);
    return result.rows.map((row) => this.mapRowToNotification(row));
  }

  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      type: row.type,
      recipient: typeof row.recipient === 'string' ? JSON.parse(row.recipient) : row.recipient,
      payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
      status: row.status,
      priority: row.priority,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
      scheduledAt: row.scheduled_at ? new Date(row.scheduled_at) : undefined,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      failedAt: row.failed_at ? new Date(row.failed_at) : undefined,
      error: row.error,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}
