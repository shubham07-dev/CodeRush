function vary(base, spread, min = 0, max = Number.MAX_SAFE_INTEGER, decimals = 0) {
  const randomOffset = (Math.random() * 2 - 1) * spread;
  const value = Math.min(max, Math.max(min, base + randomOffset));
  return Number(value.toFixed(decimals));
}

function getStudentDashboard() {
  const attendance = vary(94.8, 2.4, 80, 100, 1);
  const cgpaProjection = vary(8.4, 0.5, 5, 10, 2);

  return {
    headline: 'Student Command Center',
    subtitle: 'Track academics, mobility, and wellbeing in one intelligent workspace.',
    quickStats: [
      { label: 'Attendance', value: `${attendance}%`, trend: '+1.2%' },
      { label: 'Upcoming Classes', value: `${vary(5, 2, 1, 10)} Today`, trend: 'On Schedule' },
      { label: 'Assignment Deadlines', value: `${vary(3, 2, 0, 8)} Pending`, trend: 'Focus Window' },
      { label: 'CGPA Projection', value: cgpaProjection.toString(), trend: '+0.18' }
    ],
    focusCards: [
      {
        title: 'Bus ETA',
        value: `${vary(12, 6, 3, 30)} min`,
        note: 'Gate A shuttle synced'
      },
      {
        title: 'Library Seats',
        value: `${vary(128, 40, 20, 280)} free`,
        note: 'Real-time occupancy'
      },
      {
        title: 'Mentor Alerts',
        value: `${vary(2, 1, 0, 5)} unread`,
        note: 'New guidance updates'
      }
    ]
  };
}

function getTeacherDashboard() {
  return {
    headline: 'Teacher Insight Deck',
    subtitle: 'Run classes, assessments, and interventions with predictive assistance.',
    quickStats: [
      { label: 'Classes Today', value: `${vary(4, 2, 1, 8)}`, trend: '2 upcoming' },
      { label: 'Avg Attendance', value: `${vary(89.3, 3.5, 70, 100, 1)}%`, trend: '+0.9%' },
      { label: 'Submissions to Review', value: `${vary(37, 12, 10, 70)}`, trend: 'AI sorted' },
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
        value: `${vary(22, 9, 5, 45)} tasks`,
        note: 'Suggested rubric enabled'
      },
      {
        title: 'Parent Connect',
        value: `${vary(7, 3, 1, 14)} pending`,
        note: 'Follow-up reminders active'
      }
    ]
  };
}

function getAdminDashboard() {
  return {
    headline: 'Admin Operations Grid',
    subtitle: 'Monitor institution health, security, and efficiency in real time.',
    quickStats: [
      { label: 'Campus Uptime', value: `${vary(99.92, 0.05, 99.5, 100, 2)}%`, trend: 'Stable' },
      { label: 'Energy Savings', value: `${vary(21.4, 2, 8, 35, 1)}%`, trend: '+2.1%' },
      { label: 'Incidents Open', value: `${vary(9, 4, 1, 20)}`, trend: '-1 from yesterday' },
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
        value: `${vary(4, 3, 0, 12)} active`,
        note: 'Auto-triage in progress'
      }
    ]
  };
}

export async function getRoleDashboard(req, res) {
  const role = req.params.role;

  const factory = {
    student: getStudentDashboard,
    teacher: getTeacherDashboard,
    admin: getAdminDashboard
  };

  const payloadBuilder = factory[role];

  return res.status(200).json({
    success: true,
    data: {
      role,
      generatedAt: new Date().toISOString(),
      ...payloadBuilder()
    }
  });
}
