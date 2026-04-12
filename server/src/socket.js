import { Server } from 'socket.io';

let ioInstance;

export function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // For dev mode standard policy
      methods: ["GET", "POST"]
    }
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log('A user connected:', socket.id);

    // 0. Classes Lobby — for real-time listing updates
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
      // payload: { target: socketId, caller: socketId, offer: RTCSessionDescription }
      io.to(payload.target).emit('webrtc-offer', payload);
    });

    // 3. WebRTC Signaling: Answer
    socket.on('webrtc-answer', (payload) => {
      // payload: { target: socketId, caller: socketId, answer: RTCSessionDescription }
      io.to(payload.target).emit('webrtc-answer', payload);
    });

    // 4. WebRTC Signaling: ICE Candidate
    socket.on('webrtc-ice-candidate', (payload) => {
      // payload: { target: socketId, candidate: RTCIceCandidate }
      io.to(payload.target).emit('webrtc-ice-candidate', payload);
    });

    // 5. Chat Broadcast
    socket.on('chat-message', (payload) => {
      // payload: { classId, user: { name, role }, text, time }
      io.to(payload.classId).emit('chat-message', payload);
    });

    // 6. Whiteboard Drawing Sync
    socket.on('draw-stroke', (payload) => {
      // payload: { classId, strokeData }
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

    // Handled Disconnections
    socket.on('disconnect', () => {
      // Broadcast to any rooms this socket was in
      socket.rooms.forEach(room => {
        socket.to(room).emit('user-disconnected', socket.id);
      });
      // console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

export function getIo() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized!");
  }
  return ioInstance;
}
