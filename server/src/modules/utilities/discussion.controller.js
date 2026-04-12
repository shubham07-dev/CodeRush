// ─────────────────────────────────────────────────────────
// Discussion Controller – peer help Q&A
// ─────────────────────────────────────────────────────────

import { Discussion } from './discussion.model.js';

// ── POST – Ask a question
export async function createQuestion(req, res, next) {
  try {
    const { question, details, tags } = req.body;

    const parsedTags = typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : (tags || []);

    const discussion = await Discussion.create({
      question,
      details,
      tags: parsedTags,
      author: req.user._id
    });

    await discussion.populate('author', 'fullName role department');

    return res.status(201).json({
      success: true,
      message: 'Question posted',
      data: { discussion }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET – List discussions with optional tag filter
export async function getDiscussions(req, res, next) {
  try {
    const { tag, solved } = req.query;
    const filter = {};

    if (tag) filter.tags = tag.toLowerCase();
    if (solved !== undefined) filter.solved = solved === 'true';

    const discussions = await Discussion.find(filter)
      .populate('author', 'fullName role department')
      .populate('answers.author', 'fullName role')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: { discussions }
    });
  } catch (error) {
    return next(error);
  }
}

// ── POST /:id/answers – Add an answer
export async function addAnswer(req, res, next) {
  try {
    const { body: answerBody } = req.body;

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    discussion.answers.push({
      author: req.user._id,
      body: answerBody
    });

    await discussion.save();
    await discussion.populate('answers.author', 'fullName role');

    return res.status(201).json({
      success: true,
      message: 'Answer added',
      data: { discussion }
    });
  } catch (error) {
    return next(error);
  }
}

// ── PUT /:id/solved – Toggle solved status (author only)
export async function toggleSolved(req, res, next) {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    if (discussion.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the author can mark as solved' });
    }

    discussion.solved = !discussion.solved;
    await discussion.save();

    return res.status(200).json({
      success: true,
      message: discussion.solved ? 'Marked as solved' : 'Reopened',
      data: { discussion }
    });
  } catch (error) {
    return next(error);
  }
}
