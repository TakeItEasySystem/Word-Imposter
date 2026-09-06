import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameManager } from './gameManager.js';
import { checkGeminiStatus, generateWordTriplet } from './aiGenerator.js';
import { socketRateLimiter, validateRoomCode } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- HTTP SECURITY HEADERS (Helmet) ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:"],
      mediaSrc: ["'self'", "data:"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json({ limit: '200kb' })); // Protect against oversized body bombs

// --- HTTP RATE LIMITING ---
// Protects against DoS and prevents financial exhaustion on Google Cloud API pings
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a minute." }
});

app.use('/api/', apiRateLimiter);
app.use('/health', apiRateLimiter);

const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e6 // 1MB max buffer size per socket packet
});

const gameManager = new GameManager(io);

// Health check endpoint (Uses cached connection status to prevent live Google API calls on request)
app.get('/health', async (req, res) => {
  const gemini = await checkGeminiStatus(false);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    roomsActive: gameManager.rooms.size,
    geminiApi: gemini
  });
});

// Diagnostic check endpoint (Safe cached status, eliminates wallet-draining loops)
app.get('/api/check-ai', async (req, res) => {
  const gemini = await checkGeminiStatus(false);
  res.json(gemini);
});

// Live test AI generation with custom theme
app.get('/api/test-ai', async (req, res) => {
  const theme = (req.query.theme || 'Marvel Superheroes').toString();
  try {
    const triplet = await generateWordTriplet(theme);
    const gemini = await checkGeminiStatus(false);
    res.json({
      success: true,
      requestedTheme: theme,
      triplet,
      geminiStatus: gemini
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get('*', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// --- REAL-TIME WEBSOCKET GATEWAY & ANTI-HACKER PROTECTION ---
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Create Room (Rate limited to 5 rooms per minute per socket)
  socket.on('create-room', ({ playerName, avatar }) => {
    if (!socketRateLimiter.checkLimit(socket.id, 'create-room', 5, 60000)) {
      return socket.emit('error-msg', 'Room creation limit reached. Please wait a moment.');
    }

    try {
      const roomCode = gameManager.createRoom(socket, playerName, avatar);
      console.log(`[Room] Created: ${roomCode} by ${playerName} (${socket.id})`);
    } catch (err) {
      console.error('[Error] create-room:', err);
      socket.emit('error-msg', 'Failed to create room.');
    }
  });

  // Join Room (Rate limited to 15 attempts per minute to prevent room code brute-forcing)
  socket.on('join-room', ({ roomCode, playerName, avatar }) => {
    if (!socketRateLimiter.checkLimit(socket.id, 'join-room', 15, 60000)) {
      return socket.emit('error-msg', 'Too many join attempts. Please slow down.');
    }

    try {
      const validCode = validateRoomCode(roomCode);
      if (!validCode) {
        return socket.emit('error-msg', 'Invalid room code.');
      }

      const result = gameManager.joinRoom(socket, validCode, playerName, avatar);
      if (!result.success) {
        socket.emit('error-msg', result.error);
      } else {
        console.log(`[Room] Joined: ${validCode} by ${playerName} (${socket.id})`);
      }
    } catch (err) {
      console.error('[Error] join-room:', err);
      socket.emit('error-msg', 'Failed to join room.');
    }
  });

  // Reconnect Session (Restores a player who refreshed or returned from background)
  socket.on('reconnect-session', ({ roomCode, playerId, playerName }) => {
    try {
      const result = gameManager.reconnectPlayer(socket, roomCode, playerId, playerName);
      if (!result.success) {
        socket.emit('reconnect-failed', result.error);
      }
    } catch (err) {
      console.error('[Error] reconnect-session:', err);
      socket.emit('reconnect-failed', 'Failed to restore session.');
    }
  });

  // Add Bot (Host verified)
  socket.on('add-bot', ({ roomCode }) => {
    gameManager.addBot(roomCode, socket.id);
  });

  // Remove Bot (Host verified)
  socket.on('remove-bot', ({ roomCode, botId }) => {
    gameManager.removeBot(roomCode, botId, socket.id);
  });

  // Update Settings (Host verified)
  socket.on('update-settings', ({ roomCode, totalRounds }) => {
    gameManager.updateSettings(roomCode, totalRounds, socket.id);
  });

  // Update Theme (Host verified)
  socket.on('update-theme', ({ roomCode, theme }) => {
    gameManager.updateTheme(roomCode, theme, socket.id);
  });

  // Start Game (Host verified)
  socket.on('start-game', ({ roomCode, customTheme }) => {
    gameManager.startGame(roomCode, socket.id, customTheme);
  });

  // Submit Answer (Q1 or Q2)
  socket.on('submit-answer', ({ roomCode, questionKey, answer }) => {
    gameManager.submitAnswer(roomCode, socket.id, questionKey, answer);
  });

  // Update Drawing (Throttled to 30 updates/sec to prevent network flooding)
  socket.on('update-drawing', ({ roomCode, drawingData }) => {
    if (!socketRateLimiter.checkLimit(socket.id, 'drawing-stroke', 30, 1000)) {
      return; // Drop intermediate packet to prevent flood
    }
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

  // Send Chat Message (Throttled to 5 messages per 5 seconds)
  socket.on('send-chat', ({ roomCode, text }) => {
    if (!socketRateLimiter.checkLimit(socket.id, 'chat', 5, 5000)) {
      return socket.emit('error-msg', 'Chat rate limit reached. Please wait a second.');
    }
    gameManager.sendChatMessage(roomCode, socket.id, text);
  });

  // Player Ready
  socket.on('player-ready', ({ roomCode }) => {
    gameManager.playerReady(roomCode, socket.id);
  });

  // Next Round (Host verified)
  socket.on('next-round', ({ roomCode }) => {
    gameManager.nextRound(roomCode, socket.id);
  });

  // Play Again (Host verified)
  socket.on('play-again', ({ roomCode }) => {
    gameManager.playAgain(roomCode, socket.id);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    socketRateLimiter.cleanupSocket(socket.id);
    gameManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(` 🕵️‍♂️ Word Imposter Game Server running on port ${PORT}`);
  console.log(` 🛡️ Web Security, Anti-Hacker & Billing Guards: ACTIVE`);
  console.log(`=========================================`);
  
  // Verify Gemini API connectivity on boot once (cached for runtime)
  const gemini = await checkGeminiStatus(false);
  if (gemini.status === 'connected') {
    console.log(`[AI Engine] ✅ Gemini API connected & operational! Model: ${gemini.workingModel}`);
  } else if (!gemini.configured) {
    console.log(`[AI Engine] ℹ️ GEMINI_API_KEY not set. Offline curated 70+ category deck active.`);
  } else {
    console.warn(`[AI Engine] ⚠️ Gemini API key provided, but test ping returned: ${gemini.message}`);
  }
});
