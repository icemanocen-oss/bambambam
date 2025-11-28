const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    min: 16,
    max: 100
  },
  bio: {
    type: String,
    maxlength: 500
  },
  interests: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: 'default-avatar.png'
  },
  userType: {
    type: String,
    enum: ['student', 'professional', 'hobbyist'],
    default: 'student'
  },
  joinedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  privacySettings: {
    showEmail: { type: Boolean, default: false },
    showAge: { type: Boolean, default: true },
    showLocation: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

// Create text index for search
userSchema.index({ name: 'text', interests: 'text', skills: 'text' });

module.exports = mongoose.model('User', userSchema);
