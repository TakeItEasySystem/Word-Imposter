import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playVote, playPop } from '../utils/audio';
import { Vote, CheckCircle2, ZoomIn, X, Users, AlertTriangle, FileText, Palette, ShieldAlert, Clock } from 'lucide-react';
import PinnedWordBanner from './PinnedWordBanner';

export default function VotingPhase({ gameState }) {
  const [selectedVotedId, setSelectedVotedId] = useState(null);
  const [zoomDrawing, setZoomDrawing] = useState(null);

  const myId = gameState?.myPlayerId;
  const myPlayer = gameState?.players?.find(p => p.id === myId);
  const alreadyVoted = myPlayer?.hasVoted || !!selectedVotedId;
  const category = gameState?.roundData?.category || gameState?.theme || 'General Topic';

  const handleCastVote = (targetPlayerId) => {
    if (alreadyVoted || targetPlayerId === myId) return;
    playVote();
    setSelectedVotedId(targetPlayerId);
    socket.emit('cast-vote', {
      roomCode: gameState.code,
      targetPlayerId: targetPlayerId
    });
  };

  const q1Text = gameState?.roundData?.questions?.[0] || "Question 1";
  const q2Text = gameState?.roundData?.questions?.[1] || "Question 2";

  const totalPlayers = gameState?.players?.length || 0;
  const votedCount = gameState?.players?.filter(p => p.hasVoted).length || 0;

  return (
    <div className="max-w-6xl mx-auto my-4 px-4 animate-fade-in space-y-4">
      {/* Pinned Secret Word Bar */}
      <PinnedWordBanner myWord={gameState?.myWord} category={category} />

      {/* Investigation Header */}
      <div className="clean-card rounded-3xl p-5 sm:p-6 border-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">
              Vote for the Imposter
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Review everyone's sketch & clues. Accuse the player whose clues do not match!
            </p>
          </div>
        </div>

        {/* Live Vote Progress Counter & Timer */}
        <div className="flex items-center space-x-2.5 shrink-0">
          {gameState?.timerSeconds > 0 && (
            <div className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-2xl border text-xs font-mono font-black transition ${
              gameState.timerSeconds <= 5
                ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-md'
                : gameState.timerSeconds <= 10
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-slate-100 text-slate-800 border-slate-300'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>⏱️ {gameState.timerSeconds}s</span>
            </div>
          )}

          <div className="flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-sm">
            <Users className="w-4 h-4 text-slate-600" />
            <span>VOTES CAST: <span className="text-slate-900 font-extrabold">{votedCount}</span> / {totalPlayers}</span>
          </div>
        </div>
      </div>

      {/* Players Dossier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gameState?.players?.map((player) => {
          const isMe = player.id === myId;
          const isCurrentSelected = selectedVotedId === player.id;
          const hasVoted = player.hasVoted;

          return (
            <div
              key={player.id}
              className={`rounded-3xl p-4 flex flex-col justify-between border-2 transition relative overflow-hidden ${
                isCurrentSelected
                  ? 'bg-red-50 border-red-500 ring-2 ring-red-500/30 shadow-lg'
                  : isMe
                  ? 'bg-white border-slate-900 shadow-md'
                  : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              {/* Card Header: Avatar & Status */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl border border-slate-200 shrink-0 shadow-inner">
                    {player.avatar}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-heading font-bold text-slate-900 text-sm truncate">
                        {player.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1 mt-0.5">
                      {isMe ? (
                        <span className="text-[9px] font-mono bg-slate-900 text-white font-bold px-1.5 py-0.2 rounded">
                          YOU
                        </span>
                      ) : null}
                      <span className={`text-[10px] font-mono ${hasVoted ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                        {hasVoted ? '✓ Accusation Cast' : 'Deliberating...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dossier Evidence Body */}
              <div className="my-3.5 space-y-3 flex-1">
                {/* Drawing Exhibit */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase flex items-center space-x-1">
                      <Palette className="w-3 h-3 text-slate-700 inline" />
                      <span>EXHIBIT A: SKETCH</span>
                    </span>
                    {player.drawing && (
                      <span className="text-[9px] text-slate-400 font-mono">click to zoom</span>
                    )}
                  </div>

                  <div
                    onClick={() => player.drawing && setZoomDrawing({ img: player.drawing, name: player.name })}
                    className="relative aspect-[4/3] bg-white rounded-2xl overflow-hidden border-2 border-slate-200 cursor-pointer group shadow-xs transition hover:border-slate-400"
                  >
                    {player.drawing ? (
                      <>
                        <img
                          src={player.drawing}
                          alt={`${player.name}'s drawing`}
                          className="w-full h-full object-contain p-1"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition backdrop-blur-[2px]">
                          <div className="px-3 py-1.5 bg-white text-slate-900 font-mono font-bold text-xs rounded-xl flex items-center space-x-1 shadow-md">
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>INSPECT</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic font-mono bg-slate-50">
                        No Sketch Logged
                      </div>
                    )}
                  </div>
                </div>

                {/* Testimony 1 */}
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <div className="text-[9px] font-mono text-slate-500 font-bold uppercase mb-0.5 truncate" title={q1Text}>
                    Q1: {q1Text}
                  </div>
                  <p className="text-xs text-slate-800 font-mono italic">
                    "{player.answers?.q1 || '...'}"
                  </p>
                </div>

                {/* Testimony 2 */}
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <div className="text-[9px] font-mono text-slate-500 font-bold uppercase mb-0.5 truncate" title={q2Text}>
                    Q2: {q2Text}
                  </div>
                  <p className="text-xs text-slate-800 font-mono italic">
                    "{player.answers?.q2 || '...'}"
                  </p>
                </div>
              </div>

              {/* Vote CTA */}
              <div className="pt-2">
                {isMe ? (
                  <div className="text-center py-2.5 text-xs text-slate-400 font-mono italic bg-slate-50 rounded-xl border border-slate-200">
                    (Self-accusation barred)
                  </div>
                ) : (
                  <button
                    onClick={() => handleCastVote(player.id)}
                    disabled={alreadyVoted}
                    className={`w-full py-2.5 rounded-2xl font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 ${
                      isCurrentSelected
                        ? 'bg-red-600 text-white shadow-md border-2 border-red-500'
                        : alreadyVoted
                        ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed border border-slate-200'
                        : 'btn-danger-action text-white'
                    }`}
                  >
                    {isCurrentSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ACCUSED</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>ACCUSE SUSPECT 🚨</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {zoomDrawing && (
        <div
          onClick={() => setZoomDrawing(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="clean-card rounded-3xl p-5 max-w-2xl w-full relative shadow-2xl space-y-4 border-2 border-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-slate-800" />
                <h3 className="font-heading font-bold text-lg text-slate-900">
                  Evidence Sketch: <span className="font-mono text-slate-600">{zoomDrawing.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setZoomDrawing(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center p-2 border-2 border-slate-200">
              <img
                src={zoomDrawing.img}
                alt="Enlarged evidence drawing"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
