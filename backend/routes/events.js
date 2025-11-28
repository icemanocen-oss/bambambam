const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Event = require('../models/Event');
const Group = require('../models/Group');

// @route   POST /api/events
// @desc    Create a new event
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, location, date, duration, maxParticipants, category, isOnline, meetingLink, groupId } = req.body;

    // Validate group if provided
    if (groupId) {
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      if (!group.members.includes(req.user._id)) {
        return res.status(403).json({ error: 'You must be a member to create events' });
      }
    }

    const event = new Event({
      title,
      description,
      organizer: req.user._id,
      group: groupId || null,
      location,
      date,
      duration: duration || 60,
      maxParticipants: maxParticipants || 20,
      category,
      isOnline: isOnline || false,
      meetingLink,
      participants: [req.user._id]
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/events
// @desc    Get all upcoming events
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, isOnline } = req.query;

    let query = {
      date: { $gte: new Date() },
      status: 'upcoming'
    };

    if (category) {
      query.category = category;
    }

    if (isOnline !== undefined) {
      query.isOnline = isOnline === 'true';
    }

    const events = await Event.find(query)
      .populate('organizer', 'name profilePicture')
      .populate('group', 'name')
      .populate('participants', 'name profilePicture')
      .sort({ date: 1 })
      .limit(20);

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name profilePicture email')
      .populate('group', 'name')
      .populate('participants', 'name profilePicture userType');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/events/:id/join
// @desc    Join an event
// @access  Private
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already joined
    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already joined this event' });
    }

    // Check if event is full
    if (event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ error: 'Event is full' });
    }

    // Add participant
    event.participants.push(req.user._id);
    await event.save();

    res.json({ message: 'Joined event successfully' });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/events/:id/leave
// @desc    Leave an event
// @access  Private
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if participant
    if (!event.participants.includes(req.user._id)) {
      return res.status(400).json({ error: 'Not a participant of this event' });
    }

    // Cannot leave if organizer
    if (event.organizer.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Organizer cannot leave. Cancel the event instead.' });
    }

    // Remove participant
    event.participants = event.participants.filter(p => p.toString() !== req.user._id.toString());
    await event.save();

    res.json({ message: 'Left event successfully' });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/events/user/my-events
// @desc    Get current user's events
// @access  Private
router.get('/user/my-events', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({
      participants: req.user._id,
      date: { $gte: new Date() }
    })
    .populate('organizer', 'name')
    .populate('group', 'name')
    .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
