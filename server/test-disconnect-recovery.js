import { io } from 'socket.io-client';
import assert from 'assert';

const SERVER_URL = 'http://localhost:3001';

async function runDisconnectTest() {
  console.log('--- STARTING DISCONNECT RECOVERY & BACKGROUND RUNNING TEST ---');

  // 1. Host creates room
  const host = io(SERVER_URL);
  await new Promise(r => host.on('connect', r));
  host.emit('create-room', { playerName: 'Host_Alice', avatar: '🦊' });

  let roomCode = '';
  await new Promise(r => {
    host.on('game-state', state => {
      if (state.code) {
        roomCode = state.code;
        r();
      }
    });
  });
  console.log('[Test] Room created:', roomCode);

  // 2. Player 2 joins
  const player2 = io(SERVER_URL);
  await new Promise(r => player2.on('connect', r));
  player2.emit('join-room', { roomCode, playerName: 'Player2_Bob', avatar: '🐼' });

  // 3. Player 3 joins
  const player3 = io(SERVER_URL);
  await new Promise(r => player3.on('connect', r));
  player3.emit('join-room', { roomCode, playerName: 'Player3_Charlie', avatar: '🚀' });

  // Wait for all 3 in lobby
  await new Promise(r => setTimeout(r, 600));

  // 4. Start game
  console.log('[Test] Host starting game...');
  host.emit('start-game', { roomCode });

  // Wait for WORD_REVEAL
  await new Promise(r => {
    const handler = state => {
      if (state.state === 'WORD_REVEAL') {
        host.off('game-state', handler);
        r();
      }
    };
    host.on('game-state', handler);
  });
  console.log('[Test] State is WORD_REVEAL. Testing Word Reveal Ready...');

  // Host and Player 2 click ready
  host.emit('player-ready', { roomCode });
  player2.emit('player-ready', { roomCode });

  // 5. NOW SIMULATE: Player 3 closes the browser tab completely mid-game!
  console.log('[Test] 💥 Simulating Player 3 CLOSING their game/browser tab mid-case...');
  const player3OldId = player3.id;
  player3.disconnect();

  // 6. Verify that the game did NOT hang, and automatically advanced to QUESTION_1!
  console.log('[Test] Waiting to verify that remaining players can continue...');
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Game froze when player disconnected!')), 8000);
    const handler = state => {
      if (state.state === 'QUESTION_1') {
        clearTimeout(timeout);
        host.off('game-state', handler);
        resolve();
      }
    };
    host.on('game-state', handler);
  });
  console.log('  ✅ SUCCESS: Game did NOT hang! Automatically progressed to QUESTION_1.');

  // 7. Host and Player 2 submit answers
  host.emit('submit-answer', { roomCode, questionKey: 'q1', answer: 'Clue from Alice' });
  player2.emit('submit-answer', { roomCode, questionKey: 'q1', answer: 'Clue from Bob' });

  // 8. Verify it automatically advanced to QUESTION_2 without waiting on disconnected Player 3!
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Game froze in Question 1!')), 8000);
    const handler = state => {
      if (state.state === 'QUESTION_2') {
        clearTimeout(timeout);
        host.off('game-state', handler);
        resolve();
      }
    };
    host.on('game-state', handler);
  });
  console.log('  ✅ SUCCESS: Remaining players answered and game progressed to QUESTION_2 smoothly!');

  // 9. NOW TEST RECONNECTION: Player 3 opens the browser back up!
  console.log('[Test] 🔄 Simulating Player 3 RE-OPENING their browser/tab...');
  const player3Reconnected = io(SERVER_URL);
  await new Promise(r => player3Reconnected.on('connect', r));

  player3Reconnected.emit('reconnect-session', {
    roomCode,
    playerId: player3OldId,
    playerName: 'Player3_Charlie'
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Reconnection failed!')), 5000);
    player3Reconnected.on('game-state', state => {
      if (state.code === roomCode && state.state === 'QUESTION_2') {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  console.log('  ✅ SUCCESS: Reconnected player seamlessly restored their active game state!');

  host.disconnect();
  player2.disconnect();
  player3Reconnected.disconnect();

  console.log('--- ALL DISCONNECT & RECOVERY TESTS PASSED! ---');
  process.exit(0);
}

runDisconnectTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
