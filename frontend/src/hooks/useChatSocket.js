import { useEffect, useState } from 'react';
import { initSocket, disconnectSocket } from '../lib/socket';

export const useChatSocket = () => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const nextSocket = initSocket();
        nextSocket.connect();
        setSocket(nextSocket);

        return () => {
            disconnectSocket(); // Only disconnect when app unmounts or user logs out
        };
    }, []);

    return socket;
};
