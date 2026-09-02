import React from 'react';
import { X, HelpCircle, Shield, Skull, Palette, Vote, Eye, Award } from 'lucide-react';
import { playPop } from '../utils/audio';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-xl w-full relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-purple-400" />
            <h3 className="font-heading font-bold text-xl text-white">How to Play Word Imposter</h3>
          </div>
          <button
            onClick={() => { playPop(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          
          <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl shrink-0 mt-0.5">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-white mb-0.5">1. Three Public Words</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                At the start of every round, <strong>3 related words</strong> are shown publicly on screen (e.g., Pizza, Burger, Taco).
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl shrink-0 mt-0.5">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-white mb-0.5">2. Secret Word Assignment (Blind Roles)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Each player gets one of the words, but <strong>NOBODY knows if they are a Civilian or the Imposter!</strong> 3 players have the majority word, and 1 player has the odd imposter word.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="p-2 bg-pink-500/20 text-pink-300 rounded-xl shrink-0 mt-0.5">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-white mb-0.5">3. Answer 2 Questions & Draw (20s + 7s Live Reveal)</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All players answer 2 revealing questions. Then, you have <strong>20 seconds</strong> to sketch your word on canvas. After <strong>7 seconds</strong> of drawing, all canvases become visible live to everyone so you can figure out who the Imposter is!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="p-2 bg-red-500/20 text-red-300 rounded-xl shrink-0 mt-0.5">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-white mb-0.5">4. Vote & Score Points</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review everyone's answers and drawings, then vote for the Imposter!
                <br />
                • <strong>Civilians</strong> earn +100 pts for voting correctly.
                <br />
                • <strong>Imposter</strong> earns +150 pts if they survive, plus +50 pts per innocent player wrongfully accused!
              </p>
            </div>
          </div>

        </div>

        <button
          onClick={() => { playPop(); onClose(); }}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-heading font-bold rounded-xl transition"
        >
          Got it, let's play!
        </button>
      </div>
    </div>
  );
}
