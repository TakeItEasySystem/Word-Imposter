import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, HelpCircle, Users } from 'lucide-react';
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
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Game Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">
            🎭
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-wide bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Word Imposter
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">3 Words • 1 Secret Outlier • Who is it?</p>
          </div>
        </div>

        {/* Room & Round Status */}
        {gameState?.code && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCopyCode}
              title="Click to copy room code"
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 transition shadow-inner font-mono text-sm font-semibold"
            >
              <span>ROOM: {gameState.code}</span>
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            </button>

            {gameState.state !== 'LOBBY' && (
              <div className="bg-purple-950/60 border border-purple-800/60 text-purple-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
                Round {gameState.currentRound} / {gameState.totalRounds}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenRules}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title="How to Play"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggleSound}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            title={muted ? "Unmute Sound" : "Mute Sound"}
          >
            {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>

      </div>
    </header>
  );
}
