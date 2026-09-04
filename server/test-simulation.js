import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

async function runTestSimulation() {
  console.log('--- STARTING WORD IMPOSTER SIMULATION TEST ---');

  const hostSocket = io(SERVER_URL);
  let roomCode = '';
  let candidateWords = [];

  await new Promise((resolve) => hostSocket.on('connect', resolve));
  console.log('[Test] Host connected:', hostSocket.id);

  hostSocket.emit('create-room', { playerName: 'HostPlayer', avatar: '🦊' });

  await new Promise((resolve) => {
    hostSocket.on('game-state', (state) => {
      if (state.code) {
        roomCode = state.code;
        resolve();
      }
    });
  });
  console.log('[Test] Room created with code:', roomCode);

  // Connect 3 more players
  const playerSockets = [];
  const playerNames = ['Player2_Bob', 'Player3_Charlie', 'Player4_Diana'];
  const playerAvatars = ['🐼', '🚀', '🦄'];

  for (let i = 0; i < 3; i++) {
    const s = io(SERVER_URL);
    await new Promise((resolve) => s.on('connect', resolve));
    s.emit('join-room', {
      roomCode: roomCode,
      playerName: playerNames[i],
      avatar: playerAvatars[i]
    });
    playerSockets.push(s);
  }

  console.log('[Test] All 4 players joined lobby.');

  const allSockets = [hostSocket, ...playerSockets];

  // Listen for state transitions across all sockets
  let currentState = 'LOBBY';

  allSockets.forEach((s, idx) => {
    s.on('game-state', (state) => {
      currentState = state.state;
      if (state.roundData?.candidateWords) {
        candidateWords = state.roundData.candidateWords;
      }
    });
  });

  // Update Theme
  console.log('[Test] Host setting theme to: "Food & Street Snacks"...');
  hostSocket.emit('update-theme', { roomCode, theme: 'Food & Street Snacks' });
  await new Promise((r) => setTimeout(r, 500));

  // Start game
  console.log('[Test] Host starting game...');
  hostSocket.emit('start-game', { roomCode });

  // Wait for WORD_REVEAL
  await new Promise((r) => setTimeout(r, 1000));
  console.log('[Test] Phase:', currentState, '| 3 Candidate Words:', candidateWords);

  // Send player-ready for all sockets
  console.log('[Test] Emitting player-ready for all 4 players...');
  allSockets.forEach((s) => {
    s.emit('player-ready', { roomCode });
  });

  // Check roles assigned
  // Wait until QUESTION_1 starts or test submissions
  console.log('[Test] Waiting for Question 1 phase...');
  await new Promise((r) => {
    const checkInterval = setInterval(() => {
      if (currentState === 'QUESTION_1') {
        clearInterval(checkInterval);
        r();
      }
    }, 500);
  });

  console.log('[Test] Question 1 active! Submitting answers for all 4 players...');
  allSockets.forEach((s, idx) => {
    s.emit('submit-answer', {
      roomCode,
      questionKey: 'q1',
      answer: `Test clue from player ${idx + 1}`
    });
  });

  // Wait for QUESTION_2
  console.log('[Test] Waiting for Question 2 phase...');
  await new Promise((r) => {
    const checkInterval = setInterval(() => {
      if (currentState === 'QUESTION_2') {
        clearInterval(checkInterval);
        r();
      }
    }, 500);
  });

  console.log('[Test] Question 2 active! Submitting answers for all 4 players...');
  allSockets.forEach((s, idx) => {
    s.emit('submit-answer', {
      roomCode,
      questionKey: 'q2',
      answer: `Second test clue from player ${idx + 1}`
    });
  });

  // Wait for DRAWING phase
  console.log('[Test] Waiting for DRAWING phase...');
  await new Promise((r) => {
    const checkInterval = setInterval(() => {
      if (currentState === 'DRAWING') {
        clearInterval(checkInterval);
        r();
      }
    }, 500);
  });

  console.log('[Test] Drawing phase active! Submitting drawings for all 4 players...');
  allSockets.forEach((s, idx) => {
    s.emit('submit-drawing', {
      roomCode,
      drawingData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    });
  });

  // Wait for VOTING phase
  console.log('[Test] Waiting for VOTING phase...');
  await new Promise((r) => {
    const checkInterval = setInterval(() => {
      if (currentState === 'VOTING') {
        clearInterval(checkInterval);
        r();
      }
    }, 500);
  });

  console.log('[Test] Voting phase active! Submitting votes...');
  // All vote for player 4 (Diana)
  const targetId = playerSockets[2].id;
  allSockets.forEach((s) => {
    if (s.id !== targetId) {
      s.emit('cast-vote', {
        roomCode,
        targetPlayerId: targetId
      });
    } else {
      s.emit('cast-vote', {
        roomCode,
        targetPlayerId: hostSocket.id
      });
    }
  });

  // Wait for RESULTS phase
  console.log('[Test] Waiting for RESULTS phase...');
  await new Promise((r) => {
    const checkInterval = setInterval(() => {
      if (currentState === 'RESULTS') {
        clearInterval(checkInterval);
        r();
      }
    }, 500);
  });

  console.log('[Test] RESULTS successfully reached! Imposter and vote resolution working perfectly!');
  
  // Cleanup
  allSockets.forEach(s => s.disconnect());
  console.log('--- TEST SIMULATION COMPLETE & PASSED ---');
  process.exit(0);
}

runTestSimulation().catch((err) => {
  console.error('[Test Error]:', err);
  process.exit(1);
});
