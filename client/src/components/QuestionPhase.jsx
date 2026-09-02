import React, { useState, useEffect } from 'react';
import { socket } from '../utils/socket';
import { playPop } from '../utils/audio';
import { HelpCircle, Send, CheckCircle2, Users } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto my-6 px-4 animate-fade-in">
      {/* 3 Candidate Words Banner */}
      <CandidateWordsBanner
        roundData={gameState?.roundData}
        myWord={gameState?.myWord}
        showSecretHighlight={true}
      />

      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl relative">
        
        {/* Phase Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {isQ1 ? 'Question 1 of 2' : 'Question 2 of 2'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border bg-slate-800 border-slate-700 text-slate-300 text-xs font-bold">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            <span>{answeredCount} / {totalPlayers} Submitted</span>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="text-center my-6">
          <div className="inline-flex p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-3">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-white max-w-xl mx-auto leading-relaxed">
            "{questionText}"
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Type your clue and click <strong>Submit Answer</strong> when ready.
          </p>
        </div>

        {/* Answer Submission Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
            <div>
              <textarea
                rows={3}
                placeholder="Type your clue or description here..."
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                maxLength={120}
                required
                className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition resize-none text-base font-medium shadow-inner"
              />
              <div className="text-right text-[11px] text-slate-500 mt-1">
                {answerInput.length}/120 characters
              </div>
            </div>

            <button
              type="submit"
              disabled={!answerInput.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-heading font-bold rounded-2xl shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 text-base flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Answer</span>
            </button>
          </form>
        ) : (
          <div className="max-w-md mx-auto p-6 bg-slate-900/90 rounded-2xl border border-emerald-500/30 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="font-heading font-bold text-lg text-emerald-300">Answer Submitted!</h3>
            <p className="text-xs text-slate-400">
              Waiting for other players ({answeredCount}/{totalPlayers}). Game advances automatically once everyone submits!
            </p>
          </div>
        )}

        {/* Players Submission Live Status */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Players Submissions:</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {gameState?.players?.map((p) => {
              const answered = isQ1 ? p.hasAnsweredQ1 : p.hasAnsweredQ2;
              return (
                <div
                  key={p.id}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                    answered
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                  {answered ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-[10px] text-slate-500">(typing...)</span>
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
