import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { CheckCircle2, ShieldAlert, Lock, FileText, AlertTriangle } from 'lucide-react';
import CandidateWordsBanner from './CandidateWordsBanner';

export default function WordReveal({ gameState }) {
  const [isReady, setIsReady] = useState(false);
  const myWord = gameState?.myWord;

  const handleReady = () => {
    playPop();
    setIsReady(true);
    socket.emit('player-ready', { roomCode: gameState.code });
  };

  const totalPlayers = gameState?.players?.length || 0;
  const readyCount = gameState?.players?.filter(p => p.ready).length || 0;

  return (
    <div className="max-w-3xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      {/* 3 Candidate Words at Top */}
      <CandidateWordsBanner
        roundData={gameState?.roundData}
        myWord={myWord}
        showSecretHighlight={true}
      />

      {/* Secret Classified Dossier Card */}
      <div className="case-file-panel-glow rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl border-2 border-zinc-700">
        
        {/* Top Secret Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-black border border-red-500/80 text-red-400 text-xs font-mono font-black uppercase tracking-widest mb-4">
          <Lock className="w-3.5 h-3.5 text-red-400" />
          <span>TOP SECRET • CLASSIFIED INTELLIGENCE</span>
        </div>

        <h2 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-white">
          CONFIDENTIAL WORD ASSIGNMENT
        </h2>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          BLIND INVESTIGATION: Nobody in this room knows if they are a Detective or the Imposter!
        </p>

        {/* The Secret Word Stamp Box */}
        <div className="max-w-md mx-auto my-6 bg-black border-2 border-dashed border-white p-6 sm:p-8 rounded-3xl relative shadow-inner">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 block mb-1">
            ASSIGNED CLUE
          </span>
          <div className="font-mono font-black text-3xl sm:text-5xl text-white tracking-widest uppercase">
            {myWord || '???'}
          </div>
        </div>

        {/* Strategic Guidance Box */}
        <div className="max-w-lg mx-auto bg-black p-4 sm:p-5 rounded-2xl border-2 border-zinc-800 text-xs text-zinc-300 text-left space-y-2 mb-8 shadow-inner font-mono">
          <div className="flex items-center space-x-2 text-white font-black">
            <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            <span className="uppercase tracking-wider">The Investigation Dilemma:</span>
          </div>
          <p className="text-zinc-400 pl-6 text-xs leading-relaxed">
            3 Detectives hold the majority lead. 1 Imposter holds false intel. Drop subtle clues during interrogation and sketching to verify whether your clue matches the majority!
          </p>
        </div>

        {/* Ready Action 3D Button */}
        <div className="max-w-md mx-auto">
          {!isReady ? (
            <button
              onClick={handleReady}
              className="w-full py-4 rounded-2xl btn-noir-white flex items-center justify-center space-x-2 font-mono font-black text-sm uppercase tracking-wider"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>CONFIRM DOSSIER → PROCEED TO INTERROGATION</span>
            </button>
          ) : (
            <div className="p-4 bg-black rounded-2xl border-2 border-white text-white font-mono font-bold text-sm flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>Dossier Confirmed. Waiting for all detectives ({readyCount}/{totalPlayers})...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
