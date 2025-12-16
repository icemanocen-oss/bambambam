const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /api/friends/:userId
// @desc    Send friend request / Add friend
// @access  Private
router.post('/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Check if trying to add self
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ error: 'Cannot add yourself as a friend' });
    }

    // Get both users
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize friends array if it doesn't exist
    if (!currentUser.friends) {
      currentUser.friends = [];
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    // Check if blocked
    if (currentUser.blockedUsers?.includes(targetUserId) || 
        targetUser.blockedUsers?.includes(currentUserId)) {
      return res.status(403).json({ error: 'Cannot add this user' });
    }

    // Add friend (simple implementation - instant friendship)
    currentUser.friends.push(targetUserId);
    
    if (!targetUser.friends) {
      targetUser.friends = [];
    }
    targetUser.friends.push(currentUserId);

    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);

    res.json({ 
      message: 'Friend added successfully',
      friend: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        profilePicture: targetUser.profilePicture
      }
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/friends/:userId
// @desc    Remove friend
// @access  Private
router.delete('/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user._id;

    // Get both users
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if they are friends
    if (!currentUser.friends?.includes(targetUserId)) {
      return res.status(400).json({ error: 'Not friends with this user' });
    }

    // Remove from both users' friend lists
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== targetUserId
    );
    
    if (targetUser.friends) {
      targetUser.friends = targetUser.friends.filter(
        id => id.toString() !== currentUserId.toString()
      );
    }

    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/friends
// @desc    Get user's friends list
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'name email profilePicture userType interests skills location lastActive');

    const friends = user.friends || [];

    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/friends/check/:userId
// @desc    Check if user is a friend
// @access  Private
router.get('/check/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const isFriend = user.friends?.includes(req.params.userId) || false;

    res.json({ isFriend });
  } catch (error) {
    console.error('Check friend error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/friends/suggestions
// @desc    Get friend suggestions based on mutual friends and interests
// @access  Private
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate('friends');

    const friendIds = currentUser.friends?.map(f => f._id.toString()) || [];
    friendIds.push(currentUser._id.toString());

    // Find users who are:
    // 1. Not already friends
    // 2. Not blocked
    // 3. Have common interests or mutual friends
    const suggestions = await User.find({
      _id: { 
        $nin: [...friendIds, ...currentUser.blockedUsers || []]
      },
      blockedUsers: { $ne: currentUser._id },
      $or: [
        { interests: { $in: currentUser.interests || [] } },
        { friends: { $in: friendIds } }
      ]
    })
    .select('name email profilePicture userType interests skills location')
    .limit(10);

    // Calculate mutual friend count
    const suggestionsWithMutuals = suggestions.map(user => {
      const mutualFriends = user.friends?.filter(
        f => friendIds.includes(f.toString())
      ).length || 0;

      const commonInterests = currentUser.interests?.filter(
        interest => user.interests?.includes(interest)
      ) || [];

      return {
        ...user.toObject(),
        mutualFriends,
        commonInterests: commonInterests.length
      };
    });

    // Sort by mutual friends and common interests
    suggestionsWithMutuals.sort((a, b) => {
      const scoreA = a.mutualFriends * 2 + a.commonInterests;
      const scoreB = b.mutualFriends * 2 + b.commonInterests;
      return scoreB - scoreA;
    });

    res.json(suggestionsWithMutuals);
  } catch (error) {
    console.error('Get friend suggestions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;