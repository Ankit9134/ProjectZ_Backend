
const mongoose = require('mongoose');

const MailSchema = new mongoose.Schema({
  receiverMailId: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  createdAt:{
    type:Date,
    required:true
  },
  preview: {
    type: String,
    trim: true
  },
  image: {
    type: String
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderStatus: {
    isSent: { type: Boolean, default: false },
    isDraft: { type: Boolean, default: false },
  },
  receiverStatus: {
    read: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    isTrashed: { type: Boolean, default: false },
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Mail', MailSchema);
