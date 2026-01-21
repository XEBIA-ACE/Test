import { Server as SocketIOServer, Socket } from 'socket.io';
import { INotificationProvider, SendResult } from '../../domain/interfaces/INotificationProvider';
import { Notification } from '../../domain/models/Notification';
import { logger } from '../logging/logger';

export class WebSocketProvider implements INotificationProvider {
  private io: SocketIOServer | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  setSocketServer(io: SocketIOServer): void {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      logger.info({ socketId: socket.id }, 'Client connected to WebSocket');

      // Handle user authentication and registration
      socket.on('register', (userId: string) => {
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socket.id);

        socket.data.userId = userId;
        logger.info({ userId, socketId: socket.id }, 'User registered to WebSocket');
      });

      socket.on('disconnect', () => {
        const userId = socket.data.userId;
        if (userId && this.userSockets.has(userId)) {
          this.userSockets.get(userId)!.delete(socket.id);
          if (this.userSockets.get(userId)!.size === 0) {
            this.userSockets.delete(userId);
          }
        }
        logger.info({ socketId: socket.id }, 'Client disconnected from WebSocket');
      });
    });
  }

  async send(notification: Notification): Promise<SendResult> {
    if (!this.io) {
      return {
        success: false,
        error: 'WebSocket server not initialized'
      };
    }

    const userId = notification.recipient.userId;

    if (!userId) {
      return {
        success: false,
        error: 'User ID is required for WebSocket notifications'
      };
    }

    const socketIds = this.userSockets.get(userId);

    if (!socketIds || socketIds.size === 0) {
      logger.warn({ userId }, 'No active WebSocket connections for user');
      return {
        success: false,
        error: 'User not connected'
      };
    }

    try {
      const payload = {
        id: notification.id,
        type: notification.type,
        title: notification.payload.title,
        body: notification.payload.body,
        data: notification.payload.data,
        timestamp: new Date().toISOString()
      };

      // Send to all user's connected sockets
      socketIds.forEach((socketId) => {
        this.io!.to(socketId).emit('notification', payload);
      });

      logger.info(
        { notificationId: notification.id, userId, socketCount: socketIds.size },
        'WebSocket notification sent'
      );

      return {
        success: true,
        messageId: notification.id
      };
    } catch (error: any) {
      logger.error(
        { notificationId: notification.id, error: error.message },
        'Failed to send WebSocket notification'
      );

      return {
        success: false,
        error: error.message || 'Failed to send WebSocket notification'
      };
    }
  }

  validateRecipient(notification: Notification): boolean {
    return !!notification.recipient.userId;
  }

  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}
