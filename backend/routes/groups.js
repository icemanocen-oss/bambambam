const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');
const AIMatchingService = require('../utils/aiMatching');

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, category, interests, maxMembers, isPrivate } = req.body;

    const group = new Group({
      name,
      description,
      category,
      interests: interests || [],
      creator: req.user._id,
      members: [req.user._id],
      admins: [req.user._id],
      maxMembers: maxMembers || 50,
      isPrivate: isPrivate || false
    });

    await group.save();

    // Add group to user's joined groups
    await User.findByIdAndUpdate(req.user._id, {
      $push: { joinedGroups: group._id }
    });

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/groups
// @desc    Get all public groups
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { isPrivate: false };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const groups = await Group.find(query)
      .populate('creator', 'name')
      .populate('members', 'name profilePicture')
      .sort({ lastActivity: -1 })
      .limit(20);

    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/groups/recommendations
// @desc    Get recommended groups based on user interests
// @access  Private
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    
    const allGroups = await Group.find({
      isPrivate: false,
      members: { $ne: currentUser._id }
    }).populate('creator', 'name');

    const recommendations = AIMatchingService.recommendGroups(currentUser, allGroups, 5);

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/groups/:id
// @desc    Get group by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name profilePicture')
      .populate('members', 'name profilePicture userType')
      .populate('admins', 'name');

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if private and user is not a member
    if (group.isPrivate && !group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: 'This group is private' });
    }

    res.json(group);
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/groups/:id/join
// @desc    Join a group
// @access  Private
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if already a member
    if (group.members.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Check if group is full
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: 'Group is full' });
    }

    // Add user to group
    group.members.push(req.user._id);
    group.lastActivity = Date.now();
    await group.save();

    // Add group to user's joined groups
    await User.findByIdAndUpdate(req.user._id, {
      $push: { joinedGroups: group._id }
    });

    res.json({ message: 'Joined group successfully' });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/groups/:id/leave
// @desc    Leave a group
// @access  Private
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if member
    if (!group.members.includes(req.user._id)) {
      return res.status(400).json({ error: 'Not a member of this group' });
    }

    // Cannot leave if creator
    if (group.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Creator cannot leave the group. Delete the group instead.' });
    }

    // Remove user from group
    group.members = group.members.filter(m => m.toString() !== req.user._id.toString());
    group.admins = group.admins.filter(a => a.toString() !== req.user._id.toString());
    await group.save();

    // Remove group from user's joined groups
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { joinedGroups: group._id }
    });

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/groups/user/my-groups
// @desc    Get current user's groups
// @access  Private
router.get('/user/my-groups', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id
    })
    .populate('creator', 'name')
    .populate('members', 'name profilePicture')
    .sort({ lastActivity: -1 });

    res.json(groups);
  } catch (error) {
    console.error('Get my groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
