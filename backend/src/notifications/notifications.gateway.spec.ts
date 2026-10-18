import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationType } from './notification.entity';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: Partial<JwtService>;
  let configService: Partial<ConfigService>;

  beforeEach(async () => {
    jwtService = {
      verifyAsync: jest
        .fn()
        .mockResolvedValue({ sub: 'user-123', email: 'test@example.com' }),
    };
    configService = {
      get: jest
        .fn()
        .mockReturnValue('super_secret_jwt_key_at_least_32_characters_long'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('authenticates client with JWT and joins user room', async () => {
    const mockSocket: any = {
      handshake: { auth: { token: 'valid-token' } },
      join: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(mockSocket);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
      secret: 'super_secret_jwt_key_at_least_32_characters_long',
    });
    expect(mockSocket.join).toHaveBeenCalledWith('user:user-123');
    expect(mockSocket.disconnect).not.toHaveBeenCalled();
  });

  it('disconnects unauthenticated clients when JWT is invalid', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(
      new Error('Invalid token'),
    );
    const mockSocket: any = {
      handshake: { auth: { token: 'bad-token' } },
      join: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(mockSocket);
    expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    expect(mockSocket.join).not.toHaveBeenCalled();
  });

  it('isolates rooms: blocks user from joining another user room', () => {
    const mockSocket: any = {
      data: { user: { sub: 'user-123' } },
      join: jest.fn(),
    };

    // Attempt to join another user's room
    gateway.handleJoinRoom(mockSocket, { userId: 'victim-user-456' });
    expect(mockSocket.join).not.toHaveBeenCalledWith('user:victim-user-456');

    // Joining their own room is permitted
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
