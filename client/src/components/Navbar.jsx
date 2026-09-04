import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, HelpCircle, Shield, FileSearch } from 'lucide-react';
import { toggleMute, getMuteState } from '../utils/audio';

export default function Navbar({ gameState, onOpenRules }) {
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(getMuteState());

  const handleCopyCode = () => {
    if (gameState?.code) {
      navigator.clipboard.writeText(gameState.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleSound = () => {
    const newState = toggleMute();
    setMuted(newState);
  };

  return (
    <header className="w-full bg-[#09090b] border-b-2 border-zinc-800 px-4 py-3 sticky top-0 z-50 shadow-2xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Bureau Logo & Case File Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-black border-2 border-white flex items-center justify-center text-xl shadow-md text-white font-mono font-bold">
            🕵️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono font-black text-red-400 bg-red-950/80 px-1.5 py-0.2 rounded border border-red-800 uppercase tracking-widest">
                CLASSIFIED
              </span>
            </div>
            <h1 className="font-heading text-lg sm:text-xl font-black tracking-wide text-white leading-tight">
              WORD IMPOSTER
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 hidden sm:block">
              CRIME EVIDENCE BOARD • 3 CLUES • 1 ROGUE SUSPECT
            </p>
          </div>
        </div>

        {/* Case File Code & Round Tracker */}
        {gameState?.code && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyCode}
              title="Click to copy case file code"
              className="flex items-center space-x-2 bg-black hover:bg-zinc-900 text-zinc-200 px-3 py-1.5 rounded-xl border border-zinc-700 transition font-mono text-xs sm:text-sm font-bold active:scale-95"
            >
              <span className="text-zinc-500">CASE:</span>
              <span className="text-white font-black">#{gameState.code}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            </button>

            {gameState.state !== 'LOBBY' && (
              <div className="bg-zinc-900 border border-zinc-700 text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0">
                ROUND {gameState.currentRound}/{gameState.totalRounds}
              </div>
            )}
          </div>
        )}

        {/* Bureau Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenRules}
            className="p-2 text-zinc-400 hover:text-white bg-black hover:bg-zinc-900 rounded-xl transition border border-zinc-800 active:scale-90"
            title="Bureau Protocol (Rules)"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggleSound}
            className="p-2 text-zinc-400 hover:text-white bg-black hover:bg-zinc-900 rounded-xl transition border border-zinc-800 active:scale-90"
            title={muted ? "Unmute Audio Wire" : "Mute Audio Wire"}
          >
            {muted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
        </div>

      </div>
    </header>
  );
}
