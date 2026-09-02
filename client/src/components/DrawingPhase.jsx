import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { playPop, playReveal } from '../utils/audio';
import { Palette, CheckCircle2, Clock, Users, Send, Eye, Lock, Sparkles, ZoomIn, X } from 'lucide-react';
import CandidateWordsBanner from './CandidateWordsBanner';
import DrawingCanvas from './DrawingCanvas';

export default function DrawingPhase({ gameState }) {
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [zoomDrawing, setZoomDrawing] = useState(null);

  const myId = gameState?.myPlayerId;
  const myPlayer = gameState?.players?.find(p => p.id === myId);
  const alreadySubmitted = myPlayer?.hasSubmittedDrawing;
  const submitted = hasSubmitted || alreadySubmitted;

  const secondsLeft = gameState?.timerSeconds || 0;
  const isRevealed = !!gameState?.drawingsRevealed || secondsLeft <= 13;

  // Sound chime when drawings are revealed
  useEffect(() => {
    if (gameState?.drawingsRevealed) {
      playReveal();
    }
  }, [gameState?.drawingsRevealed]);

  const handleCanvasChange = (dataUrl) => {
    setCurrentDrawing(dataUrl);
    // Send live update to server
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

  return (
    <div className="max-w-6xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      {/* 3 Candidate Words Banner */}
      <CandidateWordsBanner
        roundData={gameState?.roundData}
        myWord={gameState?.myWord}
        showSecretHighlight={true}
      />

      {/* Drawing Phase Header & Timer */}
      <div className="glass-panel-glow rounded-3xl p-5 border border-slate-700 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-500/20 rounded-2xl border border-purple-500/40 text-purple-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
                Drawing Round (20s Total)
              </h2>
              {isRevealed ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 animate-pulse">
                  <Eye className="w-3.5 h-3.5" />
                  <span>ALL DRAWINGS REVEALED!</span>
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private (Reveals in {Math.max(0, secondsLeft - 13)}s)</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Draw your secret word: <strong className="text-purple-300">{gameState?.myWord}</strong>. After 7s, all drawings become visible to everyone!
            </p>
          </div>
        </div>

        {/* 20s Countdown Timer */}
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-sm font-bold shrink-0 ${
          secondsLeft <= 7
            ? 'bg-red-500/20 border-red-500/50 text-red-300 animate-pulse'
            : 'bg-slate-800 border-slate-700 text-slate-200'
        }`}>
          <Clock className="w-4 h-4 text-purple-400" />
          <span>{secondsLeft}s Remaining</span>
        </div>
      </div>

      {/* Main Drawing Layout: Canvas + Live Reveal Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Your Drawing Canvas (7 Cols on desktop) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
          <div className="text-center">
            <span className="text-xs uppercase font-bold text-slate-400">Your Canvas</span>
            <div className="font-heading font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-purple-400">
              {gameState?.myWord}
            </div>
          </div>

          <DrawingCanvas
            onSave={handleCanvasChange}
            disabled={submitted}
          />

          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!currentDrawing}
              className="w-full max-w-lg mx-auto py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-heading font-bold rounded-2xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit My Drawing</span>
            </button>
          ) : (
            <div className="p-3 bg-slate-900/90 rounded-2xl border border-emerald-500/30 text-center text-xs text-emerald-300 flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Drawing Submitted! Watch the live drawings on the right...</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Peek / Revealed Drawings (5 Cols on desktop) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <h3 className="font-heading font-bold text-white text-sm">
                Live Drawings {isRevealed ? '(Visible to All)' : '(Hidden)'}
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              {isRevealed ? '👀 Look for the Imposter!' : `Reveals at 13s`}
            </span>
          </div>

          {!isRevealed ? (
            <div className="p-8 bg-slate-900/60 rounded-2xl border border-dashed border-slate-700 text-center space-y-2">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 w-12 h-12 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-bold text-slate-300 text-sm">
                Drawings are currently secret
              </h4>
              <p className="text-xs text-slate-400">
                In <strong>{Math.max(0, secondsLeft - 13)} seconds</strong>, everyone's drawings will appear here live!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {gameState?.players?.map((player) => {
                const isMe = player.id === myId;
                return (
                  <div
                    key={player.id}
                    className={`bg-slate-900/80 p-2.5 rounded-2xl border transition ${
                      isMe ? 'border-purple-500/50' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1 overflow-hidden">
                        <span className="text-sm">{player.avatar}</span>
                        <span className="text-xs font-semibold text-white truncate">
                          {player.name}
                        </span>
                      </div>
                      {isMe && (
                        <span className="text-[9px] bg-purple-500/30 text-purple-300 font-bold px-1 rounded">
                          YOU
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => player.drawing && setZoomDrawing({ img: player.drawing, name: player.name })}
                      className="aspect-[4/3] bg-white rounded-xl overflow-hidden border border-slate-700 relative cursor-pointer group shadow-inner"
                    >
                      {player.drawing ? (
                        <>
                          <img
                            src={player.drawing}
                            alt={`${player.name}'s drawing`}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <ZoomIn className="w-5 h-5 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 italic">
                          Drawing...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Tip Banner */}
          <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-[11px] text-purple-200">
            💡 <strong>Deduction Tip:</strong> Look at the 3 public words above. Which drawing doesn't match the majority of sketches?
          </div>
        </div>

      </div>

      {/* Zoom Modal for Live Drawings */}
      {zoomDrawing && (
        <div
          onClick={() => setZoomDrawing(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 p-4 rounded-3xl max-w-xl w-full relative shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-heading font-bold text-base text-white">
                {zoomDrawing.name}'s Live Drawing
              </h3>
              <button
                onClick={() => setZoomDrawing(null)}
                className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
              <img
                src={zoomDrawing.img}
                alt="Enlarged drawing"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
