// ─────────────────────────────────────────────────────────
// Assignment Models – Assignments + Records
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';

// ── Assignment – created by teacher ──────────────
const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    pdfAttachment: {
      type: String // URL to uploaded PDF
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    // Filters to spawn records for specific students
    targetDepartment: String,
    targetYear: Number,
    targetSection: String
  },
  { timestamps: true }
);

// ── Assignment Record – spawned uniquely per student ─────
const assignmentRecordSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'completed'],
      default: 'pending'
    },
    submissionPdf: {
      type: String // URL to uploaded submission PDF
    },
    marks: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Prevent duplicate assignment records per student
assignmentRecordSchema.index({ assignment: 1, student: 1 }, { unique: true });

export const Assignment = mongoose.model('Assignment', assignmentSchema);
export const AssignmentRecord = mongoose.model('AssignmentRecord', assignmentRecordSchema);
