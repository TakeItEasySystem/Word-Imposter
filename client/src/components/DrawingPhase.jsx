import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { Palette, CheckCircle2, Users, Send, Lock, ShieldAlert } from 'lucide-react';
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
      <div className="glass-panel-glow rounded-3xl p-5 border border-slate-700 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/40 text-purple-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
              Secret Drawing Round
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Draw clues for your word: <strong className="text-purple-300 font-bold">{gameState?.myWord}</strong>. Drawings stay private until Voting!
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border bg-slate-800 border-slate-700 text-slate-200 text-sm font-bold shrink-0">
          <Users className="w-4 h-4 text-purple-400" />
          <span>{submittedCount} / {totalPlayers} Submitted</span>
        </div>
      </div>

      {/* Centered Secret Drawing Board */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Your Secret Canvas</span>
            <div className="font-heading font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-pink-400 to-purple-400">
              {gameState?.myWord}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Private & Secret</span>
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
              className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-heading font-bold rounded-2xl shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 text-base"
            >
              <Send className="w-5 h-5" />
              <span>Submit My Drawing</span>
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              💡 You can undo, erase, and draw as much as you like before clicking Submit.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto p-5 bg-slate-900/90 rounded-2xl border border-emerald-500/30 text-center space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="font-heading font-bold text-base text-emerald-300">Drawing Locked & Submitted!</h3>
            <p className="text-xs text-slate-400">
              Waiting for remaining players ({submittedCount}/{totalPlayers}). All drawings will be revealed together during Voting!
            </p>
          </div>
        )}

        {/* Players Submission Status (No drawings leaked) */}
        <div className="pt-5 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
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
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                    hasFinished
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>{player.avatar}</span>
                  <span className="font-semibold">{player.name} {isMe && '(You)'}</span>
                  {hasFinished ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">(Drawing...)</span>
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
