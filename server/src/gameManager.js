import { getRandomWordSet } from './wordBank.js';
import { generateWordTriplet } from './aiGenerator.js';
import { sanitizeText, validateDrawingData, verifyHost, validateRoomCode } from './security.js';

// Pre-built bot doodle drawings (vector canvas data / sample sketches) so bots can draw
const BOT_DOODLES = [
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23ffffff'/><circle cx='200' cy='150' r='60' stroke='%233b82f6' stroke-width='8' fill='none'/><path d='M170 140 Q200 180 230 140' stroke='%23ef4444' stroke-width='6' fill='none'/><circle cx='180' cy='120' r='6' fill='%2310b981'/><circle cx='220' cy='120' r='6' fill='%2310b981'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23ffffff'/><polygon points='200,60 270,220 130,220' stroke='%23f59e0b' stroke-width='7' fill='none'/><line x1='130' y1='170' x2='270' y2='170' stroke='%238b5cf6' stroke-width='6'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23ffffff'/><rect x='120' y='90' width='160' height='120' rx='15' stroke='%2310b981' stroke-width='7' fill='none'/><circle cx='160' cy='150' r='20' stroke='%233b82f6' stroke-width='5' fill='none'/><circle cx='240' cy='150' r='20' stroke='%233b82f6' stroke-width='5' fill='none'/></svg>",
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='100%' height='100%' fill='%23ffffff'/><path d='M100 200 C150 100 250 100 300 200 Z' stroke='%23ec4899' stroke-width='8' fill='none'/><line x1='200' y1='100' x2='200' y2='60' stroke='%23f59e0b' stroke-width='6'/></svg>"
];

const BOT_NAMES = ["Neo", "PixelBot", "Cosmo", "Ruby", "Shadow", "Gizmo", "Blaze", "Luna"];
const AVATARS = ["🦊", "🐼", "🤖", "🚀", "🐯", "🦄", "🐙", "🐸", "🦉", "🦁", "🐲", "🐨"];

