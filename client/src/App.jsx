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
        return <WordReveal gameState={gameState} />;
      case 'QUESTION_1':
      case 'QUESTION_2':
        return <QuestionPhase gameState={gameState} />;
      case 'DRAWING':
        return <DrawingPhase gameState={gameState} />;
      case 'VOTING':
        return <VotingPhase gameState={gameState} />;
      case 'RESULTS':
      case 'GAME_OVER':
        return <Scoreboard gameState={gameState} />;
      default:
        return <Lobby gameState={gameState} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-100">
      
      {/* Navigation Header */}
      <Navbar gameState={gameState} onOpenRules={() => setIsRulesOpen(true)} />

      {/* Toast Error Alert */}
      {errorMsg && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center space-x-2 bg-red-600/90 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-red-400 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="ml-2 hover:opacity-80">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Game Screen */}
      <main className="flex-1 flex flex-col justify-center py-4">
        {renderCurrentPhase()}
      </main>

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* In-Game Live Chat System */}
      <ChatBox gameState={gameState} />

      {/* Footer */}
      <footer className="w-full text-center py-3 text-xs text-slate-500 border-t border-slate-900">
        Word Imposter Party Game • 3 Visible Words • Secret Imposter Deduction
      </footer>

    </div>
  );
}
