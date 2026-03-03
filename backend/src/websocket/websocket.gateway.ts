import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3100',
      'http://172.16.83.8:3100',
    ],
    credentials: true,
  },
  namespace: '/ws',
})
export class AppWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AppWebSocketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:job')
  handleSubscribeJob(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    client.join(`job:${data.jobId}`);
    this.logger.debug(`Client ${client.id} subscribed to job:${data.jobId}`);
  }

  // Called from AIService to notify progress
  notifyJobProgress(jobId: string, progress: number, state: string) {
    this.server.to(`job:${jobId}`).emit('job:progress', {
      jobId,
      progress,
      state,
    });
  }

  notifyJobComplete(jobId: string, result: any) {
    this.server.to(`job:${jobId}`).emit('job:complete', {
      jobId,
      result,
    });
  }

  notifyJobFailed(jobId: string, reason: string) {
    this.server.to(`job:${jobId}`).emit('job:failed', {
      jobId,
      reason,
    });
  }

  // General notification broadcast
  sendNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
