import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepo: Repository<Notification>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createAndSend(
    userId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
  ): Promise<Notification> {
    const notification = this.notificationsRepo.create({
      userId,
      type,
      payload,
      read: false,
    });

    const saved = await this.notificationsRepo.save(notification);

    try {
      this.notificationsGateway.sendNotification(userId, type, payload);
    } catch (err) {
      // Degrade-don't-block if WebSocket delivery fails
    }

    return saved;
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepo.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.read = true;
    return this.notificationsRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepo.update({ userId, read: false }, { read: true });
  }
}
