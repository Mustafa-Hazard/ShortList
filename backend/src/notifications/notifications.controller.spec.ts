import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { User } from '../users/user.entity';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const user = { id: 'user-1' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            findForUser: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService);
  });

  it('findMine delegates to service.findForUser with user.id', async () => {
    await controller.findMine(user);
    expect(service.findForUser).toHaveBeenCalledWith('user-1');
  });

  it('markAsRead delegates to service.markAsRead with id and user.id', async () => {
    await controller.markAsRead('notif-1', user);
    expect(service.markAsRead).toHaveBeenCalledWith('notif-1', 'user-1');
  });

  it('markAllAsRead delegates to service.markAllAsRead with user.id', async () => {
    await controller.markAllAsRead(user);
    expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
  });
});
