import React from 'react';
import { Eye, Sparkles, Tag } from 'lucide-react';

export default function CandidateWordsBanner({ roundData, myWord, showSecretHighlight = true }) {
  if (!roundData || !roundData.candidateWords) return null;

  return (
    <div className="w-full bg-[#111827] border-2 border-slate-800 rounded-3xl p-4 sm:p-5 mb-6 shadow-2xl relative overflow-hidden">
      
      {/* Top Bar: Category Pill & Public Tag */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-3.5 border-b border-slate-800/80 mb-3.5">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/40">
            <Tag className="w-4 h-4" />
          </div>
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-slate-300">
            Topic: <span className="text-purple-300 font-extrabold text-sm ml-1">{roundData.category}</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-700/80">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Public Word Trio (All 4 Players See This)</span>
        </div>
      </div>

      {/* 3 High-Contrast Evidence Word Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {roundData.candidateWords.map((word, index) => {
          const isMySecretWord = showSecretHighlight && word.toLowerCase() === (myWord || '').toLowerCase();
          return (
            <div
              key={index}
              className={`relative px-3 sm:px-5 py-3 sm:py-4 rounded-2xl text-center transition transform ${
                isMySecretWord
                  ? 'bg-gradient-to-b from-purple-900/60 to-purple-950 border-2 border-purple-400 shadow-xl shadow-purple-900/40 scale-[1.02]'
                  : 'bg-[#0b0f19] border-2 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-500 mb-1">
                <span>WORD 0{index + 1}</span>
                {isMySecretWord && <Sparkles className="w-3 h-3 text-amber-300 animate-spin-slow" />}
              </div>

              <div className="font-heading font-black text-sm sm:text-lg md:text-xl text-white truncate tracking-wide">
                {word}
              </div>

              {isMySecretWord && (
                <div className="mt-1 inline-flex items-center space-x-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
                  <span>YOUR ASSIGNMENT</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
