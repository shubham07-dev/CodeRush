import { Server } from 'socket.io';

let io;

export function initSocket(httpServer, corsOptions) {
  io = new Server(httpServer, {
    cors: corsOptions
  });

  io.on('connection', (socket) => {
    console.log('Client connected to Socket.io:', socket.id);

    // Optional: Students can join a room matching their user ID or Year/Section
    socket.on('join_room', (room) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
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
