import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playVote, playPop } from '../utils/audio';
import { Vote, CheckCircle2, ZoomIn, X, Users, AlertTriangle } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto my-6 px-4 animate-fade-in">
      {/* 3 Candidate Words Banner */}
      <CandidateWordsBanner
        roundData={gameState?.roundData}
        myWord={gameState?.myWord}
        showSecretHighlight={true}
      />

      {/* Voting Phase Header */}
      <div className="glass-panel-glow rounded-3xl p-5 sm:p-6 mb-6 border border-slate-700 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-red-500/20 rounded-2xl border border-red-500/40 text-red-400">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
              Voting & Investigation Phase
            </h2>
            <p className="text-xs text-slate-400">
              Inspect everyone's 2 answers and drawing. Cast your vote for the Imposter!
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 px-4 py-2 rounded-full border bg-slate-800 border-slate-700 text-slate-200 text-sm font-bold shrink-0">
          <Users className="w-4 h-4 text-purple-400" />
          <span>{votedCount} / {totalPlayers} Votes Cast</span>
        </div>
      </div>

      {/* Players Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gameState?.players?.map((player) => {
          const isMe = player.id === myId;
          const isCurrentSelected = selectedVotedId === player.id;

          return (
            <div
              key={player.id}
              className={`glass-panel rounded-3xl p-4 flex flex-col justify-between border transition relative overflow-hidden ${
                isCurrentSelected
                  ? 'border-red-500 ring-2 ring-red-500/40 bg-red-950/20'
                  : isMe
                  ? 'border-purple-500/40 bg-purple-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header: Avatar & Name */}
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-2xl border border-slate-700">
                  {player.avatar}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="font-heading font-bold text-white text-sm truncate">
                      {player.name}
                    </h3>
                    {isMe && (
                      <span className="text-[10px] bg-purple-500/30 text-purple-300 font-bold px-1.5 py-0.2 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {player.hasVoted ? '✓ Vote Submitted' : 'Thinking...'}
                  </span>
                </div>
              </div>

              {/* Card Body: Drawing & Answers */}
              <div className="my-3 space-y-3 flex-1">
                {/* Drawing Preview */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    🎨 Drawing
                  </span>
                  <div
                    onClick={() => player.drawing && setZoomDrawing({ img: player.drawing, name: player.name })}
                    className="relative aspect-[4/3] bg-white rounded-xl overflow-hidden border border-slate-700 cursor-pointer group shadow-inner"
                  >
                    {player.drawing ? (
                      <>
                        <img
                          src={player.drawing}
                          alt={`${player.name}'s drawing`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs italic">
                        No drawing
                      </div>
                    )}
                  </div>
                </div>

                {/* Question 1 Answer */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-purple-300 font-semibold mb-0.5 truncate" title={q1Text}>
                    Q1: {q1Text}
                  </div>
                  <p className="text-xs text-white font-medium italic">
                    "{player.answers?.q1 || '...'}"
                  </p>
                </div>

                {/* Question 2 Answer */}
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-pink-300 font-semibold mb-0.5 truncate" title={q2Text}>
                    Q2: {q2Text}
                  </div>
                  <p className="text-xs text-white font-medium italic">
                    "{player.answers?.q2 || '...'}"
                  </p>
                </div>
              </div>

              {/* Vote Button */}
              <div className="pt-2">
                {isMe ? (
                  <div className="text-center py-2 text-xs text-slate-500 italic bg-slate-900/50 rounded-xl">
                    (You cannot vote for yourself)
                  </div>
                ) : (
                  <button
                    onClick={() => handleCastVote(player.id)}
                    disabled={alreadyVoted}
                    className={`w-full py-2.5 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 ${
                      isCurrentSelected
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                        : alreadyVoted
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-600/80 to-rose-600/80 hover:from-red-500 hover:to-rose-500 text-white shadow-md active:scale-95'
                    }`}
                  >
                    {isCurrentSelected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Vote Cast</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Vote Imposter</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Zoom Modal */}
      {zoomDrawing && (
        <div
          onClick={() => setZoomDrawing(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 p-4 rounded-3xl max-w-2xl w-full relative shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-heading font-bold text-lg text-white">
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
