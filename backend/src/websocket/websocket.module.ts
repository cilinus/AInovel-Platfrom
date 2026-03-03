import { Module, Global } from '@nestjs/common';
import { AppWebSocketGateway } from './websocket.gateway';

@Global()
@Module({
  providers: [AppWebSocketGateway],
  exports: [AppWebSocketGateway],
})
export class WebSocketModule {}
