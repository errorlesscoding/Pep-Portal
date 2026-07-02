const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const chatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    messages: [chatMessageSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
