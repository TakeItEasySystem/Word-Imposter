import React, { useState } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { Users, Play, Copy, Check, Plus, Trash2, Crown, Bot, Sparkles, HelpCircle, Shield, Dice5, FileText, Search } from 'lucide-react';

const AVATARS = ['🕵️', '🕵️‍♀️', '🦹', '🕶️', '🔍', '💼', '📜', '📁', '🦊', '🤖', '💀', '🎩'];

export default function Lobby({ gameState }) {
  const [tab, setTab] = useState('create');
  const [playerName, setPlayerName] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🕵️');
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
          <div className="inline-block p-4 bg-black border-2 border-white rounded-3xl shadow-2xl mb-4 transform hover:scale-105 transition">
            <span className="text-5xl">🕵️‍♂️</span>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-1">
            <span className="text-[10px] font-mono font-black text-red-400 bg-red-950/80 px-2.5 py-0.5 rounded border border-red-800 uppercase tracking-widest">
              TOP SECRET DOSSIER
            </span>
          </div>
          <h2 className="text-4xl font-heading font-black text-white tracking-tight">
            WORD IMPOSTER
          </h2>
          <p className="text-zinc-400 mt-2 text-xs sm:text-sm font-mono font-medium">
            3 Clues on the Evidence Board. 3 Detectives know the true word. 1 Rogue Imposter is bluffing.
          </p>
        </div>

        {/* Card Container */}
        <div className="case-file-panel p-6 sm:p-8 rounded-3xl shadow-2xl border-2 border-zinc-700">
          
          {/* Tabs */}
          <div className="flex bg-black p-1.5 rounded-2xl mb-6 border-2 border-zinc-800 font-mono">
            <button
              onClick={() => { setTab('create'); playPop(); }}
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                tab === 'create'
                  ? 'bg-white text-black shadow-lg font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Open New Case
            </button>
            <button
              onClick={() => { setTab('join'); playPop(); }}
              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                tab === 'join'
                  ? 'bg-white text-black shadow-lg font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Join Case
            </button>
          </div>

          {/* Form */}
          <form onSubmit={tab === 'create' ? handleCreateRoom : handleJoinRoom} className="space-y-5">
            
            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Agent / Suspect Identity:
              </label>
              <div className="grid grid-cols-6 gap-2 bg-black p-3 rounded-2xl border-2 border-zinc-800">
                {AVATARS.map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => { setSelectedAvatar(av); playPop(); }}
                    className={`h-11 rounded-xl text-2xl flex items-center justify-center transition ${
                      selectedAvatar === av
                        ? 'bg-zinc-800 scale-110 shadow-md ring-2 ring-white'
                        : 'hover:bg-zinc-900'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname Input */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Detective / Suspect Alias:
              </label>
              <input
                type="text"
                placeholder="e.g. Agent Rishi, Sherlock, Spade"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                required
                className="w-full bg-black border-2 border-zinc-700 rounded-2xl px-4 py-3.5 text-white font-medium placeholder-zinc-600 focus:outline-none focus:border-white transition text-base"
              />
            </div>

            {/* Room Code Input (If Join Tab) */}
            {tab === 'join' && (
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  4-Letter Case ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. X9K2"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  required
                  className="w-full bg-black border-2 border-zinc-700 rounded-2xl px-4 py-3.5 text-white font-mono font-black text-center tracking-widest text-xl placeholder-zinc-600 focus:outline-none focus:border-white transition uppercase"
                />
              </div>
            )}

            {/* Action 3D Button */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl btn-noir-white flex items-center justify-center space-x-2 mt-2 font-mono uppercase tracking-wider text-sm"
            >
              <span>{tab === 'create' ? 'OPEN INVESTIGATION CASE 🔍' : 'ACCESS CASE FILE 📂'}</span>
            </button>
          </form>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // IN LOBBY VIEW (Briefing Room)
  // -------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      
      {/* Lobby Room Header */}
      <div className="case-file-panel p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-zinc-800">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400">
              PRECINCT BRIEFING • GATHERING DETECTIVES
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-white">
            Investigation Lineup
          </h2>
        </div>

        {/* Room Code Card */}
        <div className="flex items-center space-x-3 bg-black border-2 border-white px-5 py-3 rounded-2xl shadow-xl">
          <div>
            <span className="text-[10px] font-mono font-black uppercase text-zinc-400 block leading-none mb-1">
              CASE FILE ID
            </span>
            <span className="text-2xl font-mono font-black text-white tracking-widest">
              #{gameState.code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition border border-zinc-600"
            title="Copy Case Code"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Suspects Lineup (Left) + Case Settings (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Player Slots */}
        <div className="md:col-span-2 case-file-panel p-6 rounded-3xl border-2 border-zinc-800 space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-white" />
              <h3 className="font-heading font-black text-lg text-white">
                Suspect Lineup ({playerCount}/8)
              </h3>
            </div>

            {isHost && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAddBot}
                  className="flex items-center space-x-1.5 btn-noir-dark text-xs text-white px-3 py-1.5 rounded-xl font-mono font-bold"
                  title="Add 1 AI Suspect"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ AI Suspect</span>
                </button>
                {playerCount < 4 && (
                  <button
                    onClick={handleFillBots}
                    className="flex items-center space-x-1.5 btn-noir-white text-xs px-3 py-1.5 rounded-xl font-mono font-black"
                    title="Fill squad to 4 players"
                  >
                    <span>⚡ Fill Squad 4</span>
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
                      ? 'border-white bg-zinc-900 shadow-xl'
                      : 'border-zinc-800 bg-black'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-3xl border-2 border-zinc-700 shadow-inner">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-bold text-white text-base truncate">
                          {player.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-mono bg-white text-black font-black px-1.5 py-0.2 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs mt-0.5 font-mono">
                        {player.isHost && (
                          <span className="flex items-center text-white font-bold text-[11px]">
                            <Crown className="w-3.5 h-3.5 mr-1" /> Lead Detective
                          </span>
                        )}
                        {player.isBot && (
                          <span className="flex items-center text-zinc-400 font-bold text-[11px]">
                            <Bot className="w-3.5 h-3.5 mr-1" /> AI Suspect
                          </span>
                        )}
                        {!player.isHost && !player.isBot && (
                          <span className="text-zinc-300 font-bold text-[11px]">✓ Ready</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kick Bot */}
                  {isHost && player.isBot && (
                    <button
                      onClick={() => handleRemoveBot(player.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-xl transition"
                      title="Dismiss Bot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {playerCount < 3 && (
            <div className="p-3.5 bg-red-950/40 border-2 border-red-500/40 rounded-2xl text-red-300 text-xs font-mono font-bold flex items-center space-x-2">
              <span>⚠️ Need at least 3 detectives/suspects to open investigation!</span>
            </div>
          )}
        </div>

        {/* Right Column: Case Settings */}
        <div className="space-y-4">
          <div className="case-file-panel p-6 rounded-3xl border-2 border-zinc-800 space-y-4">
            <h3 className="font-heading font-black text-base text-white border-b border-zinc-800 pb-2">
              Investigation Parameters
            </h3>

            {/* Rounds Selector */}
            <div>
              <div className="flex justify-between text-xs font-mono font-bold text-zinc-400 mb-1.5">
                <span>Rounds:</span>
                <span className="text-white font-black text-sm">{gameState.totalRounds || rounds} Rounds</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                disabled={!isHost}
                value={gameState.totalRounds || rounds}
                onChange={handleRoundsChange}
                className="w-full accent-white cursor-pointer disabled:opacity-60"
              />
              <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-500 mt-1">
                <span>1 Rnd</span>
                <span>3 Rnds</span>
                <span>5 Rnds</span>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="pt-3 border-t border-zinc-800">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-300 mb-2">
                <span className="flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Case Category:</span>
                </span>
                <span className="text-white font-mono font-black text-[10px] bg-zinc-900 border border-zinc-700 px-2.5 py-0.5 rounded-full">
                  {gameState.theme || selectedTheme}
                </span>
              </div>

              {isHost ? (
                <div className="space-y-2 mt-2">
                  <select
                    value={selectedTheme}
                    onChange={(e) => handleThemeChange(e.target.value)}
                    className="w-full bg-black border-2 border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-white font-mono font-semibold"
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
                    <option value="Custom">✍️ Custom Case Topic (Type your own)...</option>
                  </select>

                  {selectedTheme === 'Custom' && (
                    <form onSubmit={handleCustomThemeSubmit} className="flex space-x-2 pt-1">
                      <input
                        type="text"
                        placeholder="e.g. Hogwarts, K-Pop, 90s Cars..."
                        value={customThemeInput}
                        onChange={(e) => setCustomThemeInput(e.target.value)}
                        maxLength={40}
                        className="flex-1 bg-black border-2 border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 btn-noir-white text-xs font-mono font-black rounded-xl"
                      >
                        Set
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-black rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400">
                  Topic set by Lead Detective: <strong className="text-white">{gameState.theme || 'Random Mix'}</strong>
                </div>
              )}
            </div>

            {/* Start Button */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={playerCount < 3}
                className="w-full py-4 rounded-2xl btn-noir-white flex items-center justify-center space-x-2 mt-4 font-mono font-black text-sm uppercase tracking-wider"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>BEGIN INVESTIGATION</span>
              </button>
            ) : (
              <div className="p-4 bg-black rounded-2xl border-2 border-zinc-800 text-center text-zinc-400 text-xs font-mono font-bold animate-pulse mt-4">
                Waiting for Lead Detective to start...
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
