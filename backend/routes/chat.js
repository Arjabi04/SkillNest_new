import express from 'express';
import auth from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Product from '../models/Product.js';

const router = express.Router();

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name username profilePicture')
      .populate('product', 'title price images')
      .sort({ lastMessageAt: -1 });
    
    res.json(conversations);
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
    }).populate('participants', 'name username profilePicture');

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
      conversation = await conversation.populate('participants', 'name username profilePicture');
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
    .populate('participants', 'name username profilePicture')
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
      conversation = await conversation.populate('participants', 'name username profilePicture');
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
      .populate('sender', 'name username profilePicture')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
