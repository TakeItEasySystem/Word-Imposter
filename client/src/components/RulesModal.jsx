import React from 'react';
import { X, HelpCircle, Shield, Skull, Palette, Vote, Eye, Award, FileSearch } from 'lucide-react';
import { playPop } from '../utils/audio';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="case-file-panel rounded-3xl p-6 max-w-xl w-full relative shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto border-2 border-white"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-black border-2 border-white flex items-center justify-center text-white">
              🕵️
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-red-400 bg-red-950/80 px-1.5 py-0.2 rounded border border-red-800 uppercase tracking-widest block w-fit">
                BUREAU PROTOCOL
              </span>
              <h3 className="font-heading font-black text-lg text-white">Official Investigation Rules</h3>
            </div>
          </div>
          <button
            onClick={() => { playPop(); onClose(); }}
            className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition border border-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-sm text-zinc-300 font-mono">
          
          <div className="flex items-start space-x-3.5 bg-black p-3.5 rounded-2xl border border-zinc-800">
            <div className="p-2 bg-zinc-900 text-white rounded-xl shrink-0 mt-0.5 border border-zinc-700">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-mono font-black text-white text-xs uppercase tracking-wider mb-0.5">1. Three Public Clues</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                At the start of every case, <strong className="text-white">3 related clues</strong> are publicly pinned to the Evidence Board (e.g., Pizza, Burger, Taco).
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 bg-black p-3.5 rounded-2xl border border-zinc-800">
            <div className="p-2 bg-zinc-900 text-white rounded-xl shrink-0 mt-0.5 border border-zinc-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-mono font-black text-white text-xs uppercase tracking-wider mb-0.5">2. Blind Lead Assignment</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Each player receives a secret clue. <strong className="text-white">3 Detectives</strong> share the genuine majority lead, while <strong className="text-white">1 Rogue Imposter</strong> receives a subtle outlier. <em className="text-zinc-300">Nobody knows their true identity at the start!</em>
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 bg-black p-3.5 rounded-2xl border border-zinc-800">
            <div className="p-2 bg-zinc-900 text-white rounded-xl shrink-0 mt-0.5 border border-zinc-700">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-mono font-black text-white text-xs uppercase tracking-wider mb-0.5">3. Interrogation & Forensic Sketch</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Answer 2 interrogation prompts with subtle testimony. Then, draw a hint on your private sketchpad. Sketches remain <strong className="text-white">100% secret</strong> until everyone submits!
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5 bg-black p-3.5 rounded-2xl border border-zinc-800">
            <div className="p-2 bg-zinc-900 text-red-400 rounded-xl shrink-0 mt-0.5 border border-red-900">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-mono font-black text-white text-xs uppercase tracking-wider mb-0.5">4. Tribunal & All-or-Nothing Scoring</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                Inspect all testimonies and sketches in the suspect lineup and cast your accusation.
                <br />
                • <strong className="text-white">Detectives Catch Imposter:</strong> Each correct Detective earns <strong className="text-emerald-400">+100 pts</strong>. Imposter earns 0 pts.
                <br />
                • <strong className="text-red-400">Imposter Escapes (Not Voted Out):</strong> Detectives earn 0 pts. The Imposter captures <strong className="text-red-400">ALL bounty points (+300 pts)</strong>! (The imposter's own vote does not count).
              </p>
            </div>
          </div>

        </div>

        <button
          onClick={() => { playPop(); onClose(); }}
          className="w-full py-3.5 btn-noir-white rounded-2xl transition tracking-wider text-xs font-mono font-black uppercase"
        >
          CONFIRM PROTOCOL & RETURN TO CASE
        </button>
      </div>
    </div>
  );
}
