import { io } from 'socket.io-client';
import { getAuthToken } from '../utils/tokenUtils';

let socket = null;

export const initSocket = () => {
    if (!socket) {
        const token = getAuthToken();
        const API_URL = import.meta.env.VITE_API_URL;
        
        socket = io(API_URL, {
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
