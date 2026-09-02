import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager(io);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', roomsActive: gameManager.rooms.size });
});

app.get('*', (req, res, next) => {
  if (req.path === '/health') return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) next();
  });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Create Room
  socket.on('create-room', ({ playerName, avatar }) => {
    try {
      const roomCode = gameManager.createRoom(socket, playerName, avatar);
      console.log(`[Room] Created: ${roomCode} by ${playerName} (${socket.id})`);
    } catch (err) {
      console.error('[Error] create-room:', err);
      socket.emit('error-msg', 'Failed to create room.');
    }
  });

  // Join Room
  socket.on('join-room', ({ roomCode, playerName, avatar }) => {
    try {
      const result = gameManager.joinRoom(socket, roomCode, playerName, avatar);
      if (!result.success) {
        socket.emit('error-msg', result.error);
      } else {
        console.log(`[Room] Joined: ${roomCode} by ${playerName} (${socket.id})`);
      }
    } catch (err) {
      console.error('[Error] join-room:', err);
      socket.emit('error-msg', 'Failed to join room.');
    }
  });

  // Add Bot
  socket.on('add-bot', ({ roomCode }) => {
    gameManager.addBot(roomCode);
  });

  // Remove Bot
  socket.on('remove-bot', ({ roomCode, botId }) => {
    gameManager.removeBot(roomCode, botId);
  });

  // Update Settings
  socket.on('update-settings', ({ roomCode, totalRounds }) => {
    gameManager.updateSettings(roomCode, totalRounds);
  });

  // Start Game
  socket.on('start-game', ({ roomCode }) => {
    gameManager.startGame(roomCode);
  });

  // Submit Answer (Q1 or Q2)
  socket.on('submit-answer', ({ roomCode, questionKey, answer }) => {
    gameManager.submitAnswer(roomCode, socket.id, questionKey, answer);
  });

  // Update Drawing (Live sync)
  socket.on('update-drawing', ({ roomCode, drawingData }) => {
    gameManager.updateDrawing(roomCode, socket.id, drawingData);
  });

  // Submit Drawing
  socket.on('submit-drawing', ({ roomCode, drawingData }) => {
    gameManager.submitDrawing(roomCode, socket.id, drawingData);
  });

  // Cast Vote
  socket.on('cast-vote', ({ roomCode, targetPlayerId }) => {
    gameManager.castVote(roomCode, socket.id, targetPlayerId);
  });

  // Send Chat Message
  socket.on('send-chat', ({ roomCode, text }) => {
    gameManager.sendChatMessage(roomCode, socket.id, text);
  });

  // Play Again
  socket.on('play-again', ({ roomCode }) => {
    gameManager.playAgain(roomCode);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    gameManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(` Word Imposter Game Server running on port ${PORT}`);
  console.log(`=========================================`);
});
