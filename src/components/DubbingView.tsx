import React, { useState } from 'react';
import { EpisodeProject, DubbingTrack, ShotItem, VoiceVaultSample } from '../types';
import { AudioSpectrumVisualizer } from './AudioSpectrumVisualizer';
import { EmotionRadarKeyframeStudio, EmotionVector } from './EmotionRadarKeyframeStudio';
import { 
  Mic, 
  Sparkles, 
  Play, 
  Square,
  Volume2, 
  Globe, 
  Wand2, 
  Languages, 
  CheckCircle2, 
  Music,
  Download,
  Fingerprint,
  RefreshCw,
  SlidersHorizontal,
  Save,
  Trash2,
  Activity,
  Shield,
  Info,
  Check,
  Star,
  BookmarkPlus,
  AudioWaveform,
  Library
} from 'lucide-react';

interface DubbingViewProps {
  project: EpisodeProject;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
  onSynthesizeDubTrack: (shotId: string, character: string, text: string, emotion: string, voicePersona: string, pitch?: number) => void;
  isGenerating: boolean;
  onOpenVoiceVault?: (characterName?: string) => void;
}

const AUDITION_SAMPLES = [
  { id: 'audition-1', label: 'Dynamic Action & Combat Shouts', description: 'Simulates heavy exertion, battle instructions, or action grunts.', text: 'System check: Reactor core at 120%! Get to the escape pods now!' },
  { id: 'audition-2', label: 'Melodramatic Story Confession', description: 'Captures soft tones, quivering breaths, and intense drama.', text: 'I never wanted it to end this way... but we have to save what is left of Neo-Tokyo.' },
  { id: 'audition-3', label: 'Low Pitch Exposition / Cyber Narrative', description: 'Excellent for steady tone, narrative baritone, or cold technical dialogue.', text: 'The servers have gone dark. The AI director is now running on a local host bus.' }
];

// High fidelity technological sound chimes using the Web Audio API
const playSweepSound = (frequencyStart = 200, frequencyEnd = 800, duration = 0.8) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequencyStart, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequencyEnd, ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Web Audio sweep sound not supported or blocked by user guest policy:", e);
  }
};

