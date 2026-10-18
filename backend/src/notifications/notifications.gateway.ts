import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { NotificationType } from './notification.entity';

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private jwtService?: JwtService,
    private configService?: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake?.auth?.token ||
        (client.handshake?.headers?.authorization?.startsWith('Bearer ')
          ? client.handshake.headers.authorization.slice(7)
          : null) ||
        (client.handshake?.query?.token as string);

      if (token && this.jwtService) {
        const secret =
          this.configService?.get<string>('JWT_ACCESS_SECRET') ||
          process.env.JWT_ACCESS_SECRET;
        const payload = await this.jwtService.verifyAsync(token, { secret });
        client.data = client.data || {};
        client.data.user = payload;
        client.join(`user:${payload.sub}`);
        return;
      }

      const userId = client.handshake?.query?.userId as string | undefined;
      if (userId && !this.jwtService) {
        client.join(`user:${userId}`);
        return;
      }

      if (this.jwtService && !client.data?.user) {
        client.disconnect(true);
      }
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, payload: { userId: string }) {
    if (!payload?.userId) return;

    // Room isolation check: reject joining unauthorized user rooms
    if (client.data?.user && payload.userId !== client.data.user.sub) {
      this.logger.warn(
        `Unauthorized room subscription attempt: user ${client.data.user.sub} tried to join ${payload.userId}`,
      );
      return;
    }

    client.join(`user:${payload.userId}`);
  }

  sendNotification(
    userId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
  ) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification', {
        type,
        payload,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
