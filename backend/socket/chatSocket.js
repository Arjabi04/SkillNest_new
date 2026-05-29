import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

export default function configureChatSockets(io) {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded?.id || decoded?.user?.id;
      if (!userId) {
        return next(new Error('Authentication error: Invalid token payload'));
      }
      socket.user = { id: userId };
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected to chat socket: ${socket.user.id}`);
    
    // Join a personal room for inbox-level events
    socket.join(`user:${socket.user.id}`);

    socket.on('chat:join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.user.id} joined conversation: ${conversationId}`);
    });

    socket.on('chat:leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('chat:send_message', async (data, ack) => {
      try {
        const { conversationId, text } = data || {};
        const messageText = String(text || '').trim();

        if (!conversationId || !messageText) {
          const payload = { message: 'conversationId and text are required' };
          if (typeof ack === 'function') ack({ ok: false, ...payload });
          return socket.emit('chat:error', payload);
        }
        
        // Verify conversation participation
        const conversation = await Conversation.findById(conversationId);
        const isParticipant = conversation?.participants?.some(
          (participantId) => participantId.toString() === socket.user.id
        );
        if (!conversation || !isParticipant) {
          const payload = { message: 'Not authorized for this conversation' };
          if (typeof ack === 'function') ack({ ok: false, ...payload });
          return socket.emit('chat:error', payload);
        }

        // Save message
        const message = new Message({
          conversationId,
          sender: socket.user.id,
          text: messageText,
          readBy: [{ user: socket.user.id }]
        });
        await message.save();
        await message.populate('sender', 'username profileImage');

        // Update conversation last message
        conversation.lastMessageText = messageText;
        conversation.lastMessageAt = new Date();
        
        // Increment unread count for other participants
        conversation.participants.forEach(pId => {
          const pStr = pId.toString();
          if (pStr !== socket.user.id) {
            let count = conversation.unreadCounts.get(pStr) || 0;
            conversation.unreadCounts.set(pStr, count + 1);
          }
        });
        await conversation.save();

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit('chat:new_message', message);
        if (typeof ack === 'function') {
          ack({ ok: true, message });
        }
        
        // Broadcast inbox update to all participants
        conversation.participants.forEach(pId => {
           const participantId = pId.toString();
           io.to(`user:${pId.toString()}`).emit('chat:conversation_updated', {
             conversationId,
             senderId: socket.user.id,
             lastMessageText: messageText,
             lastMessageAt: conversation.lastMessageAt,
             unreadCount: conversation.unreadCounts.get(participantId) || 0,
           });
        });

      } catch (error) {
        console.error('Socket send message error:', error);
        const payload = { message: 'Failed to send message' };
        if (typeof ack === 'function') ack({ ok: false, ...payload });
        socket.emit('chat:error', payload);
      }
    });

    socket.on('chat:typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('chat:typing', {
        userId: socket.user.id,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from chat socket: ${socket.user.id}`);
    });
  });
}
