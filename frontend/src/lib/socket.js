import { io } from 'socket.io-client';
import { getAuthToken } from '../utils/tokenUtils';

let socket = null;

const getSocketUrl = () => {
    const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
    if (explicitSocketUrl) return explicitSocketUrl;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    return apiUrl.replace(/\/api\/?$/, '');
};

export const initSocket = () => {
    if (!socket) {
        const token = getAuthToken();
        
        socket = io(getSocketUrl(), {
            auth: { token },
            autoConnect: false // Connect manually when needed
        });
    }
    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
