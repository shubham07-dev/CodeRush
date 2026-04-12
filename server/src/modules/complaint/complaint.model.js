// ─────────────────────────────────────────────────────────
// Complaint Model – student complaint management
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';

export const COMPLAINT_CATEGORIES = ['hostel', 'wifi', 'infrastructure', 'academics', 'transport', 'canteen', 'other'];
export const COMPLAINT_STATUSES = ['pending', 'in-progress', 'resolved'];

const complaintSchema = new mongoose.Schema(
  {
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

    category: {
      type: String,
      enum: COMPLAINT_CATEGORIES,
      required: true
    },

    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: 'pending'
    },

    // Student who raised the complaint
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Admin/Teacher response thread
    responses: [{
      responder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],

    resolvedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Index for efficient filtering
complaintSchema.index({ status: 1, category: 1, createdAt: -1 });

export const Complaint = mongoose.model('Complaint', complaintSchema);
