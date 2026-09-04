import React from 'react';
import { X, HelpCircle, Shield, Skull, Palette, Vote, Eye, Award, FileSearch } from 'lucide-react';
import { playPop } from '../utils/audio';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="clean-card p-6 max-w-xl w-full relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shadow-sm">
              🕵️
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-widest block w-fit mb-0.5">
                BUREAU PROTOCOL
              </span>
              <h3 className="font-heading font-black text-lg text-slate-900">Official Investigation Rules</h3>
            </div>
          </div>
          <button
            onClick={() => { playPop(); onClose(); }}
            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-sm text-slate-700 font-mono">
          
          <div className="flex items-start space-x-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="p-2 bg-white text-slate-800 rounded-xl shrink-0 mt-0.5 border border-slate-200 shadow-sm">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-900 text-xs uppercase tracking-wider mb-0.5">1. Three Public Clues</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                At the start of every case, <strong className="text-slate-900">3 related clues</strong> are publicly pinned to the Evidence Board (e.g., Pizza, Burger, Taco).
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="p-2 bg-white text-slate-800 rounded-xl shrink-0 mt-0.5 border border-slate-200 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-900 text-xs uppercase tracking-wider mb-0.5">2. Blind Lead Assignment</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Each player receives a secret clue. <strong className="text-slate-900">3 Detectives</strong> share the genuine majority lead, while <strong className="text-slate-900">1 Rogue Imposter</strong> receives a subtle outlier. <em className="text-slate-500">Nobody knows their true identity at the start!</em>
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="p-2 bg-white text-slate-800 rounded-xl shrink-0 mt-0.5 border border-slate-200 shadow-sm">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-900 text-xs uppercase tracking-wider mb-0.5">3. Interrogation & Forensic Sketch</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Answer 2 interrogation prompts with subtle testimony. Then, draw a hint on your private sketchpad. Sketches remain <strong className="text-slate-900">100% secret</strong> until everyone submits!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="p-2 bg-white text-red-600 rounded-xl shrink-0 mt-0.5 border border-red-200 shadow-sm">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading font-black text-slate-900 text-xs uppercase tracking-wider mb-0.5">4. Tribunal & All-or-Nothing Scoring</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Inspect all testimonies and sketches in the suspect lineup and cast your accusation.
                <br />
                • <strong className="text-slate-900">Detectives Catch Imposter:</strong> Each correct Detective earns <strong className="text-emerald-700">+100 pts</strong>. Imposter earns 0 pts.
                <br />
                • <strong className="text-red-600">Imposter Escapes (Not Voted Out):</strong> Detectives earn 0 pts. The Imposter captures <strong className="text-red-600">ALL bounty points (+300 pts)</strong>! (The imposter's own vote does not count).
              </p>
            </div>
          </div>

        </div>

        <button
          onClick={() => { playPop(); onClose(); }}
          className="w-full py-3.5 btn-primary-dark rounded-2xl transition tracking-wider text-xs font-mono font-black uppercase shadow-md"
        >
          CONFIRM PROTOCOL & RETURN TO CASE
        </button>
      </div>
    </div>
  );
}
