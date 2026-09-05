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
  const [isStartingLocal, setIsStartingLocal] = useState(false);

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
    } else if (customThemeInput.trim()) {
      socket.emit('update-theme', { roomCode: gameState.code, theme: customThemeInput.trim() });
    }
  };

  const handleCustomThemeChange = (val) => {
    setCustomThemeInput(val);
    if (val.trim()) {
      socket.emit('update-theme', { roomCode: gameState.code, theme: val.trim() });
    }
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
    if (isStartingLocal || gameState?.isStarting) return;
    playPop();
    setIsStartingLocal(true);

    const activeTheme = selectedTheme === 'Custom'
      ? (customThemeInput.trim() || gameState.theme || 'Random Mix')
      : selectedTheme;

    // Emit live theme update and pass customTheme in start-game payload
    socket.emit('update-theme', { roomCode: gameState.code, theme: activeTheme });
    socket.emit('start-game', { roomCode: gameState.code, customTheme: activeTheme });
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
        
        {/* Game Title & Intro */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🕵️‍♂️</div>
          <h2 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Word Imposter
          </h2>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
            Find the imposter before they blend in!
          </p>
        </div>

        {/* Clean Card Container */}
        <div className="clean-card p-6 sm:p-7 rounded-3xl shadow-sm border-2 border-slate-200">
          
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-5 border border-slate-200 font-mono">
            <button
              onClick={() => { setTab('create'); playPop(); }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                tab === 'create'
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Room
            </button>
            <button
              onClick={() => { setTab('join'); playPop(); }}
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                tab === 'join'
                  ? 'bg-white text-slate-900 shadow-sm font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Join Room
            </button>
          </div>

          {/* Form */}
          <form onSubmit={tab === 'create' ? handleCreateRoom : handleJoinRoom} className="space-y-4">
            
            {/* Clean Avatar Row */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
                Choose Avatar:
              </label>
              <div className="flex justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200">
                {['🕵️', '🦊', '🐼', '🤖', '🚀', '🦄'].map((av) => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => { setSelectedAvatar(av); playPop(); }}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                      selectedAvatar === av
                        ? 'bg-white scale-110 shadow-sm ring-2 ring-slate-900'
                        : 'hover:bg-slate-200/60'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Nickname Input */}
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                Your Nickname:
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                required
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition text-sm"
              />
            </div>

            {/* Room Code Input (If Join Tab) */}
            {tab === 'join' && (
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">
                  4-Letter Room Code:
                </label>
                <input
                  type="text"
                  placeholder="e.g. X9K2"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  required
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-mono font-extrabold text-center tracking-widest text-lg placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition uppercase"
                />
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl btn-primary-dark flex items-center justify-center space-x-2 mt-2 font-mono uppercase tracking-wider text-xs sm:text-sm font-bold shadow-sm"
            >
              <span>{tab === 'create' ? 'CREATE ROOM 🎮' : 'JOIN ROOM 🚪'}</span>
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
      <div className="clean-card p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-slate-200 shadow-sm">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-600">
              PRECINCT BRIEFING • GATHERING DETECTIVES
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">
            Investigation Lineup
          </h2>
        </div>

        {/* Room Code Card */}
        <div className="flex items-center space-x-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-md border border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block leading-none mb-1">
              CASE FILE ID
            </span>
            <span className="text-2xl font-mono font-extrabold text-white tracking-widest">
              #{gameState.code}
            </span>
          </div>
          <button
            onClick={handleCopyCode}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition border border-slate-700"
            title="Copy Case Code"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-300" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Suspects Lineup (Left) + Case Settings (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Player Slots */}
        <div className="md:col-span-2 clean-card p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-slate-900" />
              <h3 className="font-heading font-bold text-lg text-slate-900">
                Suspect Lineup ({playerCount}/8)
              </h3>
            </div>

            {isHost && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleAddBot}
                  className="flex items-center space-x-1.5 btn-secondary-light text-xs px-3 py-1.5 rounded-xl font-mono font-bold"
                  title="Add 1 AI Suspect"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ AI Suspect</span>
                </button>
                {playerCount < 4 && (
                  <button
                    onClick={handleFillBots}
                    className="flex items-center space-x-1.5 btn-primary-dark text-xs px-3 py-1.5 rounded-xl font-mono font-bold"
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
                      ? 'border-slate-900 bg-white shadow-md'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl border border-slate-200 shadow-inner">
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-heading font-bold text-slate-900 text-base truncate">
                          {player.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-mono bg-slate-900 text-white font-bold px-1.5 py-0.2 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs mt-0.5 font-mono">
                        {player.isHost && (
                          <span className="flex items-center text-amber-600 font-bold text-[11px]">
                            <Crown className="w-3.5 h-3.5 mr-1 text-amber-500" /> Lead Detective
                          </span>
                        )}
                        {player.isBot && (
                          <span className="flex items-center text-slate-500 font-bold text-[11px]">
                            <Bot className="w-3.5 h-3.5 mr-1" /> AI Suspect
                          </span>
                        )}
                        {!player.isHost && !player.isBot && (
                          <span className="text-slate-600 font-bold text-[11px]">✓ Ready</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Kick Bot */}
                  {isHost && player.isBot && (
                    <button
                      onClick={() => handleRemoveBot(player.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-xl transition"
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
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-mono font-bold flex items-center space-x-2">
              <span>⚠️ Need at least 3 detectives/suspects to start investigation!</span>
            </div>
          )}
        </div>

        {/* Right Column: Case Settings */}
        <div className="space-y-4">
          <div className="clean-card p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900 border-b border-slate-100 pb-2">
              Investigation Parameters
            </h3>

            {/* Rounds Selector */}
            <div>
              <div className="flex justify-between text-xs font-mono font-bold text-slate-600 mb-1.5">
                <span>Rounds:</span>
                <span className="text-slate-900 font-extrabold text-sm">{gameState.totalRounds || rounds} Rounds</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                disabled={!isHost}
                value={gameState.totalRounds || rounds}
                onChange={handleRoundsChange}
                className="w-full accent-slate-900 cursor-pointer disabled:opacity-60"
              />
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400 mt-1">
                <span>1 Rnd</span>
                <span>3 Rnds</span>
                <span>5 Rnds</span>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-700 mb-2">
                <span className="flex items-center space-x-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Case Category:</span>
                </span>
                <span className="text-slate-900 font-mono font-bold text-[10px] bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {gameState.theme || selectedTheme}
                </span>
              </div>

              {isHost ? (
                <div className="space-y-2 mt-2">
                  <select
                    value={selectedTheme}
                    onChange={(e) => handleThemeChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 font-mono font-semibold shadow-xs"
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
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Type any custom topic (e.g. Hogwarts, Bollywood, 90s Cars)..."
                        value={customThemeInput}
                        onChange={(e) => handleCustomThemeChange(e.target.value)}
                        maxLength={40}
                        className="w-full bg-white border-2 border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 font-mono font-semibold shadow-inner"
                      />
                      <p className="text-[10px] font-mono text-emerald-600 flex items-center space-x-1 font-bold">
                        <span>✓ Custom topic active & ready</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600">
                  Topic set by Lead Detective: <strong className="text-slate-900">{gameState.theme || 'Random Mix'}</strong>
                </div>
              )}
            </div>

            {/* Start Button */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={playerCount < 3 || isStartingLocal || gameState?.isStarting}
                className="w-full py-4 rounded-2xl btn-primary-dark flex items-center justify-center space-x-2 mt-4 font-mono font-bold text-sm uppercase tracking-wider disabled:opacity-80 cursor-pointer transition"
              >
                {(isStartingLocal || gameState?.isStarting) ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>LAUNCHING INVESTIGATION...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>BEGIN INVESTIGATION</span>
                  </>
                )}
              </button>
            ) : (
              gameState?.isStarting ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center text-amber-900 text-xs font-mono font-bold animate-pulse mt-4 flex items-center justify-center space-x-2">
                  <span className="w-4 h-4 border-2 border-amber-800 border-t-transparent rounded-full animate-spin" />
                  <span>Lead Detective started the game! Setting up case dossier...</span>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs font-mono font-bold animate-pulse mt-4">
                  Waiting for Lead Detective to start...
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
