// ─────────────────────────────────────────────────────────
// Lost & Found Model
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const lostFoundSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    description: {
      type: String,
      required: true
    },

    // Where it was lost / found
    location: {
      type: String,
      trim: true,
      default: ''
    },

    // How to reach the poster
    contactInfo: {
      type: String,
      trim: true,
      default: ''
    },

    status: {
      type: String,
      enum: ['open', 'claimed'],
      default: 'open'
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

lostFoundSchema.index({ type: 1, status: 1, createdAt: -1 });

export const LostFound = mongoose.model('LostFound', lostFoundSchema);
