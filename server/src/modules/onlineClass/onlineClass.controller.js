import { OnlineClass } from './onlineClass.model.js';
import { getIO } from '../../utils/socket.js';

// GET: /api/v1/classes (Teachers get theirs, Students get active ones in their section)
export async function getLiveClasses(req, res, next) {
  try {
    const userRole = req.user.role;
    let classes = [];

    if (userRole === 'student') {
      classes = await OnlineClass.find({ 
        section: req.user.section, 
        status: 'live' 
      }).populate('teacherId', 'fullName');
    } else if (userRole === 'teacher') {
      // Teachers see all classes they created, sort by most recent
      classes = await OnlineClass.find({ teacherId: req.user._id })
        .populate('teacherId', 'fullName')
        .sort({ createdAt: -1 });
    } else {
      classes = await OnlineClass.find()
        .populate('teacherId', 'fullName')
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({ success: true, data: classes });
  } catch (error) {
    return next(error);
  }
}

// GET: /api/v1/classes/:id
export async function getClassById(req, res, next) {
  try {
    const classSession = await OnlineClass.findById(req.params.id).populate('teacherId', 'fullName');
    if (!classSession) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }
    return res.status(200).json({ success: true, data: classSession });
  } catch (error) {
    return next(error);
  }
}

// POST: /api/v1/classes
export async function createLiveClass(req, res, next) {
  try {
    const { title, subject, section } = req.body;
    
    // Automatically make it 'live' upon creation
    const newClass = await OnlineClass.create({
      title,
      subject,
      section,
      teacherId: req.user._id,
      status: 'live'
    });

    // Notify everyone on the listing page that a new class is live
    try {
      getIO().to('classes-lobby').emit('classes-updated');
    } catch (err) {
      console.error('Lobby broadcast failed:', err);
    }

    return res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    return next(error);
  }
}

// PUT: /api/v1/classes/:id/end
export async function endClass(req, res, next) {
  try {
    const classSession = await OnlineClass.findById(req.params.id);
    
    if (!classSession) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classSession.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to end this class' });
    }

    classSession.status = 'ended';
    classSession.endTime = Date.now();
    await classSession.save();

    // Globally emit to all connected students to boot them out
    // AND notify the classes listing lobby to refresh
    try {
      const io = getIO();
      io.to(classSession._id.toString()).emit('class-ended');
      io.to('classes-lobby').emit('classes-updated');
    } catch (err) {
      console.error('Socket emission failed:', err);
    }

    return res.status(200).json({ success: true, data: classSession });
  } catch (error) {
    return next(error);
  }
}

// DELETE: /api/v1/classes/:id
export async function deleteLiveClass(req, res, next) {
  try {
    const classSession = await OnlineClass.findById(req.params.id);
    
    if (!classSession) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    if (classSession.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this class' });
    }

    await classSession.deleteOne();

    // Notify the listing lobby so other teachers/admins see the deletion
    try {
      getIO().to('classes-lobby').emit('classes-updated');
    } catch (err) {
      console.error('Lobby broadcast failed:', err);
    }

    return res.status(200).json({ success: true, message: 'Class session successfully deleted' });
  } catch (error) {
    return next(error);
  }
}
