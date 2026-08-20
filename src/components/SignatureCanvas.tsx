import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignatureCanvasProps {
  initialSignature?: string;
  onSave: (dataUrl: string | null) => void;
  title?: string;
  signerName?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  initialSignature,
  onSave,
  title = 'Firma Digital',
  signerName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialSignature || null);

  // Resize canvas according to container width with High DPI support
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Width and height of canvas DOM element
    const width = rect.width || 400;
    const height = 180;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#0f172a'; // slate-900
      ctx.lineWidth = 2.5;

      // Draw background guide line
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#cbd5e1'; // slate-300
      ctx.lineWidth = 1;
      ctx.moveTo(20, height - 35);
      ctx.lineTo(width - 20, height - 35);
      ctx.stroke();

      // Reset dash and line width for drawing
      ctx.setLineDash([]);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
    }
  };

  useEffect(() => {
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    return () => window.removeEventListener('resize', setupCanvas);
  }, []);

  useEffect(() => {
    if (initialSignature) {
      setSignatureUrl(initialSignature);
      setHasDrawn(true);
    }
  }, [initialSignature]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);

    // Export current canvas state
    exportSignature();
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureUrl(dataUrl);
    onSave(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupCanvas();
    setHasDrawn(false);
    setSignatureUrl(null);
    onSave(null);
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
          {signerName && (
            <span className="text-xs font-normal text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-full">
              {signerName}
            </span>
          )}
        </div>
        {signatureUrl ? (
          <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 font-medium px-2 py-0.5 rounded-md">
            <Check className="w-3.5 h-3.5" /> Firmado
          </span>
        ) : (
          <span className="text-xs text-amber-700 bg-amber-100 font-medium px-2 py-0.5 rounded-md">
            Pendiente de firma
          </span>
        )}
      </div>

      <div ref={containerRef} className="relative w-full touch-none select-none bg-white rounded-lg border border-slate-300 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair w-full block"
        />

        <div className="absolute bottom-2 left-3 pointer-events-none text-[11px] font-sans text-slate-400">
          Firme sobre la línea punteada
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="text-slate-600 border-slate-300 hover:bg-slate-100 text-xs h-8 gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Limpiar Trazo
        </Button>

        {signatureUrl && (
          <span className="text-[11px] text-slate-400 font-sans italic">
            Firma procesada en PNG
          </span>
        )}
      </div>
    </div>
  );
};
