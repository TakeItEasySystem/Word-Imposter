import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { CheckCircle2, Lock, Folder } from 'lucide-react';
import CandidateWordsBanner from './CandidateWordsBanner';

export default function WordReveal({ gameState }) {
  const [isReady, setIsReady] = useState(false);
  const myWord = gameState?.myWord;
  const category = gameState?.roundData?.category || gameState?.theme || 'General Topic';

  const handleReady = () => {
    playPop();
    setIsReady(true);
    socket.emit('player-ready', { roomCode: gameState.code });
  };

  const totalPlayers = gameState?.players?.length || 0;
  const readyCount = gameState?.players?.filter(p => p.ready).length || 0;

  return (
    <div className="max-w-2xl mx-auto my-6 px-4 animate-fade-in space-y-4">
      {/* 3 Candidate Words with Assigned Word Highlighted */}
      <CandidateWordsBanner roundData={gameState?.roundData} myWord={myWord} />

      <div className="clean-card rounded-3xl p-6 sm:p-8 text-center border-2 border-slate-200 shadow-sm">
        
        {/* Category Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold uppercase tracking-wider mb-4">
          <Folder className="w-3.5 h-3.5 text-slate-600" />
          <span>TOPIC: <strong className="text-slate-900">{category}</strong></span>
        </div>

        <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900">
          Your Secret Word
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          One player has a different secret word. Do not reveal yours!
        </p>

        {/* The Secret Word Display */}
        <div className="my-6 bg-slate-50 border-2 border-dashed border-slate-300 p-6 sm:p-8 rounded-2xl">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">
            SECRET ASSIGNMENT
          </span>
          <div className="font-mono font-extrabold text-3xl sm:text-5xl text-slate-900 tracking-wider uppercase">
            {myWord || '???'}
          </div>
        </div>

        {/* Ready Action Button */}
        <div>
          {!isReady ? (
            <button
              onClick={handleReady}
              className="w-full py-4 rounded-2xl btn-primary-dark flex items-center justify-center space-x-2 font-mono font-bold text-sm uppercase tracking-wider"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>I'M READY TO PLAY ✓</span>
            </button>
          ) : (
            <div className="p-4 bg-slate-100 rounded-2xl border-2 border-slate-200 text-slate-800 font-mono font-bold text-sm flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Ready! Waiting for others ({readyCount}/{totalPlayers})...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
