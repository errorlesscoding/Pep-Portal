const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    speechEnabled: {
      type: Boolean,
      default: false,
    },
    difficultyPref: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Settings', settingsSchema);
