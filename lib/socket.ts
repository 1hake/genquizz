'use client';

import { io, Socket } from 'socket.io-client';
import { SocketType } from './types';

let socket: Socket | null = null;

export function getSocket(): SocketType {
    if (!socket) {
        socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
    }

    return socket as unknown as SocketType;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}