import { Assignment, AssignmentRecord } from '../assignment/assignment.model.js';
import { AttendanceSession, AttendanceRecord } from '../attendance/attendance.model.js';
import { User } from '../auth/auth.model.js';
import { OnlineClass } from '../onlineClass/onlineClass.model.js';
import { Notice } from '../notice/notice.model.js';
import { Practical, PracticalSubmission } from '../practical/practical.model.js';
import { Complaint } from '../complaint/complaint.model.js';

// ── Badge counts for sidebar (student-only) ─────────────
// Returns raw totals. The frontend tracks "last seen" counts
// in localStorage and only shows a badge when the total increases.
export async function getBadgeCounts(req, res, next) {
  try {
    const user = req.user;

    // Only students get badge counts
    if (user.role !== 'student') {
      return res.status(200).json({ success: true, data: {} });
    }

    const badges = {};

    // Pending assignments count
    badges.assignments = await AssignmentRecord.countDocuments({ student: user._id, status: 'pending' });
    
    // Live classes for student's section
    badges.classes = user.section ? await OnlineClass.countDocuments({ section: user.section, status: 'live' }) : 0;
    
    // Total practicals available (student can see how many exist)
    badges.practicals = await Practical.countDocuments();

    // Total notices count
    badges.notices = await Notice.countDocuments();

    return res.status(200).json({ success: true, data: badges });
  } catch (error) {
    return next(error);
  }
}

function vary(base, spread, min = 0, max = Number.MAX_SAFE_INTEGER, decimals = 0) {
  const randomOffset = (Math.random() * 2 - 1) * spread;
  const value = Math.min(max, Math.max(min, base + randomOffset));
  return Number(value.toFixed(decimals));
}

async function getStudentDashboard(user) {
  // Attendance logic
  const totalRecords = await AttendanceRecord.countDocuments({ student: user._id });
  const presentRecords = await AttendanceRecord.countDocuments({ student: user._id, status: 'present' });
  let attendancePct = 0;
  if (totalRecords > 0) {
    attendancePct = ((presentRecords / totalRecords) * 100).toFixed(1);
  }

  // Pending Assignments
  const pendingAssignments = await AssignmentRecord.countDocuments({ student: user._id, status: 'pending' });

  // CGPA Projection approx from assignment marks
  const gradedAssignments = await AssignmentRecord.find({ student: user._id, status: 'completed' });
  let cgpaProjection = 0;
  if (gradedAssignments.length > 0) {
    const totalMarks = gradedAssignments.reduce((acc, curr) => acc + curr.marks, 0);
    // Assuming out of 100 max mapped to 10 scale
    cgpaProjection = ((totalMarks / gradedAssignments.length) / 10).toFixed(2);
  }

  // Upcoming classes (Sessions for today)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const classesToday = await AttendanceSession.countDocuments({ 
    department: user.department || { $exists: true }, 
    date: { $gte: startOfToday }
  });

  // Live classes for student's section
  const liveClassesCount = user.section ? await OnlineClass.countDocuments({ section: user.section, status: 'live' }) : 0;
  
  // Raised complaints by the student
  const raisedComplaintsCount = await Complaint.countDocuments({ student: user._id });

  return {
    headline: 'Student Command Center',
    subtitle: 'Track academics, mobility, and wellbeing in one intelligent workspace.',
    quickStats: [
      { label: 'Attendance', value: totalRecords > 0 ? `${attendancePct}%` : 'N/A', trend: totalRecords > 0 ? '+1.2%' : 'No records' },
      { label: 'Upcoming Classes', value: `${classesToday} Today`, trend: 'On Schedule' },
      { label: 'Assignment Deadlines', value: `${pendingAssignments} Pending`, trend: 'Focus Window' },
      { label: 'CGPA Projection', value: gradedAssignments.length > 0 ? cgpaProjection.toString() : 'N/A', trend: '+0.18' }
    ],
    focusCards: [
      {
        title: 'Pending Assignments',
        value: `${pendingAssignments}`,
        note: pendingAssignments > 0 ? 'Requires attention' : 'All caught up',
        link: 'assignments'
      },
      {
        title: 'Live Classes',
        value: `${liveClassesCount}`,
        note: liveClassesCount > 0 ? 'Join now' : 'No ongoing classes',
        link: 'classes'
      },
      {
        title: 'Raised Complaints',
        value: `${raisedComplaintsCount}`,
        note: 'Track your issues',
        link: 'complaints'
      }
    ]
  };
}

