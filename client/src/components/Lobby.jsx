import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { Users, Crown, Bot, Play, UserPlus, Trash2, Sparkles, Copy, Check } from 'lucide-react';

const AVATARS = ["🦊", "🐼", "🤖", "🚀", "🐯", "🦄", "🐙", "🐸", "🦉", "🦁", "🐲", "🐨"];

export default function Lobby({ gameState }) {
  const [tab, setTab] = useState('create'); // 'create' or 'join'
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [copied, setCopied] = useState(false);
  const [rounds, setRounds] = useState(3);

  const isInsideRoom = !!gameState?.code;
  const isHost = gameState?.hostId === gameState?.myPlayerId;
  const playerCount = gameState?.players?.length || 0;

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    playPop();
    socket.emit('create-room', { playerName: playerName.trim(), avatar: selectedAvatar });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCodeInput.trim()) return;
    playPop();
    socket.emit('join-room', {
      roomCode: roomCodeInput.trim().toUpperCase(),
      playerName: playerName.trim(),
      avatar: selectedAvatar
    });
  };

  const handleAddBot = () => {
    playPop();
    socket.emit('add-bot', { roomCode: gameState.code });
  };

  const handleFillBots = () => {
    playPop();
    const needed = Math.max(0, 4 - (gameState?.players?.length || 0));
    for (let i = 0; i < needed; i++) {
      socket.emit('add-bot', { roomCode: gameState.code });
    }
  };

  const handleRemoveBot = (botId) => {
    playPop();
    socket.emit('remove-bot', { roomCode: gameState.code, botId });
  };

  const handleStartGame = () => {
    playPop();
    socket.emit('start-game', { roomCode: gameState.code });
  };

  const handleRoundsChange = (e) => {
    const r = parseInt(e.target.value);
    setRounds(r);
    socket.emit('update-settings', { roomCode: gameState.code, totalRounds: r });
  };

  const handleCopyCode = () => {
    if (gameState?.code) {
      navigator.clipboard.writeText(gameState.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // NOT IN ROOM VIEW (Create / Join Screen)
  if (!isInsideRoom) {
    return (
      <div className="max-w-md mx-auto my-8 px-4">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-3xl shadow-xl shadow-purple-600/30 mb-4 animate-bounce-subtle">
            <span className="text-5xl">🕵️‍♂️</span>
          </div>
          <h2 className="text-3xl font-heading font-bold text-white tracking-wide">
            Word Imposter
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            3 words on screen. 3 Civilians get one word. 1 Imposter gets another. Can you catch them?
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl shadow-2xl border border-slate-700/60">
          {/* Tabs */}
          <div className="flex bg-slate-900/80 p-1 rounded-2xl mb-6 border border-slate-800">
            <button
              onClick={() => { setTab('create'); playPop(); }}
              className={`flex-1 py-2.5 rounded-xl font-heading font-medium text-sm transition ${
                tab === 'create'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Game
            </button>
            <button
              onClick={() => { setTab('join'); playPop(); }}
              className={`flex-1 py-2.5 rounded-xl font-heading font-medium text-sm transition ${
                tab === 'join'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Join Game
            </button>
          </div>

          {/* Form */}
          <form onSubmit={tab === 'create' ? handleCreateRoom : handleJoinRoom} className="space-y-5">
            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Choose Avatar
              </label>
              <div className="grid grid-cols-6 gap-2 p-2 bg-slate-900/50 rounded-2xl border border-slate-800">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => { setSelectedAvatar(av); playPop(); }}
                    className={`h-11 rounded-xl text-2xl flex items-center justify-center transition transform active:scale-95 ${
                      selectedAvatar === av
                        ? 'bg-purple-600/40 border-2 border-purple-400 scale-105 shadow-md shadow-purple-500/20'
                        : 'hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Your Nickname
              </label>
              <input
                type="text"
                placeholder="e.g. Detective Holmes"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={15}
                required
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition font-medium"
              />
            </div>

            {/* Room Code Input (Join Tab only) */}
            {tab === 'join' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Room Code (4 Letters)
                </label>
                <input
                  type="text"
                  placeholder="e.g. WXYZ"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 uppercase tracking-widest text-center font-mono font-bold text-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-semibold rounded-xl shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 text-base flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>{tab === 'create' ? 'Create Lobby' : 'Enter Room'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // INSIDE LOBBY VIEW
  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      {/* Top Banner: Room Code Info */}
      <div className="glass-panel-glow p-6 rounded-3xl text-center relative overflow-hidden mb-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl"></div>

        <p className="text-slate-400 font-medium text-xs tracking-widest uppercase mb-1">
          Share this Room Code with friends
        </p>
        <div className="inline-flex items-center space-x-4 bg-slate-900/90 px-6 py-2.5 rounded-2xl border border-purple-500/40 my-2">
          <span className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {gameState.code}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-xl text-purple-300 transition"
            title="Copy Code"
          >
            {copied ? <Check className="w-6 h-6 text-emerald-400" /> : <Copy className="w-6 h-6" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          {playerCount} of 8 players joined {playerCount < 4 ? `(4 recommended)` : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-white flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Players in Lobby ({playerCount})</span>
            </h3>

            {isHost && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAddBot}
                  disabled={playerCount >= 8}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-purple-300 px-3 py-1.5 rounded-xl border border-purple-500/20 transition disabled:opacity-50"
                  title="Add single AI bot"
                >
                  <Bot className="w-4 h-4" />
                  <span>+ Add Bot</span>
                </button>
                {playerCount < 4 && (
                  <button
                    onClick={handleFillBots}
                    className="flex items-center space-x-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-xs text-purple-300 px-3 py-1.5 rounded-xl border border-purple-500/40 transition font-medium"
                    title="Quickly fill to 4 players with bots"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Auto-Fill 4</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Player Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gameState.players.map((player) => {
              const isMe = player.id === gameState.myPlayerId;
              return (
                <div
                  key={player.id}
                  className={`glass-panel p-4 rounded-2xl flex items-center justify-between border transition ${
                    isMe ? 'border-purple-500/60 bg-purple-950/20' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-800/80 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-700/50">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-semibold text-white text-base">
                          {player.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] bg-purple-500/30 text-purple-300 font-bold px-1.5 py-0.5 rounded-md">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                        {player.isHost && (
                          <span className="flex items-center text-amber-400 font-medium">
                            <Crown className="w-3.5 h-3.5 mr-1" /> Host
                          </span>
                        )}
                        {player.isBot && (
                          <span className="flex items-center text-cyan-400 font-medium">
                            <Bot className="w-3.5 h-3.5 mr-1" /> AI Player
                          </span>
                        )}
                        {!player.isHost && !player.isBot && <span>Ready</span>}
                      </div>
                    </div>
                  </div>

                  {/* Host can kick bots */}
                  {isHost && player.isBot && (
                    <button
                      onClick={() => handleRemoveBot(player.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                      title="Remove Bot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {playerCount < 3 && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs flex items-center space-x-2">
              <span>⚠️ At least 3 players (or bots) are required to start the game!</span>
            </div>
          )}
        </div>

        {/* Right Column: Settings & Host Actions */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-heading font-bold text-base text-white">Game Settings</h3>

            {/* Rounds Selector */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-400 mb-1.5">
                <span>Rounds to Play:</span>
                <span className="text-purple-400 font-bold text-sm">{gameState.totalRounds || rounds} Rounds</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                disabled={!isHost}
                value={gameState.totalRounds || rounds}
                onChange={handleRoundsChange}
                className="w-full accent-purple-500 cursor-pointer disabled:opacity-60"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>1 Round</span>
                <span>3 Rounds</span>
                <span>5 Rounds</span>
              </div>
            </div>

            {/* Quick Rules Preview */}
            <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300">Quick Rules:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>3 words are shown publicly to everyone.</li>
                <li>3 Civilians get Word A; 1 Imposter gets Word B.</li>
                <li>Answer 2 questions without blowing your cover!</li>
                <li>Draw your word on canvas & vote out the imposter.</li>
              </ul>
            </div>

            {/* Start Button */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={playerCount < 3}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 text-white font-heading font-bold rounded-2xl shadow-xl shadow-emerald-500/20 transition transform hover:-translate-y-0.5 active:translate-y-0 text-lg flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Start Game</span>
              </button>
            ) : (
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-slate-400 text-sm animate-pulse">
                Waiting for host to start the game...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
