import express from 'express';
import auth from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'username profileImage')
      .populate('product', 'title price images')
      .sort({ lastMessageAt: -1 });
    
    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.get('/users', auth, async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 8, 1), 20);

    const query = {
      _id: { $ne: req.user._id },
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('username profileImage bio interests')
      .sort({ username: 1 })
      .limit(limit);

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create or get direct conversation
router.post('/conversations/direct', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ msg: 'targetUserId is required' });
    }

    if (targetUserId === req.user.id) {
       return res.status(400).json({ msg: 'Cannot create conversation with yourself' });
    }

    let conversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [req.user.id, targetUserId] }
    }).populate('participants', 'username profileImage');

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, targetUserId],
        type: 'direct',
        unreadCounts: {
          [req.user.id]: 0,
          [targetUserId]: 0
        }
      });
      await conversation.save();
      conversation = await conversation.populate('participants', 'username profileImage');
    }

    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create or get marketplace conversation
router.post('/conversations/marketplace', auth, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ msg: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    if (product.seller.toString() === req.user.id) {
      return res.status(400).json({ msg: 'Cannot create a marketplace chat for your own product this way.' });
    }

    const sellerId = product.seller.toString();

    let conversation = await Conversation.findOne({
      type: 'marketplace',
      product: productId,
      participants: { $all: [req.user.id, sellerId] }
    })
    .populate('participants', 'username profileImage')
    .populate('product', 'title price images');

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, sellerId],
        type: 'marketplace',
        product: productId,
        unreadCounts: {
          [req.user.id]: 0,
          [sellerId]: 0
        }
      });
      await conversation.save();
      conversation = await conversation.populate('participants', 'username profileImage');
      conversation = await conversation.populate('product', 'title price images');
    }

    res.json(conversation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get messages for a given conversation
router.get('/conversations/:id/messages', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (participantId) => participantId.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username profileImage')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.put('/conversations/:id/read', auth, async (req, res) => {
  try {
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ msg: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      (participantId) => participantId.toString() === req.user.id
    );
    if (!isParticipant) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    conversation.unreadCounts.set(req.user.id, 0);
    await conversation.save();

    await Message.updateMany(
      {
        conversationId,
        'readBy.user': { $ne: req.user._id },
      },
      {
        $push: {
          readBy: {
            user: req.user._id,
            readAt: new Date(),
          },
        },
      }
    );

    res.json({ ok: true, unreadCount: 0 });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
