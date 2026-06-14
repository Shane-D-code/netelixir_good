import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
declare let io: SocketServer;
export declare function initWebSocket(server: HttpServer): SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { io };
//# sourceMappingURL=websocket.d.ts.map