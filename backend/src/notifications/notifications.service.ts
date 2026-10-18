import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createAndSend(
    userId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
  ): Promise<Notification> {
    const notification = await this.notificationModel.create({
      userId,
      type,
      payload,
      read: false,
    });

    try {
      this.notificationsGateway.sendNotification(userId, type, payload);
    } catch {
      // Degrade-don't-block if WebSocket delivery fails
    }

    return notification.toObject();
  }

  async findForUser(userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationModel
      .findOne({ _id: id, userId })
      .exec();
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    await notification.save();
    return notification.toObject();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany({ userId, read: false }, { read: true })
      .exec();
  }
}
