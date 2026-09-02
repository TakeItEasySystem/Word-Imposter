import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { socket } from '../utils/socket';
import { playFanfare, playPop } from '../utils/audio';
import { Trophy, Skull, Shield, Award, ArrowRight, RotateCcw, Check, X } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      
      {/* Imposter Reveal Hero Banner */}
      <div className={`glass-panel-glow rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden border shadow-2xl ${
        imposterCaught ? 'border-blue-500/50 bg-blue-950/20' : 'border-red-500/50 bg-red-950/20'
      }`}>
        <div className="inline-block p-4 rounded-3xl bg-slate-900/90 border border-slate-700 shadow-xl mb-3 text-5xl">
          {imposter?.avatar || '🕵️‍♂️'}
        </div>

        <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
          {isGameOver ? 'Final Game Results' : `Round ${gameState.currentRound} Results`}
        </div>

        <h2 className="font-heading font-black text-2xl sm:text-3xl text-white mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {imposter?.name}
          </span>{' '}
          was the Imposter!
        </h2>

        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider my-2 border">
          {imposterCaught ? (
            <span className="text-blue-300 border-blue-500/40 bg-blue-900/40 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Civilians Caught the Imposter!</span>
            </span>
          ) : (
            <span className="text-red-300 border-red-500/40 bg-red-900/40 px-3 py-1 rounded-full flex items-center space-x-1.5">
              <Skull className="w-4 h-4 text-red-400" />
              <span>The Imposter Evaded Detection!</span>
            </span>
          )}
        </div>

        {/* Word Reveal Comparison Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6">
          <div className="bg-blue-950/40 border border-blue-500/40 rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-300 block mb-0.5">
              Majority Word (3 Players)
            </span>
            <span className="font-heading font-bold text-lg text-white">
              {roundData?.commonWord || '???'}
            </span>
          </div>

          <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-red-300 block mb-0.5">
              Imposter Word (1 Player)
            </span>
            <span className="font-heading font-bold text-lg text-white">
              {roundData?.imposterWord || '???'}
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
              Unassigned Word
            </span>
            <span className="font-heading font-bold text-lg text-slate-300">
              {roundData?.unassignedWord || '???'}
            </span>
          </div>
        </div>

        {/* Next Round Countdown or Game Over CTA */}
        {!isGameOver && (
          <div className="mt-6 text-xs text-purple-300 flex items-center justify-center space-x-1.5 font-semibold">
            <span>Next round starting in {gameState?.timerSeconds}s</span>
            <ArrowRight className="w-4 h-4 animate-pulse" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Round Breakdown & Voting Tally */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
          <h3 className="font-heading font-bold text-base text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span>Round Points & Votes</span>
          </h3>

          <div className="space-y-2.5">
            {gameState?.players?.map((player) => {
              const votedFor = gameState?.players?.find(p => p.id === player.vote);
              const isCorrectCivilianVote = player.role === 'CIVILIAN' && player.vote === roundData?.imposterId;
              const roundEarned = roundData?.roundScores?.[player.id] || 0;

              return (
                <div
                  key={player.id}
                  className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{player.avatar}</div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-semibold text-white text-sm">
                          {player.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          player.role === 'IMPOSTER' ? 'bg-red-500/30 text-red-300' : 'bg-blue-500/30 text-blue-300'
                        }`}>
                          {player.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <span>Voted: <strong>{votedFor ? votedFor.name : 'Nobody'}</strong></span>
                        {player.role === 'CIVILIAN' && (
                          isCorrectCivilianVote ? (
                            <span className="text-emerald-400 flex items-center text-[10px] font-bold">
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

                  <div className="text-right">
                    <div className="text-sm font-heading font-bold text-emerald-400">
                      +{roundEarned} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overall Leaderboard Standings */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
          <h3 className="font-heading font-bold text-base text-white flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Overall Leaderboard</span>
          </h3>

          <div className="space-y-2.5">
            {sortedPlayers.map((player, rank) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                    rank === 0
                      ? 'bg-amber-950/30 border-amber-500/40 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 text-center font-heading font-bold text-base">
                      {medals[rank] || `#${rank + 1}`}
                    </div>
                    <div className="text-2xl">{player.avatar}</div>
                    <div>
                      <div className="font-heading font-bold text-white text-sm">
                        {player.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {player.isBot ? '🤖 AI Bot' : 'Human Player'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-heading font-black text-lg text-amber-300">
                      {player.score} <span className="text-xs font-normal text-slate-400">pts</span>
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
              className="w-full mt-4 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-bold rounded-2xl shadow-xl shadow-purple-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play New Game</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
