import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { Palette, CheckCircle2, Users, Send, Lock, PenTool, ShieldAlert } from 'lucide-react';
import CandidateWordsBanner from './CandidateWordsBanner';
import DrawingCanvas from './DrawingCanvas';

export default function DrawingPhase({ gameState }) {
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const myId = gameState?.myPlayerId;
  const myPlayer = gameState?.players?.find(p => p.id === myId);
  const alreadySubmitted = myPlayer?.hasSubmittedDrawing;
  const submitted = hasSubmitted || alreadySubmitted;

  const handleCanvasChange = (dataUrl) => {
    setCurrentDrawing(dataUrl);
    socket.emit('update-drawing', {
      roomCode: gameState.code,
      drawingData: dataUrl
    });
  };

  const handleSubmit = () => {
    if (!currentDrawing || submitted) return;
    playPop();
    socket.emit('submit-drawing', {
      roomCode: gameState.code,
      drawingData: currentDrawing
    });
    setHasSubmitted(true);
  };

  const totalPlayers = gameState?.players?.length || 0;
  const submittedCount = gameState?.players?.filter(p => p.hasSubmittedDrawing).length || 0;

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      {/* 3 Candidate Words Banner */}
      <CandidateWordsBanner
        roundData={gameState?.roundData}
        myWord={gameState?.myWord}
        showSecretHighlight={true}
      />

      {/* Drawing Phase Header */}
      <div className="case-file-panel p-5 sm:p-6 rounded-3xl border-2 border-zinc-700 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-zinc-900 rounded-2xl border-2 border-zinc-700 text-white">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-0.5">
              <span className="text-[9px] font-mono font-black text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700 uppercase tracking-widest">
                EXHIBIT LAB • CONFIDENTIAL SKETCH
              </span>
            </div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
              Forensic Sketch Laboratory
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Draw clues for your assigned lead: <strong className="text-white font-bold">{gameState?.myWord}</strong>. Sketches remain strictly hidden until the Tribunal!
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border-2 border-zinc-800 bg-black text-zinc-300 text-xs font-mono font-bold shrink-0">
          <Users className="w-4 h-4 text-white" />
          <span>SKETCHES: <strong className="text-white font-black">{submittedCount}</strong> / {totalPlayers}</span>
        </div>
      </div>

      {/* Centered Secret Drawing Board */}
      <div className="case-file-panel rounded-3xl p-6 sm:p-8 border-2 border-zinc-700 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase font-black tracking-widest text-zinc-500">SECRET LEAD</span>
            <div className="font-mono font-black text-2xl sm:text-3xl text-white tracking-widest uppercase">
              {gameState?.myWord}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-zinc-300 bg-black px-3.5 py-1.5 rounded-full border-2 border-zinc-800">
            <Lock className="w-3.5 h-3.5 text-red-400" />
            <span>CONFIDENTIAL // NO LEAKS</span>
          </div>
        </div>

        {/* Drawing Canvas */}
        <DrawingCanvas
          onSave={handleCanvasChange}
          disabled={submitted}
        />

        {/* Submit Action */}
        {!submitted ? (
          <div className="max-w-md mx-auto pt-2">
            <button
              onClick={handleSubmit}
              disabled={!currentDrawing}
              className="w-full py-4 rounded-2xl btn-noir-white disabled:opacity-40 flex items-center justify-center space-x-2 font-mono font-black text-sm uppercase tracking-wider"
            >
              <Send className="w-4 h-4" />
              <span>SUBMIT FORENSIC SKETCH 🔒</span>
            </button>
            <p className="text-center text-[11px] font-mono text-zinc-500 mt-2">
              💡 Your sketch will remain 100% private until all suspects complete their drawings.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto p-5 bg-black rounded-2xl border-2 border-white text-center space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-white mx-auto animate-bounce" />
            <h3 className="font-heading font-black text-base text-white">Forensic Exhibit Locked!</h3>
            <p className="text-xs font-mono text-zinc-400">
              Waiting for other suspects ({submittedCount}/{totalPlayers}). All drawings will be unsealed together during the Tribunal!
            </p>
          </div>
        )}

        {/* Players Submission Status (No drawings leaked) */}
        <div className="pt-5 border-t border-zinc-800">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-white" />
            <span>Suspect Sketch Status:</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {gameState?.players?.map((player) => {
              const isMe = player.id === myId;
              const hasFinished = player.hasSubmittedDrawing;
              return (
                <div
                  key={player.id}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border-2 text-xs font-mono font-bold transition ${
                    hasFinished
                      ? 'bg-zinc-900 border-white text-white'
                      : 'bg-black border-zinc-800 text-zinc-600'
                  }`}
                >
                  <span>{player.avatar}</span>
                  <span>{player.name} {isMe && '(You)'}</span>
                  {hasFinished ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span className="text-[10px] text-zinc-600 font-normal italic">(Drawing...)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
