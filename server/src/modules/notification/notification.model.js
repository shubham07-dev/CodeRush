import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    link: {
      type: String
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'submission'],
      default: 'info'
    }
  },
  { timestamps: true }
);

export const Notification = mongoose.model('Notification', notificationSchema);
