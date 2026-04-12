import { Practical, PracticalSubmission } from './practical.model.js';
import { Notification } from '../notification/notification.model.js';
import vm from 'vm'; // built-in node module for safe-ish JS execution

// ─────────────────────────────────────────────────────────
// POST /api/v1/practicals
// Teacher creates a new practical experiment
// ─────────────────────────────────────────────────────────
export async function createPractical(req, res, next) {
  try {
    const { title, description, subject, expectedOutput, deadline } = req.body;

    const practical = await Practical.create({
      title,
      description,
      subject,
      expectedOutput,
      deadline,
      teacherId: req.user._id
    });

    return res.status(201).json({
      success: true,
      data: practical
    });
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/v1/practicals
// Get list of practicals (Students see all, or filtered; Teachers see theirs)
// ─────────────────────────────────────────────────────────
export async function getPracticals(req, res, next) {
  try {
    let query = {};
    if (req.user.role === 'teacher') {
      query.teacherId = req.user._id;
    }

    const practicals = await Practical.find(query)
      .populate('teacherId', 'fullName')
      .sort({ createdAt: -1 });

    // If student, we want to know their submission status
    let dataToReturn = [];
    if (req.user.role === 'student') {
      const submissions = await PracticalSubmission.find({ studentId: req.user._id });
      
      dataToReturn = practicals.map((p) => {
        const pObj = p.toObject();
        const submission = submissions.find(s => s.practicalId.toString() === p._id.toString());
        pObj.submissionStatus = submission ? submission.status : 'not_started';
        pObj.isCorrect = submission ? submission.isCorrect : false;
        return pObj;
      });
    } else {
      dataToReturn = practicals;
    }

    return res.status(200).json({
      success: true,
      data: dataToReturn
    });
  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/v1/practicals/:id 
// ─────────────────────────────────────────────────────────
export async function getPracticalById(req, res, next) {
  try {
    const practical = await Practical.findById(req.params.id)
       .populate('teacherId', 'fullName');

    if (!practical) {
      return res.status(404).json({ success: false, message: 'Practical not found' });
    }

    return res.status(200).json({
      success: true,
      data: practical
    });
  } catch(error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────────────────
// POST /api/v1/practicals/:id/submit
// Student submits code for evaluation
// ─────────────────────────────────────────────────────────
export async function submitPractical(req, res, next) {
  try {
    const { codeSubmitted, language, isFinalSubmit } = req.body;
    const practicalId = req.params.id;

    const practical = await Practical.findById(practicalId);
    if (!practical) {
      return res.status(404).json({ success: false, message: 'Practical not found' });
    }

    let actualOutput = '';
    let isCorrect = false;

    // MVP: Evaluate NodeJS code
    if (language === 'javascript' || !language) {
      const outputBuffer = [];
      const sandbox = {
        console: {
          log: (...args) => {
            outputBuffer.push(args.join(' '));
          }
        }
      };

      try {
        vm.createContext(sandbox);
        vm.runInContext(codeSubmitted, sandbox, { timeout: 1000 });
        actualOutput = outputBuffer.join('\n').trim();
      } catch (err) {
        actualOutput = `Error: ${err.message}`;
      }
    } else {
      actualOutput = `Execution for ${language} is arriving in a future update.`;
    }

    // Check string match with expected
    const expected = practical.expectedOutput ? practical.expectedOutput.trim() : '';
    console.log(`Expected: [${expected}], Actual: [${actualOutput}]`);
    if (actualOutput === expected && expected !== '') {
      isCorrect = true;
    }

    // Upsert submission
    const submission = await PracticalSubmission.findOneAndUpdate(
      { practicalId, studentId: req.user._id },
      {
        codeSubmitted,
        language,
        output: actualOutput,
        status: 'evaluated',
        isCorrect,
        isFinal: isFinalSubmit || false
      },
      { new: true, upsert: true }
    );

    // If final submit, trigger notification
    if (isFinalSubmit) {
      await Notification.create({
        recipientId: practical.teacherId,
        title: `Practical Submitted`,
        message: `${req.user.fullName} submitted a solution for "${practical.title}".`,
        type: 'submission',
        link: `/dashboard/practicals/${practical._id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: isCorrect ? 'Perfect! Output matches expected result.' : 'Output did not match expected result.',
      data: {
        output: actualOutput,
        isCorrect,
        submission
      }
    });

  } catch (error) {
    return next(error);
  }
}

// ─────────────────────────────────────────────────────────
// GET /api/v1/practicals/:id/submissions
// Teacher gets all submissions for a practical
// ─────────────────────────────────────────────────────────
export async function getSubmissionsForPractical(req, res, next) {
  try {
    const practicalId = req.params.id;

    const practical = await Practical.findById(practicalId);
    if (!practical) {
      return res.status(404).json({ success: false, message: 'Practical not found' });
    }

    if (practical.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view these submissions' });
    }

    const submissions = await PracticalSubmission.find({ practicalId, isFinal: true })
      .populate('studentId', 'fullName email')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    return next(error);
  }
}