export class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomCode -> roomData

    // Automated Stale Room Garbage Collector (Runs every 10 minutes)
    this.gcInterval = setInterval(() => this.cleanupStaleRooms(), 10 * 60 * 1000);
  }

  cleanupStaleRooms() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      const humanPlayers = room.players.filter(p => !p.isBot);
      const isAbandoned = humanPlayers.length === 0;
      const isExpired = (now - (room.lastActivity || room.createdAt || now)) > 2 * 60 * 60 * 1000; // 2 hours idle

      if (isAbandoned || isExpired) {
        console.log(`[GarbageCollector] 🧹 Cleaning up stale room ${code} (abandoned: ${isAbandoned}, expired: ${isExpired})`);
        this.clearRoomTimer(room);
        this.rooms.delete(code);
      }
    }
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  createRoom(socket, playerName, avatar = "🦊") {
    const roomCode = this.generateRoomCode();
    const safeName = sanitizeText(playerName, 20) || `Player 1`;
    const safeAvatar = AVATARS.includes(avatar) ? avatar : "🦊";

    const player = {
      id: socket.id,
      name: safeName,
      avatar: safeAvatar,
      score: 0,
      isHost: true,
      isBot: false,
      role: null,
      assignedWord: null,
      answers: { q1: '', q2: '' },
      drawing: '',
      isDrawingSubmitted: false,
      vote: null,
      ready: false
    };

    const room = {
      code: roomCode,
      hostId: socket.id,
      state: 'LOBBY', // LOBBY, WORD_REVEAL, QUESTION_1, QUESTION_2, DRAWING, VOTING, RESULTS, GAME_OVER
      currentRound: 0,
      totalRounds: 3,
      theme: 'Random Mix',
      players: [player],
      messages: [],
      roundData: null,
      drawingsRevealed: false,
      drawingElapsed: 0,
      timerSeconds: 0,
      timerInterval: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      lastRoundStartTime: 0
    };

    this.rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.roomCode = roomCode;

    this.emitRoomState(roomCode);
    return roomCode;
  }

  joinRoom(socket, roomCode, playerName, avatar = "🐼") {
    const code = validateRoomCode(roomCode);
    if (!code) {
      return { success: false, error: "Invalid room code format!" };
    }

    const room = this.rooms.get(code);
    if (!room) {
      return { success: false, error: "Room not found!" };
    }

    if (room.state !== 'LOBBY') {
      return { success: false, error: "Game already in progress!" };
    }

    if (room.players.length >= 8) {
      return { success: false, error: "Room is full (max 8 players)!" };
    }

    const safeName = sanitizeText(playerName, 20) || `Player ${room.players.length + 1}`;
    const safeAvatar = AVATARS.includes(avatar) ? avatar : AVATARS[room.players.length % AVATARS.length];

    const player = {
      id: socket.id,
      name: safeName,
      avatar: safeAvatar,
      score: 0,
      isHost: false,
      isBot: false,
      role: null,
      assignedWord: null,
      answers: { q1: '', q2: '' },
      drawing: '',
      isDrawingSubmitted: false,
      vote: null,
      ready: false
    };

    room.players.push(player);
    room.lastActivity = Date.now();
    socket.join(code);
    socket.roomCode = code;

    this.emitRoomState(code);
    return { success: true, roomCode: code };
  }

  addBot(roomCode, callerSocketId = null) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'LOBBY' || room.players.length >= 8) return;
    if (callerSocketId && !verifyHost(room, callerSocketId)) {
      console.warn(`[Security] Unauthorized add-bot attempt by ${callerSocketId} in room ${roomCode}`);
      return;
    }

    const availableNames = BOT_NAMES.filter(n => !room.players.some(p => p.name === n));
    const botName = availableNames[Math.floor(Math.random() * availableNames.length)] || `Bot_${room.players.length + 1}`;
    const botAvatar = AVATARS[room.players.length % AVATARS.length];

    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const botPlayer = {
      id: botId,
      name: `🤖 ${botName}`,
      avatar: botAvatar,
      score: 0,
      isHost: false,
      isBot: true,
      role: null,
      assignedWord: null,
      answers: { q1: '', q2: '' },
      drawing: '',
      isDrawingSubmitted: false,
      vote: null,
      ready: true
    };

    room.players.push(botPlayer);
    room.lastActivity = Date.now();
    this.emitRoomState(roomCode);
  }

  removeBot(roomCode, botId, callerSocketId = null) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'LOBBY') return;
    if (callerSocketId && !verifyHost(room, callerSocketId)) {
      console.warn(`[Security] Unauthorized remove-bot attempt by ${callerSocketId} in room ${roomCode}`);
      return;
    }

    room.players = room.players.filter(p => p.id !== botId);
    room.lastActivity = Date.now();
    this.emitRoomState(roomCode);
  }

  handleDisconnect(socket) {
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === socket.id);
    if (playerIndex !== -1) {
      const isHost = room.players[playerIndex].isHost;
      room.players.splice(playerIndex, 1);

      if (room.players.length === 0 || room.players.every(p => p.isBot)) {
        this.clearRoomTimer(room);
        this.rooms.delete(roomCode);
        return;
      }

      if (isHost && room.players.length > 0) {
        // Assign new host to the first human player
        const firstHuman = room.players.find(p => !p.isBot) || room.players[0];
        firstHuman.isHost = true;
        room.hostId = firstHuman.id;
      }

      room.lastActivity = Date.now();
      this.emitRoomState(roomCode);
    }
  }

  updateSettings(roomCode, totalRounds, callerSocketId = null) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'LOBBY') return;
    if (callerSocketId && !verifyHost(room, callerSocketId)) {
      console.warn(`[Security] Unauthorized update-settings attempt by ${callerSocketId} in room ${roomCode}`);
      return;
    }

    room.totalRounds = Math.max(1, Math.min(10, parseInt(totalRounds) || 3));
    room.lastActivity = Date.now();
    this.emitRoomState(roomCode);
  }

  updateTheme(roomCode, theme, callerSocketId = null) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'LOBBY') return;
    if (callerSocketId && !verifyHost(room, callerSocketId)) {
      console.warn(`[Security] Unauthorized update-theme attempt by ${callerSocketId} in room ${roomCode}`);
      return;
    }

    room.theme = sanitizeText(theme, 60) || 'Random Mix';
    room.lastActivity = Date.now();
    this.emitRoomState(roomCode);
  }

  startGame(roomCode, callerSocketId = null) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    if (callerSocketId && !verifyHost(room, callerSocketId)) {
      console.warn(`[Security] Unauthorized start-game attempt by ${callerSocketId} in room ${roomCode}`);
      return;
    }

    if (room.players.length < 3) {
      this.io.to(roomCode).emit('error-msg', "At least 3 players required to start!");
      return;
    }

    // Cooldown check between starting rounds (prevent spam)
    const now = Date.now();
    if (now - (room.lastRoundStartTime || 0) < 5000) {
      return;
    }
    room.lastRoundStartTime = now;
    room.lastActivity = now;

    room.currentRound = 1;
    this.startRound(room);
  }

  async startRound(room) {
    const wordSet = await generateWordTriplet(room.theme);
    const shuffledWords = [...wordSet.words].sort(() => 0.5 - Math.random());
    
    // Pick Common word (3 players) and Imposter word (1 player)
    const commonWord = shuffledWords[0];
    const imposterWord = shuffledWords[1];
    const unassignedWord = shuffledWords[2];

    // Pick 1 random player as Imposter
    const imposterIndex = Math.floor(Math.random() * room.players.length);
    const imposterPlayer = room.players[imposterIndex];

    room.players.forEach((p, idx) => {
      p.answers = { q1: '', q2: '' };
      p.drawing = '';
      p.isDrawingSubmitted = false;
      p.vote = null;
      p.ready = false;
      if (idx === imposterIndex) {
        p.role = 'IMPOSTER';
        p.assignedWord = imposterWord;
      } else {
        p.role = 'CIVILIAN';
        p.assignedWord = commonWord;
      }
    });

    room.roundData = {
      category: wordSet.category,
      candidateWords: shuffledWords, // 3 visible words to EVERYONE
      commonWord: commonWord,
      imposterWord: imposterWord,
      unassignedWord: unassignedWord,
      imposterId: imposterPlayer.id,
      imposterName: imposterPlayer.name,
      questions: wordSet.questions,
      votes: {},
      roundScores: {},
      imposterCaught: false,
      imposterGuessBonus: false,
      history: []
    };

    room.state = 'WORD_REVEAL';
    this.emitRoomState(room.code);

    // Bots auto-ready
    room.players.filter(p => p.isBot).forEach(bot => {
      setTimeout(() => {
        this.playerReady(room.code, bot.id);
      }, 1500);
    });
  }

  playerReady(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'WORD_REVEAL') return;
    const player = room.players.find(p => p.id === socketId);
    if (!player) return;

    player.ready = true;
    this.emitRoomState(roomCode);

    if (room.players.every(p => p.ready)) {
      this.clearRoomTimer(room);
      this.startQuestion1(room);
    }
  }

  startQuestion1(room) {
    room.state = 'QUESTION_1';
    this.emitRoomState(room.code);

    // Handle bot submissions
    this.scheduleBotAnswers(room, 'q1', 2000, 5000);
  }

  submitAnswer(roomCode, socketId, questionKey, answer) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Verify valid questionKey and phase
    if (questionKey === 'q1' && room.state !== 'QUESTION_1') return;
    if (questionKey === 'q2' && room.state !== 'QUESTION_2') return;

    const player = room.players.find(p => p.id === socketId);
    if (!player) return;

    // Lock answer: cannot re-submit or tamper with already answered question
    if (player.answers[questionKey]) return;

    const safeAnswer = sanitizeText(answer, 150) || "(No answer submitted)";
    player.answers[questionKey] = safeAnswer;
    room.lastActivity = Date.now();
    this.emitRoomState(roomCode);

    // If all submitted for Q1, advance early
    if (room.state === 'QUESTION_1' && room.players.every(p => p.answers.q1)) {
      this.clearRoomTimer(room);
      this.startQuestion2(room);
    }
    // If all submitted for Q2, advance early
    else if (room.state === 'QUESTION_2' && room.players.every(p => p.answers.q2)) {
      this.clearRoomTimer(room);
      this.startDrawingPhase(room);
    }
  }

  startQuestion2(room) {
    room.state = 'QUESTION_2';
    this.emitRoomState(room.code);

    // Schedule bot submissions
    this.scheduleBotAnswers(room, 'q2', 2000, 5000);
  }

  startDrawingPhase(room) {
    room.state = 'DRAWING';
    room.drawingsRevealed = false;
    room.drawingElapsed = 0;
    this.emitRoomState(room.code);

    // Schedule bot drawings to complete within 2-4 seconds
    this.scheduleBotDrawings(room);
  }

  updateDrawing(roomCode, socketId, drawingData) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'DRAWING') return;
    const player = room.players.find(p => p.id === socketId);
    if (!player) return;

    // Validate drawing payload under 100KB without XSS/script injection
    const safeData = validateDrawingData(drawingData);
    player.drawing = safeData;
    // NOTE: During DRAWING, drawings are private to the player.
    // Do NOT broadcast emitRoomState on every stroke to prevent CPU/bandwidth saturation!
  }

  submitDrawing(roomCode, socketId, drawingData) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'DRAWING') return;
    const player = room.players.find(p => p.id === socketId);
    if (!player) return;
    if (player.isDrawingSubmitted) return; // Prevent double submission

    const safeData = validateDrawingData(drawingData);
    player.drawing = safeData || player.drawing || '';
    player.isDrawingSubmitted = true;
    room.lastActivity = Date.now();
    this.emitRoomState(roomCode);

    if (room.state === 'DRAWING' && room.players.every(p => p.isDrawingSubmitted)) {
      this.clearRoomTimer(room);
      this.startVotingPhase(room);
    }
  }

  startVotingPhase(room) {
    // Ensure all players have drawing fallback
    room.players.forEach((p, idx) => {
      if (!p.drawing) {
        p.drawing = BOT_DOODLES[idx % BOT_DOODLES.length];
      }
    });

    room.state = 'VOTING';
    this.emitRoomState(room.code);

    // Schedule bot chat banter during voting
    room.players.filter(p => p.isBot).forEach((bot, i) => {
      this.scheduleBotChat(room.code, bot.id, (i + 1) * 3500, 'voting');
    });

    // Schedule bot votes
    this.scheduleBotVotes(room);
  }

  castVote(roomCode, voterSocketId, targetPlayerId) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'VOTING') return;

    const voter = room.players.find(p => p.id === voterSocketId);
    if (!voter) return;

    // Vote locking: cannot vote multiple times
    if (voter.vote) return;

    // Cannot vote for self
    if (voterSocketId === targetPlayerId) return;

    // Target must exist in room
    const target = room.players.find(p => p.id === targetPlayerId);
    if (!target) return;

    voter.vote = targetPlayerId;
    room.lastActivity = Date.now();
    this.emitRoomState(roomCode);

    // If all players voted, resolve early
    if (room.players.every(p => p.vote)) {
      this.clearRoomTimer(room);
      this.resolveVotes(room);
    }
  }

  resolveVotes(room) {
    const imposterId = room.roundData.imposterId;
    const imposter = room.players.find(p => p.id === imposterId);
    const civilians = room.players.filter(p => p.role === 'CIVILIAN');
    const numCivilians = civilians.length;
    const totalBountyPool = numCivilians * 100; // e.g., 300 pts in a 4-player game

    // Tally votes from Civilians only (Imposter's vote does not count towards deciding the verdict)
    const civilianVoteCounts = {};
    room.players.forEach(p => {
      civilianVoteCounts[p.id] = 0;
    });

    civilians.forEach(c => {
      if (c.vote && civilianVoteCounts[c.vote] !== undefined) {
        civilianVoteCounts[c.vote]++;
      }
    });

    // Also track total raw votes for UI display
    const totalVoteCounts = { ...civilianVoteCounts };
    if (imposter && imposter.vote && totalVoteCounts[imposter.vote] !== undefined) {
      totalVoteCounts[imposter.vote]++;
    }

    // Determine highest voted suspect among Civilians' votes
    let maxCivilianVotes = 0;
    let mostVotedPlayers = [];
    for (const [playerId, count] of Object.entries(civilianVoteCounts)) {
      if (count > maxCivilianVotes) {
        maxCivilianVotes = count;
        mostVotedPlayers = [playerId];
      } else if (count === maxCivilianVotes && count > 0) {
        mostVotedPlayers.push(playerId);
      }
    }

    // Imposter is caught ONLY if Civilians cast the unique majority/highest votes for the Imposter
    const imposterCaught = mostVotedPlayers.length === 1 && mostVotedPlayers[0] === imposterId && maxCivilianVotes > 0;
    room.roundData.imposterCaught = imposterCaught;
    room.roundData.voteCounts = totalVoteCounts;
    room.roundData.civilianVoteCounts = civilianVoteCounts;

    // Distribute points:
    // 1. If Imposter is caught: Each civilian who correctly voted for Imposter receives +100 pts. Imposter gets 0.
    // 2. If Imposter is NOT caught: Civilians get 0 pts. ALL bounty points (numCivilians * 100) go to the Imposter!
    const roundScores = {};
    room.players.forEach(p => {
      roundScores[p.id] = 0;
    });

    if (imposterCaught) {
      civilians.forEach(c => {
        if (c.vote === imposterId) {
          roundScores[c.id] = 100;
        } else {
          roundScores[c.id] = 0;
        }
      });
      if (imposter) {
        roundScores[imposter.id] = 0;
      }
    } else {
      // Imposter escaped or no one caught them - Imposter sweeps ALL points!
      civilians.forEach(c => {
        roundScores[c.id] = 0;
      });
      if (imposter) {
        roundScores[imposter.id] = totalBountyPool;
      }
    }

    // Add to cumulative scores
    room.players.forEach(p => {
      p.score += (roundScores[p.id] || 0);
    });

    room.roundData.roundScores = roundScores;
    room.roundData.totalBountyPool = totalBountyPool;
    room.state = 'RESULTS';
    this.emitRoomState(room.code);
  }

  nextRound(roomCode, callerSocketId = null) {
    const room = this.rooms.get(roomCode);
    if (!room || room.state !== 'RESULTS') return;
    if (callerSocketId && !verifyHost(room, callerSocketId)) {
      console.warn(`[Security] Unauthorized next-round attempt by ${callerSocketId} in room ${roomCode}`);
      return;
    }

    room.lastActivity = Date.now();

    if (room.currentRound < room.totalRounds) {
      room.currentRound++;
      this.startRound(room);
    } else {
      room.state = 'GAME_OVER';
      this.emitRoomState(room.code);
    }
  }

  sendChatMessage(roomCode, socketId, text) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socketId);
    if (!player) return;

    // Sanitize chat message: strip HTML tags, control chars, cap at 150 chars
    const sanitized = sanitizeText(text, 150);
    if (!sanitized) return;

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: player.id,
      senderName: player.name,
      avatar: player.avatar,
      isBot: player.isBot,
      text: sanitized,
      timestamp: Date.now()
    };

    room.messages.push(message);
    if (room.messages.length > 80) {
      room.messages.shift();
    }
    room.lastActivity = Date.now();
    this.io.to(roomCode).emit('new-chat-message', message);
  }

  sendSystemMessage(roomCode, text) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const message = {
      id: `sys_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: 'system',
      senderName: 'Game Master',
      avatar: '📢',
      isSystem: true,
      text: text,
      timestamp: Date.now()
    };

    room.messages.push(message);
    this.io.to(roomCode).emit('new-chat-message', message);
  }

  scheduleBotChat(roomCode, botId, delay = 2000, context = 'voting') {
    setTimeout(() => {
      const room = this.rooms.get(roomCode);
      if (!room) return;
      const bot = room.players.find(p => p.id === botId);
      if (!bot) return;

      const chatter = {
        lobby: ["Ready when you are!", "Let's find the imposter!", "GL everyone! 🎉", "Who's ready to play?"],
        voting: [
          "Wait, look at drawing #2...",
          "I'm innocent, don't vote me! 😱",
          "That answer was super sus 👀",
          "I think I know who the imposter is!",
          "Check the 3 candidate words carefully!",
          "No way that drawing matches the word lol 😂"
        ]
      };

      const lines = chatter[context] || chatter.voting;
      const text = lines[Math.floor(Math.random() * lines.length)];
      this.sendChatMessage(roomCode, botId, text);
    }, delay);
  }

  playAgain(roomCode, callerSocketId = null) {
    const room = this.rooms.get(roomCode);
    if (!room) return;
    if (callerSocketId && !verifyHost(room, callerSocketId)) {
      console.warn(`[Security] Unauthorized play-again attempt by ${callerSocketId} in room ${roomCode}`);
      return;
    }

    room.state = 'LOBBY';
    room.currentRound = 0;
    room.roundData = null;
    room.lastActivity = Date.now();
    room.players.forEach(p => {
      p.score = 0;
      p.role = null;
      p.assignedWord = null;
      p.answers = { q1: '', q2: '' };
      p.drawing = '';
      p.vote = null;
    });

    this.clearRoomTimer(room);
    this.emitRoomState(roomCode);
  }

  // --- BOT SIMULATION HELPERS ---
  scheduleBotAnswers(room, questionKey, minDelay = 2000, maxDelay = 6000) {
    room.players.filter(p => p.isBot).forEach(bot => {
      const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
      setTimeout(() => {
        // Only submit if room is still in the same state
        if (!this.rooms.has(room.code)) return;
        const currentRoom = this.rooms.get(room.code);
        if (
          (questionKey === 'q1' && currentRoom.state === 'QUESTION_1') ||
          (questionKey === 'q2' && currentRoom.state === 'QUESTION_2')
        ) {
          const generatedAnswer = this.generateBotAnswer(bot.assignedWord, questionKey, currentRoom.roundData.questions);
          this.submitAnswer(room.code, bot.id, questionKey, generatedAnswer);
        }
      }, delay);
    });
  }

  scheduleBotDrawings(room) {
    room.players.filter(p => p.isBot).forEach((bot, idx) => {
      const delay = Math.floor(Math.random() * 2500) + 1500; // Complete within 1.5 - 4 seconds
      setTimeout(() => {
        if (!this.rooms.has(room.code)) return;
        const currentRoom = this.rooms.get(room.code);
        if (currentRoom.state === 'DRAWING') {
          const doodle = BOT_DOODLES[idx % BOT_DOODLES.length];
          this.submitDrawing(room.code, bot.id, doodle);
        }
      }, delay);
    });
  }

  scheduleBotVotes(room) {
    room.players.filter(p => p.isBot).forEach(bot => {
      const delay = Math.floor(Math.random() * 5000) + 3000;
      setTimeout(() => {
        if (!this.rooms.has(room.code)) return;
        const currentRoom = this.rooms.get(room.code);
        if (currentRoom.state === 'VOTING') {
          // Vote for another random player
          const eligibleTargets = currentRoom.players.filter(p => p.id !== bot.id);
          if (eligibleTargets.length > 0) {
            // High chance to pick imposter if bot is civilian, or innocent if bot is imposter
            let target;
            if (bot.role === 'IMPOSTER') {
              const innocents = eligibleTargets.filter(p => p.role === 'CIVILIAN');
              target = innocents[Math.floor(Math.random() * innocents.length)];
            } else {
              // 60% chance to guess smartly, 40% random
              const imposter = eligibleTargets.find(p => p.role === 'IMPOSTER');
              if (imposter && Math.random() < 0.6) {
                target = imposter;
              } else {
                target = eligibleTargets[Math.floor(Math.random() * eligibleTargets.length)];
              }
            }
            this.castVote(room.code, bot.id, target.id);
          }
        }
      }, delay);
    });
  }

  generateBotAnswer(word, questionKey, questions) {
    const templates = [
      `Definitely reminds me of something related to ${word.toLowerCase()}.`,
      `Usually found in places where you would expect it.`,
      `Has a very distinct vibe and feeling.`,
      `People love this during special moments!`,
      `Quite common, but tricky if not careful.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // --- TIMER UTILITIES ---
  startTimer(room, duration, callback, onTick = null) {
    this.clearRoomTimer(room);
    room.timerSeconds = duration;

    this.io.to(room.code).emit('timer-update', {
      secondsLeft: room.timerSeconds,
      phase: room.state
    });

    room.timerInterval = setInterval(() => {
      room.timerSeconds--;
      this.io.to(room.code).emit('timer-update', {
        secondsLeft: room.timerSeconds,
        phase: room.state
      });

      if (onTick) {
        onTick(room.timerSeconds);
      }

      if (room.timerSeconds <= 0) {
        this.clearRoomTimer(room);
        callback();
      }
    }, 1000);
  }

  clearRoomTimer(room) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
  }

  // --- CLIENT BROADCAST SANITIZATION ---
  // Ensure secret roles & words are only sent to the respective player, while 3 candidate words are visible to everyone!
  emitRoomState(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players.forEach(player => {
      const sanitizedPlayers = room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        isHost: p.isHost,
        isBot: p.isBot,
        hasAnsweredQ1: !!p.answers.q1,
        hasAnsweredQ2: !!p.answers.q2,
        hasSubmittedDrawing: !!p.isDrawingSubmitted,
        hasVoted: !!p.vote,
        // In VOTING or RESULTS, reveal all drawings. In DRAWING, keep drawings secret/private to each player.
        answers: ['VOTING', 'RESULTS', 'GAME_OVER'].includes(room.state) ? p.answers : (p.id === player.id ? p.answers : null),
        drawing: ['VOTING', 'RESULTS', 'GAME_OVER'].includes(room.state) ? p.drawing : (p.id === player.id ? p.drawing : null),
        vote: ['RESULTS', 'GAME_OVER'].includes(room.state) ? p.vote : null,
        role: ['RESULTS', 'GAME_OVER'].includes(room.state) ? p.role : (p.id === player.id ? p.role : null),
        assignedWord: ['RESULTS', 'GAME_OVER'].includes(room.state) ? p.assignedWord : (p.id === player.id ? p.assignedWord : null)
      }));

      const clientState = {
        code: room.code,
        hostId: room.hostId,
        state: room.state,
        currentRound: room.currentRound,
        totalRounds: room.totalRounds,
        theme: room.theme || 'Random Mix',
        timerSeconds: room.timerSeconds,
        drawingsRevealed: !!room.drawingsRevealed,
        messages: room.messages || [],
        myPlayerId: player.id,
        myRole: ['RESULTS', 'GAME_OVER'].includes(room.state) ? player.role : null,
        myWord: player.assignedWord,
        players: sanitizedPlayers,
        roundData: room.roundData ? {
          category: room.roundData.category,
          candidateWords: room.roundData.candidateWords, // 3 visible words to EVERYONE
          questions: room.roundData.questions,
          // Only show imposter identity and common words during results / game over
          commonWord: ['RESULTS', 'GAME_OVER'].includes(room.state) ? room.roundData.commonWord : null,
          imposterWord: ['RESULTS', 'GAME_OVER'].includes(room.state) ? room.roundData.imposterWord : null,
          unassignedWord: ['RESULTS', 'GAME_OVER'].includes(room.state) ? room.roundData.unassignedWord : null,
          imposterId: ['RESULTS', 'GAME_OVER'].includes(room.state) ? room.roundData.imposterId : null,
          imposterName: ['RESULTS', 'GAME_OVER'].includes(room.state) ? room.roundData.imposterName : null,
          imposterCaught: ['RESULTS', 'GAME_OVER'].includes(room.state) ? room.roundData.imposterCaught : null,
          voteCounts: ['RESULTS', 'GAME_OVER'].includes(room.state) ? room.roundData.voteCounts : null,
          roundScores: ['RESULTS', 'GAME_OVER'].includes(room.state) ? room.roundData.roundScores : null
        } : null
      };

      if (!player.isBot) {
        this.io.to(player.id).emit('game-state', clientState);
      }
    });
  }
}
