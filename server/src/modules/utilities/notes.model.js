// ─────────────────────────────────────────────────────────
// Notes Model – shared study notes
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    // Text content of the note
    content: {
      type: String,
      default: ''
    },

    // Uploaded file (optional)
    file: {
      filename: String,
      originalName: String,
      mimetype: String,
      size: Number,
      url: String
    },

    // Who shared it
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    department: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
);

noteSchema.index({ subject: 1, department: 1, createdAt: -1 });

export const Note = mongoose.model('Note', noteSchema);