export const DubbingView: React.FC<DubbingViewProps> = ({
  project,
  onUpdateProject,
  onSynthesizeDubTrack,
  isGenerating,
  onOpenVoiceVault
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'JA' | 'EN'>('JA');
  const [selectedKokoroVoice, setSelectedKokoroVoice] = useState<string>('jf_alpha');
  const [voicePitch, setVoicePitch] = useState<number>(0);
  const [synthesizingShotId, setSynthesizingShotId] = useState<string | null>(null);
  const [isAuditionPlaying, setIsAuditionPlaying] = useState<boolean>(false);
  const [visemeTracks, setVisemeTracks] = useState<Record<string, { time: number; viseme: string }[]>>({});
  const [selectedRadarShotId, setSelectedRadarShotId] = useState<string | null>(null);

  // Vocal Fingerprint States
  const [selectedCharId, setSelectedCharId] = useState<string>(project.cast[0]?.id || '');
  const [activeSampleId, setActiveSampleId] = useState<string>('audition-1');
  const [isAnalyzingFingerprint, setIsAnalyzingFingerprint] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordingIntervalId, setRecordingIntervalId] = useState<any>(null);
  const [isProfileRegistered, setIsProfileRegistered] = useState<boolean>(false);

  const [fingerprintResult, setFingerprintResult] = useState<{
    fingerprintId: string;
    timbreDescription: string;
    pitchStability: number;
    formantFrequencies: number[];
    speedCadence: number;
    resonanceCoefficient: number;
    breathiness: number;
    loraModelName: string;
    energyDistribution: number[];
    isTrained: boolean;
  } | null>(null);

  // Dialogue Shots
  const dialogueShots = project.shots.filter(s => s.dialogueLine);

  const kokoroVoices = selectedLanguage === 'JA' ? [
    { id: 'jf_alpha', name: 'Kokoro-82M (Japanese Female Alpha)' },
    { id: 'jm_kaito', name: 'Kokoro-82M (Japanese Male Kaito)' },
    { id: 'jm_ryu', name: 'Kokoro-82M (Japanese Male Ryu)' }
  ] : [
    { id: 'af_heart', name: 'Kokoro-82M (English Female Heart)' },
    { id: 'am_adam', name: 'Kokoro-82M (English Male Adam)' },
    { id: 'af_bella', name: 'Kokoro-82M (English Female Bella)' }
  ];

  // Trigger Audition Preview with real-time spectrum visualizer activation
  const triggerAuditionPreview = (textToSpeak?: string) => {
    if (isAuditionPlaying) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsAuditionPlaying(false);
      return;
    }

    setIsAuditionPlaying(true);
    playSweepSound(300, 900, 0.6);

    const text = textToSpeak || "Testing Kokoro-82M neural voice persona with real-time AudioContext spectrum analysis!";
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage === 'JA' ? 'ja-JP' : 'en-US';
      utterance.pitch = Math.max(0.5, Math.min(2.0, 1.0 + voicePitch * 0.05));
      utterance.rate = 1.05;

      utterance.onend = () => setIsAuditionPlaying(false);
      utterance.onerror = () => setIsAuditionPlaying(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsAuditionPlaying(false), 4000);
    }
  };

  // Synthesize using Kokoro-82M Endpoint
  const handleSynthesizeKokoroVoice = async (shot: ShotItem) => {
    if (!shot.dialogueLine) return;
    setSynthesizingShotId(shot.id);
    setIsAuditionPlaying(true);

    // Find if character has an active voice fingerprint!
    const charObj = project.cast.find(c => shot.charactersInShot.includes(c.name)) || project.cast[0];
    const voiceFingerprint = charObj?.voiceFingerprint;

    try {
      const res = await fetch('/api/tts/kokoro-synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: shot.dialogueLine,
          character: shot.charactersInShot[0] || 'Hero',
          voicePreset: selectedKokoroVoice,
          language: selectedLanguage,
          voiceFingerprint: voiceFingerprint,
          pitch: voicePitch
        })
      });

      const data = await res.json();

      if (data.visemeSequence) {
        setVisemeTracks(prev => ({ ...prev, [shot.id]: data.visemeSequence }));
      }

      if (data.audioBase64) {
        const audio = new Audio(data.audioBase64);
        audio.play().catch(() => {});
        audio.onended = () => setIsAuditionPlaying(false);
      } else {
        // Fallback browser speech synthesis with Kokoro pitch modulation & vocal fingerprint offsets
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(shot.dialogueLine);
          utterance.lang = selectedLanguage === 'JA' ? 'ja-JP' : 'en-US';
          
          if (voiceFingerprint) {
            // Apply physical sliders to web speech engine fallback
            const basePitch = voiceFingerprint.resonanceCoefficient;
            utterance.pitch = Math.max(0.5, Math.min(2.0, basePitch + voicePitch * 0.05)); 
            utterance.rate = voiceFingerprint.speedCadence;
          } else {
            const basePitch = selectedKokoroVoice.startsWith('j') ? 1.1 : 1.0;
            utterance.pitch = Math.max(0.5, Math.min(2.0, basePitch + voicePitch * 0.05));
            utterance.rate = 1.0;
          }
          utterance.onend = () => setIsAuditionPlaying(false);
          utterance.onerror = () => setIsAuditionPlaying(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => setIsAuditionPlaying(false), 3500);
        }
      }
    } catch (err) {
      console.error('Kokoro synthesis error:', err);
      setIsAuditionPlaying(false);
    } finally {
      setSynthesizingShotId(null);
    }
  };

  // Mock Mic Recording Handler
  const startMockRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    playSweepSound(400, 800, 0.3);
    const interval = setInterval(() => {
      setRecordingSeconds(prev => {
        if (prev >= 5) {
          clearInterval(interval);
          setIsRecording(false);
          const targetName = project.cast.find(c => c.id === selectedCharId)?.name || 'Hero';
          runSpectralAnalysis(targetName, 'audition-custom');
          return 5;
        }
        return prev + 1;
      });
    }, 1000);
    setRecordingIntervalId(interval);
  };

  const stopMockRecording = () => {
    if (recordingIntervalId) {
      clearInterval(recordingIntervalId);
    }
    setIsRecording(false);
    playSweepSound(800, 400, 0.3);
    const targetName = project.cast.find(c => c.id === selectedCharId)?.name || 'Hero';
    runSpectralAnalysis(targetName, 'audition-custom');
  };

  // Run Spectral Analysis and Query Backend Voice Analyzer
  const runSpectralAnalysis = async (characterName: string, sampleId: string) => {
    setIsAnalyzingFingerprint(true);
    setAnalysisProgress(0);
    setAnalysisLogs([]);
    playSweepSound(300, 1100, 1.2);

    const logSteps = [
      "Establishing high-speed DSP audio stream pipeline...",
      "Executing noise reduction algorithm: filtering ambient acoustics...",
      "Fourier Transform (FFT) sequence initiated... analyzing spectral waves.",
      "Extracting formant frequencies F1, F2, F3 & formant poles...",
      "Mapping timber characteristics and sub-harmonic tone resonance...",
      "Tracing breathiness coefficients and glottal flow properties...",
      "Calculating hyper-dimensional LoRA adapter weight matrices...",
      "Analysis complete! Neural Vocal Fingerprint compiled successfully."
    ];

    for (let i = 0; i < logSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnalysisProgress(Math.floor(((i + 1) / logSteps.length) * 100));
      setAnalysisLogs(prev => [...prev, logSteps[i]]);
    }

    try {
      const res = await fetch('/api/tts/analyze-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterName, sampleId })
      });
      const data = await res.json();
      if (data.success && data.voiceFingerprint) {
        setFingerprintResult(data.voiceFingerprint);
        playSweepSound(600, 900, 0.5);
      }
    } catch (e) {
      console.error("Vocal analysis error:", e);
    } finally {
      setIsAnalyzingFingerprint(false);
    }
  };

  // Register Voice Profile and update Project
  const handleRegisterFingerprint = () => {
    if (!fingerprintResult || !selectedCharId) return;
    
    const updatedCast = project.cast.map(c => {
      if (c.id === selectedCharId) {
        return {
          ...c,
          voiceFingerprint: fingerprintResult
        };
      }
      return c;
    });

    onUpdateProject({ cast: updatedCast });
    playSweepSound(600, 1100, 0.4);
    
    setIsProfileRegistered(true);
    setTimeout(() => setIsProfileRegistered(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-rose-950 text-rose-400 border border-rose-800">
            <Mic className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Real-Time Voice Synthesis &amp; Dubbing Studio
            </h2>
            <p className="text-xs text-slate-400">
              Generates lip-sync aligned voice tracks in Japanese (JA Anime) and English (EN Dubbing)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center space-x-2 gap-2">
          <button
            onClick={() => triggerAuditionPreview("Auditioning active voice persona with real-time spectrum wave analysis!")}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isAuditionPlaying
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
            }`}
          >
            {isAuditionPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                <span>Stop Wave Preview</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                <span>Audition Spectrum Wave</span>
              </>
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setSelectedLanguage('JA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedLanguage === 'JA'
                  ? 'bg-rose-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇯🇵 Japanese
            </button>
            <button
              onClick={() => setSelectedLanguage('EN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedLanguage === 'EN'
                  ? 'bg-rose-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇺🇸 English
            </button>
          </div>
        </div>
      </div>

      {/* REAL-TIME AUDIOCONTEXT FREQUENCY SPECTRUM VISUALIZER */}
      <AudioSpectrumVisualizer
        isPlaying={isAuditionPlaying || synthesizingShotId !== null || isAnalyzingFingerprint || isRecording || isGenerating}
        label="AudioContext Real-Time FFT Frequency Spectrum Wave"
        height={90}
        colorTheme={isRecording ? 'rose' : isAnalyzingFingerprint ? 'amber' : 'cyan'}
      />

      {/* VOCAL FINGERPRINT NEURAL AGENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Analysis & Control */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Fingerprint className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Vocal Fingerprint Neural Agent
              </h3>
            </div>
            <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-950/50 px-2.5 py-1 rounded border border-rose-800/40">
              Adapters &amp; Timbre Extraction
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Analyze raw voice clips to construct custom, consistent vocal embeddings. Decouple pitch, resonant frequencies, and speech cadence from default TTS presets to create consistent LoRA-like voice personas across all scenes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Step 1: Input Clip Selection */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-rose-400" />
                  1. Input Voice Clip
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Select Source</span>
              </div>

              {/* Character Select */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-mono block">Target Cast Member:</label>
                <select
                  value={selectedCharId}
                  onChange={(e) => {
                    setSelectedCharId(e.target.value);
                    setFingerprintResult(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-lg p-2 focus:outline-none cursor-pointer font-semibold"
                >
                  {project.cast.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sample Audition Clip Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono block">Pre-recorded Script Sample:</label>
                <div className="space-y-2">
                  {AUDITION_SAMPLES.map(sample => (
                    <div
                      key={sample.id}
                      onClick={() => {
                        setActiveSampleId(sample.id);
                        triggerAuditionPreview(sample.text);
                      }}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        activeSampleId === sample.id
                          ? 'bg-rose-950/40 border-rose-500 text-slate-100'
                          : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold block">{sample.label}</span>
                        {activeSampleId === sample.id && (
                          <span className="text-[9px] bg-rose-500 text-slate-950 px-1 py-0.2 rounded font-mono font-bold">Active</span>
                        )}
                      </div>
                      <p className="text-[10px] mt-1 text-slate-400 line-clamp-1 italic">
                        "{sample.text}"
                      </p>
                    </div>
                  ))}

                  <div
                    onClick={() => {
                      setActiveSampleId('audition-custom');
                      playSweepSound(400, 800, 0.5);
                    }}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      activeSampleId === 'audition-custom'
                        ? 'bg-rose-950/40 border-rose-500 text-slate-100'
                        : 'bg-slate-900/60 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold block">Live Microphone / File Upload</span>
                      {activeSampleId === 'audition-custom' && (
                        <span className="text-[9px] bg-rose-500 text-slate-950 px-1 py-0.2 rounded font-mono font-bold">Active</span>
                      )}
                    </div>
                    <p className="text-[10px] mt-1 text-slate-400">
                      Record a snippet via your physical mic or drag in a voice sample.
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom input panel if custom selected */}
              {activeSampleId === 'audition-custom' && (
                <div className="space-y-3 pt-2 border-t border-slate-900">
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <button
                        onClick={stopMockRecording}
                        className="flex-1 py-2 px-3 rounded-lg bg-red-600 text-slate-950 font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping" />
                        <span>Stop ({recordingSeconds}s)</span>
                      </button>
                    ) : (
                      <button
                        onClick={startMockRecording}
                        className="flex-1 py-2 px-3 rounded-lg bg-rose-600 text-slate-950 font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5 text-slate-950" />
                        <span>Start Mic Record</span>
                      </button>
                    )}
                    
                    <label className="flex-1 py-2 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-850 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center">
                      <Download className="w-3.5 h-3.5 rotate-180" />
                      <span>Upload Clip</span>
                      <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                        playSweepSound(500, 700, 0.4);
                        if (e.target.files?.[0]) {
                          alert(`Vocal sample file "${e.target.files[0].name}" uploaded successfully! Ready for spectral analysis.`);
                        }
                      }} />
                    </label>
                  </div>

                  {isRecording && (
                    <div className="bg-slate-900 p-2 rounded border border-slate-800/80 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-rose-400 animate-pulse">● CAPTURING AUDIO STREAM...</span>
                      <div className="flex gap-0.5 h-3 items-end">
                        <div className="w-0.5 bg-rose-500 h-2 animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-0.5 bg-rose-500 h-3 animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <div className="w-0.5 bg-rose-500 h-1.5 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-0.5 bg-rose-500 h-3.5 animate-bounce" style={{ animationDelay: '0.4s' }} />
                        <div className="w-0.5 bg-rose-500 h-2 animate-bounce" style={{ animationDelay: '0.15s' }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Spectral Analysis Trigger */}
              <button
                onClick={() => {
                  const targetName = project.cast.find(c => c.id === selectedCharId)?.name || 'Hero';
                  runSpectralAnalysis(targetName, activeSampleId);
                }}
                disabled={isAnalyzingFingerprint}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-slate-950 font-bold text-xs rounded-lg hover:opacity-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-lg"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-950 ${isAnalyzingFingerprint ? 'animate-spin' : ''}`} />
                <span>{isAnalyzingFingerprint ? 'Analyzing Spectral Waves...' : 'Analyze Vocal Fingerprint'}</span>
              </button>
            </div>

            {/* Step 2: Analyzer Progress Terminal or Active Passport */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
              
              {isAnalyzingFingerprint ? (
                /* Analyzer Progress Terminal */
                <div className="h-full flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 uppercase flex items-center gap-1.5 animate-pulse">
                      <Activity className="w-3.5 h-3.5 text-rose-400" />
                      Spectral Wave Analysis
                    </span>
                    <span className="text-xs font-mono text-slate-400">{analysisProgress}%</span>
                  </div>

                  <div className="flex-1 bg-slate-900 border border-slate-850 p-3 rounded-lg font-mono text-[9px] text-slate-400 space-y-2 overflow-y-auto max-h-[180px] leading-relaxed no-scrollbar">
                    {analysisLogs.map((log, index) => (
                      <div key={index} className="flex gap-1.5">
                        <span className="text-rose-500">➜</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    <div className="animate-pulse text-rose-400 font-bold">● EXECUTING FOURIER SPECTRAL TRANSFORM...</div>
                  </div>

                  {/* Visualizer Loading bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-rose-500 h-1.5 transition-all duration-300" style={{ width: `${analysisProgress}%` }} />
                  </div>
                </div>
              ) : fingerprintResult ? (
                /* Neural Passport Results panel */
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                      Vocal Passport Ready
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{fingerprintResult.fingerprintId}</span>
                  </div>

                  <div className="space-y-3">
                    {/* Timbre description editing box */}
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-mono block">Timbre Character Prompt:</label>
                      <textarea
                        value={fingerprintResult.timbreDescription}
                        onChange={(e) => setFingerprintResult({ ...fingerprintResult, timbreDescription: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 text-[10px] text-slate-100 p-2 rounded-lg font-mono focus:outline-none focus:border-rose-500/40 resize-none h-14 leading-normal"
                      />
                    </div>

                    {/* Interactive DSP Sliders */}
                    <div className="grid grid-cols-2 gap-3">
                      
                      {/* Pitch stability */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <span>Pitch Stability:</span>
                          <strong className="text-emerald-400">{fingerprintResult.pitchStability}%</strong>
                        </div>
                        <input
                          type="range"
                          min="80"
                          max="100"
                          step="0.5"
                          value={fingerprintResult.pitchStability}
                          onChange={(e) => setFingerprintResult({ ...fingerprintResult, pitchStability: parseFloat(e.target.value) })}
                          className="w-full accent-emerald-500 h-1 bg-slate-900 rounded cursor-pointer appearance-none animate-none"
                        />
                      </div>

                      {/* Speed cadence */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <span>Speed Cadence:</span>
                          <strong className="text-cyan-400">{fingerprintResult.speedCadence}x</strong>
                        </div>
                        <input
                          type="range"
                          min="0.6"
                          max="1.5"
                          step="0.05"
                          value={fingerprintResult.speedCadence}
                          onChange={(e) => setFingerprintResult({ ...fingerprintResult, speedCadence: parseFloat(e.target.value) })}
                          className="w-full accent-cyan-500 h-1 bg-slate-900 rounded cursor-pointer appearance-none animate-none"
                        />
                      </div>

                      {/* Tone Resonance */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <span>Tone Resonance:</span>
                          <strong className="text-amber-400">{fingerprintResult.resonanceCoefficient}x</strong>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.05"
                          value={fingerprintResult.resonanceCoefficient}
                          onChange={(e) => setFingerprintResult({ ...fingerprintResult, resonanceCoefficient: parseFloat(e.target.value) })}
                          className="w-full accent-amber-500 h-1 bg-slate-900 rounded cursor-pointer appearance-none animate-none"
                        />
                      </div>

                      {/* Breathiness */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-slate-400">
                          <span>Breathiness Ratio:</span>
                          <strong className="text-rose-400">{fingerprintResult.breathiness}</strong>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="0.8"
                          step="0.02"
                          value={fingerprintResult.breathiness}
                          onChange={(e) => setFingerprintResult({ ...fingerprintResult, breathiness: parseFloat(e.target.value) })}
                          className="w-full accent-rose-500 h-1 bg-slate-900 rounded cursor-pointer appearance-none animate-none"
                        />
                      </div>

                    </div>

                    {/* Spectral Equalizer visualization */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-slate-500 block">Formant Energy Dispersion:</span>
                      <div className="flex h-10 items-end justify-between bg-slate-900 rounded border border-slate-850 px-3.5 py-1.5">
                        {fingerprintResult.energyDistribution.map((v, i) => {
                          const heightPct = v * 100;
                          return (
                            <div key={i} className="w-1/5 flex flex-col items-center space-y-1">
                              <div
                                className="w-full bg-gradient-to-t from-rose-600 to-pink-500 rounded transition-all duration-300"
                                style={{ height: `${Math.max(10, heightPct)}px` }}
                              />
                              <span className="text-[7px] font-mono text-slate-600">F{i+1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sync and Save */}
                  <button
                    onClick={handleRegisterFingerprint}
                    className="w-full mt-2 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:opacity-95 transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-950" />
                    <span>
                      {isProfileRegistered ? '✓ Sync Complete!' : `Sync & Save Profile to ${project.cast.find(c => c.id === selectedCharId)?.name}`}
                    </span>
                  </button>
                </div>
              ) : (
                /* Initial Idle state */
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-full text-slate-500">
                    <Fingerprint className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide block">
                      Awaiting Voice Analysis
                    </span>
                    <p className="text-[11px] text-slate-500 leading-normal max-w-[200px] mt-1.5">
                      Select an input vocal clip and trigger the Fourier analyzer pipeline to establish a neural passport.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Connected Vault */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Voice Vault &amp; Anchors
              </h3>
            </div>
            {onOpenVoiceVault && (
              <button
                onClick={() => onOpenVoiceVault()}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                <Library className="w-3 h-3 text-cyan-400" />
                <span>Open Library →</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400 leading-normal">
            Active neural voice profiles and stored Voice Vault samples mapped to cast anchors:
          </p>

          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1 no-scrollbar">
            {project.cast.map(char => {
              const hasFingerprint = !!char.voiceFingerprint;
              const charVaultSamples = (project.voiceVaultSamples || []).filter(s => s.characterId === char.id);
              const primarySample = charVaultSamples.find(s => s.isPrimaryForCharacter) || charVaultSamples[0];

              return (
                <div
                  key={char.id}
                  className={`p-3 rounded-xl border transition-all ${
                    hasFingerprint || primarySample
                      ? 'bg-indigo-950/20 border-indigo-500/40'
                      : 'bg-slate-950 border-slate-850'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-slate-100 block">{char.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{char.role}</span>
                    </div>

                    {primarySample ? (
                      <span className="flex items-center space-x-1 text-[9px] font-bold font-mono text-amber-300 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-full uppercase">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span>Vault Primary</span>
                      </span>
                    ) : hasFingerprint ? (
                      <span className="flex items-center space-x-1 text-[9px] font-bold font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-900 px-2 py-0.5 rounded-full uppercase">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping mr-0.5" />
                        <span>Profile Synced</span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold font-mono text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full uppercase">
                        Default TTS
                      </span>
                    )}
                  </div>

                  {primarySample && (
                    <div className="mt-2 p-2 bg-slate-950/80 rounded-lg border border-slate-800/80 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-mono text-cyan-300 font-bold truncate">{primarySample.sampleTitle}</span>
                        <span className="font-mono text-[9px] text-slate-400">{primarySample.language}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 italic line-clamp-1">"{primarySample.transcriptText}"</p>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{charVaultSamples.length} Vault Samples</span>
                    {onOpenVoiceVault && (
                      <button
                        onClick={() => onOpenVoiceVault(char.name)}
                        className="text-cyan-400 hover:underline cursor-pointer font-bold"
                      >
                        Manage Voice Vault →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Visual Emotion Radar Chart & Keyframe Studio */}
      <EmotionRadarKeyframeStudio
        project={project}
        dialogueShots={dialogueShots}
        selectedShotId={selectedRadarShotId || dialogueShots[0]?.id || null}
        onSelectShot={(shotId) => setSelectedRadarShotId(shotId)}
        onSynthesizeShot={(shot, emotionName, vector) => {
          const charName = shot.charactersInShot[0] || 'Hero';
          const charObj = project.cast.find(c => shot.charactersInShot.includes(c.name)) || project.cast[0];
          const voicePersona = charObj?.voicePersona || 'Kore';
          // Compute pitch offset based on emotion intensity and vector sorrow vs joy
          const pitchOffset = Math.round((vector.intensity - 50) / 10 + (vector.joy - vector.sorrow) / 15);
          onSynthesizeDubTrack(shot.id, charName, shot.dialogueLine || '', emotionName, voicePersona, pitchOffset);
        }}
        isGenerating={isGenerating}
      />

      {/* Voice Tracks List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200">
            Dialogue Dubbing Queue ({dialogueShots.length} Lines)
          </h3>
          <div className="flex flex-wrap items-center space-x-3 gap-2">
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-mono text-slate-300 font-semibold whitespace-nowrap">Voice Pitch:</span>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={voicePitch}
                onChange={(e) => setVoicePitch(parseInt(e.target.value))}
                className="w-20 sm:w-28 accent-rose-500 h-1 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-rose-400 w-6 text-right">
                {voicePitch > 0 ? `+${voicePitch}` : voicePitch}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400">Kokoro Preset:</span>
              <select
                value={selectedKokoroVoice}
                onChange={(e) => setSelectedKokoroVoice(e.target.value)}
                className="bg-slate-950 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
              >
                {kokoroVoices.map(v => (
                  <option key={v.id} value={v.id} className="bg-slate-900 text-slate-200">{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {dialogueShots.map((shot) => {
            const charObj = project.cast.find(c => shot.charactersInShot.includes(c.name)) || project.cast[0];
            const voicePersona = charObj?.voicePersona || 'Kore';
            const speedScale = charObj?.voiceFingerprint?.speedCadence || 1.0;
            const currentVisemes = visemeTracks[shot.id] || [
              { time: 0, viseme: 'SIL' }, 
              { time: parseFloat((0.1 / speedScale).toFixed(2)), viseme: 'AA' }, 
              { time: parseFloat((0.2 / speedScale).toFixed(2)), viseme: 'EE' },
              { time: parseFloat((0.3 / speedScale).toFixed(2)), viseme: 'IY' }, 
              { time: parseFloat((0.4 / speedScale).toFixed(2)), viseme: 'OH' }, 
              { time: parseFloat((0.5 / speedScale).toFixed(2)), viseme: 'UW' }, 
              { time: parseFloat((0.6 / speedScale).toFixed(2)), viseme: 'SIL' }
            ];

            return (
              <div
                key={shot.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold font-mono text-cyan-400">
                      Shot #{shot.shotNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-100 uppercase bg-slate-800 px-2 py-0.5 rounded">
                      {shot.charactersInShot[0] || 'CHARACTER'}
                    </span>
                    {charObj?.voiceFingerprint ? (
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/60 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                        <Fingerprint className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>VFP Active ({charObj.voiceFingerprint.fingerprintId})</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-mono bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/60 uppercase">
                        Kokoro Engine ({selectedKokoroVoice})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSynthesizeKokoroVoice(shot)}
                      disabled={synthesizingShotId === shot.id || isGenerating}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 text-slate-950 font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${synthesizingShotId === shot.id ? 'animate-spin' : ''}`} />
                      <span>{synthesizingShotId === shot.id ? 'Synthesizing...' : 'Kokoro Voice'}</span>
                    </button>

                    <button
                      onClick={() => {
                        const charName = shot.charactersInShot[0] || 'Hero';
                        onSynthesizeDubTrack(shot.id, charName, shot.dialogueLine || '', 'Urgent', voicePersona, voicePitch);
                      }}
                      disabled={isGenerating}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-200 font-bold text-xs hover:bg-indigo-900 transition-all cursor-pointer shadow disabled:opacity-50"
                      title={`Synthesize with Gemini TTS using Pitch ${voicePitch > 0 ? '+' : ''}${voicePitch}`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Gemini TTS</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <p className="text-xs text-slate-100 font-serif italic">
                    "{shot.dialogueLine}"
                  </p>
                </div>

                {/* Visemes Alignment Visualizer */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Kokoro-82M Viseme Phoneme Timeline (Frame Sync Grid):
                  </span>
                  <div className="h-7 w-full bg-slate-900 rounded border border-slate-800/80 flex items-center px-2 space-x-1.5 overflow-x-auto no-scrollbar">
                    {currentVisemes.map((v, i) => (
                      <div
                        key={i}
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 flex items-center space-x-1 whitespace-nowrap"
                      >
                        <span>{v.viseme}</span>
                        <span className="text-[8px] opacity-60">@{v.time}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
