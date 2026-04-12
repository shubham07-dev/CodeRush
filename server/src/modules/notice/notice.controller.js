// ─────────────────────────────────────────────────────────
// Notice Controller – CRUD with file attachments & AI summary
// ─────────────────────────────────────────────────────────

import { Notice } from './notice.model.js';
import { summariseText } from '../../utils/summariser.js';

// ── POST /notices – Create a notice with optional file attachments
export async function createNotice(req, res, next) {
  try {
    const { title, body: noticeBody, priority, targetRoles } = req.body;

    // Build attachments array from uploaded files
    const attachments = (req.files || []).map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/notices/${file.filename}`
    }));

    // Auto-generate summary for long notices
    const summary = noticeBody.length > 200 ? summariseText(noticeBody) : '';

    // Parse targetRoles from comma-separated string (multipart forms send strings)
    let parsedRoles = [];
    if (targetRoles) {
      parsedRoles = typeof targetRoles === 'string'
        ? targetRoles.split(',').map((r) => r.trim()).filter(Boolean)
        : targetRoles;
    }

    const notice = await Notice.create({
      title,
      body: noticeBody,
      summary,
      author: req.user._id,
      priority: priority || 'normal',
      targetRoles: parsedRoles,
      attachments
    });

    await notice.populate('author', 'fullName role');

    return res.status(201).json({
      success: true,
      message: 'Notice published',
      data: { notice }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET /notices – List notices filtered by user's role
export async function getAllNotices(req, res, next) {
  try {
    const userRole = req.user.role;

    // Show notices targeted at the user's role OR notices with no target (= everyone)
    const notices = await Notice.find({
      $or: [
        { targetRoles: { $size: 0 } },
        { targetRoles: userRole }
      ]
    })
      .populate('author', 'fullName role')
      .sort({ createdAt: -1 })
      .limit(100);

    // Add read status for current user
    const enriched = notices.map((n) => ({
      ...n.toObject(),
      isRead: n.readBy.some((id) => id.toString() === req.user._id.toString())
    }));

    return res.status(200).json({
      success: true,
      data: { notices: enriched }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET /notices/:id – Single notice detail + mark as read
export async function getNoticeById(req, res, next) {
  try {
    const notice = await Notice.findById(req.params.id)
      .populate('author', 'fullName role email');

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Mark as read for this user
    if (!notice.readBy.includes(req.user._id)) {
      notice.readBy.push(req.user._id);
      await notice.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        notice: {
          ...notice.toObject(),
          isRead: true,
          readCount: notice.readBy.length
        }
      }
    });
  } catch (error) {
    return next(error);
  }
}

// ── DELETE /notices/:id – Admin or author can delete
export async function deleteNotice(req, res, next) {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    // Only admin or the author can delete
    if (req.user.role !== 'admin' && notice.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this notice' });
    }

    await Notice.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Notice deleted'
    });
  } catch (error) {
    return next(error);
  }
}
