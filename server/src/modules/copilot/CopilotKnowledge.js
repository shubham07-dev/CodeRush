// ─────────────────────────────────────────────────────────
// CopilotKnowledge Model – RAG knowledge chunks
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const copilotKnowledgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['navigation', 'academics', 'features', 'faq', 'rules'],
      default: 'faq'
    },
    embedding: { type: [Number], default: [] }
  },
  { timestamps: true }
);

// Text index for simple full-text search (works on any MongoDB)
copilotKnowledgeSchema.index({ title: 'text', content: 'text' });

export default mongoose.model('CopilotKnowledge', copilotKnowledgeSchema);
