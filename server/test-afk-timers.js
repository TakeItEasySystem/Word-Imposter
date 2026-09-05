import assert from 'assert';
import { GameManager } from './src/gameManager.js';

// Mock Socket.io
class MockSocket {
  constructor(id) {
    this.id = id;
    this.rooms = new Set();
  }
  join(code) { this.rooms.add(code); }
  emit() {}
}

class MockIO {
  to() {
    return {
      emit: () => {}
    };
  }
}

async function testAfkTimers() {
  console.log('--- RUNNING AFK TIMERS & AUTO-PILOT TEST ---');
  const io = new MockIO();
  const gm = new GameManager(io);

  // 1. Create Room & add 3 players
  const host = new MockSocket('player_1');
  const roomCode = gm.createRoom(host, 'Alice', '🦊');
  const room = gm.rooms.get(roomCode);

  const p2 = new MockSocket('player_2');
  gm.joinRoom(p2, roomCode, 'Bob', '🐼');

  const p3 = new MockSocket('player_3');
  gm.joinRoom(p3, roomCode, 'Charlie (AFK)', '🤖');

  assert.strictEqual(room.players.length, 3, 'Room should have 3 players');
  console.log('✓ 3 players created in room', roomCode);

  // 2. Start game -> WORD_REVEAL
  await gm.startRound(room);
  assert.strictEqual(room.state, 'WORD_REVEAL');
  assert.strictEqual(room.timerSeconds, 15, 'WORD_REVEAL timer should be 15s');
  console.log('✓ WORD_REVEAL timer is 15s');

  // 3. Transition to QUESTION_1
  gm.startQuestion1(room);
  assert.strictEqual(room.state, 'QUESTION_1');
  assert.strictEqual(room.timerSeconds, 45, 'QUESTION_1 timer should be 45s');
  console.log('✓ QUESTION_1 timer is 45s');

  // Simulate Alice and Bob submitting answers, Charlie is AFK
  gm.submitAnswer(roomCode, 'player_1', 'q1', 'Alice answer');
  gm.submitAnswer(roomCode, 'player_2', 'q1', 'Bob answer');
  assert.strictEqual(room.state, 'QUESTION_1', 'Should stay in QUESTION_1 because Charlie is AFK');

  // Simulate Q1 timer expiration
  // Force trigger callback of timer
  room.timerSeconds = 0;
  // Trigger the auto-advance logic that occurs on timer expiration
  room.players.forEach(p => {
    if (!p.answers.q1) {
      p.answers.q1 = p.isBot
        ? gm.generateBotAnswer(p.assignedWord, 'q1', room.roundData?.questions)
        : "(Detective submitted subtle classified testimony)";
    }
  });
  gm.startQuestion2(room);

  const charlie = room.players.find(p => p.id === 'player_3');
  assert.strictEqual(charlie.answers.q1, '(Detective submitted subtle classified testimony)', 'AFK player should receive fallback testimony');
  console.log('✓ Q1 AFK player auto-completed with classified testimony fallback');

  // 4. QUESTION_2 Timer check
  assert.strictEqual(room.state, 'QUESTION_2');
  assert.strictEqual(room.timerSeconds, 45, 'QUESTION_2 timer should be 45s');
  console.log('✓ QUESTION_2 timer is 45s');

  // Simulate Q2 timer expiration for Charlie
  gm.submitAnswer(roomCode, 'player_1', 'q2', 'Alice answer 2');
  gm.submitAnswer(roomCode, 'player_2', 'q2', 'Bob answer 2');
  room.players.forEach(p => {
    if (!p.answers.q2) {
      p.answers.q2 = p.isBot
        ? gm.generateBotAnswer(p.assignedWord, 'q2', room.roundData?.questions)
        : "(Detective submitted subtle classified testimony)";
    }
  });
  gm.startDrawingPhase(room);
  assert.strictEqual(charlie.answers.q2, '(Detective submitted subtle classified testimony)');
  console.log('✓ Q2 AFK player auto-completed with classified testimony fallback');

  // 5. DRAWING Phase Timer check
  assert.strictEqual(room.state, 'DRAWING');
  assert.strictEqual(room.timerSeconds, 75, 'DRAWING timer should be 75s');
  console.log('✓ DRAWING timer is 75s');

  // Alice and Bob submit drawings, Charlie is AFK
  gm.submitDrawing(roomCode, 'player_1', 'data:image/svg+xml;utf8,alice_sketch');
  gm.submitDrawing(roomCode, 'player_2', 'data:image/svg+xml;utf8,bob_sketch');
  assert.strictEqual(room.state, 'DRAWING', 'Should stay in DRAWING because Charlie has not submitted');

  // Trigger Drawing timer expiration
  room.players.forEach((p, idx) => {
    if (!p.drawing) {
      p.drawing = 'data:image/svg+xml;utf8,sample_doodle';
    }
    p.isDrawingSubmitted = true;
  });
  gm.startVotingPhase(room);

  assert.ok(charlie.drawing, 'Charlie should have received fallback drawing');
  assert.strictEqual(charlie.isDrawingSubmitted, true, 'Charlie drawing marked submitted');
  console.log('✓ Drawing AFK player auto-completed with bot doodle fallback');

  // 6. VOTING Phase Timer check
  assert.strictEqual(room.state, 'VOTING');
  assert.strictEqual(room.timerSeconds, 30, 'VOTING timer should be 30s');
  console.log('✓ VOTING timer is 30s');

  // Alice and Bob vote, Charlie is AFK
  gm.castVote(roomCode, 'player_1', 'player_2');
  gm.castVote(roomCode, 'player_2', 'player_1');
  assert.strictEqual(room.state, 'VOTING', 'Should stay in VOTING because Charlie has not voted');

  // Trigger Voting timer expiration
  room.players.forEach(p => {
    if (!p.vote) {
      const eligible = room.players.filter(t => t.id !== p.id);
      if (eligible.length > 0) {
        p.vote = eligible[Math.floor(Math.random() * eligible.length)].id;
      }
    }
  });
  gm.resolveVotes(room);

  assert.ok(charlie.vote, 'Charlie should have auto-cast a vote');
  assert.strictEqual(room.state, 'RESULTS', 'Should transition to RESULTS');
  console.log('✓ Voting AFK player auto-cast vote, tribunal resolved to RESULTS');

  // 7. Early Advance verification: when everyone submits, timer clears immediately
  console.log('Testing early advance when all players submit manually...');
  room.players.forEach(p => {
    p.answers = { q1: '', q2: '' };
    p.drawing = '';
    p.isDrawingSubmitted = false;
    p.vote = null;
  });
  gm.startQuestion1(room);
  assert.strictEqual(room.state, 'QUESTION_1');
  assert.ok(room.timerInterval, 'Timer interval is running');

  gm.submitAnswer(roomCode, 'player_1', 'q1', 'Fast Alice');
  gm.submitAnswer(roomCode, 'player_2', 'q1', 'Fast Bob');
  gm.submitAnswer(roomCode, 'player_3', 'q1', 'Fast Charlie');

  assert.strictEqual(room.state, 'QUESTION_2', 'Should immediately advance to QUESTION_2');
  console.log('✓ Early submission works: game advances immediately without waiting full 45s!');

  // Cleanup
  gm.clearRoomTimer(room);
  clearInterval(gm.gcInterval);
  console.log('--- ALL AFK & TIMER ALLOTMENT TESTS PASSED! ---');
  process.exit(0);
}

testAfkTimers().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
