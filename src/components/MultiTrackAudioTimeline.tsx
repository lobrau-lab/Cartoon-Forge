import React, { useState, useEffect, useRef } from 'react';
import { 
  EpisodeProject, 
  ScriptScene, 
  DialogueLine, 
  SceneAudioTimelineConfig, 
  WordEmotionKeyframe, 
  LipSyncVisemeFrame, 
  LipSyncPhoneme, 
  FoleySoundEvent 
} from '../types';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Mic, 
  Music, 
  Zap, 
  Sliders, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Plus, 
  Trash2, 
  Activity, 
  Layers, 
  Radio, 
  Smile, 
  AudioWaveform, 
  Clock, 
  Info,
  ChevronRight,
  RefreshCw,
  Film
} from 'lucide-react';

interface Props {
  project: EpisodeProject;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
}

// Default BGM Preset Options
const BGM_PRESETS = [
  'Neo-Tokyo Cyberpunk Industrial Synthwave',
  'High-Stakes Orchestral Climax',
  'Melancholic Rain & Piano Motif',
  'Action Combat Staccato Drums',
  'Ethereal Sci-Fi Ambient Pad'
];

// Default Foley FX Options
const FOLEY_PRESETS: { name: string; category: FoleySoundEvent['category'] }[] = [
  { name: 'Rain & Thunder Ambience', category: 'Ambience' },
  { name: 'Laser Katana Blade Clash', category: 'Combat' },
  { name: 'Heavy Armor Footsteps', category: 'Footstep' },
  { name: 'Plasma Energy Discharge', category: 'Sci-Fi' },
  { name: 'Cybernetic Interface Beep', category: 'UI' },
  { name: 'Explosive Shockwave', category: 'Impact' }
];

