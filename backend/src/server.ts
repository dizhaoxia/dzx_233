import app from './app.js';
import { setupSocket } from './config/socket.js';
import { initTables } from './config/database.js';

const PORT = process.env.PORT || 3202;

const startServer = async () => {
  try {
    await initTables();

    const { io, httpServer } = setupSocket(app);
    
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.io is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
