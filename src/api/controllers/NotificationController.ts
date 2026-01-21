import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../../application/services/NotificationService';
import { CreateNotificationDTO, NotificationStatus } from '../../domain/models/Notification';
import { logger } from '../../infrastructure/logging/logger';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  async createNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto: CreateNotificationDTO = {
        type: req.body.type,
        recipient: req.body.recipient,
        payload: req.body.payload,
        priority: req.body.priority,
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
        metadata: req.body.metadata
      };

      const notification = await this.notificationService.createNotification(dto);

      logger.info({ notificationId: notification.id }, 'Notification created via API');

      res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  async getNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const notification = await this.notificationService.getNotification(id);

      if (!notification) {
        res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
        return;
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, userId, limit } = req.query;

      let notifications;

      if (userId) {
        notifications = await this.notificationService.getNotificationsByRecipient(
          userId as string,
          limit ? parseInt(limit as string) : 50
        );
      } else if (status) {
        notifications = await this.notificationService.getNotificationsByStatus(
          status as NotificationStatus,
          limit ? parseInt(limit as string) : 100
        );
      } else {
        res.status(400).json({
          success: false,
          error: 'Either status or userId query parameter is required'
        });
        return;
      }

      res.json({
        success: true,
        data: notifications,
        count: notifications.length
      });
    } catch (error) {
      next(error);
    }
  }

  async sendNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await this.notificationService.sendNotification(id);

      res.json({
        success: true,
        message: 'Notification sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
