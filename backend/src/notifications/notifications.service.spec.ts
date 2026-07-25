import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './notification.entity';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationsRepo: jest.Mocked<any>;
  let notificationsGateway: jest.Mocked<NotificationsGateway>;

  const baseNotification: Notification = {
    id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.APPLICATION_STAGE_CHANGED,
    payload: { stage: 'SCREENED' },
    read: false,
    createdAt: new Date(),
  } as unknown as Notification;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: NotificationsGateway,
          useValue: { sendNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationsRepo = module.get(getRepositoryToken(Notification));
    notificationsGateway = module.get(NotificationsGateway);
  });

  describe('createAndSend', () => {
    it('persists notification in DB and emits live WebSocket event', async () => {
      notificationsRepo.create.mockReturnValue(baseNotification);
      notificationsRepo.save.mockResolvedValue(baseNotification);

      const result = await service.createAndSend(
        'user-1',
        NotificationType.APPLICATION_STAGE_CHANGED,
        { stage: 'SCREENED' },
      );

      expect(notificationsRepo.create).toHaveBeenCalledWith(
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
      expect(result).toBe(baseNotification);
    });
  });

  describe('findForUser', () => {
    it('returns notifications for user sorted by date', async () => {
      notificationsRepo.find.mockResolvedValue([baseNotification]);

      const result = await service.findForUser('user-1');

      expect(notificationsRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([baseNotification]);
    });
  });

  describe('markAsRead', () => {
    it('marks specific notification as read', async () => {
      notificationsRepo.findOne.mockResolvedValue({ ...baseNotification });
      notificationsRepo.save.mockImplementation((n: any) => Promise.resolve(n));

      const result = await service.markAsRead('notif-1', 'user-1');

      expect(result.read).toBe(true);
    });

    it('throws NotFoundException if notification does not exist', async () => {
      notificationsRepo.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('updates all unread notifications for user', async () => {
      notificationsRepo.update.mockResolvedValue({ affected: 2 });

      await service.markAllAsRead('user-1');

      expect(notificationsRepo.update).toHaveBeenCalledWith(
        { userId: 'user-1', read: false },
        { read: true },
      );
    });
  });
});
