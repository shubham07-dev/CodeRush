// ─────────────────────────────────────────────────────────
// CopilotCache Model – stores semantic cache of Q&A pairs
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const copilotCacheSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    embedding: { type: [Number], required: true },
    context: { type: String, default: '' },           // page path + role
    createdAt: { type: Date, default: Date.now, expires: 604800 } // TTL: 7 days
  },
  { timestamps: true }
);

copilotCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export default mongoose.model('CopilotCache', copilotCacheSchema);
