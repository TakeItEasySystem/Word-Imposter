import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { Send, CheckCircle2, Users, FileText, Clock } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto my-4 px-4 animate-fade-in space-y-4">
      {/* 3 Candidate Words Pinned with Assigned Word Highlighted */}
      <CandidateWordsBanner roundData={gameState?.roundData} myWord={gameState?.myWord} />

      <div className="clean-card rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm relative">
        
        {/* Phase Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
          <span className="bg-slate-900 text-white text-xs font-mono font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
            {isQ1 ? 'INTERROGATION ROUND 01/02' : 'INTERROGATION ROUND 02/02'}
          </span>

          <div className="flex items-center space-x-2">
            {gameState?.timerSeconds > 0 && (
              <div className={`flex items-center space-x-1.5 px-3.5 py-1 rounded-full border text-xs font-mono font-black transition ${
                gameState.timerSeconds <= 5 
                  ? 'bg-red-600 text-white border-red-700 animate-pulse shadow-xs' 
                  : gameState.timerSeconds <= 10
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-800 border-slate-300'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                <span>⏱️ {gameState.timerSeconds}s</span>
              </div>
            )}

            <div className="flex items-center space-x-1.5 px-3.5 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              <Users className="w-3.5 h-3.5 text-slate-800" />
              <span>ANSWERS: <strong className="text-slate-900 font-extrabold">{answeredCount}</strong> / {totalPlayers}</span>
            </div>
          </div>
        </div>

        {/* Question Prompt Box */}
        <div className="text-center my-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="inline-flex p-3 rounded-2xl bg-white border border-slate-200 text-slate-800 mb-3 shadow-xs">
            <FileText className="w-6 h-6 text-slate-800" />
          </div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 mb-1">
            OFFICIAL QUESTION PROMPT
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 max-w-xl mx-auto leading-relaxed">
            "{questionText}"
          </h2>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            Provide a subtle clue about your word without giving it away directly!
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
                className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition resize-none text-base font-mono font-medium shadow-xs"
              />
              <div className="text-right text-[11px] font-mono text-slate-400 mt-1">
                {answerInput.length}/120 characters
              </div>
            </div>

            <button
              type="submit"
              disabled={!answerInput.trim()}
              className="w-full py-4 rounded-2xl btn-primary-dark disabled:opacity-40 flex items-center justify-center space-x-2 font-mono font-bold text-sm uppercase tracking-wider"
            >
              <Send className="w-4 h-4" />
              <span>SUBMIT ANSWER 📝</span>
            </button>
          </form>
        ) : (
          <div className="max-w-md mx-auto p-6 bg-slate-50 rounded-2xl border-2 border-slate-300 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="font-heading font-extrabold text-lg text-slate-900">Answer Submitted!</h3>
            <p className="text-xs text-slate-500 font-mono">
              Waiting for all players to submit ({answeredCount}/{totalPlayers})...
            </p>
          </div>
        )}

        {/* Players Submission Live Status */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-slate-700" />
            <span>Player Status:</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {gameState?.players?.map((p) => {
              const answered = isQ1 ? p.hasAnsweredQ1 : p.hasAnsweredQ2;
              return (
                <div
                  key={p.id}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border-2 text-xs font-mono font-bold transition ${
                    answered
                      ? 'bg-white border-slate-900 text-slate-900 shadow-xs'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                  {answered ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal italic">(answering...)</span>
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
