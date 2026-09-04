import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { Sparkles, AlertCircle, CheckCircle2, ShieldAlert, Lock } from 'lucide-react';
import CandidateWordsBanner from './CandidateWordsBanner';

export default function WordReveal({ gameState }) {
  const [isReady, setIsReady] = useState(false);
  const myWord = gameState?.myWord;

  const handleReady = () => {
    playPop();
    setIsReady(true);
    socket.emit('player-ready', { roomCode: gameState.code });
  };

  const totalPlayers = gameState?.players?.length || 0;
  const readyCount = gameState?.players?.filter(p => p.ready).length || 0;

  return (
    <div className="max-w-3xl mx-auto my-6 px-4 animate-fade-in">
      {/* 3 Candidate Words at Top */}
      <CandidateWordsBanner
        roundData={gameState?.roundData}
        myWord={myWord}
        showSecretHighlight={true}
      />

      {/* Secret Classified Dossier Card */}
      <div className="game-panel-glow rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl">
        
        {/* Top Secret Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-purple-950 border border-purple-500/50 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>TOP SECRET • ROLE CONFIDENTIAL</span>
        </div>

        <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-tight text-white">
          YOUR SECRET WORD ASSIGNMENT
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Blind Role: Nobody in this room knows if they are a Civilian or the Imposter!
        </p>

        {/* The Secret Word Stamp Box */}
        <div className="max-w-md mx-auto my-6 secret-card-box p-6 sm:p-8 rounded-3xl relative">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">
            SECRET WORD
          </span>
          <div className="font-heading font-black text-3xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400 tracking-wide">
            {myWord || '???'}
          </div>
        </div>

        {/* Strategic Guidance Box */}
        <div className="max-w-lg mx-auto bg-[#0b0f19] p-4 sm:p-5 rounded-2xl border-2 border-slate-800 text-xs text-slate-300 text-left space-y-2 mb-8 shadow-inner">
          <div className="flex items-center space-x-2 text-purple-200 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>The Deduction Twist:</span>
          </div>
          <p className="text-slate-400 pl-6 text-xs leading-relaxed">
            3 Civilians got the majority word. 1 Imposter got the odd word. Give subtle clues in the questions and drawing to figure out if your word is the majority or if <em>you</em> are the secret imposter!
          </p>
        </div>

        {/* Ready Action 3D Button */}
        <div className="max-w-md mx-auto">
          {!isReady ? (
            <button
              onClick={handleReady}
              className="w-full py-4 text-white font-heading font-black text-lg rounded-2xl btn-3d-purple flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>I'M READY → START QUESTION 1</span>
            </button>
          ) : (
            <div className="p-4 bg-emerald-950/40 rounded-2xl border-2 border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>You are Ready! Waiting for others ({readyCount}/{totalPlayers})...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
