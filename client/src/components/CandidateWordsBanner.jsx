import React from 'react';
import { Folder } from 'lucide-react';

export default function CandidateWordsBanner({ roundData, myWord }) {
  const candidateWords = roundData?.candidateWords;
  if (!candidateWords || candidateWords.length === 0) return null;

  const category = roundData?.category;

  return (
    <div className="sticky top-[62px] z-40 w-full max-w-4xl mx-auto my-2 px-2 pointer-events-auto animate-fade-in">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 border-2 border-slate-200 shadow-md">
        
        {/* Category & Subtitle */}
        <div className="flex items-center justify-between px-1.5 pb-2 mb-2 border-b border-slate-100 text-xs font-mono">
          <div className="flex items-center space-x-2 text-slate-500">
            <Folder className="w-3.5 h-3.5 text-slate-400" />
            <span>TOPIC: <strong className="text-slate-900 uppercase">{category || 'General'}</strong></span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider hidden sm:inline">
            3 EVIDENCE CLUES • 1 IMPOSTER
          </span>
        </div>

        {/* 3 Candidate Words Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {candidateWords.map((word, index) => {
            const isAssigned = word.toLowerCase() === (myWord || '').toLowerCase();
            return (
              <div
                key={index}
                className={`relative px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center transition ${
                  isAssigned
                    ? 'bg-slate-900 text-white shadow-md ring-2 ring-amber-400 scale-[1.02]'
                    : 'bg-slate-50 border border-slate-200 text-slate-700'
                }`}
              >
                {/* Header Tag */}
                <div className="flex items-center justify-center space-x-1 mb-0.5">
                  {isAssigned ? (
                    <span className="text-[9px] sm:text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                      <span>📌 YOUR WORD</span>
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                      CLUE #{index + 1}
                    </span>
                  )}
                </div>

                {/* Word Text */}
                <div className={`font-heading font-extrabold text-sm sm:text-base md:text-lg truncate tracking-wide ${
                  isAssigned ? 'text-amber-400 font-black' : 'text-slate-800 font-bold'
                }`}>
                  {word}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
