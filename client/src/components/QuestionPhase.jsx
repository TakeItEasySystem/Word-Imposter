import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { HelpCircle, Send, CheckCircle2, Users, FileText, AlertTriangle } from 'lucide-react';
import CandidateWordsBanner from './CandidateWordsBanner';

export default function QuestionPhase({ gameState }) {
  const [answerInput, setAnswerInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isQ1 = gameState?.state === 'QUESTION_1';
  const questionIndex = isQ1 ? 0 : 1;
  const questionKey = isQ1 ? 'q1' : 'q2';
  const questionText = gameState?.roundData?.questions?.[questionIndex] || "Answer honestly about your word:";

  // Reset input state whenever phase changes between Q1 and Q2
  useEffect(() => {
    setAnswerInput('');
    setHasSubmitted(false);
  }, [gameState?.state]);

  const myPlayer = gameState?.players?.find(p => p.id === gameState?.myPlayerId);
  const alreadyAnswered = isQ1 ? myPlayer?.hasAnsweredQ1 : myPlayer?.hasAnsweredQ2;
  const submitted = hasSubmitted || alreadyAnswered;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!answerInput.trim() || submitted) return;
    playPop();
    socket.emit('submit-answer', {
      roomCode: gameState.code,
      questionKey: questionKey,
      answer: answerInput.trim()
    });
    setHasSubmitted(true);
  };

  const totalPlayers = gameState?.players?.length || 0;
  const answeredCount = gameState?.players?.filter(p => isQ1 ? p.hasAnsweredQ1 : p.hasAnsweredQ2).length || 0;

  return (
    <div className="max-w-3xl mx-auto my-6 px-4 animate-fade-in space-y-6">
      {/* 3 Candidate Words Banner */}
      <CandidateWordsBanner
        roundData={gameState?.roundData}
        myWord={gameState?.myWord}
        showSecretHighlight={true}
      />

      <div className="case-file-panel rounded-3xl p-6 sm:p-8 border-2 border-zinc-700 shadow-2xl relative">
        
        {/* Phase Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
          <span className="bg-black text-white border border-white text-xs font-mono font-black px-3.5 py-1 rounded-full uppercase tracking-widest">
            {isQ1 ? 'INTERROGATION ROUND 01/02' : 'INTERROGATION ROUND 02/02'}
          </span>

          <div className="flex items-center space-x-1.5 px-3.5 py-1 rounded-full border-2 border-zinc-800 bg-black text-zinc-300 text-xs font-mono font-bold">
            <Users className="w-3.5 h-3.5 text-white" />
            <span>TESTIMONIES: <strong className="text-white font-black">{answeredCount}</strong> / {totalPlayers}</span>
          </div>
        </div>

        {/* Question Prompt Box */}
        <div className="text-center my-6 bg-black p-6 rounded-2xl border-2 border-zinc-800 shadow-inner">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white mb-3">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500 mb-1">
            OFFICIAL INTERROGATION PROMPT
          </div>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-white max-w-xl mx-auto leading-relaxed">
            "{questionText}"
          </h2>
          <p className="text-xs text-zinc-400 mt-2 font-mono">
            Provide a subtle statement about your clue without revealing your secret lead directly!
          </p>
        </div>

        {/* Answer Submission Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
            <div>
              <textarea
                rows={3}
                placeholder="Type your testimony statement here..."
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                maxLength={120}
                required
                className="w-full bg-black border-2 border-zinc-700 rounded-2xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white transition resize-none text-base font-mono font-medium shadow-inner"
              />
              <div className="text-right text-[11px] font-mono text-zinc-500 mt-1">
                {answerInput.length}/120 characters
              </div>
            </div>

            <button
              type="submit"
              disabled={!answerInput.trim()}
              className="w-full py-4 rounded-2xl btn-noir-white disabled:opacity-40 flex items-center justify-center space-x-2 font-mono font-black text-sm uppercase tracking-wider"
            >
              <Send className="w-4 h-4" />
              <span>LOG TESTIMONY 📝</span>
            </button>
          </form>
        ) : (
          <div className="max-w-md mx-auto p-6 bg-black rounded-2xl border-2 border-white text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-white mx-auto animate-bounce" />
            <h3 className="font-heading font-black text-lg text-white">Testimony Recorded!</h3>
            <p className="text-xs text-zinc-400 font-mono">
              Waiting for all suspects to log statements ({answeredCount}/{totalPlayers})...
            </p>
          </div>
        )}

        {/* Players Submission Live Status */}
        <div className="mt-8 pt-6 border-t border-zinc-800">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-white" />
            <span>Suspect Status:</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {gameState?.players?.map((p) => {
              const answered = isQ1 ? p.hasAnsweredQ1 : p.hasAnsweredQ2;
              return (
                <div
                  key={p.id}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border-2 text-xs font-mono font-bold transition ${
                    answered
                      ? 'bg-zinc-900 border-white text-white'
                      : 'bg-black border-zinc-800 text-zinc-600'
                  }`}
                >
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                  {answered ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <span className="text-[10px] text-zinc-600 font-normal italic">(typing...)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
