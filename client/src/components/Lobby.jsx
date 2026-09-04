import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { Users, Play, Copy, Check, Plus, Trash2, Crown, Bot, Sparkles, HelpCircle, Shield, Dice5 } from 'lucide-react';

const AVATARS = ['🦊', '🐼', '🤖', '🚀', '🐯', '🦄', '🐙', '🐸', '🦉', '🦁', '🐲', '🐨'];

export default function Lobby({ gameState }) {
  const [tab, setTab] = useState('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');
  const [rounds, setRounds] = useState(3);
  const [selectedTheme, setSelectedTheme] = useState('Random Mix');
  const [customThemeInput, setCustomThemeInput] = useState('');
  const [copied, setCopied] = useState(false);

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

  const handleThemeChange = (themeName) => {
    playPop();
    setSelectedTheme(themeName);
    if (themeName !== 'Custom') {
      socket.emit('update-theme', { roomCode: gameState.code, theme: themeName });
    }
  };

  const handleCustomThemeSubmit = (e) => {
    e.preventDefault();
    if (!customThemeInput.trim()) return;
    playPop();
    socket.emit('update-theme', { roomCode: gameState.code, theme: customThemeInput.trim() });
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

  // -------------------------------------------------------------
  // NOT IN ROOM VIEW (Create / Join Screen)
  // -------------------------------------------------------------
  if (!isInsideRoom) {
    return (
      <div className="max-w-md mx-auto my-8 px-4 animate-fade-in">
        
        {/* Game Logo & Intro */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-[#1e1b4b] border-2 border-purple-500 rounded-3xl shadow-2xl shadow-purple-900/50 mb-4 transform hover:scale-105 transition">
            <span className="text-5xl">🕵️‍♂️</span>
          </div>
          <h2 className="text-4xl font-heading font-black text-white tracking-tight">
            WORD IMPOSTER
          </h2>
          <p className="text-slate-400 mt-2 text-xs sm:text-sm font-medium">
            3 words on screen. 3 Civilians get one word. 1 Imposter gets another. Can you deduce who is lying?
          </p>
        </div>

        {/* Card Container */}
        <div className="game-panel-glow p-6 sm:p-8 rounded-3xl shadow-2xl">
          
          {/* Tabs */}
          <div className="flex bg-[#0b0f19] p-1.5 rounded-2xl mb-6 border-2 border-slate-800">
            <button
              onClick={() => { setTab('create'); playPop(); }}
              className={`flex-1 py-3 rounded-xl font-heading font-bold text-sm transition ${
                tab === 'create'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Game
            </button>
            <button
              onClick={() => { setTab('join'); playPop(); }}
              className={`flex-1 py-3 rounded-xl font-heading font-bold text-sm transition ${
                tab === 'join'
                  ? 'bg-purple-600 text-white shadow-lg'
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Choose Your Avatar:
              </label>
              <div className="grid grid-cols-6 gap-2 bg-[#0b0f19] p-3 rounded-2xl border-2 border-slate-800">
                {AVATARS.map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => { setSelectedAvatar(av); playPop(); }}
                    className={`h-11 rounded-xl text-2xl flex items-center justify-center transition ${
                      selectedAvatar === av
                        ? 'bg-purple-600 scale-110 shadow-md ring-2 ring-purple-400'
                        : 'hover:bg-slate-800/80'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Your Nickname:
              </label>
              <input
                type="text"
                placeholder="e.g. Detective Rishi, Ace, Sherlock"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                required
                className="w-full bg-[#0b0f19] border-2 border-slate-700 rounded-2xl px-4 py-3.5 text-white font-medium placeholder-slate-500 focus:outline-none focus:border-purple-500 transition text-base"
              />
            </div>

            {/* Room Code Input (If Join Tab) */}
            {tab === 'join' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  4-Letter Room Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. X9K2"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  required
                  className="w-full bg-[#0b0f19] border-2 border-purple-500/50 rounded-2xl px-4 py-3.5 text-white font-mono font-bold text-center tracking-widest text-xl placeholder-slate-600 focus:outline-none focus:border-purple-400 transition uppercase"
                />
              </div>
            )}

            {/* Action 3D Button */}
            <button
              type="submit"
              className="w-full py-4 text-white font-heading font-black text-lg rounded-2xl btn-3d-purple flex items-center justify-center space-x-2 mt-2"
            >
              <span>{tab === 'create' ? 'Create New Lobby 🚀' : 'Enter Lobby 🔑'}</span>
            </button>
          </form>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // IN LOBBY VIEW (Waiting Room)
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      
      {/* Lobby Room Header */}
      <div className="game-panel p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-slate-800">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Lobby Active • Share Code with Friends
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
            Party Waiting Room
          </h2>
        </div>

        {/* Room Code Card */}
        <div className="flex items-center space-x-3 bg-[#0b0f19] border-2 border-purple-500/60 px-5 py-3 rounded-2xl shadow-xl">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block leading-none mb-1">
              ROOM CODE
            </span>
            <span className="text-2xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 tracking-wider">
              {gameState.code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition shadow"
            title="Copy Code to Clipboard"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Players List (Left) + Game Settings (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Player Slots (2 Cols on desktop) */}
        <div className="md:col-span-2 game-panel p-6 rounded-3xl border-2 border-slate-800 space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="font-heading font-bold text-lg text-white">
                Joined Players ({playerCount}/8)
              </h3>
            </div>

            {isHost && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAddBot}
                  className="flex items-center space-x-1.5 btn-3d-slate text-xs text-slate-200 px-3 py-1.5 rounded-xl font-bold"
                  title="Add 1 AI Demo Bot"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Bot</span>
                </button>
                {playerCount < 4 && (
                  <button
                    onClick={handleFillBots}
                    className="flex items-center space-x-1.5 btn-3d-purple text-xs text-white px-3 py-1.5 rounded-xl font-bold"
                    title="Quickly fill to 4 players"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ Auto-Fill 4</span>
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
                  className={`p-4 rounded-2xl flex items-center justify-between border-2 transition ${
                    isMe
                      ? 'border-purple-500 bg-purple-950/30 shadow-lg'
                      : 'border-slate-800 bg-[#0b0f19]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl border-2 border-slate-700 shadow-inner">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-bold text-white text-base truncate">
                          {player.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] bg-purple-500/30 text-purple-300 font-extrabold px-1.5 py-0.2 rounded border border-purple-500/40">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs mt-0.5">
                        {player.isHost && (
                          <span className="flex items-center text-amber-400 font-bold text-[11px]">
                            <Crown className="w-3.5 h-3.5 mr-1" /> Host
                          </span>
                        )}
                        {player.isBot && (
                          <span className="flex items-center text-cyan-400 font-bold text-[11px]">
                            <Bot className="w-3.5 h-3.5 mr-1" /> AI Player
                          </span>
                        )}
                        {!player.isHost && !player.isBot && (
                          <span className="text-emerald-400 font-bold text-[11px]">✓ Ready</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kick Bot */}
                  {isHost && player.isBot && (
                    <button
                      onClick={() => handleRemoveBot(player.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
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
            <div className="p-3.5 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl text-amber-300 text-xs font-bold flex items-center space-x-2">
              <span>⚠️ Need at least 3 players (or bots) to start the game!</span>
            </div>
          )}
        </div>

        {/* Right Column: Settings & Host Actions */}
        <div className="space-y-4">
          <div className="game-panel p-6 rounded-3xl border-2 border-slate-800 space-y-4">
            <h3 className="font-heading font-bold text-base text-white border-b border-slate-800 pb-2">
              Game Settings
            </h3>

            {/* Rounds Selector */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                <span>Rounds to Play:</span>
                <span className="text-purple-400 font-black text-sm">{gameState.totalRounds || rounds} Rounds</span>
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
              <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-1">
                <span>1 Rnd</span>
                <span>3 Rnds</span>
                <span>5 Rnds</span>
              </div>
            </div>

            {/* AI Theme Selector */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold text-slate-300 mb-2">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Round Theme:</span>
                </span>
                <span className="text-purple-300 font-black text-[11px] bg-purple-950 border border-purple-700/50 px-2.5 py-0.5 rounded-full">
                  {gameState.theme || selectedTheme}
                </span>
              </div>

              {isHost ? (
                <div className="space-y-2 mt-2">
                  <select
                    value={selectedTheme}
                    onChange={(e) => handleThemeChange(e.target.value)}
                    className="w-full bg-[#0b0f19] border-2 border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                  >
                    <option value="Random Mix">🎲 Random Surprise Mix</option>
                    <option value="Gen Z Memes & Internet Lore">💀 Gen Z Memes & Brainrot Lore</option>
                    <option value="Gen Z Slang & Dating">💬 Gen Z Slang & Situationships</option>
                    <option value="Social Media & Screen Time">📱 Social Media & Screen Addiction</option>
                    <option value="College & Late Night Life">🍕 College & Late Night 2 AM Life</option>
                    <option value="Streamers & Content Creators">🔥 Streamers, YouTubers & Influencers</option>
                    <option value="Pop & Music Icons">🎵 Viral Music & Pop/Hip-Hop Icons</option>
                    <option value="Food & Street Snacks">🍕 Food & Street Snacks</option>
                    <option value="Cinema & Pop Culture">🎬 Cinema & Pop Culture</option>
                    <option value="Superheroes & Anime">🦸 Superheroes & Anime</option>
                    <option value="Sports & Cricket">🏏 Sports & Cricket</option>
                    <option value="Tech & Gaming">💻 Tech & Gaming</option>
                    <option value="Custom">✍️ Custom Theme (Type your own)...</option>
                  </select>

                  {selectedTheme === 'Custom' && (
                    <form onSubmit={handleCustomThemeSubmit} className="flex space-x-2 pt-1">
                      <input
                        type="text"
                        placeholder="e.g. Hogwarts, K-Pop, 90s Cars..."
                        value={customThemeInput}
                        onChange={(e) => setCustomThemeInput(e.target.value)}
                        maxLength={40}
                        className="flex-1 bg-[#0b0f19] border-2 border-purple-500/50 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 btn-3d-purple text-white rounded-xl text-xs font-bold"
                      >
                        Set
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-[#0b0f19] rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  Theme chosen by host: <strong className="text-purple-300">{gameState.theme || 'Random Mix'}</strong>
                </div>
              )}
            </div>

            {/* Start Button */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={playerCount < 3}
                className="w-full py-4 text-white font-heading font-black rounded-2xl text-lg btn-3d-emerald flex items-center justify-center space-x-2 mt-4"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START GAME</span>
              </button>
            ) : (
              <div className="p-4 bg-[#0b0f19] rounded-2xl border-2 border-slate-800 text-center text-slate-400 text-sm font-semibold animate-pulse mt-4">
                Waiting for host to start the game...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
