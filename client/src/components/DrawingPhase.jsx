import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { Palette, CheckCircle2, Users, Send, Eye, ZoomIn, X } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto my-6 px-4 animate-fade-in space-y-6">
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
              Drawing Round
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Draw your secret word: <strong className="text-purple-300">{gameState?.myWord}</strong>. Click <strong>Submit Drawing</strong> when finished!
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border bg-slate-800 border-slate-700 text-slate-200 text-sm font-bold shrink-0">
          <Users className="w-4 h-4 text-purple-400" />
          <span>{submittedCount} / {totalPlayers} Drawings Submitted</span>
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
              className="w-full max-w-lg mx-auto py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-heading font-bold rounded-2xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2 text-base"
            >
              <Send className="w-4 h-4" />
              <span>Submit My Drawing</span>
            </button>
          ) : (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-emerald-500/30 text-center text-xs text-emerald-300 flex items-center justify-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Drawing Submitted! Waiting for remaining players ({submittedCount}/{totalPlayers})...</span>
            </div>
          )}
        </div>

        {/* Right Column: Live Peek / Revealed Drawings (5 Cols on desktop) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <h3 className="font-heading font-bold text-white text-sm">
                Live Player Drawings
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              👀 Look for clues
            </span>
          </div>

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
                        Drawing in progress...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-xl text-[11px] text-purple-200">
            💡 <strong>Tip:</strong> Look at the 3 public words. Compare drawings to find who might have the imposter word!
          </div>
        </div>

      </div>

      {/* Zoom Modal */}
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
                {zoomDrawing.name}'s Drawing
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
