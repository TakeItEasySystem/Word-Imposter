import React from 'react';
import { X, HelpCircle, Shield, Skull, Palette, Vote, Eye, Award } from 'lucide-react';
import { playPop } from '../utils/audio';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="game-panel rounded-3xl p-6 max-w-xl w-full relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border-2 border-purple-500/50"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-600/40 flex items-center justify-center text-purple-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-black text-xl text-white">How to Play Word Imposter</h3>
          </div>
          <button
            onClick={() => { playPop(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-sm text-slate-300">
          
          <div className="flex items-start space-x-3.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl shrink-0 mt-0.5 border border-purple-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-black text-white text-sm mb-0.5">1. Three Public Candidates</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                At the start of every round, <strong className="text-slate-200">3 related words</strong> are publicly visible on the Evidence Board (e.g., Pizza, Burger, Taco).
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-xl shrink-0 mt-0.5 border border-cyan-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-black text-white text-sm mb-0.5">2. Blind Role Assignment</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Each player is assigned one secret word. <strong className="text-slate-200">3 Civilians</strong> receive the majority word, while <strong className="text-slate-200">1 Imposter</strong> receives a subtle outlier. <em className="text-cyan-300">Nobody knows their true role at start!</em>
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="p-2 bg-pink-500/20 text-pink-300 rounded-xl shrink-0 mt-0.5 border border-pink-500/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-black text-white text-sm mb-0.5">3. Answer 2 Questions & Draw (Secret Sketch)</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Answer 2 provocative questions describing your word without giving it away completely. Then, sketch a hint on your private canvas. Drawings remain <strong className="text-slate-200">100% secret</strong> until everyone submits!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <div className="p-2 bg-red-500/20 text-red-300 rounded-xl shrink-0 mt-0.5 border border-red-500/30">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-black text-white text-sm mb-0.5">4. Investigation & Scoring</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                All drawings and answers are declassified during the Voting Tribunal.
                <br />
                • <strong className="text-emerald-400">Civilians</strong> earn +100 pts for correctly voting the Imposter.
                <br />
                • <strong className="text-red-400">Imposter</strong> earns +150 pts for evading detection, plus +50 bonus pts per innocent player wrongfully accused!
              </p>
            </div>
          </div>

        </div>

        <button
          onClick={() => { playPop(); onClose(); }}
          className="w-full py-3.5 btn-3d-purple text-white font-heading font-black rounded-2xl transition tracking-wide text-sm"
        >
          GOT IT, LET'S PLAY!
        </button>
      </div>
    </div>
  );
}
