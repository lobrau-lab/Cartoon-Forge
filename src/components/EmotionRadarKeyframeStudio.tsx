import React, { useState, useEffect } from 'react';
import { EpisodeProject, ShotItem } from '../types';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Tooltip,
  Legend 
} from 'recharts';
import { 
  Activity, 
  Sparkles, 
  Sliders, 
  Zap, 
  Flame, 
  HeartPulse, 
  Volume2, 
  Layers, 
  ChevronRight, 
  RotateCcw,
  Gauge,
  TrendingUp,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

export interface EmotionVector {
  intensity: number;  // Aggression / Volume / Projection
  melodrama: number;  // Emotional Depth / Passion
  sorrow: number;     // Grief / Melancholy
  tension: number;    // Suspense / Anxiety
  joy: number;        // Enthusiasm / Hope / Warmth
  urgency: number;    // Cadence / Speed
}

export interface EmotionPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  vector: EmotionVector;
  color: string;
}

export const EMOTION_PRESETS: EmotionPreset[] = [
  {
    id: 'battle-cry',
    label: 'Battle Cry / Combat Shouts',
    icon: '⚡',
    description: 'High projection, intense aggression, and urgent pacing for battle scenes.',
    vector: { intensity: 95, melodrama: 40, sorrow: 10, tension: 85, joy: 30, urgency: 90 },
    color: '#ef4444'
  },
  {
    id: 'tearful-confession',
    label: 'Tearful Confession',
    icon: '💔',
    description: 'Deep melodrama and sorrow with quivering emotional resonance.',
    vector: { intensity: 40, melodrama: 90, sorrow: 85, tension: 65, joy: 10, urgency: 35 },
    color: '#ec4899'
  },
  {
    id: 'cold-cyber',
    label: 'Cold Technical / Cyber',
    icon: '🤖',
    description: 'Monotone pitch, low emotional warmth, precise analytical cadence.',
    vector: { intensity: 25, melodrama: 10, sorrow: 5, tension: 45, joy: 5, urgency: 40 },
    color: '#06b6d4'
  },
  {
    id: 'heroic-inspiration',
    label: 'Heroic Inspiration',
    icon: '🌟',
    description: 'Uplifting resonance, high joy and projection for speeches.',
    vector: { intensity: 80, melodrama: 75, sorrow: 10, tension: 35, joy: 90, urgency: 65 },
    color: '#f59e0b'
  },
  {
    id: 'eerie-suspense',
    label: 'Eerie Suspense',
    icon: '👁️',
    description: 'High tension and slow breathing gaps for thriller scenes.',
    vector: { intensity: 50, melodrama: 35, sorrow: 50, tension: 95, joy: 5, urgency: 25 },
    color: '#8b5cf6'
  }
];

interface EmotionRadarKeyframeStudioProps {
  project: EpisodeProject;
  dialogueShots: ShotItem[];
  selectedShotId: string | null;
  onSelectShot: (shotId: string) => void;
  onSynthesizeShot?: (shot: ShotItem, emotionName: string, vector: EmotionVector) => void;
  isGenerating?: boolean;
}

