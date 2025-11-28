const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const AIMatchingService = require('../utils/aiMatching');

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('joinedGroups', 'name category');
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, age, bio, interests, skills, location, userType, privacySettings } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (age) updateFields.age = age;
    if (bio) updateFields.bio = bio;
    if (interests) updateFields.interests = interests;
    if (skills) updateFields.skills = skills;
    if (location) updateFields.location = location;
    if (userType) updateFields.userType = userType;
    if (privacySettings) updateFields.privacySettings = privacySettings;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by interests, skills, or name
// @access  Private
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query, userType, interests } = req.query;

    let searchCriteria = {
      _id: { $ne: req.user._id },
      $and: [
        { _id: { $nin: req.user.blockedUsers || [] } },
        { blockedUsers: { $ne: req.user._id } }
      ]
    };

    if (query) {
      searchCriteria.$text = { $search: query };
    }

    if (userType) {
      searchCriteria.userType = userType;
    }

    if (interests) {
      const interestArray = interests.split(',').map(i => i.trim());
      searchCriteria.interests = { $in: interestArray };
    }

    const users = await User.find(searchCriteria)
      .select('-password -blockedUsers')
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/matches
// @desc    Get AI-powered user matches
// @access  Private
router.get('/matches', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    // Get all users except current user and blocked users
    const allUsers = await User.find({
      _id: { $ne: currentUser._id },
      $and: [
        { _id: { $nin: currentUser.blockedUsers || [] } },
        { blockedUsers: { $ne: currentUser._id } }
      ]
    }).select('-password -blockedUsers');

    // Use AI matching service
    const matches = AIMatchingService.findMatches(currentUser, allUsers, 10);

    res.json(matches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -blockedUsers')
      .populate('joinedGroups', 'name category');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Apply privacy settings
    if (!user.privacySettings.showEmail) {
      user.email = undefined;
    }
    if (!user.privacySettings.showAge) {
      user.age = undefined;
    }
    if (!user.privacySettings.showLocation) {
      user.location = undefined;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/users/block/:id
// @desc    Block a user
// @access  Private
router.post('/block/:id', authMiddleware, async (req, res) => {
  try {
    const userToBlock = await User.findById(req.params.id);
    
    if (!userToBlock) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);
    
    if (!currentUser.blockedUsers.includes(userToBlock._id)) {
      currentUser.blockedUsers.push(userToBlock._id);
      await currentUser.save();
    }

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
