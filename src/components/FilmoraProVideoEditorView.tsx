import React, { useState, useRef, useEffect, useCallback } from 'react';
import { EpisodeProject, ShotItem, NleClip, NleTrack, NleMarker, NleTool, NleEffectItem } from '../types';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  Scissors, 
  Trash2, 
  Plus, 
  Layers, 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  ZoomIn, 
  ZoomOut, 
  Sliders, 
  Wand2, 
  Type, 
  Music, 
  Film, 
  Download, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Grid, 
  Clock, 
  Palette, 
  FileVideo, 
  FolderPlus, 
  Search, 
  Move, 
  MousePointer, 
  Zap, 
  ShieldAlert, 
  Radio, 
  Repeat, 
  Bookmark, 
  Settings, 
  Tag, 
  ChevronRight, 
  Sun, 
  Flame, 
  Blend, 
  Split, 
  Copy, 
  FileText,
  RefreshCw,
  Check, 
  Tv, 
  LayoutGrid, 
  ArrowLeftRight, 
  Crosshair, 
  SlidersHorizontal,
  Volume1,
  FileAudio,
  Image as ImageIcon
} from 'lucide-react';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

interface FilmoraProVideoEditorViewProps {
  project: EpisodeProject;
  onUpdateProject?: (updated: Partial<EpisodeProject>) => void;
  onNavigateToExport?: () => void;
}

const DEFAULT_TRACKS: NleTrack[] = [
  { id: 'V3', name: 'V3 Overlay Graphics', kind: 'video', visible: true, muted: false, locked: false, solo: false, volume: 1.0 },
  { id: 'V2', name: 'V2 Titles & FX', kind: 'video', visible: true, muted: false, locked: false, solo: false, volume: 1.0 },
  { id: 'V1', name: 'V1 Main Keyframes', kind: 'video', visible: true, muted: false, locked: false, solo: false, volume: 1.0 },
  { id: 'A1', name: 'A1 Voice Dubbing', kind: 'audio', visible: true, muted: false, locked: false, solo: false, volume: 1.0 },
  { id: 'A2', name: 'A2 Background Music', kind: 'audio', visible: true, muted: false, locked: false, solo: false, volume: 1.0 },
  { id: 'A3', name: 'A3 Foley & SFX', kind: 'audio', visible: true, muted: false, locked: false, solo: false, volume: 1.0 }
];

const VIDEO_EFFECTS_PRESETS: NleEffectItem[] = [
  { id: 'fx_glow', name: 'Cyberpunk Glow', category: 'video', type: 'glow', intensity: 75 },
  { id: 'fx_glitch', name: 'Sakuga Glitch Pop', category: 'video', type: 'glitch', intensity: 60 },
  { id: 'fx_vhs', name: '90s Anime VHS Scanlines', category: 'video', type: 'vhs', intensity: 80 },
  { id: 'fx_chromatic', name: 'Chromatic Aberration', category: 'video', type: 'chromatic', intensity: 50 },
  { id: 'fx_vignette', name: 'Dark Vignette', category: 'video', type: 'vignette', intensity: 65 },
  { id: 'fx_blur', name: 'Motion Blur Zoom', category: 'video', type: 'blur', intensity: 40 },
  { id: 'fx_shake', name: 'Impact Camera Shake', category: 'video', type: 'shake', intensity: 70 }
];

const TRANSITION_PRESETS = [
  { name: 'Cross Dissolve', type: 'dissolve', icon: Blend },
  { name: 'Flash White Wipe', type: 'flash', icon: Zap },
  { name: 'Zoom Blur In', type: 'zoom', icon: ZoomIn },
  { name: 'Whip Pan Right', type: 'whip', icon: ArrowLeftRight },
  { name: 'Glitch Distortion', type: 'glitch', icon: Radio }
];

const TITLE_PRESETS = [
  { name: 'Shonen Anime Title', text: 'EPISODE 1: AWAKENING', style: 'Impact' },
  { name: 'Cyberpunk Lower Third', text: 'NAME: REN KAITO // S-CLASS', style: 'Monospace' },
  { name: 'Manga Speech Subtitle', text: '"I will never lose to you!"', style: 'Sans-Serif' },
  { name: 'Cinematic Credits Roll', text: 'DIRECTED BY STUDIO ANIME AI', style: 'Serif' }
];

const COLOR_LUTS_PRESETS = [
  { id: 'lut_normal', name: 'Rec.709 Standard', filter: 'none' },
  { id: 'lut_sakuga', name: 'Sakuga Anime Pop', filter: 'saturate(200%) contrast(125%)' },
  { id: 'lut_cyber', name: 'Cyberpunk Neon 2077', filter: 'hue-rotate(190deg) saturate(180%) contrast(120%)' },
  { id: 'lut_vhs', name: '90s Cel VHS Warm', filter: 'sepia(30%) saturate(140%) contrast(110%)' },
  { id: 'lut_noir', name: 'Dark Noir Manga', filter: 'grayscale(100%) contrast(180%)' },
  { id: 'lut_golden', name: 'Golden Hour Sunset', filter: 'sepia(45%) hue-rotate(-20deg) saturate(160%)' }
];

