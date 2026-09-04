import React from 'react';
import { FileSearch, ShieldAlert, Sparkles, Folder } from 'lucide-react';

export default function CandidateWordsBanner({ roundData, myWord, showSecretHighlight = true }) {
  if (!roundData || !roundData.candidateWords) return null;

  return (
    <div className="w-full bg-[#09090b] border-2 border-zinc-700 rounded-3xl p-4 sm:p-5 mb-6 shadow-2xl relative overflow-hidden">
      
      {/* Top Bar: Case Category & Public Board Notice */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-3.5 border-b border-zinc-800 mb-3.5">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-zinc-900 text-white rounded-xl border border-zinc-700">
            <Folder className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            CASE TOPIC: <span className="text-white font-mono font-black text-sm ml-1">{roundData.category}</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-zinc-400 bg-black px-3 py-1 rounded-full border border-zinc-800">
          <FileSearch className="w-3.5 h-3.5 text-white" />
          <span>DECLASSIFIED EVIDENCE (VISIBLE TO ALL SUSPECTS)</span>
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
                  ? 'bg-zinc-900 border-2 border-white shadow-2xl shadow-white/10 scale-[1.02]'
                  : 'bg-black border-2 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono font-bold text-zinc-500 mb-1">
                <span>EVIDENCE #{index + 1}</span>
                {isMySecretWord && <span className="text-red-400 font-black">● ACTIVE</span>}
              </div>

              <div className="font-heading font-black text-sm sm:text-lg md:text-xl text-white truncate tracking-wide">
                {word}
              </div>

              {isMySecretWord && (
                <div className="mt-1.5 inline-flex items-center space-x-1 text-[9px] font-mono font-black uppercase tracking-widest text-white bg-black border border-white px-2 py-0.5 rounded-full shadow-inner">
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
