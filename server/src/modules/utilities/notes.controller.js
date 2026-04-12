// ─────────────────────────────────────────────────────────
// Notes Controller – share and browse study notes
// ─────────────────────────────────────────────────────────

import { Note } from './notes.model.js';

// ── POST /utilities/notes – Share a note (with optional file)
export async function createNote(req, res, next) {
  try {
    const { title, subject, content, department } = req.body;

    const file = req.file
      ? {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/notes/${req.file.filename}`
        }
      : undefined;

    const note = await Note.create({
      title,
      subject,
      content,
      department: department || req.user.department,
      uploader: req.user._id,
      ...(file && { file })
    });

    await note.populate('uploader', 'fullName department');

    return res.status(201).json({
      success: true,
      message: 'Note shared successfully',
      data: { note }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET /utilities/notes – Browse notes with optional filters
export async function getNotes(req, res, next) {
  try {
    const { subject, department } = req.query;
    const filter = {};

    if (subject) filter.subject = new RegExp(subject, 'i');
    if (department) filter.department = new RegExp(department, 'i');

    const notes = await Note.find(filter)
      .populate('uploader', 'fullName department')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: { notes }
    });
  } catch (error) {
    return next(error);
  }
}

// ── DELETE /utilities/notes/:id – Owner or admin can delete
export async function deleteNote(req, res, next) {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (req.user.role !== 'admin' && note.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorised to delete this note' });
    }

    await Note.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Note deleted' });
  } catch (error) {
    return next(error);
  }
}
