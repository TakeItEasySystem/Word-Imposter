import React from 'react';

export default function PinnedWordBanner({ myWord, category }) {
  if (!myWord) return null;

  return (
    <div className="sticky top-[64px] z-40 w-full max-w-2xl mx-auto my-2 px-2 pointer-events-auto animate-fade-in">
      <div className="bg-slate-900 text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-md border-2 border-slate-700 flex items-center justify-between gap-3">
        
        {/* Left: Pin Badge & Word */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
            📌
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block leading-none mb-0.5">
              YOUR ASSIGNED WORD
            </span>
            <span className="font-heading font-black text-xl sm:text-2xl text-amber-400 uppercase tracking-wide truncate block leading-none">
              {myWord}
            </span>
          </div>
        </div>

        {/* Right: Topic */}
        {category && (
          <div className="text-right shrink-0 border-l border-slate-700 pl-3">
            <span className="text-[10px] font-mono text-slate-400 block uppercase leading-none mb-0.5">
              TOPIC
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm text-slate-200 block leading-none">
              {category}
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
