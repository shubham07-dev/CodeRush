// ─────────────────────────────────────────────────────────
// Subject Controller
// ─────────────────────────────────────────────────────────

import { Subject } from './subject.model.js';

export async function createSubject(req, res, next) {
  try {
    const name = req.body.name;
    const code = req.body.code;
    const department = req.body.department || req.user.department;
    const campus = req.body.campus || req.user.campus;

    if (!campus) {
      return res.status(400).json({ success: false, message: 'Campus is required to create a subject' });
    }

    const existing = await Subject.findOne({ code: code.toUpperCase(), campus });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Subject code already exists in this campus' });
    }

    const subject = await Subject.create({
      name,
      code,
      department,
      campus,
      createdBy: req.user._id
    });

    return res.status(201).json({
      success: true,
      data: { subject }
    });
  } catch (error) {
    return next(error);
  }
}

export async function getSubjects(req, res, next) {
  try {
    const filters = {};
    if (req.query.campus) filters.campus = req.query.campus;
    if (req.query.department) filters.department = req.query.department;

    const subjects = await Subject.find(filters).populate('campus', 'name');

    return res.status(200).json({
      success: true,
      data: { subjects }
    });
  } catch (error) {
    return next(error);
  }
}