// Viseme Mouth Shape Renderer Helper
const renderMouthShapeSvg = (viseme: LipSyncPhoneme, intensity: number) => {
  const openAmount = Math.max(0.1, intensity);
  
  switch (viseme) {
    case 'A': // Wide open round
      return (
        <svg viewBox="0 0 100 60" className="w-16 h-12">
          <ellipse cx="50" cy="30" rx={28 * openAmount} ry={22 * openAmount} fill="#f43f5e" stroke="#fff" strokeWidth="2" />
          <path d="M25 22 Q50 15 75 22" fill="none" stroke="#fff" strokeWidth="2" />
          <path d="M35 38 Q50 48 65 38" fill="#e11d48" />
        </svg>
      );
    case 'E': // Slightly open wide smile
      return (
        <svg viewBox="0 0 100 60" className="w-16 h-12">
          <path d={`M 20 30 Q 50 ${30 + 12 * openAmount} 80 30 Q 50 ${30 - 8 * openAmount} 20 30`} fill="#f43f5e" stroke="#fff" strokeWidth="2" />
          <rect x="30" y="27" width="40" height="4" fill="#ffffff" rx="1" />
        </svg>
      );
    case 'I': // Wide teeth smile
      return (
        <svg viewBox="0 0 100 60" className="w-16 h-12">
          <path d={`M 15 30 Q 50 ${30 + 8 * openAmount} 85 30 Q 50 ${30 - 6 * openAmount} 15 30`} fill="#f43f5e" stroke="#fff" strokeWidth="2" />
          <rect x="22" y="27" width="56" height="5" fill="#ffffff" rx="1" />
        </svg>
      );
    case 'O': // Rounded O lips
      return (
        <svg viewBox="0 0 100 60" className="w-16 h-12">
          <circle cx="50" cy="30" r={16 * openAmount + 4} fill="#e11d48" stroke="#fff" strokeWidth="2" />
        </svg>
      );
    case 'U': // Tight puckered lips
      return (
        <svg viewBox="0 0 100 60" className="w-16 h-12">
          <circle cx="50" cy="30" r={10 * openAmount + 3} fill="#be123c" stroke="#fff" strokeWidth="2" />
        </svg>
      );
    case 'MBP': // Closed lips
      return (
        <svg viewBox="0 0 100 60" className="w-16 h-12">
          <line x1="20" y1="30" x2="80" y2="30" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'FV': // Upper teeth on bottom lip
      return (
        <svg viewBox="0 0 100 60" className="w-16 h-12">
          <path d="M 22 32 Q 50 38 78 32 Q 50 25 22 32" fill="#be123c" stroke="#fff" strokeWidth="2" />
          <rect x="32" y="26" width="36" height="4" fill="#ffffff" rx="1" />
        </svg>
      );
    case 'L': // Open tongue raised
      return (
        <svg viewBox="0 0 100 60" className="w-16 h-12">
          <path d="M 22 28 Q 50 42 78 28 Q 50 18 22 28" fill="#e11d48" stroke="#fff" strokeWidth="2" />
          <path d="M 38 32 Q 50 22 62 32" fill="#fb7185" />
        </svg>
      );
    case 'Rest':
    default:
      return (
        <svg viewBox="0 0 100 60" className="w-16 h-12">
          <line x1="25" y1="30" x2="75" y2="30" stroke="#fb7185" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
};

// Generate default visemes for text
const generateVisemesForText = (text: string, character: string, durationSec: number): LipSyncVisemeFrame[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const totalDuration = Math.max(1.5, durationSec || words.length * 0.4);
  const frames: LipSyncVisemeFrame[] = [];
  
  let currentTime = 0;
  const timePerChar = totalDuration / Math.max(1, text.length);

  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();
    let viseme: LipSyncPhoneme = 'Rest';
    let intensity = 0.8;

    if (['A', 'AH', 'HA'].includes(char)) viseme = 'A';
    else if (['E', 'EY', 'EH'].includes(char)) viseme = 'E';
    else if (['I', 'Y'].includes(char)) viseme = 'I';
    else if (['O', 'OH', 'AW'].includes(char)) viseme = 'O';
    else if (['U', 'W', 'OO'].includes(char)) viseme = 'U';
    else if (['M', 'B', 'P'].includes(char)) viseme = 'MBP';
    else if (['F', 'V'].includes(char)) viseme = 'FV';
    else if (['L', 'N', 'T', 'D'].includes(char)) viseme = 'L';
    else if (char === ' ') viseme = 'Rest';

    frames.push({
      id: `viseme-${i}-${Date.now()}`,
      timeSec: parseFloat(currentTime.toFixed(2)),
      durationSec: parseFloat(timePerChar.toFixed(2)),
      viseme,
      intensity: viseme === 'Rest' ? 0.1 : intensity,
      characterName: character
    });

    currentTime += timePerChar;
  }

  return frames;
};

// Generate initial word keyframes
const generateInitialWordKeyframes = (text: string): WordEmotionKeyframe[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const totalDuration = Math.max(2, words.length * 0.45);
  const wordDuration = totalDuration / Math.max(1, words.length);

  return words.map((word, idx) => ({
    id: `word-key-${idx}-${Date.now()}`,
    word: word.replace(/[^a-zA-Z0-9']/g, ''),
    startSec: parseFloat((idx * wordDuration).toFixed(2)),
    durationSec: parseFloat(wordDuration.toFixed(2)),
    pitchShiftSemitones: idx === words.length - 1 ? 2 : 0, // Natural cadence inflection
    speedRate: 1.0,
    emotionIntensity: 65,
    emotionTag: idx === words.length - 1 ? 'Shout' : 'Neutral'
  }));
};

export const MultiTrackAudioTimeline: React.FC<Props> = ({ project, onUpdateProject }) => {
  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(project.scenes[0]?.sceneNumber || 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  const [activeDialogueId, setActiveDialogueId] = useState<string>('');

  // Audio Timeline Configuration State
  const [timelineConfigs, setTimelineConfigs] = useState<Record<number, SceneAudioTimelineConfig>>({});

  const activeScene = project.scenes.find(s => s.sceneNumber === selectedSceneNumber) || project.scenes[0];
  const sceneShots = project.shots.filter(s => s.sceneNumber === selectedSceneNumber);
  const totalSceneDurationSec = Math.max(12, sceneShots.reduce((acc, s) => acc + (s.durationSec || 3), 0));

  // Initialize Scene Audio Config
  useEffect(() => {
    if (!activeScene) return;
    
    if (!timelineConfigs[selectedSceneNumber]) {
      const defaultDialogueLines = activeScene.dialogue || [];
      const firstDiagId = defaultDialogueLines[0]?.id || 'diag-1';

      const initialWordKeyframes: Record<string, WordEmotionKeyframe[]> = {};
      const initialLipSync: Record<string, LipSyncVisemeFrame[]> = {};

      defaultDialogueLines.forEach(d => {
        initialWordKeyframes[d.id] = generateInitialWordKeyframes(d.line);
        initialLipSync[d.id] = generateVisemesForText(d.line, d.character, d.durationEst);
      });

      const initialConfig: SceneAudioTimelineConfig = {
        sceneNumber: selectedSceneNumber,
        masterVolume: 0.9,
        dialogueVolume: 0.95,
        bgmVolume: 0.45,
        foleyVolume: 0.65,
        isDialogueMuted: false,
        isBgmMuted: false,
        isFoleyMuted: false,
        bgmTrackName: BGM_PRESETS[0],
        foleyEvents: [
          { id: 'foley-1', name: 'Rain Ambience', category: 'Ambience', timestampSec: 0, durationSec: totalSceneDurationSec, volume: 0.4, pan: 0 },
          { id: 'foley-2', name: 'Laser Blade Clash', category: 'Combat', timestampSec: 2.5, durationSec: 1.2, volume: 0.8, pan: -0.3 },
          { id: 'foley-3', name: 'Cybernetic Interface Beep', category: 'UI', timestampSec: 6.0, durationSec: 0.8, volume: 0.7, pan: 0.4 }
        ],
        wordEmotionKeyframes: initialWordKeyframes,
        lipSyncData: initialLipSync
      };

      setTimelineConfigs(prev => ({ ...prev, [selectedSceneNumber]: initialConfig }));
      setActiveDialogueId(firstDiagId);
    } else {
      const currentConfig = timelineConfigs[selectedSceneNumber];
      const diagIds = Object.keys(currentConfig.wordEmotionKeyframes);
      if (diagIds.length > 0 && !activeDialogueId) {
        setActiveDialogueId(diagIds[0]);
      }
    }
  }, [selectedSceneNumber, activeScene]);

  const config = timelineConfigs[selectedSceneNumber] || {
    sceneNumber: selectedSceneNumber,
    masterVolume: 0.9,
    dialogueVolume: 0.95,
    bgmVolume: 0.45,
    foleyVolume: 0.65,
    isDialogueMuted: false,
    isBgmMuted: false,
    isFoleyMuted: false,
    bgmTrackName: BGM_PRESETS[0],
    foleyEvents: [],
    wordEmotionKeyframes: {},
    lipSyncData: {}
  };

  // Scrubber Master Transport Effect
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 50;
    const timer = setInterval(() => {
      setCurrentTimeSec(prev => {
        const next = prev + intervalMs / 1000;
        if (next >= totalSceneDurationSec) {
          setIsPlaying(false);
          return 0;
        }
        return parseFloat(next.toFixed(2));
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, totalSceneDurationSec]);

  // Web Audio Synth Helper to synthesize preview audio tones & pitch shifts
  const playSynthesizedAudioPreview = (pitchShift = 0, speedRate = 1.0) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 220 * Math.pow(2, pitchShift / 12); // Semitone pitch shift math
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.3 / speedRate);

      gain.gain.setValueAtTime(0.15 * config.masterVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35 / speedRate);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4 / speedRate);
    } catch (e) {
      console.warn('Web Audio synthesis preview not available:', e);
    }
  };

  const updateConfig = (updates: Partial<SceneAudioTimelineConfig>) => {
    setTimelineConfigs(prev => ({
      ...prev,
      [selectedSceneNumber]: {
        ...config,
        ...updates
      }
    }));
  };

  const activeDialogueLine = activeScene?.dialogue?.find(d => d.id === activeDialogueId) || activeScene?.dialogue?.[0];
  const activeWordKeyframes = config.wordEmotionKeyframes[activeDialogueId] || [];
  const activeLipSyncFrames = config.lipSyncData[activeDialogueId] || [];

  // Determine current active viseme at currentTimeSec
  const currentVisemeFrame = activeLipSyncFrames.find(f => 
    currentTimeSec >= f.timeSec && currentTimeSec < (f.timeSec + f.durationSec)
  ) || activeLipSyncFrames[0] || { viseme: 'Rest', intensity: 0.1, characterName: activeDialogueLine?.character || 'Character' };

  // Helper: Apply Preset to Emotion Curve
  const applyEmotionCurvePreset = (presetName: string) => {
    if (!activeDialogueId || activeWordKeyframes.length === 0) return;

    let updatedKeyframes: WordEmotionKeyframe[] = [];

    if (presetName === 'Heroic Climax Shout') {
      updatedKeyframes = activeWordKeyframes.map((k, idx) => ({
        ...k,
        pitchShiftSemitones: Math.min(12, idx * 2),
        speedRate: 1.15,
        emotionIntensity: 90 + idx * 2,
        emotionTag: 'Shout'
      }));
    } else if (presetName === 'Tearful Confession') {
      updatedKeyframes = activeWordKeyframes.map((k, idx) => ({
        ...k,
        pitchShiftSemitones: -3,
        speedRate: 0.8,
        emotionIntensity: 75,
        emotionTag: 'Tremble'
      }));
    } else if (presetName === 'Cinematic Whisper') {
      updatedKeyframes = activeWordKeyframes.map((k, idx) => ({
        ...k,
        pitchShiftSemitones: -5,
        speedRate: 0.9,
        emotionIntensity: 40,
        emotionTag: 'Whisper'
      }));
    } else if (presetName === 'Cyber Cold Monotone') {
      updatedKeyframes = activeWordKeyframes.map((k) => ({
        ...k,
        pitchShiftSemitones: 0,
        speedRate: 1.0,
        emotionIntensity: 20,
        emotionTag: 'Monotone'
      }));
    }

    updateConfig({
      wordEmotionKeyframes: {
        ...config.wordEmotionKeyframes,
        [activeDialogueId]: updatedKeyframes
      }
    });

    playSynthesizedAudioPreview(updatedKeyframes[0]?.pitchShiftSemitones || 0, 1.2);
  };

  // Add Foley Sound Event
  const handleAddFoleyEvent = (foleyPreset: { name: string; category: FoleySoundEvent['category'] }) => {
    const newEvent: FoleySoundEvent = {
      id: `foley-${Date.now()}`,
      name: foleyPreset.name,
      category: foleyPreset.category,
      timestampSec: parseFloat(currentTimeSec.toFixed(1)),
      durationSec: 1.5,
      volume: 0.7,
      pan: 0
    };

    updateConfig({
      foleyEvents: [...config.foleyEvents, newEvent]
    });
  };

  const handleRemoveFoleyEvent = (id: string) => {
    updateConfig({
      foleyEvents: config.foleyEvents.filter(e => e.id !== id)
    });
  };

  // Export Lip-Sync JSON
  const handleExportLipSyncJson = () => {
    const exportData = {
      sceneNumber: selectedSceneNumber,
      sceneHeading: activeScene?.heading || 'Scene',
      exportedAt: new Date().toISOString(),
      dialogueTrack: activeDialogueLine ? {
        character: activeDialogueLine.character,
        line: activeDialogueLine.line,
        phonemes: activeLipSyncFrames
      } : null,
      fullSceneLipSync: config.lipSyncData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scene_${selectedSceneNumber}_lip_sync_visemes.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyLipSyncJson = () => {
    const exportData = {
      sceneNumber: selectedSceneNumber,
      character: activeDialogueLine?.character || 'Character',
      phonemeVisemes: activeLipSyncFrames
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Scene Selector Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-400" />
                Multi-Track Audio Timeline & Kokoro Synthesizer
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono text-[10px]">
                Auto Lip-Sync Visemes Active
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-100 font-mono flex items-center gap-2">
              <AudioWaveform className="w-5 h-5 text-cyan-400" />
              Dynamic Scene Audio Mixer & Voice Emotion Curve Studio
            </h2>
          </div>

          {/* Master Transport & Scene Picker */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Scene Dropdown */}
            <select
              value={selectedSceneNumber}
              onChange={(e) => {
                setSelectedSceneNumber(Number(e.target.value));
                setCurrentTimeSec(0);
                setIsPlaying(false);
              }}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {project.scenes.map(s => (
                <option key={s.sceneNumber} value={s.sceneNumber}>
                  Scene #{s.sceneNumber}: {s.heading}
                </option>
              ))}
            </select>

            {/* Transport Playback Buttons */}
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => {
                  setCurrentTimeSec(0);
                  setIsPlaying(false);
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Rewind to 0s"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  playSynthesizedAudioPreview(0, 1.0);
                }}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? 'Pause' : 'Play Mixer'}</span>
              </button>
            </div>

            {/* Time HUD */}
            <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-cyan-400 font-bold flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTimeSec.toFixed(2)}s / {totalSceneDurationSec.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        {/* Master Volume Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-bold text-[10px]">
              <span>MASTER VOLUME</span>
              <span className="text-cyan-400">{Math.round(config.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.masterVolume}
              onChange={(e) => updateConfig({ masterVolume: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-bold text-[10px]">
              <span className="text-indigo-400">DIALOGUE TRACK</span>
              <span>{Math.round(config.dialogueVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.dialogueVolume}
              onChange={(e) => updateConfig({ dialogueVolume: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-bold text-[10px]">
              <span className="text-amber-400">BGM SOUNDTRACK</span>
              <span>{Math.round(config.bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.bgmVolume}
              onChange={(e) => updateConfig({ bgmVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-bold text-[10px]">
              <span className="text-rose-400">FOLEY FX & AMBIENCE</span>
              <span>{Math.round(config.foleyVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.foleyVolume}
              onChange={(e) => updateConfig({ foleyVolume: parseFloat(e.target.value) })}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: 🎚️ Multi-Track Visual Audio Timeline */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              3-Track Scene Audio Timeline ({totalSceneDurationSec.toFixed(0)}s Total Duration)
            </h3>
          </div>

          <span className="text-[10px] font-mono text-slate-400 italic">
            Scrub playhead or adjust track gains & solo channels
          </span>
        </div>

        {/* Timeline Visual Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden font-mono text-xs">
          {/* Time Ruler Top */}
          <div className="relative h-6 border-b border-slate-800/80 flex items-center pl-36">
            <div className="w-full flex justify-between text-[9px] text-slate-500">
              {Array.from({ length: Math.ceil(totalSceneDurationSec) + 1 }).map((_, sec) => (
                <span key={sec} className="relative">
                  {sec}s
                  <span className="absolute top-4 left-1/2 w-px h-2 bg-slate-800" />
                </span>
              ))}
            </div>

            {/* Playhead Vertical Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-30 pointer-events-none transition-all"
              style={{
                left: `calc(9rem + ${(currentTimeSec / totalSceneDurationSec) * 100}% - ${(currentTimeSec / totalSceneDurationSec) * 9.5}rem)`
              }}
            >
              <div className="w-3 h-3 bg-cyan-400 rounded-full -ml-1.25 -mt-1 shadow-lg shadow-cyan-400/50" />
            </div>
          </div>

          {/* TRACK 1: DIALOGUE VOICE TRACK */}
          <div className="flex items-center space-x-3 border-b border-slate-800/60 pb-3">
            {/* Track Header Controls */}
            <div className="w-32 shrink-0 bg-slate-950 p-2.5 rounded-xl border border-indigo-900/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-400 text-[11px] flex items-center gap-1">
                  <Mic className="w-3 h-3" /> Dialogue
                </span>
                <span className="text-[9px] text-slate-500">Kokoro</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px]">
                <button
                  onClick={() => updateConfig({ isDialogueMuted: !config.isDialogueMuted })}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${config.isDialogueMuted ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400'}`}
                >
                  M
                </button>
                <button
                  onClick={() => updateConfig({ isDialogueSolo: !config.isDialogueSolo })}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${config.isDialogueSolo ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-400'}`}
                >
                  S
                </button>
              </div>
            </div>

            {/* Track Timeline Area */}
            <div className="flex-1 h-14 bg-slate-950/80 rounded-xl border border-indigo-950 relative overflow-hidden flex items-center px-2">
              {activeScene?.dialogue?.map((d, idx) => (
                <div
                  key={d.id}
                  onClick={() => setActiveDialogueId(d.id)}
                  className={`h-10 rounded-lg p-2 flex flex-col justify-between border cursor-pointer transition-all mx-1 shrink-0 overflow-hidden ${
                    d.id === activeDialogueId
                      ? 'bg-indigo-950/90 border-indigo-500 ring-2 ring-indigo-500/30 text-indigo-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                  style={{ width: `${Math.max(18, (d.durationEst / totalSceneDurationSec) * 100)}%` }}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-cyan-300 truncate">{d.character}</span>
                    <span className="text-[9px] text-indigo-400">{d.emotion}</span>
                  </div>
                  <p className="text-[9.5px] truncate italic font-serif opacity-90">"{d.line}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* TRACK 2: BGM SOUNDTRACK */}
          <div className="flex items-center space-x-3 border-b border-slate-800/60 pb-3">
            {/* Track Header Controls */}
            <div className="w-32 shrink-0 bg-slate-950 p-2.5 rounded-xl border border-amber-900/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                  <Music className="w-3 h-3" /> BGM Score
                </span>
                <span className="text-[9px] text-slate-500">Stereo</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px]">
                <button
                  onClick={() => updateConfig({ isBgmMuted: !config.isBgmMuted })}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${config.isBgmMuted ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400'}`}
                >
                  M
                </button>
                <button
                  onClick={() => updateConfig({ isBgmSolo: !config.isBgmSolo })}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${config.isBgmSolo ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-400'}`}
                >
                  S
                </button>
              </div>
            </div>

            {/* Track Timeline Area */}
            <div className="flex-1 h-14 bg-slate-950/80 rounded-xl border border-amber-950/80 relative overflow-hidden flex items-center px-3">
              <div className="w-full h-10 bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 rounded-lg border border-amber-800/50 flex items-center justify-between px-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
                  <select
                    value={config.bgmTrackName}
                    onChange={(e) => updateConfig({ bgmTrackName: e.target.value })}
                    className="bg-slate-900 text-amber-300 font-bold text-xs border border-amber-800/80 rounded px-2 py-1 focus:outline-none cursor-pointer"
                  >
                    {BGM_PRESETS.map(preset => (
                      <option key={preset} value={preset}>{preset}</option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-1">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-amber-500/60 rounded-full"
                      style={{ height: `${12 + Math.sin(i * 0.8) * 10 + Math.random() * 8}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TRACK 3: FOLEY FX & AMBIENCE */}
          <div className="flex items-center space-x-3">
            {/* Track Header Controls */}
            <div className="w-32 shrink-0 bg-slate-950 p-2.5 rounded-xl border border-rose-900/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 text-[11px] flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Foley FX
                </span>
                <span className="text-[9px] text-slate-500">{config.foleyEvents.length} SFX</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px]">
                <button
                  onClick={() => updateConfig({ isFoleyMuted: !config.isFoleyMuted })}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${config.isFoleyMuted ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-slate-800 text-slate-400'}`}
                >
                  M
                </button>
                <button
                  onClick={() => updateConfig({ isFoleySolo: !config.isFoleySolo })}
                  className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${config.isFoleySolo ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-400'}`}
                >
                  S
                </button>
              </div>
            </div>

            {/* Track Timeline Area with Draggable/Positioned FX Badges */}
            <div className="flex-1 h-14 bg-slate-950/80 rounded-xl border border-rose-950/80 relative overflow-hidden flex items-center px-3">
              {config.foleyEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="absolute h-9 bg-rose-950/80 border border-rose-700 text-rose-200 rounded-lg px-2 flex items-center justify-between space-x-2 text-[10px] font-bold shadow-md"
                  style={{
                    left: `${(evt.timestampSec / totalSceneDurationSec) * 100}%`,
                    width: `${Math.max(10, (evt.durationSec / totalSceneDurationSec) * 100)}%`
                  }}
                >
                  <span className="truncate">{evt.name}</span>
                  <button
                    onClick={() => handleRemoveFoleyEvent(evt.id)}
                    className="text-slate-400 hover:text-rose-300 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add Foley Dropdown Button */}
              <div className="absolute right-2 z-20">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      const preset = FOLEY_PRESETS.find(p => p.name === e.target.value);
                      if (preset) handleAddFoleyEvent(preset);
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-900 border border-rose-800 text-rose-300 text-[10px] font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none"
                >
                  <option value="">+ Add Foley FX at {currentTimeSec.toFixed(1)}s</option>
                  {FOLEY_PRESETS.map(p => (
                    <option key={p.name} value={p.name}>{p.name} ({p.category})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: 🎙️ Kokoro Voice Emotion Curve Editor */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              Kokoro Voice Model Pitch & Emotion Keyframing
            </span>
            <h3 className="text-base font-bold text-slate-100 font-mono">
              Word-by-Word Emotion Curve & Cadence Envelope Editor
            </h3>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
            <span className="text-slate-500 font-bold uppercase mr-1">Emotion Presets:</span>
            {[
              'Heroic Climax Shout',
              'Tearful Confession',
              'Cinematic Whisper',
              'Cyber Cold Monotone'
            ].map((p) => (
              <button
                key={p}
                onClick={() => applyEmotionCurvePreset(p)}
                className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 px-2 py-1 rounded-lg transition-colors cursor-pointer"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Dialogue Line Selector & Info */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Active Dialogue Line:</span>
            <p className="text-sm font-serif italic text-cyan-200">
              "{activeDialogueLine?.line || 'Select a dialogue line above'}"
            </p>
            <p className="text-[10px] font-mono text-slate-400">
              Character: <strong className="text-slate-200">{activeDialogueLine?.character}</strong> | Baseline Emotion: <strong className="text-indigo-300">{activeDialogueLine?.emotion}</strong>
            </p>
          </div>

          <button
            onClick={() => playSynthesizedAudioPreview(activeWordKeyframes[0]?.pitchShiftSemitones || 0, 1.0)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs flex items-center space-x-2 cursor-pointer shadow-md shrink-0"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            <span>Audition Emotion Curve Tone</span>
          </button>
        </div>

        {/* Word-by-Word Pitch & Intensity Control Table */}
        {activeWordKeyframes.length > 0 && (
          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {activeWordKeyframes.map((wf, idx) => (
                <div
                  key={wf.id}
                  className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-2 hover:border-cyan-800 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="font-bold text-cyan-300 text-sm">#{idx + 1} "{wf.word}"</span>
                    <span className="text-[9.5px] text-slate-400">{wf.startSec}s</span>
                  </div>

                  {/* Pitch Shift Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Pitch Shift</span>
                      <span className="text-indigo-400 font-bold">{wf.pitchShiftSemitones > 0 ? `+${wf.pitchShiftSemitones}` : wf.pitchShiftSemitones} semitones</span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      value={wf.pitchShiftSemitones}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = activeWordKeyframes.map((item, i) => i === idx ? { ...item, pitchShiftSemitones: val } : item);
                        updateConfig({
                          wordEmotionKeyframes: { ...config.wordEmotionKeyframes, [activeDialogueId]: updated }
                        });
                      }}
                      className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Emotion Intensity Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Intensity</span>
                      <span className="text-amber-400 font-bold">{wf.emotionIntensity}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={wf.emotionIntensity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const updated = activeWordKeyframes.map((item, i) => i === idx ? { ...item, emotionIntensity: val } : item);
                        updateConfig({
                          wordEmotionKeyframes: { ...config.wordEmotionKeyframes, [activeDialogueId]: updated }
                        });
                      }}
                      className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>

                  {/* Emotion Tag Selector */}
                  <select
                    value={wf.emotionTag}
                    onChange={(e) => {
                      const tag = e.target.value as WordEmotionKeyframe['emotionTag'];
                      const updated = activeWordKeyframes.map((item, i) => i === idx ? { ...item, emotionTag: tag } : item);
                      updateConfig({
                        wordEmotionKeyframes: { ...config.wordEmotionKeyframes, [activeDialogueId]: updated }
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-[10px] font-bold rounded-lg px-2 py-1 cursor-pointer focus:outline-none"
                  >
                    <option value="Neutral">Tag: Neutral</option>
                    <option value="Whisper">Tag: Whisper</option>
                    <option value="Shout">Tag: Shout</option>
                    <option value="Tremble">Tag: Tremble</option>
                    <option value="Empathetic">Tag: Empathetic</option>
                    <option value="Monotone">Tag: Monotone</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: 👄 Auto Lip-Sync Flap Data Synthesizer & Exporter */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-rose-400" />
              Automated Character Mouth Shape Phonemes
            </span>
            <h3 className="text-base font-bold text-slate-100 font-mono">
              Auto Lip-Sync Flap Data & Viseme Real-Time Preview
            </h3>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={handleCopyLipSyncJson}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedJson ? 'Copied JSON!' : 'Copy Flap Data'}</span>
            </button>

            <button
              onClick={handleExportLipSyncJson}
              className="bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-bold shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-rose-300" />
              <span>Export Lip-Sync JSON</span>
            </button>
          </div>
        </div>

        {/* Real-time Character Face & Mouth Vector Canvas Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono text-xs">
          {/* Character Vector Face Rig */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 relative overflow-hidden shadow-inner">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Real-Time Lip-Sync Mouth Rig: {currentVisemeFrame.characterName}
            </span>

            {/* Simulated Anime Character Head Vector Graphic */}
            <div className="w-40 h-40 rounded-full bg-slate-950 border-2 border-slate-800 flex flex-col items-center justify-center relative shadow-2xl">
              {/* Anime Eyes */}
              <div className="flex space-x-8 mb-4">
                <div className="w-6 h-3 bg-cyan-400 rounded-t-full border border-cyan-200" />
                <div className="w-6 h-3 bg-cyan-400 rounded-t-full border border-cyan-200" />
              </div>

              {/* Dynamic Vector Mouth Viseme Graphic */}
              <div className="my-1 transform transition-all duration-75">
                {renderMouthShapeSvg(currentVisemeFrame.viseme, currentVisemeFrame.intensity)}
              </div>

              {/* Viseme Label Badge */}
              <div className="mt-3 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                Phoneme: {currentVisemeFrame.viseme} ({(currentVisemeFrame.intensity * 100).toFixed(0)}%)
              </div>
            </div>
          </div>

          {/* Visemes Phonemes Sequence Timeline Grid */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-2">
              Time-Stamped Phoneme Viseme Sequence ({activeLipSyncFrames.length} Frames)
            </span>

            <div className="h-40 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
              {activeLipSyncFrames.map((f, idx) => (
                <div
                  key={f.id || idx}
                  className={`p-2 rounded-xl border flex items-center justify-between text-[11px] transition-all ${
                    currentTimeSec >= f.timeSec && currentTimeSec < (f.timeSec + f.durationSec)
                      ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold scale-[1.01]'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-12 text-slate-500 font-bold">#{idx + 1}</span>
                    <span className="text-cyan-400 font-bold">{f.timeSec.toFixed(2)}s</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-300 font-bold">
                      Viseme: {f.viseme}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                    <span>Duration: {f.durationSec.toFixed(2)}s</span>
                    <span className="text-emerald-400 font-bold">
                      {(f.intensity * 100).toFixed(0)}% Open
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
