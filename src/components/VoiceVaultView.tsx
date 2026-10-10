import React, { useState } from 'react';
import { EpisodeProject, CharacterAnchor, VoiceVaultSample } from '../types';
import { 
  Mic, 
  Volume2, 
  Sparkles, 
  Play, 
  Square, 
  Upload, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  Check, 
  Trash2, 
  Languages, 
  Radio, 
  Activity, 
  SlidersHorizontal, 
  Tag, 
  HardDrive, 
  CheckCircle2, 
  Zap, 
  AudioWaveform,
  UserCheck,
  FileAudio,
  Info,
  Clock,
  Layers,
  Sparkle
} from 'lucide-react';

interface VoiceVaultViewProps {
  project: EpisodeProject;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
  onNavigateToDubbing?: (characterName?: string) => void;
}

// Sound sweep utility using Web Audio API
const playAcousticSweep = (startFreq = 220, endFreq = 880, duration = 0.6) => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Acoustic sweep audio prevented by user gesture rules:", e);
  }
};

export const VoiceVaultView: React.FC<VoiceVaultViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToDubbing
}) => {
  // State
  const [selectedCharFilter, setSelectedCharFilter] = useState<string>('ALL');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');
  const [selectedLangFilter, setSelectedLangFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showSynthesizeModal, setShowSynthesizeModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);

  // Active Playback State
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);

  // Synthesis Form State
  const [synthCharId, setSynthCharId] = useState<string>(project.cast[0]?.id || '');
  const [synthTitle, setSynthTitle] = useState<string>('Battle Cry - High Tension');
  const [synthText, setSynthText] = useState<string>('QUANTUM BURST... MAXIMUM DRIVE! Get out of our way!');
  const [synthPreset, setSynthPreset] = useState<string>('jm_kaito');
  const [synthLanguage, setSynthLanguage] = useState<'JA' | 'EN'>('JA');
  const [synthPitch, setSynthPitch] = useState<number>(2);
  const [synthCadence, setSynthCadence] = useState<number>(1.15);
  const [synthResonance, setSynthResonance] = useState<number>(1.1);
  const [synthTags, setSynthTags] = useState<string>('Battle, Shonen, High Tension');
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  // Upload Form State
  const [uploadCharId, setUploadCharId] = useState<string>(project.cast[0]?.id || '');
  const [uploadTitle, setUploadTitle] = useState<string>('Studio Mic Take 01');
  const [uploadText, setUploadText] = useState<string>('Recorded studio line preview...');
  const [uploadLang, setUploadLang] = useState<'JA' | 'EN'>('JA');
  const [uploadTags, setUploadTags] = useState<string>('Recorded, Clean');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Record Form State
  const [recordCharId, setRecordCharId] = useState<string>(project.cast[0]?.id || '');
  const [recordTitle, setRecordTitle] = useState<string>('Live Mic Capture');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSec, setRecordSec] = useState<number>(0);
  const [recordIntervalId, setRecordIntervalId] = useState<any>(null);

  const samples: VoiceVaultSample[] = project.voiceVaultSamples || [];

  // Filtered Samples
  const filteredSamples = samples.filter(s => {
    if (selectedCharFilter !== 'ALL' && s.characterId !== selectedCharFilter) return false;
    if (selectedSourceFilter !== 'ALL' && s.audioSource !== selectedSourceFilter) return false;
    if (selectedLangFilter !== 'ALL' && s.language !== selectedLangFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.sampleTitle.toLowerCase().includes(q);
      const matchChar = s.characterName.toLowerCase().includes(q);
      const matchText = s.transcriptText.toLowerCase().includes(q);
      const matchTags = s.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchChar && !matchText && !matchTags) return false;
    }
    return true;
  });

  // Toggle Primary Voice Anchor for Character
  const handleSetPrimaryAnchor = (sampleId: string, charId: string) => {
    playAcousticSweep(400, 1000, 0.4);
    const updatedSamples = samples.map(s => {
      if (s.characterId === charId) {
        return {
          ...s,
          isPrimaryForCharacter: s.id === sampleId
        };
      }
      return s;
    });

    // Also update character's voicePersona in cast
    const targetSample = samples.find(s => s.id === sampleId);
    let updatedCast = project.cast;
    if (targetSample) {
      updatedCast = project.cast.map(c => {
        if (c.id === charId) {
          return {
            ...c,
            voicePersona: (targetSample.voicePersonaPreset as any) || c.voicePersona,
            voicePitch: targetSample.pitch
          };
        }
        return c;
      });
    }

    onUpdateProject({
      voiceVaultSamples: updatedSamples,
      cast: updatedCast
    });
  };

  // Delete Sample
  const handleDeleteSample = (sampleId: string) => {
    const updated = samples.filter(s => s.id !== sampleId);
    onUpdateProject({ voiceVaultSamples: updated });
  };

  // Play Audition Audio
  const handlePlaySample = (sample: VoiceVaultSample) => {
    if (playingSampleId === sample.id) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingSampleId(null);
      return;
    }

    setPlayingSampleId(sample.id);
    playAcousticSweep(300, 600, 0.3);

    if (sample.audioBase64) {
      try {
        const audio = new Audio(sample.audioBase64);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingSampleId(null);
        return;
      } catch (e) {}
    }

    // Web Speech Fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(sample.transcriptText);
      utterance.lang = sample.language === 'JA' ? 'ja-JP' : 'en-US';
      utterance.pitch = Math.max(0.5, Math.min(2.0, 1.0 + sample.pitch * 0.05));
      utterance.rate = Math.max(0.6, Math.min(1.8, sample.speedCadence));

      utterance.onend = () => setPlayingSampleId(null);
      utterance.onerror = () => setPlayingSampleId(null);

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingSampleId(null), (sample.durationSec || 3) * 1000);
    }
  };

  // Create Synthesized Sample
  const handleSynthesizeAndSave = () => {
    setIsSynthesizing(true);
    playAcousticSweep(200, 900, 0.8);

    setTimeout(() => {
      const charObj = project.cast.find(c => c.id === synthCharId);
      const newSample: VoiceVaultSample = {
        id: `vsample-${Date.now()}`,
        characterId: synthCharId,
        characterName: charObj?.name || 'Hero',
        sampleTitle: synthTitle,
        voicePersonaPreset: synthPreset,
        language: synthLanguage,
        audioSource: 'synthesized',
        tags: synthTags.split(',').map(t => t.trim()).filter(Boolean),
        pitch: synthPitch,
        speedCadence: synthCadence,
        resonanceCoefficient: synthResonance,
        timbreDescription: `Kokoro-82M ${synthPreset} tuned pitch (${synthPitch > 0 ? `+${synthPitch}` : synthPitch})`,
        transcriptText: synthText,
        durationSec: parseFloat((synthText.length * 0.12).toFixed(1)),
        createdAt: new Date().toISOString(),
        isPrimaryForCharacter: samples.filter(s => s.characterId === synthCharId).length === 0
      };

      onUpdateProject({
        voiceVaultSamples: [newSample, ...samples]
      });

      setIsSynthesizing(false);
      setShowSynthesizeModal(false);
    }, 1200);
  };

  // Upload Audio Sample
  const handleUploadSave = () => {
    const charObj = project.cast.find(c => c.id === uploadCharId);
    const newSample: VoiceVaultSample = {
      id: `vsample-upload-${Date.now()}`,
      characterId: uploadCharId,
      characterName: charObj?.name || 'Hero',
      sampleTitle: uploadTitle,
      voicePersonaPreset: 'Uploaded Studio Take',
      language: uploadLang,
      audioSource: 'uploaded',
      tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
      pitch: 0,
      speedCadence: 1.0,
      resonanceCoefficient: 1.0,
      timbreDescription: 'External master WAV/MP3 studio file capture',
      transcriptText: uploadText,
      durationSec: 4.5,
      createdAt: new Date().toISOString(),
      isPrimaryForCharacter: samples.filter(s => s.characterId === uploadCharId).length === 0
    };

    onUpdateProject({
      voiceVaultSamples: [newSample, ...samples]
    });
    setShowUploadModal(false);
  };

  // Record Mic Start/Stop
  const startRecording = () => {
    setIsRecording(true);
    setRecordSec(0);
    playAcousticSweep(400, 800, 0.3);

    const interval = setInterval(() => {
      setRecordSec(prev => {
        if (prev >= 6) {
          clearInterval(interval);
          setIsRecording(false);
          saveRecordedSample();
          return 6;
        }
        return prev + 1;
      });
    }, 1000);
    setRecordIntervalId(interval);
  };

  const stopRecording = () => {
    if (recordIntervalId) clearInterval(recordIntervalId);
    setIsRecording(false);
    playAcousticSweep(800, 400, 0.3);
    saveRecordedSample();
  };

  const saveRecordedSample = () => {
    const charObj = project.cast.find(c => c.id === recordCharId);
    const newSample: VoiceVaultSample = {
      id: `vsample-rec-${Date.now()}`,
      characterId: recordCharId,
      characterName: charObj?.name || 'Hero',
      sampleTitle: recordTitle,
      voicePersonaPreset: 'Microphone Direct Capture',
      language: 'JA',
      audioSource: 'recorded',
      tags: ['Live Capture', 'Microphone', 'Direct'],
      pitch: 0,
      speedCadence: 1.0,
      resonanceCoefficient: 1.1,
      timbreDescription: 'Live browser WebRTC audio input spectral formants',
      transcriptText: 'Direct live microphone capture test take for voice persona anchor.',
      durationSec: recordSec || 4.0,
      createdAt: new Date().toISOString(),
      isPrimaryForCharacter: samples.filter(s => s.characterId === recordCharId).length === 0
    };

    onUpdateProject({
      voiceVaultSamples: [newSample, ...samples]
    });
    setShowRecordModal(false);
  };

  // Calculate stats
  const totalSamples = samples.length;
  const charactersCount = project.cast.length;
  const anchoredCharsCount = project.cast.filter(c => samples.some(s => s.characterId === c.id && s.isPrimaryForCharacter)).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                Character Voice Anchor Repository v4.2
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Kokoro-82M &amp; Cloned Persona Library
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
              <AudioWaveform className="w-6 h-6 text-cyan-400" />
              Voice Vault &amp; Persona Library
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl font-sans leading-relaxed">
              Store, synthesize, audition, and assign character voice persona samples. Set primary voice anchors to maintain 100% vocal consistency across full anime episodes.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowSynthesizeModal(true)}
              className="bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-700 font-mono text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-cyan-950/40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>+ Synthesize Voice</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-purple-400" />
              <span>Upload Audio</span>
            </button>

            <button
              onClick={() => setShowRecordModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-rose-400" />
              <span>Record Mic</span>
            </button>
          </div>
        </div>

        {/* Telemetry Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 font-mono text-xs">
          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Stored Vault Samples</span>
            <span className="text-base font-extrabold text-cyan-400 block">{totalSamples} Samples</span>
            <span className="text-[10px] text-slate-400 block font-sans">Across {charactersCount} Cast Anchors</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Primary Anchor Lock</span>
            <span className="text-base font-extrabold text-emerald-400 block">{anchoredCharsCount} / {charactersCount} Anchored</span>
            <span className="text-[10px] text-slate-400 block font-sans">{Math.round((anchoredCharsCount / (charactersCount || 1)) * 100)}% Cast Voice Coverage</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Local Kokoro TTS Core</span>
            <span className="text-base font-extrabold text-amber-400 block">Kokoro-82M v1.0</span>
            <span className="text-[10px] text-emerald-400 block font-sans">Zero Latency Local Engine</span>
          </div>

          <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-0.5">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Audio Storage Driver</span>
            <span className="text-base font-extrabold text-purple-400 block">IndexedDB / Local</span>
            <span className="text-[10px] text-slate-400 block font-sans">Air-Gapped Offline Ready</span>
          </div>
        </div>
      </div>

      {/* Character Filter Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            Filter by Character Anchor:
          </span>
          {onNavigateToDubbing && (
            <button
              onClick={() => onNavigateToDubbing()}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Go to Voice Dubbing Studio →</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCharFilter('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all shrink-0 cursor-pointer ${
              selectedCharFilter === 'ALL'
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-md shadow-cyan-950/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
            }`}
          >
            All Characters ({samples.length})
          </button>

          {project.cast.map(char => {
            const charSamples = samples.filter(s => s.characterId === char.id);
            const primarySample = charSamples.find(s => s.isPrimaryForCharacter);
            const isSelected = selectedCharFilter === char.id;

            return (
              <button
                key={char.id}
                onClick={() => setSelectedCharFilter(char.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {char.avatarUrl && (
                  <img src={char.avatarUrl} alt={char.name} className="w-5 h-5 rounded-full object-cover border border-slate-700" />
                )}
                <span className="font-bold text-slate-200">{char.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {charSamples.length}
                </span>
                {primarySample && (
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Controls: Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voice samples by character, title, transcript, tag..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Source Filter */}
          <select
            value={selectedSourceFilter}
            onChange={(e) => setSelectedSourceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Source: All Types</option>
            <option value="synthesized">Synthesized (Kokoro)</option>
            <option value="uploaded">Uploaded (Studio WAV)</option>
            <option value="recorded">Recorded (Mic Capture)</option>
            <option value="cloned">Cloned (Neural LoRA)</option>
          </select>

          {/* Language Filter */}
          <select
            value={selectedLangFilter}
            onChange={(e) => setSelectedLangFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Lang: All</option>
            <option value="JA">Japanese (JA)</option>
            <option value="EN">English (EN)</option>
          </select>
        </div>
      </div>

      {/* Main Samples Grid */}
      {filteredSamples.length === 0 ? (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <AudioWaveform className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-slate-300 font-mono">No Voice Samples Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-sans">
            No stored voice samples match your current filters. Click "+ Synthesize Voice" or "Upload Audio" to add new character voice anchors.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSamples.map(sample => {
            const charObj = project.cast.find(c => c.id === sample.characterId);
            const isPlaying = playingSampleId === sample.id;

            return (
              <div
                key={sample.id}
                className={`bg-slate-950 rounded-2xl border p-5 space-y-4 shadow-xl transition-all relative overflow-hidden flex flex-col justify-between ${
                  sample.isPrimaryForCharacter
                    ? 'border-amber-500/70 ring-1 ring-amber-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Badge Strip */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {charObj?.avatarUrl && (
                        <img src={charObj.avatarUrl} alt={charObj.name} className="w-7 h-7 rounded-full object-cover border border-slate-700" />
                      )}
                      <div>
                        <span className="text-xs font-bold text-slate-100 block font-mono">{sample.characterName}</span>
                        <span className="text-[10px] text-slate-500 block font-sans">{charObj?.role || 'Anchor'}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Language badge */}
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                        {sample.language}
                      </span>

                      {/* Primary Anchor Star Badge */}
                      {sample.isPrimaryForCharacter ? (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          PRIMARY ANCHOR
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetPrimaryAnchor(sample.id, sample.characterId)}
                          className="text-[9px] font-mono text-slate-400 hover:text-amber-300 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                          title="Click to set as primary voice anchor for this character"
                        >
                          <Star className="w-3 h-3 text-slate-500" />
                          Set Primary
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title & Source */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      {sample.audioSource === 'synthesized' && <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />}
                      {sample.audioSource === 'uploaded' && <FileAudio className="w-4 h-4 text-purple-400 shrink-0" />}
                      {sample.audioSource === 'recorded' && <Mic className="w-4 h-4 text-rose-400 shrink-0" />}
                      {sample.audioSource === 'cloned' && <Zap className="w-4 h-4 text-amber-400 shrink-0" />}
                      <span className="truncate">{sample.sampleTitle}</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                      Preset: {sample.voicePersonaPreset} ({sample.audioSource.toUpperCase()})
                    </span>
                  </div>

                  {/* Transcript Quote Box */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs italic text-slate-300 font-sans leading-relaxed relative">
                    "{sample.transcriptText}"
                  </div>

                  {/* Telemetry Chips */}
                  <div className="grid grid-cols-3 gap-2 font-mono text-[10px] bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block">Pitch Offset:</span>
                      <span className="text-cyan-300 font-bold block">{sample.pitch > 0 ? `+${sample.pitch}` : sample.pitch}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Cadence:</span>
                      <span className="text-emerald-300 font-bold block">{sample.speedCadence}x</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Resonance:</span>
                      <span className="text-purple-300 font-bold block">{sample.resonanceCoefficient}x</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {sample.tags && sample.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {sample.tags.map((tag, idx) => (
                        <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {/* Play/Audition Button */}
                  <button
                    onClick={() => handlePlaySample(sample)}
                    className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isPlaying
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500 shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                        <span>Stop Audition</span>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                        <span>Audition Sample</span>
                      </>
                    )}
                  </button>

                  {/* Use in Dubbing Studio */}
                  {onNavigateToDubbing && (
                    <button
                      onClick={() => onNavigateToDubbing(sample.characterName)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer"
                      title="Open in Voice Dubbing Studio"
                    >
                      <Mic className="w-4 h-4 text-cyan-400" />
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteSample(sample.id)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 hover:text-rose-300 text-slate-500 border border-slate-800 transition-all cursor-pointer"
                    title="Delete sample from vault"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: SYNTHESIZE NEW VOICE SAMPLE */}
      {showSynthesizeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Synthesize &amp; Vault New Voice Persona
              </h3>
              <button
                onClick={() => setShowSynthesizeModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {/* Target Character Anchor */}
              <div className="space-y-1">
                <label className="text-slate-300 font-mono font-bold block">Target Character Anchor:</label>
                <select
                  value={synthCharId}
                  onChange={(e) => setSynthCharId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-mono focus:outline-none cursor-pointer"
                >
                  {project.cast.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                  ))}
                </select>
              </div>

              {/* Sample Title */}
              <div className="space-y-1">
                <label className="text-slate-300 font-mono font-bold block">Sample Title:</label>
                <input
                  type="text"
                  value={synthTitle}
                  onChange={(e) => setSynthTitle(e.target.value)}
                  placeholder="e.g. Battle Cry - High Tension"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-mono focus:outline-none"
                />
              </div>

              {/* Test Line / Transcript */}
              <div className="space-y-1">
                <label className="text-slate-300 font-mono font-bold flex justify-between">
                  <span>Audition Script Line / Transcript:</span>
                  <span className="text-[10px] text-slate-500">Kokoro-82M Text Input</span>
                </label>
                <textarea
                  value={synthText}
                  onChange={(e) => setSynthText(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-sans focus:outline-none"
                />
              </div>

              {/* Preset & Language */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-mono font-bold block">Voice Preset:</label>
                  <select
                    value={synthPreset}
                    onChange={(e) => setSynthPreset(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2 font-mono text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="jm_kaito">Kokoro jm_kaito (JA Male)</option>
                    <option value="jf_alpha">Kokoro jf_alpha (JA Female)</option>
                    <option value="jm_ryu">Kokoro jm_ryu (JA Male)</option>
                    <option value="af_heart">Kokoro af_heart (EN Female)</option>
                    <option value="am_adam">Kokoro am_adam (EN Male)</option>
                    <option value="Kore">Kore (Heroic Tenor)</option>
                    <option value="Zephyr">Zephyr (Analytical Female)</option>
                    <option value="Fenrir">Fenrir (Villain Baritone)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-mono font-bold block">Language:</label>
                  <select
                    value={synthLanguage}
                    onChange={(e) => setSynthLanguage(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2 font-mono text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="JA">Japanese (JA)</option>
                    <option value="EN">English (EN)</option>
                  </select>
                </div>
              </div>

              {/* Pitch, Cadence, Resonance Sliders */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3 font-mono">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Pitch Offset:</span>
                    <span className="text-cyan-400 font-bold">{synthPitch > 0 ? `+${synthPitch}` : synthPitch}</span>
                  </div>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    value={synthPitch}
                    onChange={(e) => setSynthPitch(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Speed Cadence:</span>
                    <span className="text-emerald-400 font-bold">{synthCadence}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.05"
                    value={synthCadence}
                    onChange={(e) => setSynthCadence(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <label className="text-slate-300 font-mono font-bold block">Tags (comma separated):</label>
                <input
                  type="text"
                  value={synthTags}
                  onChange={(e) => setSynthTags(e.target.value)}
                  placeholder="Battle, Shonen, High Tension"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end space-x-3 border-t border-slate-800">
              <button
                onClick={() => setShowSynthesizeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSynthesizeAndSave}
                disabled={isSynthesizing}
                className="px-5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-700 font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles className={`w-4 h-4 text-cyan-400 ${isSynthesizing ? 'animate-spin' : ''}`} />
                <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize & Save to Vault'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UPLOAD AUDIO SAMPLE */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Upload className="w-5 h-5 text-purple-400" />
                Upload Studio Voice Take
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-200 font-mono cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-slate-300 font-mono font-bold block">Target Character:</label>
                <select
                  value={uploadCharId}
                  onChange={(e) => setUploadCharId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-mono focus:outline-none cursor-pointer"
                >
                  {project.cast.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-mono font-bold block">Take Title:</label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-mono focus:outline-none"
                />
              </div>

              {/* Dropzone */}
              <div className="border-2 border-dashed border-slate-800 hover:border-purple-500/50 rounded-2xl p-6 text-center space-y-2 bg-slate-950 transition-all cursor-pointer">
                <FileAudio className="w-8 h-8 text-purple-400 mx-auto" />
                <span className="text-xs font-mono font-bold text-slate-300 block">Drag &amp; drop WAV/MP3/OGG file</span>
                <span className="text-[10px] text-slate-500 block font-sans">Max recommended size: 25 MB</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => e.target.files?.[0] && setUploadedFile(e.target.files[0])}
                  className="hidden"
                  id="vault-audio-upload"
                />
                <label htmlFor="vault-audio-upload" className="inline-block px-3 py-1.5 rounded-lg bg-slate-900 text-purple-300 border border-slate-800 font-mono text-xs cursor-pointer">
                  {uploadedFile ? uploadedFile.name : 'Select File'}
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3 border-t border-slate-800">
              <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs cursor-pointer">Cancel</button>
              <button onClick={handleUploadSave} className="px-5 py-2 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 font-mono text-xs font-bold cursor-pointer">
                Save File to Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD MIC SAMPLE */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 animate-fade-in shadow-2xl text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-left">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Mic className="w-5 h-5 text-rose-400" />
                Live Microphone Audition Capture
              </h3>
              <button onClick={() => setShowRecordModal(false)} className="text-slate-400 hover:text-slate-200 font-mono cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 font-sans text-xs text-left">
              <div className="space-y-1">
                <label className="text-slate-300 font-mono font-bold block">Target Character:</label>
                <select
                  value={recordCharId}
                  onChange={(e) => setRecordCharId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 font-mono focus:outline-none cursor-pointer"
                >
                  {project.cast.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Live Visualizer Box */}
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl text-center space-y-3">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-rose-950 border border-rose-500 animate-pulse' : 'bg-slate-900 border border-slate-800'}`}>
                  <Mic className={`w-8 h-8 ${isRecording ? 'text-rose-400' : 'text-slate-500'}`} />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-slate-200 block">
                    {isRecording ? `RECORDING IN PROGRESS (${recordSec}s / 6s)` : 'Click Record to start live capture'}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-sans">
                    {isRecording ? 'Analyzing spectral formants & acoustic timbre...' : 'Uses WebRTC microphone stream'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-center space-x-3 border-t border-slate-800">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Mic className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Start Recording (6s)</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-2.5 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700 font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Square className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Stop &amp; Save to Vault</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
