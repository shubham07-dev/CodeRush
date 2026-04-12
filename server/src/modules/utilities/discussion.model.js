// ─────────────────────────────────────────────────────────
// Discussion Model – peer help Q&A
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  body: {
    type: String,
    required: true
  },
  upvotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const discussionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },

    details: {
      type: String,
      default: ''
    },

    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    answers: [answerSchema],

    solved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

discussionSchema.index({ tags: 1, createdAt: -1 });

export const Discussion = mongoose.model('Discussion', discussionSchema);
