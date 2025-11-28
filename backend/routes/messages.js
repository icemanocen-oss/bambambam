const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { receiverId, groupId, content } = req.body;

    if (!receiverId && !groupId) {
      return res.status(400).json({ error: 'Receiver or group is required' });
    }

    if (receiverId && groupId) {
      return res.status(400).json({ error: 'Message can be sent to either user or group, not both' });
    }

    const message = new Message({
      sender: req.user._id,
      receiver: receiverId || null,
      group: groupId || null,
      content,
      messageType: 'text'
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/messages/conversation/:userId
// @desc    Get conversation with a specific user
// @access  Private
router.get('/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    })
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture')
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user._id,
        isRead: false
      },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/messages/group/:groupId
// @desc    Get group messages
// @access  Private
router.get('/group/:groupId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      group: req.params.groupId
    })
    .populate('sender', 'name profilePicture')
    .sort({ createdAt: 1 })
    .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/messages/conversations
// @desc    Get all conversations for current user
// @access  Private
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    // Get all unique users the current user has messaged with
    const sentMessages = await Message.distinct('receiver', { 
      sender: req.user._id,
      receiver: { $ne: null }
    });
    
    const receivedMessages = await Message.distinct('sender', { 
      receiver: req.user._id 
    });

    const uniqueUserIds = [...new Set([...sentMessages, ...receivedMessages])];

    // Get last message for each conversation
    const conversations = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const lastMessage = await Message.findOne({
          $or: [
            { sender: req.user._id, receiver: userId },
            { sender: userId, receiver: req.user._id }
          ]
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'name profilePicture')
        .populate('receiver', 'name profilePicture');

        const unreadCount = await Message.countDocuments({
          sender: userId,
          receiver: req.user._id,
          isRead: false
        });

        const otherUser = await User.findById(userId).select('name profilePicture lastActive');

        return {
          user: otherUser,
          lastMessage,
          unreadCount
        };
      })
    );

    // Sort by last message time
    conversations.sort((a, b) => {
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/messages/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
