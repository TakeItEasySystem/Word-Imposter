import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { Palette, CheckCircle2, Users, Send, Lock } from 'lucide-react';
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
      <div className="game-panel p-5 sm:p-6 rounded-3xl border-2 border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 rounded-2xl border-2 border-purple-500/40 text-purple-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
              Secret Drawing Studio
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Draw clues for your word: <strong className="text-purple-300 font-bold">{gameState?.myWord}</strong>. Drawings stay private until Voting!
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border-2 border-slate-800 bg-[#0b0f19] text-slate-200 text-xs font-bold shrink-0">
          <Users className="w-4 h-4 text-purple-400" />
          <span>{submittedCount} / {totalPlayers} Submitted</span>
        </div>
      </div>

      {/* Centered Secret Drawing Board */}
      <div className="game-panel-glow rounded-3xl p-6 sm:p-8 border-2 border-purple-900/60 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-slate-400">Your Secret Canvas</span>
            <div className="font-heading font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400">
              {gameState?.myWord}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 bg-[#0b0f19] px-3.5 py-1.5 rounded-full border-2 border-slate-800">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Private & Hidden</span>
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
              className="w-full py-4 text-white font-heading font-black text-lg rounded-2xl btn-3d-purple disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>SUBMIT MY DRAWING</span>
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2 font-medium">
              💡 You can undo, erase, and draw as much as you like before clicking Submit.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto p-5 bg-emerald-950/40 rounded-2xl border-2 border-emerald-500/40 text-center space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="font-heading font-black text-base text-emerald-300">Drawing Locked & Submitted!</h3>
            <p className="text-xs text-slate-400 font-medium">
              Waiting for remaining players ({submittedCount}/{totalPlayers}). All drawings will be revealed together during Voting!
            </p>
          </div>
        )}

        {/* Players Submission Status (No drawings leaked) */}
        <div className="pt-5 border-t border-slate-800">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Players Progress:</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {gameState?.players?.map((player) => {
              const isMe = player.id === myId;
              const hasFinished = player.hasSubmittedDrawing;
              return (
                <div
                  key={player.id}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition ${
                    hasFinished
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#0b0f19] border-slate-800 text-slate-400'
                  }`}
                >
                  <span>{player.avatar}</span>
                  <span>{player.name} {isMe && '(You)'}</span>
                  {hasFinished ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-normal italic">(Drawing...)</span>
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
