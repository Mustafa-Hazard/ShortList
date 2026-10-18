import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationModel: any;
  let notificationsGateway: jest.Mocked<NotificationsGateway>;

  const baseNotification: any = {
    id: 'notif-1',
    _id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.APPLICATION_STAGE_CHANGED,
    payload: { stage: 'SCREENED' },
    read: false,
    createdAt: new Date(),
    toObject: () => baseNotification,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    notificationModel = {
      create: jest.fn().mockResolvedValue(baseNotification),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([baseNotification]),
        }),
      }),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...baseNotification,
          save: jest
            .fn()
            .mockResolvedValue({ ...baseNotification, read: true }),
          toObject: () => ({ ...baseNotification, read: true }),
        }),
      }),
      updateMany: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: notificationModel,
        },
        {
          provide: NotificationsGateway,
          useValue: { sendNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationsGateway = module.get(NotificationsGateway);
  });

  describe('createAndSend', () => {
    it('persists notification in DB and emits live WebSocket event', async () => {
      const result = await service.createAndSend(
        'user-1',
        NotificationType.APPLICATION_STAGE_CHANGED,
        { stage: 'SCREENED' },
      );

      expect(notificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: NotificationType.APPLICATION_STAGE_CHANGED,
          read: false,
        }),
      );
      expect(notificationsGateway.sendNotification).toHaveBeenCalledWith(
        'user-1',
        NotificationType.APPLICATION_STAGE_CHANGED,
        { stage: 'SCREENED' },
      );
      expect(result).toBeDefined();
    });
  });

  describe('findForUser', () => {
    it('returns notifications for user sorted by date', async () => {
      const result = await service.findForUser('user-1');
      expect(notificationModel.find).toHaveBeenCalledWith({ userId: 'user-1' });
      expect(result).toEqual([baseNotification]);
    });
  });

  describe('markAsRead', () => {
    it('marks specific notification as read', async () => {
      const result = await service.markAsRead('notif-1', 'user-1');
      expect(result.read).toBe(true);
    });

    it('throws NotFoundException if notification does not exist', async () => {
      notificationModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.markAsRead('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('updates all unread notifications for user', async () => {
      await service.markAllAsRead('user-1');
      expect(notificationModel.updateMany).toHaveBeenCalledWith(
        { userId: 'user-1', read: false },
        { read: true },
      );
    });
  });
});
