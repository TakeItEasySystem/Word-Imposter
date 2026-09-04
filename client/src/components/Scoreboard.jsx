import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { socket } from '../utils/socket';
import { playFanfare, playPop } from '../utils/audio';
import { Trophy, Skull, Shield, Award, ArrowRight, RotateCcw, Check, X, AlertTriangle, FileSearch, ShieldAlert } from 'lucide-react';

export default function Scoreboard({ gameState }) {
  const isGameOver = gameState?.state === 'GAME_OVER';
  const roundData = gameState?.roundData;
  const isHost = gameState?.hostId === gameState?.myPlayerId;

  const imposter = gameState?.players?.find(p => p.id === roundData?.imposterId);
  const imposterCaught = roundData?.imposterCaught;
  const totalBountyPool = roundData?.totalBountyPool || 300;

  // Sort players by cumulative score descending
  const sortedPlayers = [...(gameState?.players || [])].sort((a, b) => b.score - a.score);

  useEffect(() => {
    playFanfare();
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#0f172a', '#3b82f6', '#ef4444', '#10b981']
    });
  }, []);

  const handlePlayAgain = () => {
    playPop();
    socket.emit('play-again', { roomCode: gameState.code });
  };

  return (
    <div className="max-w-5xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      
      {/* Imposter Reveal Hero Banner */}
      <div className={`clean-card p-6 sm:p-8 text-center relative overflow-hidden border-2 ${
        imposterCaught
          ? 'border-emerald-300 bg-white'
          : 'border-red-300 bg-white'
      }`}>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-[11px] font-mono font-black tracking-widest text-slate-500 uppercase px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
            {isGameOver ? '📂 FINAL CASE DOSSIER • TOURNAMENT CONCLUSION' : `CASE REPORT • ROUND ${gameState.currentRound} VERDICT`}
          </span>
        </div>

        <div className="inline-block p-4 rounded-3xl bg-slate-100 border-2 border-slate-200 shadow-sm mb-3 text-5xl">
          {imposter?.avatar || '🕵️‍♂️'}
        </div>

        <h2 className="font-heading font-black text-2xl sm:text-4xl text-slate-900 mb-2">
          <span className="underline decoration-red-500 underline-offset-8">
            {imposter?.name}
          </span>{' '}
          was the Imposter!
        </h2>

        {/* Verdict Badge */}
        <div className="inline-flex items-center space-x-2 my-2">
          {imposterCaught ? (
            <span className="text-emerald-800 border-2 border-emerald-300 bg-emerald-50 px-4 py-2 rounded-full font-mono font-black text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2 shadow-sm">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>CASE CLOSED: DETECTIVES UNMASKED THE IMPOSTER (+100 PTS EACH)</span>
            </span>
          ) : (
            <span className="text-red-800 border-2 border-red-300 bg-red-50 px-4 py-2 rounded-full font-mono font-black text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2 shadow-sm">
              <Skull className="w-4 h-4 text-red-600" />
              <span>IMPOSTER ESCAPED! ALL BOUNTY POINTS (+{totalBountyPool} PTS) CAPTURED!</span>
            </span>
          )}
        </div>

        {/* Word Reveal Comparison Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6">
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-center shadow-sm">
            <span className="text-[10px] font-mono uppercase font-black text-slate-500 block mb-0.5">
              DETECTIVES' LEAD (3 PLAYERS)
            </span>
            <span className="font-heading font-black text-lg text-slate-900">
              {roundData?.commonWord || '???'}
            </span>
          </div>

          <div className="bg-red-50/60 border-2 border-red-200 rounded-2xl p-3.5 text-center shadow-sm">
            <span className="text-[10px] font-mono uppercase font-black text-red-600 block mb-0.5">
              IMPOSTER'S ROGUE LEAD (1 PLAYER)
            </span>
            <span className="font-heading font-black text-lg text-slate-900">
              {roundData?.imposterWord || '???'}
            </span>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3.5 text-center shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-0.5">
              UNASSIGNED CLUE
            </span>
            <span className="font-heading font-bold text-lg text-slate-400">
              {roundData?.unassignedWord || '???'}
            </span>
          </div>
        </div>

        {/* Next Round Action CTA */}
        {!isGameOver ? (
          <div className="mt-6 max-w-sm mx-auto">
            {isHost ? (
              <button
                onClick={() => { playPop(); socket.emit('next-round', { roomCode: gameState.code }); }}
                className="w-full py-3.5 btn-primary-dark flex items-center justify-center space-x-2 text-sm font-mono font-black uppercase tracking-wider rounded-2xl transition shadow-md"
              >
                <span>PROCEED TO NEXT CASE ROUND</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-xs font-mono font-bold animate-pulse">
                ⏳ Waiting for Lead Detective to advance case...
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Round Breakdown & Voting Tally */}
        <div className="clean-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-heading font-black text-base text-slate-900 flex items-center space-x-2">
              <Award className="w-5 h-5 text-slate-700" />
              <span>Round Points & Accusations</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-700 font-black bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              ROUND BOUNTY
            </span>
          </div>

          <div className="space-y-2.5">
            {gameState?.players?.map((player) => {
              const votedFor = gameState?.players?.find(p => p.id === player.vote);
              const isCorrectCivilianVote = player.role === 'CIVILIAN' && player.vote === roundData?.imposterId;
              const roundEarned = roundData?.roundScores?.[player.id] || 0;

              return (
                <div
                  key={player.id}
                  className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-2xl border border-slate-200 shrink-0 shadow-sm">
                      {player.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-bold text-slate-900 text-sm truncate">
                          {player.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-black border ${
                          player.role === 'IMPOSTER'
                            ? 'bg-red-100 border-red-200 text-red-700'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}>
                          {player.role === 'IMPOSTER' ? 'ROGUE IMPOSTER' : 'DETECTIVE'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                        <span>Accused: <strong className="text-slate-800">{votedFor ? votedFor.name : 'Nobody'}</strong></span>
                        {player.role === 'CIVILIAN' && (
                          isCorrectCivilianVote && imposterCaught ? (
                            <span className="text-emerald-600 flex items-center text-[10px] font-bold font-mono">
                              <Check className="w-3 h-3 ml-1" /> (+100)
                            </span>
                          ) : (
                            <span className="text-red-500 flex items-center text-[10px]">
                              <X className="w-3 h-3 ml-1" />
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-black text-slate-900">
                      +{roundEarned} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Leaderboard Standings */}
        <div className="clean-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="font-heading font-black text-base text-slate-900 flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Overall Case Standings</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-700 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              LEADERBOARD
            </span>
          </div>

          <div className="space-y-2.5">
            {sortedPlayers.map((player, rank) => {
              const medals = ["🥇", "🥈", "🥉"];
              const isFirst = rank === 0;

              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border-2 flex items-center justify-between transition ${
                    isFirst
                      ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-8 text-center font-mono font-black text-lg shrink-0">
                      {medals[rank] || `#${rank + 1}`}
                    </div>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-2xl border border-slate-200 shrink-0 shadow-sm">
                      {player.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-heading font-black text-slate-900 text-sm truncate">
                        {player.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {player.isBot ? '🤖 AI SUSPECT' : 'DETECTIVE'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-lg text-slate-900">
                      {player.score} <span className="text-xs font-normal text-slate-500">pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Game Over Actions */}
          {isGameOver && isHost && (
            <button
              onClick={handlePlayAgain}
              className="w-full mt-4 py-3.5 btn-primary-dark flex items-center justify-center space-x-2 font-mono font-black text-sm uppercase tracking-wider rounded-2xl transition shadow-md"
            >
              <RotateCcw className="w-5 h-5" />
              <span>START NEW CASE INVESTIGATION</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
