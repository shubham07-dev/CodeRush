import { Server } from 'socket.io';

let io;

export function initSocket(httpServer, corsOptions) {
  io = new Server(httpServer, {
    cors: corsOptions
  });

  io.on('connection', (socket) => {
    // console.log('Client connected to Socket.io:', socket.id);

    // Optional: Students can join a room matching their user ID or Year/Section
    socket.on('join_room', (room) => {
      socket.join(room);
    });

    // 0. Classes Lobby — for real-time listing page updates
    socket.on('join-classes-lobby', () => {
      socket.join('classes-lobby');
    });

    // 1. Join Class Room
    socket.on('join-class', (classId, userRole, userId) => {
      socket.join(classId);
      socket.to(classId).emit('user-joined', socket.id, userRole, userId);
    });

    // 2. WebRTC Signaling: Offer
    socket.on('webrtc-offer', (payload) => {
      io.to(payload.target).emit('webrtc-offer', payload);
    });

    // 3. WebRTC Signaling: Answer
    socket.on('webrtc-answer', (payload) => {
      io.to(payload.target).emit('webrtc-answer', payload);
    });

    // 4. WebRTC Signaling: ICE Candidate
    socket.on('webrtc-ice-candidate', (payload) => {
      io.to(payload.target).emit('webrtc-ice-candidate', payload);
    });

    // 5. Chat Broadcast
    socket.on('chat-message', (payload) => {
      io.to(payload.classId).emit('chat-message', payload);
    });

    // 6. Whiteboard Drawing Sync
    socket.on('draw-stroke', (payload) => {
      socket.to(payload.classId).emit('draw-stroke', payload.strokeData);
    });
    
    // Draw Text Sync
    socket.on('draw-text', (payload) => {
      socket.to(payload.classId).emit('draw-text', payload.textElements);
    });

    // Clear Whiteboard
    socket.on('clear-whiteboard', (classId) => {
      socket.to(classId).emit('clear-whiteboard');
    });

    socket.on('disconnect', () => {
      // Broadcast to any rooms this socket was in
      socket.rooms.forEach(room => {
        socket.to(room).emit('user-disconnected', socket.id);
      });
      // console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}