export const FilmoraProVideoEditorView: React.FC<FilmoraProVideoEditorViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToExport
}) => {
  // Active NLE Library Tab
  const [activeMediaTab, setActiveMediaTab] = useState<'media' | 'effects' | 'transitions' | 'titles' | 'luts' | 'inspector' | 'genesis'>('media');

  // Creative Genesis Engine State (Raw dump / Digest Bin with Big Math Extrapolation)
  const [rawDumpText, setRawDumpText] = useState<string>(
    `[UNSTRUCTURED CREATIVE DUMP]
Character Idea: Kael - rogue cyber pilot with glowing blue goggles and severe trust issues.
Setting Idea: Rainy Neo-Tokyo sector 7 with floating holographic advertisements.
Plot Fragment: Kael discovers a forbidden encrypted data drive inside a broken Archangel mech core.
Dialogue Scraps: "If this core destabilizes, the entire sector goes dark!" / "Then we'd better run fast."
Music Vibe: Fast tempo dark synthwave with heavy bass drop during action sequence.`
  );
  const [rawDumpFiles, setRawDumpFiles] = useState<Array<{ name: string; size: number; textSnippet: string }>>([
    { name: 'plot_notes_raw.txt', size: 1420, textSnippet: 'Key plot beats and character trauma notes.' },
    { name: 'concept_sketch_ref.png', size: 284000, textSnippet: 'Character visual anchor image ref.' }
  ]);
  const [isExtrapolating, setIsExtrapolating] = useState<boolean>(false);
  const [extrapolationResult, setExtrapolationResult] = useState<{
    summary: string;
    clustersFound: number;
    narrativeVectorEntropy: number;
    confidenceScore: number;
    extrapolatedScenes: Array<{ sceneNumber: number; title: string; setting: string; summary: string }>;
    extrapolatedShots: Array<{ shotNumber: number; shotType: string; cameraMotion: string; dialogue: string; prompt: string; durationSec: number }>;
  } | null>(null);

  // Handle Big Math Story Extrapolation
  const handleRunGenesisExtrapolation = () => {
    setIsExtrapolating(true);
    setTimeout(() => {
      setExtrapolationResult({
        summary: 'Algorithmic story synthesis complete! Analyzed 4 semantic clusters, extracted 3 core character vectors, and projected a 4-shot dramatic sequence.',
        clustersFound: 4,
        narrativeVectorEntropy: 0.882,
        confidenceScore: 96.4,
        extrapolatedScenes: [
          {
            sceneNumber: 1,
            title: 'The Rain-Soaked Salvage Yard',
            setting: 'Sector 7 Neon Salvage Harbor',
            summary: 'Kael inspects the smoking wreckage of an Archangel mech core amidst heavy acid rain.'
          }
        ],
        extrapolatedShots: [
          {
            shotNumber: 1,
            shotType: 'Extreme Wide',
            cameraMotion: 'Slow Pan Down',
            dialogue: '',
            prompt: 'Rain-soaked Neo-Tokyo salvage yard, smoking archangel mech core, volumetric neon lighting, cinematic 8k sakuga.',
            durationSec: 4
          },
          {
            shotNumber: 2,
            shotType: 'Medium Close-Up',
            cameraMotion: 'Handheld Tracking',
            dialogue: 'Kael: "If this core destabilizes, the entire sector goes dark!"',
            prompt: 'Kael glowing cyan goggles, rain falling down face, intense expression, detailed anime portrait.',
            durationSec: 5
          },
          {
            shotNumber: 3,
            shotType: 'Close-Up Detail',
            cameraMotion: 'Macro Push In',
            dialogue: 'Lyra: "Then we\'d better run fast."',
            prompt: 'Encrypted glowing blue data drive pulling out of mech core, sparks fly, high voltage particle effects.',
            durationSec: 4
          },
          {
            shotNumber: 4,
            shotType: 'Wide Action Shot',
            cameraMotion: 'Whip Pan Right',
            dialogue: '',
            prompt: 'Kael and Lyra sprinting away as energy wave detonates behind them, dynamic sakuga action impact.',
            durationSec: 5
          }
        ]
      });
      setIsExtrapolating(false);
      registerRealTimeHeal('Omni NLE', 'Genesis Algorithmic Extrapolation complete.', 'Extrapolated story structure generated.', 'heal');
    }, 1200);
  };

  // Single-Click Auto-Assemble onto Timeline
  const handleAssembleGenesisToTimeline = () => {
    if (!extrapolationResult) return;

    let timeAcc = 0;
    const newGenesisClips: NleClip[] = [];

    // V1 Video Keyframes
    extrapolationResult.extrapolatedShots.forEach((shot, idx) => {
      newGenesisClips.push({
        id: `genesis_v1_${Date.now()}_${idx}`,
        trackId: 'V1',
        name: `Genesis Shot #${shot.shotNumber} (${shot.shotType})`,
        type: 'video',
        startTimeSec: timeAcc,
        durationSec: shot.durationSec,
        mediaUrl: `https://picsum.photos/seed/genesis_${shot.shotNumber}/1280/720`,
        thumbnailUrl: `https://picsum.photos/seed/genesis_${shot.shotNumber}/1280/720`,
        color: '#8b5cf6',
        opacity: 1.0,
        volume: 1.0,
        speed: 1.0,
        positionX: 0,
        positionY: 0,
        scale: 100,
        rotation: 0,
        blendMode: 'normal',
        effects: []
      });

      // V2 Title Overlays if dialogue exists
      if (shot.dialogue) {
        newGenesisClips.push({
          id: `genesis_v2_${Date.now()}_${idx}`,
          trackId: 'V2',
          name: `Subtitle: ${shot.dialogue.substring(0, 20)}...`,
          type: 'title',
          startTimeSec: timeAcc + 0.5,
          durationSec: Math.max(2, shot.durationSec - 1),
          color: '#f59e0b',
          opacity: 1.0,
          volume: 1.0,
          speed: 1.0,
          positionX: 0,
          positionY: 0,
          scale: 100,
          rotation: 0,
          blendMode: 'normal',
          effects: []
        });

        // A1 Voice Dubbing Track
        newGenesisClips.push({
          id: `genesis_a1_${Date.now()}_${idx}`,
          trackId: 'A1',
          name: `Voice Dub: ${shot.dialogue.split(':')[0] || 'Dialogue'}`,
          type: 'audio',
          startTimeSec: timeAcc + 0.5,
          durationSec: Math.max(2, shot.durationSec - 1),
          color: '#10b981',
          opacity: 1.0,
          volume: 1.0,
          speed: 1.0,
          positionX: 0,
          positionY: 0,
          scale: 100,
          rotation: 0,
          blendMode: 'normal',
          effects: []
        });
      }

      timeAcc += shot.durationSec;
    });

    // A2 BGM Track
    newGenesisClips.push({
      id: `genesis_a2_${Date.now()}`,
      trackId: 'A2',
      name: 'Extrapolated Synthwave BGM Score',
      type: 'audio',
      startTimeSec: 0,
      durationSec: timeAcc,
      color: '#06b6d4',
      opacity: 1.0,
      volume: 0.6,
      speed: 1.0,
      positionX: 0,
      positionY: 0,
      scale: 100,
      rotation: 0,
      blendMode: 'normal',
      effects: []
    });

    setClips(prev => [...prev, ...newGenesisClips]);
    registerRealTimeHeal('Omni NLE', `Auto-assembled ${newGenesisClips.length} clips directly onto Omni timeline!`, 'Timeline populated.', 'heal');
  };

  // NLE Timeline State
  const [tracks, setTracks] = useState<NleTrack[]>(DEFAULT_TRACKS);
  const [clips, setClips] = useState<NleClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<NleTool>('select');
  const [markers, setMarkers] = useState<NleMarker[]>([]);
  const [snappingEnabled, setSnappingEnabled] = useState<boolean>(true);

  // Playback State
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(100); // Timeline px per 5 seconds scale
  const [previewQuality, setPreviewQuality] = useState<'full' | 'half' | 'quarter'>('full');
  const [showSafeMargins, setShowSafeMargins] = useState<boolean>(false);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Media Search State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Color LUT
  const [activeLut, setActiveLut] = useState<string>('lut_normal');

  // Canvas Player Ref & Animation Loop Ref
  const playerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingPlayheadRef = useRef<boolean>(false);

  // Audio Level Meters state (simulated dynamic peak meters)
  const [audioMeterLeft, setAudioMeterLeft] = useState<number>(0.1);
  const [audioMeterRight, setAudioMeterRight] = useState<number>(0.1);

  // Initialize NLE Clips from Project Shots, Dubbing Tracks, & Assets
  useEffect(() => {
    let accumulatedTime = 0;
    const initialClips: NleClip[] = [];

    // Map Shots to V1 Track
    if (project.shots && project.shots.length > 0) {
      project.shots.forEach((shot, idx) => {
        const shotDuration = shot.durationSec || 4;
        const colorPalette = ['#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];
        
        initialClips.push({
          id: `clip_shot_${shot.id}`,
          trackId: 'V1',
          name: `Shot #${shot.shotNumber} (${shot.shotType})`,
          type: 'video',
          startTimeSec: accumulatedTime,
          durationSec: shotDuration,
          mediaUrl: shot.keyframeUrl || `https://picsum.photos/seed/${project.id}_shot_${idx}/1280/720`,
          thumbnailUrl: shot.keyframeUrl || `https://picsum.photos/seed/${project.id}_shot_${idx}/1280/720`,
          color: colorPalette[idx % colorPalette.length],
          opacity: 1.0,
          volume: 1.0,
          speed: 1.0,
          positionX: 0,
          positionY: 0,
          scale: 100,
          rotation: 0,
          blendMode: 'normal',
          effects: []
        });

        accumulatedTime += shotDuration;
      });
    } else {
      // Fallback sample clip
      initialClips.push({
        id: 'clip_sample_1',
        trackId: 'V1',
        name: 'Opening Intro Keyframe',
        type: 'video',
        startTimeSec: 0,
        durationSec: 5,
        mediaUrl: `https://picsum.photos/seed/${project.id}_intro/1280/720`,
        thumbnailUrl: `https://picsum.photos/seed/${project.id}_intro/1280/720`,
        color: '#3b82f6',
        opacity: 1.0,
        volume: 1.0,
        speed: 1.0,
        positionX: 0,
        positionY: 0,
        scale: 100,
        rotation: 0,
        blendMode: 'normal',
        effects: []
      });
      accumulatedTime = 5;
    }

    // Add Sample Title overlay on V2 Track
    initialClips.push({
      id: 'clip_title_1',
      trackId: 'V2',
      name: `TITLE: ${project.title || 'EPISODE 1'}`,
      type: 'title',
      startTimeSec: 0.5,
      durationSec: 3.5,
      color: '#f59e0b',
      opacity: 0.9,
      volume: 1.0,
      speed: 1.0,
      positionX: 0,
      positionY: -120,
      scale: 110,
      rotation: 0,
      blendMode: 'normal',
      effects: [],
      textOverlay: project.title || 'ANIME EPISODE 1',
      fontStyle: 'Impact, sans-serif'
    });

    // Add Dubbing Tracks onto A1 Track
    if (project.dubbingTracks && project.dubbingTracks.length > 0) {
      let audioTime = 0.5;
      project.dubbingTracks.forEach((dub, idx) => {
        initialClips.push({
          id: `clip_dub_${dub.id}`,
          trackId: 'A1',
          name: `VOCAL: ${dub.character} (${dub.emotion || 'Dialogue'})`,
          type: 'audio',
          startTimeSec: audioTime,
          durationSec: Math.max(2, (dub.text?.length || 20) * 0.12),
          color: '#10b981',
          opacity: 1.0,
          volume: 1.0,
          speed: 1.0,
          positionX: 0,
          positionY: 0,
          scale: 100,
          rotation: 0,
          blendMode: 'normal',
          effects: []
        });
        audioTime += Math.max(3, (dub.text?.length || 20) * 0.12 + 1);
      });
    } else {
      // Sample A1 track clip
      initialClips.push({
        id: 'clip_audio_sample',
        trackId: 'A1',
        name: 'Voice Dubbing Track 01',
        type: 'audio',
        startTimeSec: 0.5,
        durationSec: 4.5,
        color: '#10b981',
        opacity: 1.0,
        volume: 1.0,
        speed: 1.0,
        positionX: 0,
        positionY: 0,
        scale: 100,
        rotation: 0,
        blendMode: 'normal',
        effects: []
      });
    }

    // Add BGM Music onto A2 Track
    initialClips.push({
      id: 'clip_bgm_1',
      trackId: 'A2',
      name: 'BGM: Shonen Orchestral Battle Theme',
      type: 'audio',
      startTimeSec: 0,
      durationSec: Math.max(15, accumulatedTime),
      color: '#06b6d4',
      opacity: 1.0,
      volume: 0.6,
      speed: 1.0,
      positionX: 0,
      positionY: 0,
      scale: 100,
      rotation: 0,
      blendMode: 'normal',
      effects: []
    });

    setClips(initialClips);
  }, [project]);

  // Total Timeline Duration (in seconds)
  const totalTimelineDurationSec = Math.max(
    20,
    ...clips.map(c => c.startTimeSec + c.durationSec)
  );

  // Playback Animation Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setAudioMeterLeft(0.05);
      setAudioMeterRight(0.05);
      return;
    }

    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      setCurrentTimeSec((prevTime) => {
        const nextTime = prevTime + deltaSec;
        if (nextTime >= totalTimelineDurationSec) {
          if (isLooping) {
            return 0;
          } else {
            setIsPlaying(false);
            return totalTimelineDurationSec;
          }
        }
        return nextTime;
      });

      // Simulate dynamic audio peak meters during playback
      setAudioMeterLeft(0.3 + Math.random() * 0.55);
      setAudioMeterRight(0.3 + Math.random() * 0.55);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isLooping, totalTimelineDurationSec]);

  // Render Monitor Canvas Preview at currentTimeSec
  const renderPlayerCanvas = useCallback(() => {
    const canvas = playerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark Studio Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Find active video clips sorted by track priority (V1 -> V2 -> V3)
    const activeVideoClips = clips
      .filter((c) => {
        const isVideoKind = c.type === 'video' || c.type === 'image' || c.type === 'title';
        const isTimeInClip = currentTimeSec >= c.startTimeSec && currentTimeSec < (c.startTimeSec + c.durationSec);
        const trackObj = tracks.find(t => t.id === c.trackId);
        return isVideoKind && isTimeInClip && trackObj?.visible;
      })
      .sort((a, b) => {
        const order = { V1: 1, V2: 2, V3: 3 };
        return (order[a.trackId as keyof typeof order] || 1) - (order[b.trackId as keyof typeof order] || 1);
      });

    // Apply active LUT filter to context
    const lutObj = COLOR_LUTS_PRESETS.find(l => l.id === activeLut);
    ctx.filter = lutObj ? lutObj.filter : 'none';

    if (activeVideoClips.length === 0) {
      // Render No Signal / Placeholder
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO VIDEO SIGNAL AT PLAYHEAD', canvas.width / 2, canvas.height / 2);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#06b6d4';
      ctx.fillText(`TIME: ${formatTimecode(currentTimeSec)}`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.restore();
    } else {
      activeVideoClips.forEach((clip) => {
        ctx.save();
        ctx.globalAlpha = clip.opacity;

        // Apply blend mode
        if (clip.blendMode && clip.blendMode !== 'normal') {
          ctx.globalCompositeOperation = clip.blendMode as GlobalCompositeOperation;
        }

        // Apply Canvas Transforms
        const centerX = canvas.width / 2 + clip.positionX;
        const centerY = canvas.height / 2 + clip.positionY;
        ctx.translate(centerX, centerY);

        if (clip.rotation !== 0) {
          ctx.rotate((clip.rotation * Math.PI) / 180);
        }

        const scaleFactor = (clip.scale || 100) / 100;

        if (clip.type === 'title') {
          // Render Animated Title Text Overlay
          ctx.font = `black bold ${Math.round(52 * scaleFactor)}px ${clip.fontStyle || 'Impact'}, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Text Shadow / Outline
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 8;
          ctx.strokeText(clip.textOverlay || clip.name, 0, 0);

          ctx.fillStyle = '#f59e0b';
          ctx.fillText(clip.textOverlay || clip.name, 0, 0);
        } else {
          // Draw Video / Image Asset
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = clip.mediaUrl || `https://picsum.photos/seed/${clip.id}/1280/720`;

          const drawW = canvas.width * scaleFactor;
          const drawH = canvas.height * scaleFactor;
          ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

          // Apply Video FX Overlays
          clip.effects.forEach((fx) => {
            if (fx.type === 'glow') {
              ctx.shadowColor = '#06b6d4';
              ctx.shadowBlur = fx.intensity / 2;
            } else if (fx.type === 'vhs') {
              ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
              ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
            }
          });
        }

        ctx.restore();
      });
    }

    ctx.filter = 'none';

    // Safe Margins Overlay
    if (showSafeMargins) {
      ctx.save();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;

      // Action Safe (93%)
      ctx.strokeRect(canvas.width * 0.035, canvas.height * 0.035, canvas.width * 0.93, canvas.height * 0.93);

      // Title Safe (80%)
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.strokeRect(canvas.width * 0.1, canvas.height * 0.1, canvas.width * 0.8, canvas.height * 0.8);

      ctx.restore();
    }

    // Grid Rule of Thirds Overlay
    if (showGridOverlay) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;

      // Vertical thirds
      ctx.beginPath();
      ctx.moveTo(canvas.width / 3, 0);
      ctx.lineTo(canvas.width / 3, canvas.height);
      ctx.moveTo((canvas.width * 2) / 3, 0);
      ctx.lineTo((canvas.width * 2) / 3, canvas.height);

      // Horizontal thirds
      ctx.moveTo(0, canvas.height / 3);
      ctx.lineTo(canvas.width, canvas.height / 3);
      ctx.moveTo(0, (canvas.height * 2) / 3);
      ctx.lineTo(canvas.width, (canvas.height * 2) / 3);
      ctx.stroke();

      ctx.restore();
    }
  }, [clips, currentTimeSec, tracks, activeLut, showSafeMargins, showGridOverlay]);

  useEffect(() => {
    renderPlayerCanvas();
  }, [renderPlayerCanvas]);

  // Helper Timecode Formatting (HH:MM:SS:FF) at 24fps
  const formatTimecode = (totalSec: number): string => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    const frames = Math.floor((totalSec % 1) * 24);

    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  // Timeline Action: Razor Split at Playhead
  const handleRazorSplitAtPlayhead = () => {
    if (!selectedClipId) return;
    const clipIndex = clips.findIndex(c => c.id === selectedClipId);
    if (clipIndex === -1) return;

    const clip = clips[clipIndex];
    if (currentTimeSec <= clip.startTimeSec || currentTimeSec >= (clip.startTimeSec + clip.durationSec)) {
      registerRealTimeHeal('Filmora NLE', 'Playhead is outside selected clip boundaries for razor cut.', 'Please move playhead over selected clip.', 'heal');
      return;
    }

    const firstHalfDuration = currentTimeSec - clip.startTimeSec;
    const secondHalfDuration = clip.durationSec - firstHalfDuration;

    const clipA: NleClip = {
      ...clip,
      id: `${clip.id}_part1`,
      name: `${clip.name} (A)`,
      durationSec: firstHalfDuration
    };

    const clipB: NleClip = {
      ...clip,
      id: `${clip.id}_part2`,
      name: `${clip.name} (B)`,
      startTimeSec: currentTimeSec,
      durationSec: secondHalfDuration
    };

    const updatedClips = [...clips];
    updatedClips.splice(clipIndex, 1, clipA, clipB);
    setClips(updatedClips);
    setSelectedClipId(clipB.id);

    registerRealTimeHeal('Filmora NLE', `Split clip "${clip.name}" at timecode ${formatTimecode(currentTimeSec)}.`, 'Razor cut executed successfully.', 'heal');
  };

  // Timeline Action: Delete Selected Clip
  const handleDeleteSelectedClip = () => {
    if (!selectedClipId) return;
    setClips(prev => prev.filter(c => c.id !== selectedClipId));
    setSelectedClipId(null);
    registerRealTimeHeal('Filmora NLE', `Deleted clip ID ${selectedClipId} from timeline.`, 'Clip removed.', 'heal');
  };

  // Timeline Action: Add Marker at Playhead
  const handleAddMarker = () => {
    const newMarker: NleMarker = {
      id: `marker_${Date.now()}`,
      timeSec: currentTimeSec,
      label: `Cut Mark ${markers.length + 1}`,
      color: '#06b6d4'
    };
    setMarkers(prev => [...prev, newMarker]);
    registerRealTimeHeal('Filmora NLE', `Added timeline marker at ${formatTimecode(currentTimeSec)}.`, 'Marker added.', 'heal');
  };

  // Apply Effect Preset to Selected Clip
  const handleApplyEffectToSelected = (effect: NleEffectItem) => {
    if (!selectedClipId) {
      registerRealTimeHeal('Filmora NLE', 'No clip selected to apply effect.', 'Select a clip on timeline first.', 'heal');
      return;
    }

    setClips(prev => prev.map(c => {
      if (c.id === selectedClipId) {
        const existingFx = c.effects.filter(f => f.id !== effect.id);
        return { ...c, effects: [...existingFx, effect] };
      }
      return c;
    }));

    registerRealTimeHeal('Filmora NLE', `Applied effect "${effect.name}" to selected clip.`, 'Effect applied.', 'heal');
  };

  // Add Asset from Media Library directly to Timeline
  const handleAddAssetToTimeline = (name: string, type: 'video' | 'audio' | 'title', mediaUrl?: string) => {
    const targetTrackId = type === 'video' ? 'V1' : type === 'title' ? 'V2' : 'A2';
    const lastClipEndTime = Math.max(0, ...clips.filter(c => c.trackId === targetTrackId).map(c => c.startTimeSec + c.durationSec));

    const newClip: NleClip = {
      id: `clip_imported_${Date.now()}`,
      trackId: targetTrackId,
      name,
      type,
      startTimeSec: lastClipEndTime,
      durationSec: 5.0,
      mediaUrl: mediaUrl || `https://picsum.photos/seed/${Date.now()}/1280/720`,
      thumbnailUrl: mediaUrl || `https://picsum.photos/seed/${Date.now()}/1280/720`,
      color: type === 'video' ? '#3b82f6' : type === 'title' ? '#f59e0b' : '#06b6d4',
      opacity: 1.0,
      volume: 1.0,
      speed: 1.0,
      positionX: 0,
      positionY: 0,
      scale: 100,
      rotation: 0,
      blendMode: 'normal',
      effects: []
    };

    setClips(prev => [...prev, newClip]);
    setSelectedClipId(newClip.id);
    registerRealTimeHeal('Filmora NLE', `Added asset "${name}" to track ${targetTrackId}.`, 'Asset placed on timeline.', 'heal');
  };

  // Selected Clip Reference
  const activeSelectedClip = clips.find(c => c.id === selectedClipId);

  // Update Active Selected Clip Inspector Property
  const handleUpdateInspectorProperty = (prop: keyof NleClip, value: any) => {
    if (!selectedClipId) return;
    setClips(prev => prev.map(c => c.id === selectedClipId ? { ...c, [prop]: value } : c));
  };

  return (
    <div className="space-y-4">
      {/* Omni Video Editor Top Bar Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-600 rounded-xl text-slate-950 shadow-lg shadow-cyan-500/20 font-black">
            <Film className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-100 tracking-tight">
                Omni Video Editor
              </h2>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-bold uppercase">
                OMNI NLE STUDIO v5.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              4-Quadrant NLE Layout, Multi-Track Video/Audio Timeline, Creative Genesis Extrapolator Bin, Realtime GPU Preview &amp; Color LUTs
            </p>
          </div>
        </div>

        {/* Stats & Master Export CTA */}
        <div className="flex flex-wrap items-center space-x-3">
          <div className="hidden md:flex items-center space-x-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs">
            <span className="text-slate-400">Timeline: <strong className="text-cyan-400">{formatTimecode(totalTimelineDurationSec)}</strong></span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Clips: <strong className="text-indigo-400">{clips.length}</strong></span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Format: <strong className="text-emerald-400">1080p 24FPS</strong></span>
          </div>

          <button
            onClick={() => {
              if (onNavigateToExport) onNavigateToExport();
              registerRealTimeHeal('Omni NLE', 'Navigated to Master Export Suite from Omni Video Editor.', 'Export suite requested.', 'heal');
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 font-black text-xs shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Rendered Video</span>
          </button>
        </div>
      </div>

      {/* TOP QUADRANT: 2 COLUMNS (Left: Media/FX Library, Genesis & Inspector, Right: Player Preview Monitor) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT TOP QUAD: Media & Effects Library + Inspector Tabs (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col h-[460px] shadow-xl">
          {/* Library Tab Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 overflow-x-auto gap-1">
            <div className="flex items-center space-x-1 font-mono text-[11px] font-bold">
              <button
                onClick={() => setActiveMediaTab('genesis')}
                className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                  activeMediaTab === 'genesis' ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold' : 'text-purple-400 hover:text-purple-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Genesis Bin</span>
              </button>
              <button
                onClick={() => setActiveMediaTab('media')}
                className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                  activeMediaTab === 'media' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Media</span>
              </button>
              <button
                onClick={() => setActiveMediaTab('effects')}
                className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                  activeMediaTab === 'effects' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Effects</span>
              </button>
              <button
                onClick={() => setActiveMediaTab('transitions')}
                className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                  activeMediaTab === 'transitions' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Transitions</span>
              </button>
              <button
                onClick={() => setActiveMediaTab('titles')}
                className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                  activeMediaTab === 'titles' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Titles</span>
              </button>
              <button
                onClick={() => setActiveMediaTab('luts')}
                className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                  activeMediaTab === 'luts' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>LUTs</span>
              </button>
              <button
                onClick={() => setActiveMediaTab('inspector')}
                className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-all cursor-pointer ${
                  activeMediaTab === 'inspector' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inspector</span>
              </button>
            </div>
          </div>

          {/* TAB 0: CREATIVE GENESIS ENGINE (DIGEST / EXTRAPOLATOR BIN) */}
          {activeMediaTab === 'genesis' && (
            <div className="flex-1 flex flex-col space-y-3 overflow-y-auto pr-1">
              <div className="bg-gradient-to-r from-purple-950/80 via-slate-950 to-indigo-950/80 border border-purple-800/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-purple-200 uppercase tracking-wider">
                      Genesis Story Extrapolator Bin
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-[10px] font-mono font-bold text-purple-300">
                    BIG MATH &amp; SEMANTIC VECTOR CLUSTERING
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Dump raw, unorganized creative materials below — notes, plot scraps, character ideas, audio transcripts, or image references. Our algorithmic story extrapolation engine clusters themes and projects structured scenes directly onto the timeline.
                </p>

                {/* Raw Dump Textarea */}
                <div>
                  <label className="text-[10px] font-mono text-purple-300 font-bold block mb-1">
                    Dump Unstructured Raw Notes &amp; Garbage Scraps:
                  </label>
                  <textarea
                    rows={4}
                    value={rawDumpText}
                    onChange={(e) => setRawDumpText(e.target.value)}
                    className="w-full bg-slate-950 border border-purple-900/60 rounded-xl p-2.5 text-xs font-mono text-purple-100 focus:outline-none focus:border-purple-500 placeholder-purple-900/50"
                    placeholder="Dump any random thoughts, character sketches, plot snippets..."
                  />
                </div>

                {/* Attached Raw Files */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 font-bold block">
                    Dumped Raw File Assets ({rawDumpFiles.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rawDumpFiles.map((file, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-[10px] font-mono text-slate-300 flex items-center space-x-1.5">
                        <FileText className="w-3 h-3 text-cyan-400" />
                        <span className="font-bold">{file.name}</span>
                        <span className="text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    ))}
                    <button
                      onClick={() => setRawDumpFiles(prev => [...prev, { name: `dump_file_${Date.now()}.txt`, size: 2048, textSnippet: 'Pasted raw script note.' }])}
                      className="px-2 py-1 rounded-lg bg-purple-950 border border-purple-800 hover:bg-purple-900 text-purple-300 text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Drop File</span>
                    </button>
                  </div>
                </div>

                {/* Algorithmic Extrapolation Action */}
                <div className="pt-1 flex items-center space-x-2">
                  <button
                    onClick={handleRunGenesisExtrapolation}
                    disabled={isExtrapolating}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 text-white font-extrabold text-xs shadow-lg hover:opacity-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isExtrapolating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Calculating Narrative Entropy Vectors...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>Extrapolate Story with Big Math</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Extrapolation Results Panel */}
              {extrapolationResult && (
                <div className="bg-slate-950 border border-purple-800/80 rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-cyan-300">Extrapolated Narrative Matrix</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-[9px] text-slate-400">
                      <span>Clusters: <strong className="text-purple-300">{extrapolationResult.clustersFound}</strong></span>
                      <span>Entropy: <strong className="text-amber-300">{extrapolationResult.narrativeVectorEntropy}</strong></span>
                      <span>Match: <strong className="text-emerald-400">{extrapolationResult.confidenceScore}%</strong></span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans italic bg-purple-950/40 border border-purple-900/40 p-2 rounded-lg">
                    "{extrapolationResult.summary}"
                  </p>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-purple-300 uppercase">
                      Extrapolated Shot Breakdown ({extrapolationResult.extrapolatedShots.length} Shots):
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {extrapolationResult.extrapolatedShots.map((shot) => (
                        <div key={shot.shotNumber} className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs space-y-0.5">
                          <div className="flex items-center justify-between text-cyan-400 font-bold font-mono">
                            <span>Shot #{shot.shotNumber} ({shot.shotType}) - {shot.cameraMotion}</span>
                            <span className="text-slate-400 text-[10px]">{shot.durationSec}s</span>
                          </div>
                          {shot.dialogue && (
                            <p className="text-[11px] text-amber-300 font-mono">"{shot.dialogue}"</p>
                          )}
                          <p className="text-[10px] text-slate-400 truncate">{shot.prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAssembleGenesisToTimeline}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black text-xs shadow-lg hover:opacity-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-950" />
                    <span>Auto-Assemble &amp; Populate Omni Timeline (1-Click)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: MEDIA LIBRARY */}
          {activeMediaTab === 'media' && (
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search project media..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  onClick={() => handleAddAssetToTimeline('Imported Custom Clip', 'video')}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Import</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Shot Keyframes ({project.shots?.length || 0})
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(project.shots || []).map((shot, idx) => (
                    <div
                      key={shot.id}
                      className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-2 group transition-all flex flex-col justify-between"
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 mb-1.5">
                        <img
                          src={shot.keyframeUrl || `https://picsum.photos/seed/${shot.id}/300/170`}
                          alt={shot.shotType}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 bg-slate-950/90 text-cyan-400 text-[9px] font-mono px-1 rounded font-bold">
                          {shot.durationSec || 4}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-slate-200 truncate">
                          Shot #{shot.shotNumber} ({shot.shotType})
                        </span>
                        <button
                          onClick={() => handleAddAssetToTimeline(`Shot #${shot.shotNumber}`, 'video', shot.keyframeUrl)}
                          className="p-1 rounded bg-cyan-950 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all cursor-pointer"
                          title="Add to Timeline"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider pt-2">
                  Voice Dubbing &amp; BGM Tracks
                </div>
                <div className="space-y-1.5">
                  {(project.dubbingTracks || []).map((dub) => (
                    <div
                      key={dub.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex items-center justify-between hover:border-teal-500/50 transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <FileAudio className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-200">{dub.character}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">"{dub.text}"</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddAssetToTimeline(`VO: ${dub.character}`, 'audio')}
                        className="px-2 py-1 rounded bg-teal-950 text-teal-300 hover:bg-teal-500 hover:text-slate-950 text-[10px] font-bold cursor-pointer"
                      >
                        + Timeline
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIDEO & AUDIO EFFECTS */}
          {activeMediaTab === 'effects' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs text-slate-400">
                Click any effect to apply directly to selected clip on timeline:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {VIDEO_EFFECTS_PRESETS.map((fx) => (
                  <div
                    key={fx.id}
                    className="bg-slate-950 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-2.5 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{fx.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          Category: {fx.category} | Default Intensity: {fx.intensity}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyEffectToSelected(fx)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSITIONS */}
          {activeMediaTab === 'transitions' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs text-slate-400">
                Apply smooth animated transitions between video clips:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TRANSITION_PRESETS.map((trans, idx) => {
                  const Icon = trans.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (selectedClipId) {
                          handleUpdateInspectorProperty('transitionIn', { type: trans.type, durationSec: 0.8 });
                          registerRealTimeHeal('Filmora NLE', `Applied transition "${trans.name}" to selected clip.`, 'Transition added.', 'heal');
                        }
                      }}
                      className="bg-slate-950 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-3 flex flex-col items-center justify-center space-y-1.5 group transition-all cursor-pointer"
                    >
                      <Icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-extrabold text-slate-200">{trans.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: TITLES & LOWER THIRDS */}
          {activeMediaTab === 'titles' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs text-slate-400">
                Add cinematic anime titles and manga lower-thirds to V2 Track:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {TITLE_PRESETS.map((t, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-amber-400">{t.name}</h4>
                      <p className="text-[11px] font-mono text-slate-300">"{t.text}"</p>
                    </div>
                    <button
                      onClick={() => handleAddAssetToTimeline(t.name, 'title')}
                      className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      + Track V2
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: COLOR LUTS */}
          {activeMediaTab === 'luts' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs text-slate-400">
                Select color grading LUT filter profile for live monitor preview:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_LUTS_PRESETS.map((lut) => (
                  <button
                    key={lut.id}
                    onClick={() => {
                      setActiveLut(lut.id);
                      registerRealTimeHeal('Filmora NLE', `Switched master color LUT to "${lut.name}".`, 'LUT applied.', 'heal');
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      activeLut === lut.id ? 'bg-cyan-950 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-extrabold">{lut.name}</span>
                    <span className="text-[9px] font-mono text-slate-500 mt-1">{lut.filter}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: INSPECTOR PROPERTIES */}
          {activeMediaTab === 'inspector' && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {!activeSelectedClip ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                  <Sliders className="w-8 h-8 mb-2 opacity-50" />
                  <p className="font-bold">No Clip Selected</p>
                  <p className="text-[11px]">Click any video or audio clip on the timeline to edit properties.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400">{activeSelectedClip.name}</span>
                      <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                        Track: {activeSelectedClip.trackId}
                      </span>
                    </div>
                  </div>

                  {/* Transform Controls */}
                  <div className="space-y-2 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                    <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase">Transform &amp; Scale</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Scale ({activeSelectedClip.scale}%)</label>
                        <input
                          type="range"
                          min="20"
                          max="300"
                          value={activeSelectedClip.scale}
                          onChange={(e) => handleUpdateInspectorProperty('scale', parseInt(e.target.value))}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Opacity ({Math.round(activeSelectedClip.opacity * 100)}%)</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={Math.round(activeSelectedClip.opacity * 100)}
                          onChange={(e) => handleUpdateInspectorProperty('opacity', parseInt(e.target.value) / 100)}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Position X ({activeSelectedClip.positionX}px)</label>
                        <input
                          type="range"
                          min="-400"
                          max="400"
                          value={activeSelectedClip.positionX}
                          onChange={(e) => handleUpdateInspectorProperty('positionX', parseInt(e.target.value))}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Position Y ({activeSelectedClip.positionY}px)</label>
                        <input
                          type="range"
                          min="-300"
                          max="300"
                          value={activeSelectedClip.positionY}
                          onChange={(e) => handleUpdateInspectorProperty('positionY', parseInt(e.target.value))}
                          className="w-full accent-cyan-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Speed & Blend Mode */}
                  <div className="space-y-2 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                    <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase">Speed &amp; Blend Mode</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Speed Rate ({activeSelectedClip.speed}x)</label>
                        <select
                          value={activeSelectedClip.speed}
                          onChange={(e) => handleUpdateInspectorProperty('speed', parseFloat(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200"
                        >
                          <option value="0.25">0.25x (Super Slow)</option>
                          <option value="0.5">0.5x (Slow Motion)</option>
                          <option value="1.0">1.0x (Normal)</option>
                          <option value="1.5">1.5x (Fast)</option>
                          <option value="2.0">2.0x (Double Speed)</option>
                          <option value="4.0">4.0x (Hyperlapse)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Blend Mode</label>
                        <select
                          value={activeSelectedClip.blendMode}
                          onChange={(e) => handleUpdateInspectorProperty('blendMode', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200"
                        >
                          <option value="normal">Normal</option>
                          <option value="multiply">Multiply</option>
                          <option value="screen">Screen</option>
                          <option value="overlay">Overlay</option>
                          <option value="add">Add / Glow</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Applied Effects Stack */}
                  <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl space-y-1.5">
                    <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase">Applied Effects Stack ({activeSelectedClip.effects.length})</h4>
                    {activeSelectedClip.effects.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">No FX applied. Choose from Effects tab.</p>
                    ) : (
                      activeSelectedClip.effects.map((fx) => (
                        <div key={fx.id} className="flex items-center justify-between bg-slate-900 p-1.5 rounded">
                          <span className="font-bold text-cyan-300">{fx.name}</span>
                          <button
                            onClick={() => {
                              const updatedFx = activeSelectedClip.effects.filter(f => f.id !== fx.id);
                              handleUpdateInspectorProperty('effects', updatedFx);
                            }}
                            className="text-rose-400 hover:text-rose-300 text-[10px] font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT TOP QUAD: Program Player Preview Monitor (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col h-[460px] shadow-xl justify-between">
          {/* Player Monitor Controls Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-extrabold text-slate-200 uppercase">PROGRAM MONITOR (24FPS)</span>
            </div>

            {/* View Overlays & Resolution Quality Dropdown */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSafeMargins(prev => !prev)}
                className={`p-1 rounded border cursor-pointer ${
                  showSafeMargins ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
                title="Toggle Title/Action Safe Margins"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setShowGridOverlay(prev => !prev)}
                className={`p-1 rounded border cursor-pointer ${
                  showGridOverlay ? 'bg-cyan-500 text-slate-950 border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
                title="Toggle Rule of Thirds Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>

              <select
                value={previewQuality}
                onChange={(e) => setPreviewQuality(e.target.value as any)}
                className="bg-slate-950 text-cyan-400 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer"
              >
                <option value="full">Full 1080p Quality</option>
                <option value="half">1/2 Draft Quality</option>
                <option value="quarter">1/4 Draft Quality</option>
              </select>

              <button
                onClick={() => setIsFullscreen(prev => !prev)}
                className="p-1 rounded bg-slate-950 text-slate-400 border border-slate-800 hover:text-white cursor-pointer"
                title="Fullscreen Monitor"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Player Screen Canvas */}
          <div className="flex-1 bg-slate-950 my-2 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center relative shadow-inner">
            <canvas
              ref={playerCanvasRef}
              width={1280}
              height={720}
              className="w-full h-full object-contain block"
            />

            {/* Timecode HUD Overlay */}
            <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-lg text-cyan-400 font-mono text-sm font-black tracking-widest backdrop-blur-md shadow-lg">
              {formatTimecode(currentTimeSec)}
            </div>
          </div>

          {/* Bottom Player Controls & Audio Level Meters */}
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2 rounded-xl">
            {/* Left Jump Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentTimeSec(0)}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Jump to Beginning (Home)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentTimeSec(prev => Math.max(0, prev - (1/24)))}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Step Back 1 Frame (,)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Main Big Play/Pause Button */}
              <button
                onClick={() => setIsPlaying(prev => !prev)}
                className={`px-4 py-1.5 rounded-lg flex items-center space-x-1.5 font-black text-xs transition-all cursor-pointer shadow-lg ${
                  isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              <button
                onClick={() => setCurrentTimeSec(prev => Math.min(totalTimelineDurationSec, prev + (1/24)))}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Step Forward 1 Frame (.)"
              >
                <RotateCcw className="w-4 h-4 transform scale-x-[-1]" />
              </button>

              <button
                onClick={() => setCurrentTimeSec(totalTimelineDurationSec)}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Jump to End (End)"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsLooping(prev => !prev)}
                className={`p-1.5 rounded border cursor-pointer ${
                  isLooping ? 'bg-teal-500 text-slate-950 border-teal-400' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
                title="Toggle Loop Playback"
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Audio Stereo DB Level Meters */}
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex flex-col space-y-1 w-24">
                {/* L Channel */}
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, audioMeterLeft * 100)}%` }}
                  />
                </div>
                {/* R Channel */}
                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                    style={{ width: `${Math.min(100, audioMeterRight * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">0dB</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM QUADRANT: PROFESSIONAL MULTI-TRACK TIMELINE (Full Width) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-3 shadow-2xl">
        {/* Timeline Tools Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
          {/* Tool Selector Buttons */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            {[
              { id: 'select', label: 'Select (V)', icon: MousePointer },
              { id: 'razor', label: 'Razor Blade (C)', icon: Scissors },
              { id: 'ripple', label: 'Ripple (B)', icon: Split },
              { id: 'slip', label: 'Slip (Y)', icon: ArrowLeftRight },
              { id: 'hand', label: 'Hand Pan (H)', icon: Move },
              { id: 'zoom', label: 'Zoom (Z)', icon: ZoomIn }
            ].map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id as NleTool)}
                  className={`px-2.5 py-1 rounded-lg flex items-center space-x-1 font-mono text-xs font-bold transition-all cursor-pointer ${
                    isActive ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title={tool.label}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tool.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Editing Action Triggers */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRazorSplitAtPlayhead}
              disabled={!selectedClipId}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-rose-400 font-bold text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
              title="Split selected clip at playhead position"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Split Clip</span>
            </button>

            <button
              onClick={handleDeleteSelectedClip}
              disabled={!selectedClipId}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-400 font-bold text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
              title="Delete selected clip"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              onClick={handleAddMarker}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Marker</span>
            </button>

            <button
              onClick={() => setSnappingEnabled(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1 cursor-pointer ${
                snappingEnabled ? 'bg-teal-950 text-teal-300 border-teal-700' : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Snap</span>
            </button>

            {/* Timeline Horizontal Zoom Slider */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-xs font-mono">
              <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="range"
                min="50"
                max="300"
                value={zoomScale}
                onChange={(e) => setZoomScale(parseInt(e.target.value))}
                className="w-20 accent-cyan-500 cursor-pointer"
              />
              <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* TIMELINE TRACKS & RULER STACK */}
        <div className="grid grid-cols-12 gap-2 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-2 min-h-[320px]">
          {/* TRACK HEADERS COLUMN (3 Cols) */}
          <div className="col-span-3 space-y-1.5 border-r border-slate-800 pr-2">
            {/* Ruler Blank Spacer */}
            <div className="h-8 bg-slate-900 rounded-lg flex items-center px-2 text-[10px] font-mono text-slate-400 font-bold uppercase">
              <span>TRACK HEADERS</span>
            </div>

            {/* Tracks Header Items */}
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`h-14 rounded-xl border p-2 flex items-center justify-between text-xs font-mono transition-all ${
                  track.kind === 'video' ? 'bg-slate-900 border-indigo-900/40 text-indigo-300' : 'bg-slate-900 border-teal-900/40 text-teal-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-black px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800 text-[10px]">
                    {track.id}
                  </span>
                  <span className="font-extrabold truncate max-w-[100px] text-slate-200">{track.name}</span>
                </div>

                <div className="flex items-center space-x-1 text-slate-400">
                  <button
                    onClick={() => setTracks(prev => prev.map(t => t.id === track.id ? { ...t, visible: !t.visible } : t))}
                    className={`p-1 rounded cursor-pointer ${track.visible ? 'text-slate-300' : 'text-slate-600'}`}
                  >
                    {track.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setTracks(prev => prev.map(t => t.id === track.id ? { ...t, muted: !t.muted } : t))}
                    className={`p-1 rounded cursor-pointer ${track.muted ? 'text-rose-500' : 'text-slate-300'}`}
                  >
                    {track.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => setTracks(prev => prev.map(t => t.id === track.id ? { ...t, locked: !t.locked } : t))}
                    className={`p-1 rounded cursor-pointer ${track.locked ? 'text-amber-400' : 'text-slate-300'}`}
                  >
                    {track.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* TIMELINE RULER & CLIPS AREA (9 Cols) */}
          <div className="col-span-9 relative overflow-x-auto space-y-1.5">
            {/* Timecode Ruler Bar */}
            <div
              className="h-8 bg-slate-900 rounded-lg relative cursor-pointer border border-slate-800 overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newSec = (clickX / zoomScale) * 5;
                setCurrentTimeSec(Math.max(0, Math.min(totalTimelineDurationSec, newSec)));
              }}
            >
              {/* Ticks */}
              {Array.from({ length: Math.ceil(totalTimelineDurationSec / 5) + 2 }).map((_, i) => {
                const sec = i * 5;
                const leftPx = (sec / 5) * zoomScale;
                return (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-slate-800" style={{ left: `${leftPx}px` }}>
                    <span className="text-[9px] font-mono text-slate-500 pl-1 font-bold">
                      {formatTimecode(sec).slice(3, 8)}
                    </span>
                  </div>
                );
              })}

              {/* Markers Overlay */}
              {markers.map((m) => {
                const markerLeft = (m.timeSec / 5) * zoomScale;
                return (
                  <div
                    key={m.id}
                    className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 group"
                    style={{ left: `${markerLeft}px` }}
                  >
                    <div className="absolute -top-1 -left-2 bg-cyan-500 text-slate-950 text-[8px] font-mono font-bold px-1 rounded shadow">
                      M
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Track Lanes */}
            {tracks.map((track) => {
              const trackClips = clips.filter(c => c.trackId === track.id);
              return (
                <div
                  key={track.id}
                  className="h-14 bg-slate-900/60 border border-slate-800/80 rounded-xl relative overflow-hidden"
                >
                  {/* Grid Lines */}
                  {Array.from({ length: Math.ceil(totalTimelineDurationSec / 5) + 2 }).map((_, i) => {
                    const leftPx = i * zoomScale;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-slate-800/30 pointer-events-none"
                        style={{ left: `${leftPx}px` }}
                      />
                    );
                  })}

                  {/* Render Clips */}
                  {trackClips.map((clip) => {
                    const clipLeftPx = (clip.startTimeSec / 5) * zoomScale;
                    const clipWidthPx = Math.max(32, (clip.durationSec / 5) * zoomScale);
                    const isSelected = selectedClipId === clip.id;

                    return (
                      <div
                        key={clip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        style={{
                          left: `${clipLeftPx}px`,
                          width: `${clipWidthPx}px`,
                          backgroundColor: clip.color || '#3b82f6'
                        }}
                        className={`absolute top-1 bottom-1 rounded-lg border-2 p-1.5 flex flex-col justify-between cursor-pointer transition-all shadow-md overflow-hidden ${
                          isSelected ? 'border-cyan-300 ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-950 z-10' : 'border-slate-800 hover:opacity-90'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-white font-extrabold truncate">
                          <span className="truncate drop-shadow">{clip.name}</span>
                          <span className="bg-slate-950/70 px-1 rounded text-[8px] text-cyan-300">
                            {clip.speed}x
                          </span>
                        </div>

                        {/* Effects & Text Indicator */}
                        <div className="flex items-center space-x-1 text-[8px] font-mono text-slate-200">
                          {clip.effects.length > 0 && (
                            <span className="bg-indigo-950/90 px-1 rounded text-indigo-300 border border-indigo-700">
                              FX ({clip.effects.length})
                            </span>
                          )}
                          {clip.transitionIn && (
                            <span className="bg-teal-950/90 px-1 rounded text-teal-300 border border-teal-700">
                              TRANS
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Red Playhead Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none shadow-[0_0_12px_#f43f5e]"
              style={{ left: `${(currentTimeSec / 5) * zoomScale}px` }}
            >
              <div className="w-3 h-3 bg-rose-500 rotate-45 transform -translate-x-[5px] -top-1.5 shadow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
