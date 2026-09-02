import React from 'react';
import { Eye, Sparkles } from 'lucide-react';

export default function CandidateWordsBanner({ roundData, myWord, showSecretHighlight = true }) {
  if (!roundData || !roundData.candidateWords) return null;

  return (
    <div className="w-full bg-slate-900/90 border border-purple-500/30 rounded-2xl p-3 sm:p-4 mb-5 shadow-lg relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
            Public Word Trio • Category: <strong className="text-white">{roundData.category}</strong>
          </span>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
          Everyone sees these 3 words
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {roundData.candidateWords.map((word, index) => {
          const isMySecretWord = showSecretHighlight && word.toLowerCase() === (myWord || '').toLowerCase();
          return (
            <div
              key={index}
              className={`relative px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl text-center border transition ${
                isMySecretWord
                  ? 'bg-gradient-to-b from-purple-900/50 to-indigo-900/50 border-purple-400 shadow-md shadow-purple-500/20 ring-1 ring-purple-400'
                  : 'bg-slate-800/60 border-slate-700/70 text-slate-300'
              }`}
            >
              <div className="text-[10px] text-slate-400 font-mono uppercase mb-0.5">
                Word {index + 1}
              </div>
              <div className="font-heading font-bold text-sm sm:text-base md:text-lg text-white truncate">
                {word}
              </div>
              {isMySecretWord && (
                <div className="text-[9px] sm:text-[10px] text-purple-300 font-semibold mt-0.5 flex items-center justify-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>YOUR WORD</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