export const EmotionRadarKeyframeStudio: React.FC<EmotionRadarKeyframeStudioProps> = ({
  project,
  dialogueShots,
  selectedShotId,
  onSelectShot,
  onSynthesizeShot,
  isGenerating = false
}) => {
  // Selected shot or default to first shot
  const activeShot = dialogueShots.find(s => s.id === selectedShotId) || dialogueShots[0] || null;

  // Emotion vectors map per shot ID
  const [shotVectors, setShotVectors] = useState<Record<string, EmotionVector>>(() => {
    const initialMap: Record<string, EmotionVector> = {};
    dialogueShots.forEach((shot, index) => {
      // Ingest default preset or construct vector from shot properties
      const defaultPreset = EMOTION_PRESETS[index % EMOTION_PRESETS.length].vector;
      initialMap[shot.id] = { ...defaultPreset };
    });
    return initialMap;
  });

  // Comparison mode: show baseline default persona vs keyframe target
  const [showComparison, setShowComparison] = useState<boolean>(true);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Get current active shot's emotion vector
  const currentVector: EmotionVector = (activeShot && shotVectors[activeShot.id]) || {
    intensity: 60,
    melodrama: 50,
    sorrow: 20,
    tension: 40,
    joy: 50,
    urgency: 50
  };

  // Handler to update an emotion dimension for the active shot
  const handleDimensionChange = (dimension: keyof EmotionVector, value: number) => {
    if (!activeShot) return;
    setShotVectors(prev => ({
      ...prev,
      [activeShot.id]: {
        ...prev[activeShot.id],
        [dimension]: value
      }
    }));
    setActivePresetId(null);
  };

  // Handler to apply a preset vector
  const handleApplyPreset = (preset: EmotionPreset) => {
    if (!activeShot) return;
    setShotVectors(prev => ({
      ...prev,
      [activeShot.id]: { ...preset.vector }
    }));
    setActivePresetId(preset.id);
    registerRealTimeHeal(
      'Dubbing',
      `Applied emotion keyframe preset '${preset.label}' to Shot #${activeShot.shotNumber}`,
      'Mapped keyframe emotion vector to TTS synthesis.',
      'heal'
    );
  };

  // Format data for Recharts RadarChart
  const radarChartData = [
    { dimension: 'Intensity', keyframe: currentVector.intensity, baseline: 50, fullMark: 100 },
    { dimension: 'Melodrama', keyframe: currentVector.melodrama, baseline: 35, fullMark: 100 },
    { dimension: 'Sorrow', keyframe: currentVector.sorrow, baseline: 20, fullMark: 100 },
    { dimension: 'Tension', keyframe: currentVector.tension, baseline: 40, fullMark: 100 },
    { dimension: 'Joy', keyframe: currentVector.joy, baseline: 45, fullMark: 100 },
    { dimension: 'Urgency', keyframe: currentVector.urgency, baseline: 50, fullMark: 100 },
  ];

  // Calculate overall Emotional Energy Index (average of vector values)
  const energyIndex = Math.round(
    (currentVector.intensity + currentVector.melodrama + currentVector.sorrow + currentVector.tension + currentVector.joy + currentVector.urgency) / 6
  );

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-2xl relative overflow-hidden">
      {/* Background Subtle Accent Glow */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 text-rose-400">
            <HeartPulse className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider font-mono">
                Visual Emotion Radar &amp; Keyframe Studio
              </h3>
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 text-[10px] font-mono font-bold">
                RECHARTS FFT RADAR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Map emotional intensity shifts across voice synthesis keyframes with multi-axis radar analytics
            </p>
          </div>
        </div>

        {/* Shot Selection Dropdown & Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <label className="text-[10px] font-mono text-slate-400 pl-2">Target Line:</label>
            <select
              value={activeShot?.id || ''}
              onChange={(e) => onSelectShot(e.target.value)}
              className="bg-slate-900 text-rose-300 border border-slate-700 font-mono text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
            >
              {dialogueShots.map(shot => (
                <option key={shot.id} value={shot.id} className="bg-slate-900 text-slate-200">
                  Shot #{shot.shotNumber} - {shot.charactersInShot[0] || 'Character'}
                </option>
              ))}
            </select>
          </div>

          {/* Baseline Overlay Toggle */}
          <button
            onClick={() => setShowComparison(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all border cursor-pointer flex items-center space-x-1.5 ${
              showComparison
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showComparison ? 'Overlay Persona' : 'Keyframe Only'}</span>
          </button>
        </div>
      </div>

      {/* Preset Emotion Vectors Bar */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
          EMOTION VECTOR PRESETS:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {EMOTION_PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-rose-950/60 border-rose-500 text-slate-100 shadow-lg scale-[1.02]'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <span className="text-base">{preset.icon}</span>
                  <span className="text-xs font-bold truncate">{preset.label}</span>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 line-clamp-1 font-mono">
                  {preset.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Radar Chart & Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Recharts Radar Chart Visualizer (6 Cols) */}
        <div className="md:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center relative">
          <div className="w-full flex justify-between items-center mb-1 text-xs font-mono">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              Multi-Axis Intensity Topology
            </span>
            <span className="px-2 py-0.5 bg-rose-950 border border-rose-800 text-rose-400 rounded text-[10px] font-bold">
              Energy Index: {energyIndex}/100
            </span>
          </div>

          {/* Recharts Radar Chart */}
          <div className="w-full h-[260px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis 
                  dataKey="dimension" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  stroke="#475569" 
                  tick={{ fill: '#64748b', fontSize: 9 }} 
                />
                {showComparison && (
                  <Radar
                    name="Default Baseline Persona"
                    dataKey="baseline"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.25}
                  />
                )}
                <Radar
                  name="Voice Keyframe Target"
                  dataKey="keyframe"
                  stroke="#f43f5e"
                  fill="#f43f5e"
                  fillOpacity={0.55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '8px' }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full text-center mt-2 pt-2 border-t border-slate-900 text-[10px] text-slate-400 font-mono">
            Active Character: <span className="text-rose-300 font-bold">{activeShot?.charactersInShot[0] || 'Hero'}</span> — "{activeShot?.dialogueLine?.slice(0, 45)}..."
          </div>
        </div>

        {/* Right Column: Fine-Tuning Sliders & Trigger (6 Cols) */}
        <div className="md:col-span-6 space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-rose-400" />
              Dimension Modulation Sliders
            </span>
            <button
              onClick={() => {
                if (!activeShot) return;
                setShotVectors(prev => ({
                  ...prev,
                  [activeShot.id]: { intensity: 50, melodrama: 50, sorrow: 20, tension: 30, joy: 50, urgency: 50 }
                }));
                setActivePresetId(null);
              }}
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Neutral
            </button>
          </div>

          {/* Individual Dimension Sliders */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            {/* Intensity */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Intensity (Projection):</span>
                <span className="text-rose-400 font-bold">{currentVector.intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentVector.intensity}
                onChange={(e) => handleDimensionChange('intensity', parseInt(e.target.value))}
                className="w-full accent-rose-500 h-1 bg-slate-900 rounded cursor-pointer"
              />
            </div>

            {/* Melodrama */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Melodrama (Depth):</span>
                <span className="text-pink-400 font-bold">{currentVector.melodrama}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentVector.melodrama}
                onChange={(e) => handleDimensionChange('melodrama', parseInt(e.target.value))}
                className="w-full accent-pink-500 h-1 bg-slate-900 rounded cursor-pointer"
              />
            </div>

            {/* Sorrow */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Sorrow (Melancholy):</span>
                <span className="text-indigo-400 font-bold">{currentVector.sorrow}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentVector.sorrow}
                onChange={(e) => handleDimensionChange('sorrow', parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-900 rounded cursor-pointer"
              />
            </div>

            {/* Tension */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Tension (Suspense):</span>
                <span className="text-purple-400 font-bold">{currentVector.tension}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentVector.tension}
                onChange={(e) => handleDimensionChange('tension', parseInt(e.target.value))}
                className="w-full accent-purple-500 h-1 bg-slate-900 rounded cursor-pointer"
              />
            </div>

            {/* Joy */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Joy (Hope/Warmth):</span>
                <span className="text-amber-400 font-bold">{currentVector.joy}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentVector.joy}
                onChange={(e) => handleDimensionChange('joy', parseInt(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-slate-900 rounded cursor-pointer"
              />
            </div>

            {/* Urgency */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-400">Urgency (Pacing):</span>
                <span className="text-cyan-400 font-bold">{currentVector.urgency}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentVector.urgency}
                onChange={(e) => handleDimensionChange('urgency', parseInt(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-900 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-2 border-t border-slate-900">
            <button
              onClick={() => {
                if (!activeShot || !onSynthesizeShot) return;
                const presetName = EMOTION_PRESETS.find(p => p.id === activePresetId)?.label || 'Custom Emotion Keyframe';
                onSynthesizeShot(activeShot, presetName, currentVector);
              }}
              disabled={isGenerating || !activeShot}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg hover:opacity-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4 text-slate-950" />
              <span>Synthesize Dub Line with Radar Emotion Keyframe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sequential Keyframe Intensity Timeline Bar across Dialogue Shots */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          Sequence Keyframe Emotion Progression across Episode Lines:
        </span>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {dialogueShots.map((shot, idx) => {
            const vector = shotVectors[shot.id] || EMOTION_PRESETS[0].vector;
            const energy = Math.round((vector.intensity + vector.melodrama + vector.tension) / 3);
            const isCurrent = activeShot?.id === shot.id;

            return (
              <div
                key={shot.id}
                onClick={() => onSelectShot(shot.id)}
                className={`flex-1 min-w-[110px] p-2 rounded-lg border text-left cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-rose-950/60 border-rose-500 text-slate-100 ring-1 ring-rose-500'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold text-rose-300">Shot #{shot.shotNumber}</span>
                  <span className="text-[9px] text-slate-500">{energy}% E</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1 mt-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-amber-400 h-1 transition-all"
                    style={{ width: `${energy}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
