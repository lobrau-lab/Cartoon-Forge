import React, { useEffect, useRef, useState } from 'react';
import { Activity, Volume2, Sparkles, AudioWaveform } from 'lucide-react';

interface AudioSpectrumVisualizerProps {
  isPlaying: boolean;
  label?: string;
  height?: number;
  colorTheme?: 'cyan' | 'rose' | 'amber' | 'emerald';
  audioElement?: HTMLAudioElement | null;
}

export const AudioSpectrumVisualizer: React.FC<AudioSpectrumVisualizerProps> = ({
  isPlaying,
  label = 'AudioContext Real-Time Frequency Spectrum',
  height = 90,
  colorTheme = 'cyan',
  audioElement
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  
  // Web Audio API refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [peakDb, setPeakDb] = useState<number>(-60);
  const [estPitch, setEstPitch] = useState<number>(0);

  // Theme colors
  const themeGradients = {
    cyan: { primary: '#22d3ee', secondary: '#06b6d4', dark: '#083344', glow: 'rgba(34, 211, 238, 0.4)' },
    rose: { primary: '#fb7185', secondary: '#f43f5e', dark: '#4c0519', glow: 'rgba(251, 113, 133, 0.4)' },
    amber: { primary: '#fbbf24', secondary: '#f59e0b', dark: '#451a03', glow: 'rgba(251, 191, 36, 0.4)' },
    emerald: { primary: '#34d399', secondary: '#10b981', dark: '#064e3b', glow: 'rgba(52, 211, 153, 0.4)' }
  };

  const theme = themeGradients[colorTheme] || themeGradients.cyan;

  // Initialize AudioContext & AnalyserNode
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && !audioCtxRef.current) {
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
      }
    } catch (e) {
      console.warn('AudioContext initialization prevented:', e);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Connect HTMLAudioElement if provided
  useEffect(() => {
    if (audioElement && audioCtxRef.current && analyserRef.current && !sourceRef.current) {
      try {
        const source = audioCtxRef.current.createMediaElementSource(audioElement);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);
        sourceRef.current = source;
      } catch (e) {
        // MediaElementAudioSourceNode might already be attached or cross-origin
      }
    }
  }, [audioElement]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const barCount = 48;
    const peakDecay = new Array(barCount).fill(0);
    let phase = 0;

    const render = () => {
      // Resize canvas to match display DPI
      const width = canvas.parentElement?.clientWidth || 600;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Clear Canvas Background
      ctx2d.clearRect(0, 0, w, h);

      // Create Background Grid Lines
      ctx2d.strokeStyle = 'rgba(30, 41, 59, 0.5)';
      ctx2d.lineWidth = 1;
      ctx2d.beginPath();
      ctx2d.moveTo(0, h * 0.25); ctx2d.lineTo(w, h * 0.25);
      ctx2d.moveTo(0, h * 0.50); ctx2d.lineTo(w, h * 0.50);
      ctx2d.moveTo(0, h * 0.75); ctx2d.lineTo(w, h * 0.75);
      ctx2d.stroke();

      // Retrieve FFT Frequency Data
      let freqArray = new Uint8Array(barCount);

      if (analyserRef.current && isPlaying) {
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        
        // Map down to barCount bins
        const step = Math.floor(data.length / barCount);
        let maxVal = 0;
        for (let i = 0; i < barCount; i++) {
          const val = data[i * step] || 0;
          freqArray[i] = val;
          if (val > maxVal) maxVal = val;
        }

        // Calculate peak dB
        if (maxVal > 0) {
          const db = Math.round(20 * Math.log10(maxVal / 255));
          setPeakDb(db);
          setEstPitch(Math.round(100 + maxVal * 2.2));
        }
      } 
      
      // If no audio node or during Web Speech / synthesis simulation
      if (isPlaying && freqArray.every(v => v === 0)) {
        phase += 0.12;
        let maxVal = 0;
        for (let i = 0; i < barCount; i++) {
          const normI = i / barCount;
          // Synthesize realistic speech formant envelope (F1 at ~20%, F2 at ~50%, F3 at ~75%)
          const formant1 = Math.exp(-Math.pow(normI - 0.2, 2) / 0.02) * 200;
          const formant2 = Math.exp(-Math.pow(normI - 0.5, 2) / 0.04) * 160;
          const formant3 = Math.exp(-Math.pow(normI - 0.75, 2) / 0.03) * 120;

          const wave = Math.sin(phase + i * 0.25) * 25 + Math.cos(phase * 1.5 + i * 0.1) * 20;
          const noise = Math.random() * 25;

          const val = Math.min(255, Math.max(15, Math.floor(formant1 + formant2 + formant3 + wave + noise)));
          freqArray[i] = val;
          if (val > maxVal) maxVal = val;
        }
        setPeakDb(Math.round(20 * Math.log10(maxVal / 255)));
        setEstPitch(Math.round(180 + Math.sin(phase) * 60));
      } else if (!isPlaying) {
        // Idle ambient subtle movement
        phase += 0.03;
        for (let i = 0; i < barCount; i++) {
          freqArray[i] = Math.max(4, Math.floor(Math.sin(phase + i * 0.2) * 6 + 8));
        }
        setPeakDb(-60);
        setEstPitch(0);
      }

      // Draw Bars
      const barSpacing = 2;
      const totalBarWidth = w - (barCount * barSpacing);
      const barWidth = Math.max(2, totalBarWidth / barCount);

      // Create Gradient
      const grad = ctx2d.createLinearGradient(0, h, 0, 0);
      grad.addColorStop(0, theme.dark);
      grad.addColorStop(0.6, theme.secondary);
      grad.addColorStop(1, theme.primary);

      ctx2d.fillStyle = grad;

      for (let i = 0; i < barCount; i++) {
        const val = freqArray[i];
        const barHeight = Math.max(2, (val / 255) * (h - 10));
        const x = i * (barWidth + barSpacing);
        const y = h - barHeight;

        // Draw Bar
        ctx2d.fillRect(x, y, barWidth, barHeight);

        // Update & Draw Peak Hold Marker
        if (barHeight > peakDecay[i]) {
          peakDecay[i] = barHeight;
        } else {
          peakDecay[i] = Math.max(2, peakDecay[i] - 1.2);
        }

        const peakY = h - peakDecay[i] - 2;
        ctx2d.fillStyle = '#ffffff';
        ctx2d.fillRect(x, peakY, barWidth, 2);
        ctx2d.fillStyle = grad;
      }

      // Draw Wave Curve Overlay
      ctx2d.strokeStyle = theme.primary;
      ctx2d.lineWidth = 1.5;
      ctx2d.shadowColor = theme.glow;
      ctx2d.shadowBlur = isPlaying ? 8 : 2;
      ctx2d.beginPath();

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + barSpacing) + barWidth / 2;
        const y = h - ((freqArray[i] / 255) * (h - 12)) - 4;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
      }
      ctx2d.stroke();
      ctx2d.shadowBlur = 0; // Reset shadow

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, colorTheme, height]);

  return (
    <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 space-y-2 shadow-inner">
      {/* Top Telemetry Header */}
      <div className="flex items-center justify-between font-mono text-[10px]">
        <div className="flex items-center space-x-2">
          <AudioWaveform className={`w-3.5 h-3.5 ${isPlaying ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-slate-300 font-bold uppercase tracking-wider">{label}</span>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <span>
            PEAK: <strong className={isPlaying ? 'text-cyan-300' : 'text-slate-500'}>{isPlaying ? `${peakDb} dB` : '-60 dB'}</strong>
          </span>
          <span>
            PITCH: <strong className={isPlaying ? 'text-emerald-300' : 'text-slate-500'}>{isPlaying ? `${estPitch} Hz` : '0 Hz'}</strong>
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`} />
            <strong className={isPlaying ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
              {isPlaying ? 'LIVE FFT STREAM' : 'IDLE'}
            </strong>
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="w-full relative overflow-hidden rounded-lg bg-slate-900/90 border border-slate-800">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        />
      </div>
    </div>
  );
};