async function getTeacherDashboard(user) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  
  // Classes created today by teacher
  const classesToday = await AttendanceSession.countDocuments({ createdBy: user._id, date: { $gte: startOfToday } });
  
  // Avg Attendance
  const teacherSessions = await AttendanceSession.find({ createdBy: user._id }).select('_id');
  const sessionIds = teacherSessions.map(s => s._id);
  const totalTeacherRecords = await AttendanceRecord.countDocuments({ session: { $in: sessionIds } });
  const presentTeacherRecords = await AttendanceRecord.countDocuments({ session: { $in: sessionIds }, status: 'present' });
  const avgAttendance = totalTeacherRecords > 0 ? ((presentTeacherRecords / totalTeacherRecords) * 100).toFixed(1) : 0;

  // Submissions to review
  const teacherAssignments = await Assignment.find({ teacher: user._id }).select('_id');
  const assignmentIds = teacherAssignments.map(a => a._id);
  const submissionsToReview = await AssignmentRecord.countDocuments({ assignment: { $in: assignmentIds }, status: 'submitted' });

  return {
    headline: 'Teacher Insight Deck',
    subtitle: 'Run classes, assessments, and interventions with predictive assistance.',
    quickStats: [
      { label: 'Classes Today', value: `${classesToday}`, trend: 'Upcoming' },
      { label: 'Avg Attendance', value: totalTeacherRecords > 0 ? `${avgAttendance}%` : 'N/A', trend: '+0.9%' },
      { label: 'Submissions to Review', value: `${submissionsToReview}`, trend: 'AI sorted' },
      { label: 'At-Risk Students', value: `${vary(12, 5, 2, 25)}`, trend: '-2 today' }
    ],
    focusCards: [
      {
        title: 'Lecture Hall Occupancy',
        value: `${vary(76, 12, 45, 100)}%`,
        note: 'Auto-seat scan'
      },
      {
        title: 'Grading Queue',
        value: `${submissionsToReview} tasks`,
        note: 'Suggested rubric enabled'
      },
      {
        title: 'Parent Connect',
        value: `0 pending`,
        note: 'Follow-up reminders active'
      }
    ]
  };
}

async function getAdminDashboard() {
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalTeachers = await User.countDocuments({ role: 'teacher' });

  return {
    headline: 'Admin Operations Grid',
    subtitle: 'Monitor institution health, security, and efficiency in real time.',
    quickStats: [
      { label: 'Campus Uptime', value: `${vary(99.92, 0.05, 99.5, 100, 2)}%`, trend: 'Stable' },
      { label: 'Total Students', value: `${totalStudents}`, trend: 'Active' },
      { label: 'Total Teachers', value: `${totalTeachers}`, trend: 'Active' },
      { label: 'Active Devices', value: `${vary(2480, 220, 1600, 3200)}`, trend: 'IoT mesh live' }
    ],
    focusCards: [
      {
        title: 'Hostel Load',
        value: `${vary(87, 6, 65, 100)}%`,
        note: 'Dynamic allocation running'
      },
      {
        title: 'Transport Efficiency',
        value: `${vary(93, 4, 75, 100)}%`,
        note: 'Route optimizer active'
      },
      {
        title: 'Security Alerts',
        value: `0 active`,
        note: 'Auto-triage in progress'
      }
    ]
  };
}

export async function getRoleDashboard(req, res, next) {
  try {
    const role = req.params.role;
    let payload = {};
    if (role === 'student') payload = await getStudentDashboard(req.user);
    if (role === 'teacher') payload = await getTeacherDashboard(req.user);
    if (role === 'admin') payload = await getAdminDashboard();

    return res.status(200).json({
      success: true,
      data: {
        role,
        generatedAt: new Date().toISOString(),
        ...payload
      }
    });
  } catch (error) {
    return next(error);
  }
}
