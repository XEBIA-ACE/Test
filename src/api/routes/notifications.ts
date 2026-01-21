import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { NotificationController } from '../controllers/NotificationController';
import { validate } from '../middleware/validation';
import { NotificationService } from '../../application/services/NotificationService';

export const createNotificationRouter = (notificationService: NotificationService): Router => {
  const router = Router();
  const controller = new NotificationController(notificationService);

  /**
   * @swagger
   * /api/v1/notifications:
   *   post:
   *     summary: Create a new notification
   *     tags: [Notifications]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - recipient
   *               - payload
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [email, push, websocket, sms]
   *               recipient:
   *                 type: object
   *               payload:
   *                 type: object
   *     responses:
   *       201:
   *         description: Notification created successfully
   */
  router.post(
    '/',
    validate([
      body('type').isIn(['email', 'push', 'websocket', 'sms']).withMessage('Invalid notification type'),
      body('recipient').isObject().withMessage('Recipient must be an object'),
      body('payload').isObject().withMessage('Payload must be an object'),
      body('payload.body').notEmpty().withMessage('Payload body is required'),
      body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
    ]),
    controller.createNotification.bind(controller)
  );

  /**
   * @swagger
   * /api/v1/notifications/{id}:
   *   get:
   *     summary: Get notification by ID
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Notification found
   *       404:
   *         description: Notification not found
   */
  router.get(
    '/:id',
    validate([param('id').isUUID().withMessage('Invalid notification ID')]),
    controller.getNotification.bind(controller)
  );

  /**
   * @swagger
   * /api/v1/notifications:
   *   get:
   *     summary: Get notifications by status or recipient
   *     tags: [Notifications]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: List of notifications
   */
  router.get(
    '/',
    validate([
      query('status').optional().isIn(['pending', 'processing', 'sent', 'failed', 'retrying']),
      query('userId').optional().isString(),
      query('limit').optional().isInt({ min: 1, max: 100 })
    ]),
    controller.getNotifications.bind(controller)
  );

  /**
   * @swagger
   * /api/v1/notifications/{id}/send:
   *   post:
   *     summary: Manually trigger sending a notification
   *     tags: [Notifications]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Notification sent successfully
   */
  router.post(
    '/:id/send',
    validate([param('id').isUUID().withMessage('Invalid notification ID')]),
    controller.sendNotification.bind(controller)
  );

  return router;
};
