import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playReveal, playPop } from '../utils/audio';
import { Sparkles, AlertCircle, CheckCircle2, Play, Users } from 'lucide-react';
import CandidateWordsBanner from './CandidateWordsBanner';

export default function WordReveal({ gameState }) {
  const [isReady, setIsReady] = useState(false);
  const myWord = gameState?.myWord;
  const isHost = gameState?.hostId === gameState?.myPlayerId;

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

      {/* Secret Card */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden border border-slate-700">
        
        {/* Mystery Role Header */}
        <div className="mb-4">
          <div className="inline-flex p-4 rounded-3xl bg-purple-500/20 border border-purple-500/40 text-purple-300 mb-3 shadow-lg shadow-purple-500/20 animate-bounce-subtle">
            <Sparkles className="w-12 h-12 text-amber-300" />
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300">
            YOUR SECRET WORD ASSIGNMENT
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Nobody knows if they are a Civilian or the Imposter!
          </p>
        </div>

        {/* The Secret Word Box */}
        <div className="max-w-md mx-auto my-6 bg-slate-950/80 p-6 rounded-2xl border-2 border-dashed border-purple-500/40 shadow-inner">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Your Secret Word</p>
          <div className="font-heading font-black text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400">
            {myWord || '???'}
          </div>
        </div>

        {/* Blind Identity Rules & Strategic Guidance */}
        <div className="max-w-lg mx-auto bg-slate-900/80 p-4 rounded-2xl border border-purple-500/30 text-xs sm:text-sm text-slate-300 text-left space-y-2 mb-6">
          <div className="flex items-start space-x-2.5 text-purple-200">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-semibold">The Mystery:</strong> 3 players received the majority word, and 1 player received the imposter word.
            </div>
          </div>
          <p className="text-slate-400 pl-7 text-xs leading-relaxed">
            Answer the 2 questions and draw your clues. Pay attention to other players' submissions to deduce whether your word is the majority or if <em>you</em> are the secret imposter!
          </p>
        </div>

        {/* Ready Action Button */}
        <div className="max-w-md mx-auto">
          {!isReady ? (
            <button
              onClick={handleReady}
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-bold rounded-2xl shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 text-base flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>I'm Ready → Start Question 1</span>
            </button>
          ) : (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-emerald-500/30 text-emerald-300 font-bold text-sm flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>You are Ready! Waiting for other players ({readyCount}/{totalPlayers})...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
