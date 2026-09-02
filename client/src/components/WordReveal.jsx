import React, { useEffect } from 'react';
import { playReveal } from '../utils/audio';
import { HelpCircle, Clock, Sparkles, AlertCircle } from 'lucide-react';
import CandidateWordsBanner from './CandidateWordsBanner';

export default function WordReveal({ gameState }) {
  const myWord = gameState?.myWord;

  useEffect(() => {
    playReveal();
  }, []);

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
        
        {/* Timer Bar */}
        <div className="inline-flex items-center space-x-2 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700 text-xs font-semibold text-slate-300 mb-6">
          <Clock className="w-4 h-4 text-purple-400 animate-spin" />
          <span>Game starts in {gameState?.timerSeconds}s</span>
        </div>

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
        <div className="max-w-lg mx-auto bg-slate-900/80 p-4 rounded-2xl border border-purple-500/30 text-xs sm:text-sm text-slate-300 text-left space-y-2">
          <div className="flex items-start space-x-2.5 text-purple-200">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 font-semibold">The Mystery:</strong> One of the 3 words was given to <strong>3 players</strong> (Civilians), and one word was given to only <strong>1 player</strong> (The Imposter).
            </div>
          </div>
          <p className="text-slate-400 pl-7 text-xs leading-relaxed">
            Answer the 2 questions and draw your clues. Pay attention to other players' submissions to deduce whether your word is the majority or if <em>you</em> are the secret imposter!
          </p>
        </div>

      </div>
    </div>
  );
}
