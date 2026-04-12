// ─────────────────────────────────────────────────────────
// Notice Model – campus-wide notice board
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    body: {
      type: String,
      required: true
    },

    // AI-generated short summary for long notices
    summary: {
      type: String,
      default: ''
    },

    // Who posted it
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Notice priority level
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal'
    },

    // Which roles can see this notice (empty = everyone)
    targetRoles: [{
      type: String,
      enum: ['student', 'teacher', 'admin']
    }],

    // File attachments (images, PDFs, docs)
    attachments: [{
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      url: String
    }],

    // Track who has read the notice
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { timestamps: true }
);

// Index for efficient queries by role and date
noticeSchema.index({ targetRoles: 1, createdAt: -1 });

export const Notice = mongoose.model('Notice', noticeSchema);
