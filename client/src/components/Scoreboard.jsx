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
      colors: ['#ffffff', '#a1a1aa', '#ef4444', '#000000']
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
          ? 'bg-black border-white shadow-white/10'
          : 'bg-black border-red-500 shadow-red-500/10'
      }`}>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase px-3 py-1 bg-zinc-950 rounded-full border border-zinc-800">
            {isGameOver ? '📂 FINAL CASE DOSSIER • TOURNAMENT CONCLUSION' : `CASE REPORT • ROUND ${gameState.currentRound} VERDICT`}
          </span>
        </div>

        <div className="inline-block p-4 rounded-3xl bg-zinc-950 border-2 border-zinc-700 shadow-2xl mb-3 text-5xl">
          {imposter?.avatar || '🕵️‍♂️'}
        </div>

        <h2 className="font-heading font-black text-2xl sm:text-4xl text-white mb-2">
          <span className="underline decoration-red-500 underline-offset-8">
            {imposter?.name}
          </span>{' '}
          was the Imposter!
        </h2>

        {/* Verdict Badge */}
        <div className="inline-flex items-center space-x-2 my-2">
          {imposterCaught ? (
            <span className="text-white border-2 border-white bg-zinc-900 px-4 py-1.5 rounded-full font-mono font-black text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2 shadow-lg">
              <Shield className="w-4 h-4 text-white" />
              <span>CASE CLOSED: DETECTIVES UNMASKED THE IMPOSTER (+100 PTS EACH)</span>
            </span>
          ) : (
            <span className="text-red-300 border-2 border-red-500 bg-red-950/80 px-4 py-1.5 rounded-full font-mono font-black text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2 shadow-lg shadow-red-900/30">
              <Skull className="w-4 h-4 text-red-400" />
              <span>IMPOSTER ESCAPED! ALL BOUNTY POINTS (+{totalBountyPool} PTS) CAPTURED!</span>
            </span>
          )}
        </div>

        {/* Word Reveal Comparison Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6">
          <div className="bg-zinc-950 border-2 border-zinc-700 rounded-2xl p-3.5 text-center shadow">
            <span className="text-[10px] font-mono uppercase font-black text-zinc-400 block mb-0.5">
              DETECTIVES' LEAD (3 PLAYERS)
            </span>
            <span className="font-heading font-black text-lg text-white">
              {roundData?.commonWord || '???'}
            </span>
          </div>

          <div className="bg-zinc-950 border-2 border-red-500/80 rounded-2xl p-3.5 text-center shadow">
            <span className="text-[10px] font-mono uppercase font-black text-red-400 block mb-0.5">
              IMPOSTER'S ROGUE LEAD (1 PLAYER)
            </span>
            <span className="font-heading font-black text-lg text-white">
              {roundData?.imposterWord || '???'}
            </span>
          </div>

          <div className="bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-3.5 text-center shadow">
            <span className="text-[10px] font-mono uppercase font-bold text-zinc-600 block mb-0.5">
              UNASSIGNED CLUE
            </span>
            <span className="font-heading font-bold text-lg text-zinc-500">
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
                className="w-full py-3.5 btn-noir-white flex items-center justify-center space-x-2 text-sm font-mono font-black uppercase tracking-wider rounded-2xl transition"
              >
                <span>PROCEED TO NEXT CASE ROUND</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 text-zinc-400 text-xs font-mono font-bold animate-pulse">
                ⏳ Waiting for Lead Detective to advance case...
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Round Breakdown & Voting Tally */}
        <div className="case-file-panel rounded-3xl p-5 border-2 border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="font-heading font-black text-base text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-white" />
              <span>Round Points & Accusations</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-300 font-black bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
              BOUNTY
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
                  className="bg-black p-3 rounded-2xl border border-zinc-800 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-2xl border border-zinc-800 shrink-0">
                      {player.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-bold text-white text-sm truncate">
                          {player.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black border ${
                          player.role === 'IMPOSTER'
                            ? 'bg-red-950 border-red-700 text-red-300'
                            : 'bg-zinc-900 border-zinc-700 text-white'
                        }`}>
                          {player.role === 'IMPOSTER' ? 'ROGUE IMPOSTER' : 'DETECTIVE'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono flex items-center space-x-1 mt-0.5">
                        <span>Accused: <strong className="text-white">{votedFor ? votedFor.name : 'Nobody'}</strong></span>
                        {player.role === 'CIVILIAN' && (
                          isCorrectCivilianVote && imposterCaught ? (
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
                    <div className="text-sm font-mono font-black text-white">
                      +{roundEarned} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Leaderboard Standings */}
        <div className="case-file-panel rounded-3xl p-5 border-2 border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="font-heading font-black text-base text-white flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-white" />
              <span>Overall Case Standings</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
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
                      ? 'bg-zinc-900 border-white shadow-lg'
                      : 'bg-black border-zinc-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-8 text-center font-mono font-black text-lg shrink-0">
                      {medals[rank] || `#${rank + 1}`}
                    </div>
                    <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-2xl border border-zinc-800 shrink-0">
                      {player.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-heading font-black text-white text-sm truncate">
                        {player.name}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {player.isBot ? '🤖 AI SUSPECT' : 'DETECTIVE'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-lg text-white">
                      {player.score} <span className="text-xs font-normal text-zinc-500">pts</span>
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
              className="w-full mt-4 py-3.5 btn-noir-white flex items-center justify-center space-x-2 font-mono font-black text-sm uppercase tracking-wider rounded-2xl transition"
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
