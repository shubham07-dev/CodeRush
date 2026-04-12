import mongoose from 'mongoose';

const practicalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expectedOutput: {
      type: String,
      required: true
    },
    deadline: {
      type: Date
    }
  },
  { timestamps: true }
);

const practicalSubmissionSchema = new mongoose.Schema(
  {
    practicalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Practical',
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    codeSubmitted: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'java'],
      default: 'javascript'
    },
    output: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'evaluated', 'error'],
      default: 'pending'
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    isFinal: {
      type: Boolean,
      default: false
    },
    marks: {
      type: Number
    }
  },
  { timestamps: true }
);

export const Practical = mongoose.model('Practical', practicalSchema);
export const PracticalSubmission = mongoose.model('PracticalSubmission', practicalSubmissionSchema);
