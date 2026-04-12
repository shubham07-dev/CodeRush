// ─────────────────────────────────────────────────────────
// Seed Knowledge Base for OmniCampus Copilot
// Run: node --experimental-specifier-resolution=node server/src/modules/copilot/seedKnowledge.js
// ─────────────────────────────────────────────────────────

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

import CopilotKnowledge from './CopilotKnowledge.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-campus-os';

const knowledgeEntries = [
  // ── Features ──
  {
    title: 'Smart Attendance System',
    content: 'OmniCampus uses an automated attendance system tied to your university identity. Students can view their real-time attendance percentages for each subject. Teachers can mark, edit, and export attendance records. The system prevents shortfalls by sending alerts when attendance drops below 75%.',
    category: 'features'
  },
  {
    title: 'Campus Navigator / GPS',
    content: 'The Campus Navigator is a 3D-mapped GPS module. It maps 34+ campus buildings including halls, libraries, canteens, and departments. Users can search for any location and get precise turn-by-turn routing. The map is accessible from the dashboard sidebar or the landing page.',
    category: 'navigation'
  },
  {
    title: 'Assignment Portal',
    content: 'The Assignment Portal lets teachers upload assignments as PDFs via Cloudinary. Students can download, complete, and re-upload their submissions. Deadlines are tracked, and late submissions are flagged automatically. Assignments are organized by subject.',
    category: 'features'
  },
  {
    title: 'Virtual Classrooms',
    content: 'Virtual Classrooms use WebRTC for peer-to-peer video calls. Teachers can start a live class, share their screen, and use a real-time whiteboard. Students can join from the dashboard and ask questions via live chat. The system supports up to 30 concurrent participants.',
    category: 'features'
  },
  {
    title: 'Practical Module',
    content: 'The Practical module allows teachers to schedule and manage lab practicals. Students can view upcoming practicals, submit lab reports, and track their practical attendance separately from theory classes.',
    category: 'features'
  },
  {
    title: 'Complaint System',
    content: 'Students and staff can file complaints through the Complaint module. Complaints are categorized (infrastructure, academic, hostel, etc.) and routed to the appropriate admin. Users can track the status of their complaints in real-time.',
    category: 'features'
  },
  {
    title: 'Notice Board',
    content: 'The Notice Board displays announcements from admins and teachers. Notices can be filtered by category (academic, event, exam, general). Important notices are pinned to the top. Students receive push notifications for new notices.',
    category: 'features'
  },

  // ── Navigation ──
  {
    title: 'How to access the Dashboard',
    content: 'After logging in, you are automatically redirected to the Dashboard. The dashboard shows your attendance summary, upcoming assignments, recent notices, and quick links to all modules. Use the sidebar to navigate between modules.',
    category: 'navigation'
  },
  {
    title: 'How to navigate the Campus Map',
    content: 'Click "Campus Map" in the navbar or sidebar. The interactive map loads with all buildings marked. Click any building to see its name and department. Use the search bar to find specific locations. The map supports zoom and pan gestures.',
    category: 'navigation'
  },

  // ── Academics ──
  {
    title: 'Checking Attendance',
    content: 'Go to Dashboard > Attendance from the sidebar. You will see a subject-wise breakdown of your attendance percentage. Subjects below 75% are highlighted in red. Teachers can mark attendance from their dashboard by selecting the subject, date, and student list.',
    category: 'academics'
  },
  {
    title: 'Submitting Assignments',
    content: 'Go to Dashboard > Assignments. Select the subject. Download the assignment PDF, complete it, then upload your submission as a PDF. The system tracks submission time and marks late submissions accordingly.',
    category: 'academics'
  },

  // ── FAQ ──
  {
    title: 'Who built OmniCampus?',
    content: 'OmniCampus was built by a team of four developers: Shashank Rai, Shashwat Mishra, Shubham Shukla, and YashDeep Gupta. It is a full-stack application using React, Node.js, MongoDB, Socket.io, and WebRTC.',
    category: 'faq'
  },
  {
    title: 'User Roles in OmniCampus',
    content: 'OmniCampus supports three roles: Student, Teacher, and Admin. Students can view attendance, submit assignments, and join classes. Teachers can manage courses, mark attendance, and start live classes. Admins can manage all users, post notices, and handle complaints.',
    category: 'faq'
  },
  {
    title: 'How to register',
    content: 'Click "Join OmniCampus" on the landing page. Fill in your name, email, password, and select your role (Student/Teacher/Admin). Optionally upload a profile picture. After registration, you can log in immediately.',
    category: 'faq'
  },
  {
    title: 'Forgot Password',
    content: 'Currently, password reset is handled by contacting the admin. A self-service password reset feature via email is planned for a future update.',
    category: 'faq'
  },

  // ── Rules ──
  {
    title: 'Attendance Policy',
    content: 'Students must maintain a minimum of 75% attendance in each subject to be eligible for exams. The system sends automatic alerts when attendance drops below this threshold. Attendance below 60% may result in being debarred from exams.',
    category: 'rules'
  },
  {
    title: 'Assignment Submission Rules',
    content: 'Assignments must be submitted before the deadline set by the teacher. Late submissions are accepted but flagged. Plagiarism is strictly prohibited and may result in academic penalties.',
    category: 'rules'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    await CopilotKnowledge.deleteMany({});
    console.log('Cleared existing knowledge');

    await CopilotKnowledge.insertMany(knowledgeEntries);
    console.log(`Seeded ${knowledgeEntries.length} knowledge entries`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
