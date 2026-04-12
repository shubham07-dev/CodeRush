// ─────────────────────────────────────────────────────────
// Assignment Controller
// ─────────────────────────────────────────────────────────

import { Assignment, AssignmentRecord } from './assignment.model.js';
import { User } from '../auth/auth.model.js';
import PDFDocument from 'pdfkit';
import { getIO } from '../../utils/socket.js';

// ── Teacher creates assignment + auto-spawns records
export async function createAssignment(req, res, next) {
  try {
    const { title, description, subject, dueDate, targetDepartment, targetYear, targetSection } = req.body;
    
    let pdfAttachment = null;
    if (req.file) {
      pdfAttachment = `/uploads/assignments/${req.file.filename}`;
    }

    const assignment = await Assignment.create({
      title, description, pdfAttachment, subject,
      teacher: req.user._id,
      dueDate, targetDepartment, targetYear, targetSection
    });

    // Spawn records for all matching students
    const studentQuery = { role: 'student' };
    if (targetDepartment) studentQuery.department = targetDepartment;
    if (targetYear) studentQuery.enrollmentYear = targetYear;
    if (targetSection) studentQuery.section = targetSection;

    const students = await User.find(studentQuery);
    
    const recordsToInsert = students.map(s => ({
      assignment: assignment._id,
      student: s._id,
      status: 'pending',
      marks: 0
    }));

    if (recordsToInsert.length > 0) {
      await AssignmentRecord.insertMany(recordsToInsert);
      
      try {
        const io = getIO();
        io.emit('new_assignment', { 
          title: assignment.title, 
          assignmentId: assignment._id,
          targetDepartment, targetYear, targetSection 
        });
      } catch (err) {
        console.error('Socket emission failed:', err.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Assignment created. Distributed to ${students.length} students.`,
      data: { assignment }
    });
  } catch (error) {
    return next(error);
  }
}

// ── Student submits an assignment
export async function submitAssignment(req, res, next) {
  try {
    const { id } = req.params; // record ID
    let submissionPdf = null;
    if (req.file) {
      submissionPdf = `/uploads/assignments/${req.file.filename}`;
    } else {
      return res.status(400).json({ success: false, message: 'PDF submission is required' });
    }

    const record = await AssignmentRecord.findOneAndUpdate(
      { _id: id, student: req.user._id },
      { status: 'submitted', submissionPdf },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: 'Assignment record not found' });
    }

    return res.status(200).json({ success: true, message: 'Assignment submitted successfully', data: { record } });
  } catch (error) {
    return next(error);
  }
}

// ── Teacher/Student lists assignments
export async function getAssignments(req, res, next) {
  try {
    if (req.user.role === 'student') {
      const records = await AssignmentRecord.find({ student: req.user._id })
        .populate({ path: 'assignment', populate: { path: 'teacher subject' } })
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: { records } });
    } else {
      const filter = req.user.role === 'teacher' ? { teacher: req.user._id } : {};
      const assignments = await Assignment.find(filter)
        .populate('subject')
        .sort({ createdAt: -1 });
      return res.status(200).json({ success: true, data: { assignments } });
    }
  } catch (error) {
    return next(error);
  }
}

// ── Teacher marks an assignment complete for a student
export async function gradeAssignment(req, res, next) {
  try {
    const { id } = req.params; // record ID
    const { marks } = req.body;

    const record = await AssignmentRecord.findByIdAndUpdate(
      id,
      { status: 'completed', marks },
      { new: true }
    );

    return res.status(200).json({ success: true, message: 'Student graded', data: { record } });
  } catch (error) {
    return next(error);
  }
}

// ── Teacher generates PDF Report for a specific assignment
export async function generateAssignmentPdf(req, res, next) {
  try {
    const { id } = req.params; // Assignment ID
    const assignment = await Assignment.findById(id).populate('subject');
    if (!assignment) return res.status(404).json({ success: false, message: 'Not found' });

    const records = await AssignmentRecord.find({ assignment: id })
      .populate('student', 'fullName email section');

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=assignment-${id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text(`Assignment Report: ${assignment.title}`, { align: 'center' });
    doc.fontSize(14).text(`Subject: ${assignment.subject.name}`);
    doc.text(`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`);
    doc.moveDown();

    records.forEach((r, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${r.student.fullName} (${r.student.section || 'N/A'}) - ${r.status.toUpperCase()} - Marks: ${r.marks}`);
    });

    doc.end();
  } catch (error) {
    return next(error);
  }
}

// ── Teacher fetches records for a specific assignment
export async function getAssignmentRecords(req, res, next) {
  try {
    const { id } = req.params;
    const records = await AssignmentRecord.find({ assignment: id })
      .populate('student', 'fullName email section enrollmentYear')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, data: { records } });
  } catch (error) {
    return next(error);
  }
}
