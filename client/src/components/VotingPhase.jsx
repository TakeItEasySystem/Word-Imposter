import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playVote, playPop } from '../utils/audio';
import { Vote, CheckCircle2, ZoomIn, X, Users, AlertTriangle, Search, FileText, Palette } from 'lucide-react';
import CandidateWordsBanner from './CandidateWordsBanner';

export default function VotingPhase({ gameState }) {
  const [selectedVotedId, setSelectedVotedId] = useState(null);
  const [zoomDrawing, setZoomDrawing] = useState(null);

  const myId = gameState?.myPlayerId;
  const myPlayer = gameState?.players?.find(p => p.id === myId);
  const alreadyVoted = myPlayer?.hasVoted || !!selectedVotedId;

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
    <div className="max-w-6xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      {/* 3 Candidate Words Banner */}
      <CandidateWordsBanner
        roundData={gameState?.roundData}
        myWord={gameState?.myWord}
        showSecretHighlight={true}
      />

      {/* Investigation Header */}
      <div className="game-panel-glow rounded-3xl p-5 sm:p-6 border-2 border-red-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-red-500/20 rounded-2xl border-2 border-red-500/50 flex items-center justify-center text-red-400 shrink-0 shadow-lg shadow-red-500/20">
            <Vote className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-black tracking-widest text-red-400 uppercase px-2 py-0.5 bg-red-950/80 rounded border border-red-800">
                PHASE 04 • TRIBUNAL
              </span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-wide mt-0.5">
              Voting & Investigation
            </h2>
            <p className="text-xs text-slate-300">
              Cross-examine drawings and answers against the 3 candidates. Find the Imposter!
            </p>
          </div>
        </div>

        {/* Live Vote Progress Counter */}
        <div className="flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl bg-slate-900 border-2 border-slate-700 text-white font-mono font-bold text-sm shrink-0 shadow-inner">
          <Users className="w-4 h-4 text-purple-400" />
          <span>VOTES: <span className="text-purple-300 font-black">{votedCount}</span> / {totalPlayers}</span>
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
                  ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/50 shadow-xl shadow-red-600/20'
                  : isMe
                  ? 'bg-slate-900/90 border-purple-500/50'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header: Avatar & Status */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-11 h-11 bg-slate-950 rounded-2xl flex items-center justify-center text-2xl border border-slate-700 shrink-0 shadow">
                    {player.avatar}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-heading font-black text-white text-sm truncate">
                        {player.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1 mt-0.5">
                      {isMe ? (
                        <span className="text-[9px] bg-purple-500/30 text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-500/40">
                          YOU
                        </span>
                      ) : null}
                      <span className={`text-[10px] font-mono ${hasVoted ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {hasVoted ? '✓ Voted' : 'Deliberating...'}
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
                    <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center space-x-1">
                      <Palette className="w-3 h-3 text-cyan-400 inline" />
                      <span>EXHIBIT A: SKETCH</span>
                    </span>
                    {player.drawing && (
                      <span className="text-[9px] text-cyan-400/80 font-mono">click to zoom</span>
                    )}
                  </div>

                  <div
                    onClick={() => player.drawing && setZoomDrawing({ img: player.drawing, name: player.name })}
                    className="relative aspect-[4/3] bg-white rounded-2xl overflow-hidden border-2 border-slate-700 cursor-pointer group shadow-inner transition hover:border-cyan-400"
                  >
                    {player.drawing ? (
                      <>
                        <img
                          src={player.drawing}
                          alt={`${player.name}'s drawing`}
                          className="w-full h-full object-contain p-1"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition backdrop-blur-[2px]">
                          <div className="px-2.5 py-1 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1 shadow-lg">
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic font-medium bg-slate-900">
                        No Sketch Submitted
                      </div>
                    )}
                  </div>
                </div>

                {/* Testimony 1 */}
                <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                  <div className="text-[9px] font-mono text-purple-400 font-bold uppercase mb-0.5 truncate" title={q1Text}>
                    Q1: {q1Text}
                  </div>
                  <p className="text-xs text-slate-100 font-medium italic">
                    "{player.answers?.q1 || '...'}"
                  </p>
                </div>

                {/* Testimony 2 */}
                <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                  <div className="text-[9px] font-mono text-pink-400 font-bold uppercase mb-0.5 truncate" title={q2Text}>
                    Q2: {q2Text}
                  </div>
                  <p className="text-xs text-slate-100 font-medium italic">
                    "{player.answers?.q2 || '...'}"
                  </p>
                </div>
              </div>

              {/* Vote CTA */}
              <div className="pt-2">
                {isMe ? (
                  <div className="text-center py-2.5 text-xs text-slate-500 font-mono italic bg-slate-950/60 rounded-xl border border-slate-800">
                    (Self-vote prohibited)
                  </div>
                ) : (
                  <button
                    onClick={() => handleCastVote(player.id)}
                    disabled={alreadyVoted}
                    className={`w-full py-2.5 rounded-2xl font-heading font-black text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 ${
                      isCurrentSelected
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 border-2 border-red-400'
                        : alreadyVoted
                        ? 'btn-3d-slate text-slate-500 opacity-60 cursor-not-allowed'
                        : 'btn-3d-red text-white'
                    }`}
                  >
                    {isCurrentSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>VOTE CONFIRMED</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>VOTE IMPOSTER</span>
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
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="game-panel rounded-3xl p-5 max-w-2xl w-full relative shadow-2xl space-y-4 border-2 border-purple-500/50"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-purple-400" />
                <h3 className="font-heading font-black text-lg text-white">
                  Evidence Sketch: <span className="text-purple-300">{zoomDrawing.name}</span>
                </h3>
              </div>
              <button
                onClick={() => setZoomDrawing(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center p-2 border-2 border-slate-700">
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
