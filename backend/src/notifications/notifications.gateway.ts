import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationType } from './notification.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake?.query?.userId as string | undefined;
    if (userId) {
      client.join(`user:${userId}`);
    }
  }

  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, payload: { userId: string }) {
    if (payload?.userId) {
      client.join(`user:${payload.userId}`);
    }
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
