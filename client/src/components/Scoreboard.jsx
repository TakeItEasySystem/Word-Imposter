import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { socket } from '../utils/socket';
import { playFanfare, playPop } from '../utils/audio';
import { Trophy, Skull, Shield, Award, ArrowRight, RotateCcw, Check, X, Sparkles, Target } from 'lucide-react';

export default function Scoreboard({ gameState }) {
  const isGameOver = gameState?.state === 'GAME_OVER';
  const roundData = gameState?.roundData;
  const isHost = gameState?.hostId === gameState?.myPlayerId;

  const imposter = gameState?.players?.find(p => p.id === roundData?.imposterId);
  const imposterCaught = roundData?.imposterCaught;

  // Sort players by cumulative score descending
  const sortedPlayers = [...(gameState?.players || [])].sort((a, b) => b.score - a.score);

  useEffect(() => {
    playFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const handlePlayAgain = () => {
    playPop();
    socket.emit('play-again', { roomCode: gameState.code });
  };

  return (
    <div className="max-w-5xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      
      {/* Imposter Reveal Hero Banner */}
      <div className={`rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden border-2 shadow-2xl ${
        imposterCaught
          ? 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-500/10'
          : 'bg-slate-900/95 border-red-500/50 shadow-red-500/10'
      }`}>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-[10px] font-mono font-black tracking-widest text-slate-400 uppercase px-3 py-1 bg-slate-950 rounded-full border border-slate-800">
            {isGameOver ? '🏆 TOURNAMENT FINAL STANDINGS' : `ROUND ${gameState.currentRound} RESULTS`}
          </span>
        </div>

        <div className="inline-block p-4 rounded-3xl bg-slate-950 border-2 border-slate-700 shadow-2xl mb-3 text-5xl">
          {imposter?.avatar || '🕵️‍♂️'}
        </div>

        <h2 className="font-heading font-black text-2xl sm:text-4xl text-white mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
            {imposter?.name}
          </span>{' '}
          was the Imposter!
        </h2>

        {/* Verdict Badge */}
        <div className="inline-flex items-center space-x-2 my-2">
          {imposterCaught ? (
            <span className="text-emerald-300 border-2 border-emerald-500/50 bg-emerald-950/60 px-4 py-1.5 rounded-full font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-emerald-500/20">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Civilians Caught the Imposter!</span>
            </span>
          ) : (
            <span className="text-red-300 border-2 border-red-500/50 bg-red-950/60 px-4 py-1.5 rounded-full font-heading font-black text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-red-500/20">
              <Skull className="w-4 h-4 text-red-400" />
              <span>The Imposter Fooled Everyone!</span>
            </span>
          )}
        </div>

        {/* Word Reveal Comparison Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6">
          <div className="bg-slate-950/90 border-2 border-cyan-500/40 rounded-2xl p-3.5 text-center shadow">
            <span className="text-[10px] font-mono uppercase font-bold text-cyan-400 block mb-0.5">
              CIVILIANS (3 PLAYERS)
            </span>
            <span className="font-heading font-black text-lg text-white">
              {roundData?.commonWord || '???'}
            </span>
          </div>

          <div className="bg-slate-950/90 border-2 border-red-500/40 rounded-2xl p-3.5 text-center shadow">
            <span className="text-[10px] font-mono uppercase font-bold text-red-400 block mb-0.5">
              IMPOSTER (1 PLAYER)
            </span>
            <span className="font-heading font-black text-lg text-white">
              {roundData?.imposterWord || '???'}
            </span>
          </div>

          <div className="bg-slate-950/90 border-2 border-slate-800 rounded-2xl p-3.5 text-center shadow">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-0.5">
              UNASSIGNED DECK
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
                className="w-full py-3.5 btn-3d-emerald text-white font-heading font-black rounded-2xl transition flex items-center justify-center space-x-2 text-base tracking-wide"
              >
                <span>CONTINUE TO NEXT ROUND</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs font-mono font-bold animate-pulse">
                ⏳ Waiting for Host to advance to next round...
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Round Breakdown & Voting Tally */}
        <div className="game-panel rounded-3xl p-5 border-2 border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-heading font-black text-base text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span>Round Points & Accusations</span>
            </h3>
            <span className="text-[10px] font-mono text-purple-300 font-bold bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
              BREAKDOWN
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
                  className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-2xl border border-slate-800 shrink-0">
                      {player.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-bold text-white text-sm truncate">
                          {player.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold border ${
                          player.role === 'IMPOSTER'
                            ? 'bg-red-500/20 border-red-500/40 text-red-300'
                            : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        }`}>
                          {player.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <span>Voted: <strong className="text-slate-200">{votedFor ? votedFor.name : 'Nobody'}</strong></span>
                        {player.role === 'CIVILIAN' && (
                          isCorrectCivilianVote ? (
                            <span className="text-emerald-400 flex items-center text-[10px] font-bold font-mono">
                              <Check className="w-3 h-3 ml-1" /> (+100)
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center text-[10px]">
                              <X className="w-3 h-3 ml-1" />
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-black text-emerald-400">
                      +{roundEarned} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Leaderboard Standings */}
        <div className="game-panel rounded-3xl p-5 border-2 border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-heading font-black text-base text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Overall Leaderboard</span>
            </h3>
            <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
              STANDINGS
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
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/80 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-8 text-center font-heading font-black text-lg shrink-0">
                      {medals[rank] || `#${rank + 1}`}
                    </div>
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-2xl border border-slate-800 shrink-0">
                      {player.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-heading font-black text-white text-sm truncate">
                        {player.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {player.isBot ? '🤖 BOT' : 'PLAYER'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-lg text-amber-300">
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
              className="w-full mt-4 py-3.5 btn-3d-purple text-white font-heading font-black rounded-2xl transition flex items-center justify-center space-x-2 text-base tracking-wide"
            >
              <RotateCcw className="w-5 h-5" />
              <span>START NEW GAME</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
