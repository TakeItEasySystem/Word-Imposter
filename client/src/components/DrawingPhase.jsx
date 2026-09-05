import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { CheckCircle2, Users, Send, PenTool, Clock } from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';
import PinnedWordBanner from './PinnedWordBanner';

export default function DrawingPhase({ gameState }) {
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const myId = gameState?.myPlayerId;
  const myPlayer = gameState?.players?.find(p => p.id === myId);
  const alreadySubmitted = myPlayer?.hasSubmittedDrawing;
  const submitted = hasSubmitted || alreadySubmitted;
  const category = gameState?.roundData?.category || gameState?.theme || 'General Topic';

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
    <div className="max-w-4xl mx-auto my-4 px-4 animate-fade-in space-y-4">
      {/* Pinned Secret Word Bar */}
      <PinnedWordBanner myWord={gameState?.myWord} category={category} />

      {/* Main Drawing Card */}
      <div className="clean-card rounded-3xl p-5 sm:p-7 border-2 border-slate-200 space-y-5 shadow-sm">
        
        {/* Unified Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-900 rounded-2xl text-white shadow-sm">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900">
                Draw Your Secret Clue
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Your drawing is 100% private until voting begins.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {gameState?.timerSeconds > 0 && (
              <div className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border text-xs font-mono font-black transition ${
                gameState.timerSeconds <= 5
                  ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-sm'
                  : gameState.timerSeconds <= 10
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>⏱️ {gameState.timerSeconds}s</span>
              </div>
            )}

            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              <Users className="w-3.5 h-3.5 text-slate-800" />
              <span>SKETCHES: <strong className="text-slate-900 font-extrabold">{submittedCount}</strong> / {totalPlayers}</span>
            </div>
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
