import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Trash2, Eraser, PenTool } from 'lucide-react';
import { playPop } from '../utils/audio';

const PALETTE = [
  '#000000', '#27272a', '#71717a', '#ffffff', '#ef4444',
  '#b91c1c', '#3b82f6', '#10b981', '#f59e0b', '#78350f'
];

const SIZES = [
  { label: 'Fine', size: 3 },
  { label: 'Med', size: 6 },
  { label: 'Bold', size: 12 },
  { label: 'Ink', size: 22 }
];

export default function DrawingCanvas({ onSave, disabled = false }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Set white background by default
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHistory((prev) => [...prev.slice(-15), canvas.toDataURL()]);
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = isEraser ? brushSize * 2.5 : brushSize;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveHistory();
    if (onSave) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  const handleUndo = () => {
    if (disabled || history.length <= 1) return;
    playPop();
    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const previousState = newHistory[newHistory.length - 1];

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = previousState;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory(newHistory);
      if (onSave) onSave(canvas.toDataURL('image/png'));
    };
  };

  const handleClear = () => {
    if (disabled) return;
    playPop();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
    if (onSave) onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Canvas Container */}
      <div className="relative w-full aspect-[4/3] bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-zinc-700">
        <canvas
          ref={canvasRef}
          width={600}
          height={450}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair drawing-canvas"
        />
        {disabled && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center text-white font-mono font-black text-sm uppercase tracking-widest">
            🔒 EXHIBIT LOCKED & SUBMITTED
          </div>
        )}
      </div>

      {/* Toolbar Controls */}
      {!disabled && (
        <div className="w-full mt-3 p-3 bg-black rounded-2xl border border-zinc-800 space-y-3 shadow-xl">
          
          {/* Top Row: Palette & Tool Type */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center space-x-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setColor(c); setIsEraser(false); playPop(); }}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 transition transform active:scale-90 ${
                    color === c && !isEraser
                      ? 'border-white scale-110 shadow-md ring-2 ring-white/50'
                      : 'border-zinc-700 hover:scale-105'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center space-x-1 border-l border-zinc-800 pl-2">
              <button
                type="button"
                onClick={() => { setIsEraser(false); playPop(); }}
                className={`p-1.5 rounded-lg border transition ${
                  !isEraser ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
                title="Pen / Ink"
              >
                <PenTool className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setIsEraser(true); playPop(); }}
                className={`p-1.5 rounded-lg border transition ${
                  isEraser ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
                title="Eraser"
              >
                <Eraser className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Brush Sizes & Undo/Clear */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-900 font-mono">
            {/* Brush Sizes */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] uppercase font-black text-zinc-500 mr-1">Stroke:</span>
              {SIZES.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  onClick={() => { setBrushSize(s.size); playPop(); }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                    brushSize === s.size
                      ? 'bg-white text-black font-black'
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-30 text-xs text-zinc-300 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-xs text-red-200 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
