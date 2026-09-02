import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { MessageSquare, X, Send, Smile, Bot, Sparkles, ChevronDown } from 'lucide-react';

const QUICK_EMOJIS = ['😂', '👀', '🤫', '🕵️‍♂️', '💀', '🔥', '🤷‍♂️', '🎉'];

export default function ChatBox({ gameState }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);

  const roomCode = gameState?.code;
  const myId = gameState?.myPlayerId;

  // Initialize messages from gameState when available
  useEffect(() => {
    if (gameState?.messages) {
      setMessages(gameState.messages);
    }
  }, [gameState?.messages]);

  // Listen for real-time new chat messages
  useEffect(() => {
    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (!isOpen && msg.senderId !== myId) {
        setUnreadCount((c) => c + 1);
        playPop();
      }
    };

    socket.on('new-chat-message', handleNewMessage);
    return () => {
      socket.off('new-chat-message', handleNewMessage);
    };
  }, [isOpen, myId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleToggle = () => {
    playPop();
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setUnreadCount(0);
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !roomCode) return;
    playPop();

    socket.emit('send-chat', {
      roomCode: roomCode,
      text: inputText.trim()
    });

    setInputText('');
  };

  const handleEmojiClick = (emoji) => {
    setInputText((prev) => prev + emoji);
  };

  if (!roomCode) return null;

  return (
    <>
      {/* Floating Toggle Button (Always visible on bottom right) */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={handleToggle}
          className={`relative p-3.5 rounded-2xl font-bold shadow-2xl flex items-center space-x-2 transition transform hover:scale-105 active:scale-95 ${
            isOpen
              ? 'bg-slate-800 text-slate-300 border border-slate-700'
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-purple-600/40 ring-2 ring-purple-400/40'
          }`}
          title="Open Room Chat"
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          <span className="font-heading text-sm hidden sm:inline">
            {isOpen ? 'Close Chat' : 'Live Chat'}
          </span>

          {/* Unread Message Badge */}
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-lg animate-bounce border-2 border-slate-900">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Slide-out / Popover Chat Box */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-96 max-h-[75vh] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden animate-fade-in ring-1 ring-white/10">
          
          {/* Chat Header */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-base">
                💬
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm text-white flex items-center space-x-1.5">
                  <span>Room Discussion</span>
                  <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.2 rounded font-mono">
                    {gameState?.players?.length || 0} P
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Accuse, bluff & chat in real-time!</p>
              </div>
            </div>

            <button
              onClick={handleToggle}
              className="p-1 text-slate-400 hover:text-white bg-slate-800/80 rounded-lg transition"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-[220px] max-h-[360px] bg-slate-950/40 text-xs">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-1">
                <MessageSquare className="w-8 h-8 text-slate-600" />
                <p className="text-xs">No messages yet!</p>
                <p className="text-[10px] text-slate-600">Start the conversation or throw some suspicion...</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === myId;
                const isSystem = msg.isSystem;

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center my-1.5">
                      <span className="bg-purple-950/60 text-purple-300 border border-purple-800/60 px-2.5 py-0.5 rounded-full text-[10px] font-semibold inline-block">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                  >
                    <div className="w-7 h-7 bg-slate-800 rounded-xl flex items-center justify-center text-sm shrink-0 border border-slate-700">
                      {msg.avatar}
                    </div>

                    <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${
                      isMe
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tl-none'
                    }`}>
                      <div className="flex items-center space-x-1.5 mb-0.5 text-[10px]">
                        <span className={`font-heading font-bold ${isMe ? 'text-purple-200' : 'text-purple-400'}`}>
                          {msg.senderName}
                        </span>
                        {isMe && (
                          <span className="text-[9px] bg-purple-900/60 text-purple-200 px-1 rounded">
                            YOU
                          </span>
                        )}
                        {msg.isBot && (
                          <span className="text-[9px] bg-cyan-900/60 text-cyan-300 px-1 rounded flex items-center">
                            <Bot className="w-2.5 h-2.5 mr-0.5" /> AI
                          </span>
                        )}
                      </div>
                      <p className="text-xs break-words leading-relaxed font-medium">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reaction Emojis */}
          <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded-lg text-sm transition transform active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Type message or accusation..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={120}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 font-medium"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white rounded-xl transition shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
