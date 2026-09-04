import React from 'react';
import { FileSearch, ShieldAlert, Sparkles, Folder } from 'lucide-react';

export default function CandidateWordsBanner({ roundData, myWord, showSecretHighlight = true }) {
  if (!roundData || !roundData.candidateWords) return null;

  return (
    <div className="w-full bg-white border-2 border-slate-200 rounded-3xl p-4 sm:p-5 mb-6 shadow-sm relative overflow-hidden">
      
      {/* Top Bar: Case Category & Public Board Notice */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100 mb-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-slate-100 text-slate-800 rounded-xl border border-slate-200 shadow-xs">
            <Folder className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
            CASE TOPIC: <span className="text-slate-900 font-mono font-extrabold text-sm ml-1">{roundData.category}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <FileSearch className="w-3.5 h-3.5 text-slate-800" />
          <span>DECLASSIFIED EVIDENCE (VISIBLE TO ALL)</span>
        </div>
      </div>

      {/* 3 Crime Clue Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {roundData.candidateWords.map((word, index) => {
          const isMySecretWord = showSecretHighlight && word.toLowerCase() === (myWord || '').toLowerCase();
          return (
            <div
              key={index}
              className={`relative px-3 sm:px-5 py-3.5 sm:py-4 rounded-2xl text-center transition transform ${
                isMySecretWord
                  ? 'bg-white border-2 border-slate-900 shadow-md scale-[1.02] ring-2 ring-slate-900/10'
                  : 'bg-slate-50 border-2 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 mb-1">
                <span>EVIDENCE #{index + 1}</span>
                {isMySecretWord && <span className="text-emerald-600 font-bold">● ACTIVE</span>}
              </div>

              <div className="font-heading font-extrabold text-sm sm:text-lg md:text-xl text-slate-900 truncate tracking-wide">
                {word}
              </div>

              {isMySecretWord && (
                <div className="mt-1.5 inline-flex items-center space-x-1 text-[9px] font-mono font-bold uppercase tracking-wider text-white bg-slate-900 px-2.5 py-0.5 rounded-full shadow-xs">
                  <span>★ YOUR SECRET LEAD</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
