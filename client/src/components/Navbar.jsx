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
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Logo & Game Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-md font-mono font-bold">
            🕵️
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 uppercase tracking-wider">
                CONFIDENTIAL
              </span>
            </div>
            <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
              WORD IMPOSTER
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 hidden sm:block">
              DETECTIVE EVIDENCE BOARD • 3 CLUES • 1 ROGUE SUSPECT
            </p>
          </div>
        </div>

        {/* Case File Code & Round Tracker */}
        {gameState?.code && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleCopyCode}
              title="Click to copy case file code"
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 transition font-mono text-xs sm:text-sm font-bold active:scale-95"
            >
              <span className="text-slate-500">CASE:</span>
              <span className="text-slate-900 font-extrabold">#{gameState.code}</span>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {gameState.state !== 'LOBBY' && (
              <div className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 shadow-sm">
                ROUND {gameState.currentRound}/{gameState.totalRounds}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenRules}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-300 active:scale-90 shadow-sm"
            title="Investigation Rules"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggleSound}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-300 active:scale-90 shadow-sm"
            title={muted ? "Unmute Audio" : "Mute Audio"}
          >
            {muted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5 text-slate-800" />}
          </button>
        </div>

      </div>
    </header>
  );
}
