import React, { useState, useEffect } from 'react';
import { socket } from './utils/socket';
import { playTick } from './utils/audio';

import Navbar from './components/Navbar';
import RulesModal from './components/RulesModal';
import Lobby from './components/Lobby';
import WordReveal from './components/WordReveal';
import QuestionPhase from './components/QuestionPhase';
import DrawingPhase from './components/DrawingPhase';
import VotingPhase from './components/VotingPhase';
import Scoreboard from './components/Scoreboard';
import ChatBox from './components/ChatBox';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  useEffect(() => {
    // Socket event listeners
    const handleGameState = (state) => {
      setGameState(state);
    };

    const handleTimerUpdate = ({ secondsLeft, phase }) => {
      setGameState((prev) => (prev ? { ...prev, timerSeconds: secondsLeft } : prev));
      if (secondsLeft <= 5 && secondsLeft > 0) {
        playTick();
      }
    };

    const handleErrorMsg = (msg) => {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    };

    socket.on('game-state', handleGameState);
    socket.on('timer-update', handleTimerUpdate);
    socket.on('error-msg', handleErrorMsg);

    return () => {
      socket.off('game-state', handleGameState);
      socket.off('timer-update', handleTimerUpdate);
      socket.off('error-msg', handleErrorMsg);
    };
  }, []);

  // Render current phase component
  const renderCurrentPhase = () => {
    if (!gameState || gameState.state === 'LOBBY') {
      return <Lobby gameState={gameState} />;
    }

    switch (gameState.state) {
      case 'WORD_REVEAL':
        return <WordReveal key={gameState.state + '_' + gameState.currentRound} gameState={gameState} />;
      case 'QUESTION_1':
      case 'QUESTION_2':
        return <QuestionPhase key={gameState.state} gameState={gameState} />;
      case 'DRAWING':
        return <DrawingPhase key={gameState.state} gameState={gameState} />;
      case 'VOTING':
        return <VotingPhase key={gameState.state} gameState={gameState} />;
      case 'RESULTS':
      case 'GAME_OVER':
        return <Scoreboard key={gameState.state + '_' + gameState.currentRound} gameState={gameState} />;
      default:
        return <Lobby gameState={gameState} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#000000] bg-noir-grid text-zinc-100 relative selection:bg-white selection:text-black">
      
      {/* Background Subtle Noir Fog / Vignette */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-zinc-600/[0.03] rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Navigation Header */}
      <Navbar gameState={gameState} onOpenRules={() => setIsRulesOpen(true)} />

      {/* Toast Error Alert */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center space-x-2 bg-red-950 text-red-200 px-5 py-3 rounded-2xl shadow-2xl border-2 border-red-500 text-sm font-mono font-bold">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Game Screen */}
      <main className="flex-1 flex flex-col justify-center py-4 px-2">
        {renderCurrentPhase()}
      </main>

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* In-Game Live Chat System */}
      <ChatBox gameState={gameState} />

      {/* Footer */}
      <footer className="w-full text-center py-4 text-xs font-mono font-bold uppercase tracking-widest text-zinc-600 border-t border-zinc-900">
        🕵️ BUREAU OF INVESTIGATION • CONFIDENTIAL CASE FILE • 3 EVIDENCE CLUES • 1 ROGUE IMPOSTER
      </footer>

    </div>
  );
}
