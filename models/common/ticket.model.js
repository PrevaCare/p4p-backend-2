// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  context: { type: String, enum: ['teleconsultation', 'support_ticket'], required: true },

  // Common to both
  senderId: { type: String, required: true },
  receiverId: { type: String }, // Optional: useful for ticket admin-user
  subject: { type: String },
  content: { type: String },
  type: { type: String, enum: ['payment', 'package', 'consultation'] },
  mediaUrl: { type: String },
  status: { enum: ['open', 'closed', 'in-progress', 'on-hold']},
  // Context-specific linkage
  channelName: { type: String }, // For teleconsultation
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
