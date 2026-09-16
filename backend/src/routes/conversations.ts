import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Listing from '../models/Listing.js';

const router = Router();

// POST /api/conversations — start (or resume) a conversation about a listing
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required' });
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.sellerId.toString() === req.userId) {
      return res
        .status(400)
        .json({ error: "You can't message yourself about your own listing" });
    }

    let conversation = await Conversation.findOne({
      listingId,
      buyerId: req.userId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        listingId,
        buyerId: req.userId,
        sellerId: listing.sellerId,
      });
    }

    res.status(201).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/conversations — inbox: every conversation the current user is part of
router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversations = await Conversation.find({
      $or: [{ buyerId: req.userId }, { sellerId: req.userId }],
    })
      .sort({ lastMessageAt: -1 })
      .populate('listingId', 'title images')
      .populate('buyerId', 'name')
      .populate('sellerId', 'name');

    const withLastMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const lastMessage = await Message.findOne({
          conversationId: conversation._id,
        })
          .sort({ createdAt: -1 })
          .select('body type createdAt');
        return { ...conversation.toObject(), lastMessage };
      }),
    );

    res.json(withLastMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/conversations/:id — single conversation (for the thread header)
router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversation = await Conversation.findById(req.params.id)
      .populate('listingId', 'title images')
      .populate('buyerId', 'name')
      .populate('sellerId', 'name')
      .populate('listingId', 'title images price');

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.buyerId._id.toString() === req.userId ||
      conversation.sellerId._id.toString() === req.userId;

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

    res.json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// GET /api/conversations/:id/messages — message history for a thread
router.get('/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.buyerId.toString() === req.userId ||
      conversation.sellerId.toString() === req.userId;

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/conversations/:id/messages — send a message in a thread
router.post('/:id/messages', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant =
      conversation.buyerId.toString() === req.userId ||
      conversation.sellerId.toString() === req.userId;

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not your conversation' });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: req.userId,
      type: 'text',
      body: body.trim(),
    });

    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;
