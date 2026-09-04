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
      <div className="clean-card p-5 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-sm">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-0.5">
              <span className="text-[9px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200 uppercase tracking-wider">
                EXHIBIT LAB • SECRET DRAWING
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900">
              Forensic Sketch Laboratory
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Draw clues for your assigned lead: <strong className="text-slate-900 font-bold">{gameState?.myWord}</strong>. Sketches remain hidden until voting!
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-xs font-mono font-bold shrink-0">
          <Users className="w-4 h-4 text-slate-800" />
          <span>SKETCHES: <strong className="text-slate-900 font-extrabold">{submittedCount}</strong> / {totalPlayers}</span>
        </div>
      </div>

      {/* Centered Secret Drawing Board */}
      <div className="clean-card rounded-3xl p-6 sm:p-8 border-2 border-slate-200 space-y-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">SECRET LEAD</span>
            <div className="font-mono font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-wider uppercase">
              {gameState?.myWord}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>CONFIDENTIAL // PRIVATE CANVAS</span>
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
              className="w-full py-4 rounded-2xl btn-primary-dark disabled:opacity-40 flex items-center justify-center space-x-2 font-mono font-bold text-sm uppercase tracking-wider"
            >
              <Send className="w-4 h-4" />
              <span>SUBMIT DRAWING 🔒</span>
            </button>
            <p className="text-center text-[11px] font-mono text-slate-400 mt-2">
              💡 Your sketch will remain 100% private until all players complete their drawings.
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto p-5 bg-slate-50 rounded-2xl border-2 border-slate-300 text-center space-y-1.5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="font-heading font-extrabold text-base text-slate-900">Exhibit Locked!</h3>
            <p className="text-xs font-mono text-slate-500">
              Waiting for other players ({submittedCount}/{totalPlayers}). All drawings will be unsealed together during the Tribunal!
            </p>
          </div>
        )}

        {/* Players Submission Status (No drawings leaked) */}
        <div className="pt-5 border-t border-slate-100">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-slate-700" />
            <span>Player Sketch Status:</span>
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
                      ? 'bg-white border-slate-900 text-slate-900 shadow-xs'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <span>{player.avatar}</span>
                  <span>{player.name} {isMe && '(You)'}</span>
                  {hasFinished ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal italic">(Drawing...)</span>
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
