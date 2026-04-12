// ─────────────────────────────────────────────────────────
// Complaint Controller – raise, track, respond, resolve
// ─────────────────────────────────────────────────────────

import { Complaint } from './complaint.model.js';

// ── POST /complaints – Student raises a complaint
export async function createComplaint(req, res, next) {
  try {
    const { title, description, category } = req.body;

    const complaint = await Complaint.create({
      title,
      description,
      category,
      student: req.user._id
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint raised successfully',
      data: { complaint }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET /complaints – List complaints (role-filtered)
export async function getComplaints(req, res, next) {
  try {
    const { status, category } = req.query;
    const filter = {};

    // Students only see their own complaints
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    }

    if (status) filter.status = status;
    if (category) filter.category = category;

    const complaints = await Complaint.find(filter)
      .populate('student', 'fullName email department')
      .populate('responses.responder', 'fullName role')
      .sort({ createdAt: -1 })
      .limit(100);

    // Stats summary
    const allForStats = req.user.role === 'student'
      ? await Complaint.find({ student: req.user._id })
      : await Complaint.find();

    const stats = {
      total: allForStats.length,
      pending: allForStats.filter((c) => c.status === 'pending').length,
      inProgress: allForStats.filter((c) => c.status === 'in-progress').length,
      resolved: allForStats.filter((c) => c.status === 'resolved').length
    };

    return res.status(200).json({
      success: true,
      data: { complaints, stats }
    });
  } catch (error) {
    return next(error);
  }
}

// ── GET /complaints/:id – Single complaint with full response thread
export async function getComplaintById(req, res, next) {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('student', 'fullName email department')
      .populate('responses.responder', 'fullName role');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Students can only view their own
    if (req.user.role === 'student' && complaint.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    return res.status(200).json({
      success: true,
      data: { complaint }
    });
  } catch (error) {
    return next(error);
  }
}

// ── PUT /complaints/:id/status – Admin/Teacher updates status
export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = status;
    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: { complaint }
    });
  } catch (error) {
    return next(error);
  }
}

// ── POST /complaints/:id/responses – Admin/Teacher adds a response
export async function addResponse(req, res, next) {
  try {
    const { message } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.responses.push({
      responder: req.user._id,
      message
    });

    // Auto-update status to in-progress if still pending
    if (complaint.status === 'pending') {
      complaint.status = 'in-progress';
    }

    await complaint.save();
    await complaint.populate('responses.responder', 'fullName role');

    return res.status(201).json({
      success: true,
      message: 'Response added',
      data: { complaint }
    });
  } catch (error) {
    return next(error);
  }
}
