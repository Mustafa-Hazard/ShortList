import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from './notification.entity';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsGateway],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('joins user room on handleConnection when userId query parameter is present', () => {
    const mockSocket: any = {
      handshake: { query: { userId: 'user-123' } },
      join: jest.fn(),
    };

    gateway.handleConnection(mockSocket);
    expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
  });

  it('joins user room on handleJoinRoom message', () => {
    const mockSocket: any = { join: jest.fn() };
    gateway.handleJoinRoom(mockSocket, { userId: 'user-123' });
    expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
  });

  it('emits notification event to user room via socket server', () => {
    const mockServer: any = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    gateway.server = mockServer;

    gateway.sendNotification(
      'user-123',
      NotificationType.APPLICATION_STAGE_CHANGED,
      {
        applicationId: 'app-1',
      },
    );

    expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
    expect(mockServer.emit).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({
        type: NotificationType.APPLICATION_STAGE_CHANGED,
        payload: { applicationId: 'app-1' },
      }),
    );
  });
});
