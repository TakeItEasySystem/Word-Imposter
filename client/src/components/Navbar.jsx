import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, HelpCircle, Users, Sparkles } from 'lucide-react';
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
    <header className="w-full bg-slate-950/90 backdrop-blur-md border-b-2 border-slate-800/90 px-4 py-3 sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Game Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30 border border-purple-400/30">
            🎭
          </div>
          <div>
            <h1 className="font-heading text-lg sm:text-xl font-black tracking-wide bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent leading-tight">
              WORD IMPOSTER
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden sm:block">
              3 WORDS • 1 OUTLIER • WHO BLUFFS?
            </p>
          </div>
        </div>

        {/* Room & Round Status */}
        {gameState?.code && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-purple-300 px-3 py-1.5 rounded-xl border border-purple-500/40 transition shadow-inner font-mono text-xs sm:text-sm font-bold active:scale-95"
            >
              <span className="text-slate-400">ROOM:</span>
              <span className="text-white font-black">{gameState.code}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
            </button>

            {gameState.state !== 'LOBBY' && (
              <div className="bg-purple-950/80 border border-purple-700/60 text-purple-200 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0">
                ROUND {gameState.currentRound}/{gameState.totalRounds}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenRules}
            className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition border border-slate-800 active:scale-90"
            title="How to Play"
          >
            <HelpCircle className="w-5 h-5 text-purple-400" />
          </button>
          <button
            onClick={handleToggleSound}
            className="p-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition border border-slate-800 active:scale-90"
            title={muted ? "Unmute Sound" : "Mute Sound"}
          >
            {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>

      </div>
    </header>
  );
}
