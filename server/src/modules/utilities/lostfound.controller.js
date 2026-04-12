// ─────────────────────────────────────────────────────────
// Lost & Found Controller
// ─────────────────────────────────────────────────────────

import { LostFound } from './lostfound.model.js';

// ── POST – Create a lost/found post
export async function createPost(req, res, next) {
  try {
    const { type, title, description, location, contactInfo } = req.body;

    const post = await LostFound.create({
      type,
      title,
      description,
      location,
      contactInfo,
      postedBy: req.user._id
    });

    await post.populate('postedBy', 'fullName email');

    return res.status(201).json({
      success: true,
      message: `${type === 'lost' ? 'Lost' : 'Found'} item posted`,
      data: { post }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET – List posts with optional filters
export async function getPosts(req, res, next) {
  try {
    const { type, status } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;

    const posts = await LostFound.find(filter)
      .populate('postedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: { posts }
    });
  } catch (error) {
    return next(error);
  }
}

// ── PUT /:id – Update status (claim item)
export async function updatePost(req, res, next) {
  try {
    const post = await LostFound.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (req.body.status) post.status = req.body.status;
    await post.save();

    return res.status(200).json({
      success: true,
      message: 'Post updated',
      data: { post }
    });
  } catch (error) {
    return next(error);
  }
}
