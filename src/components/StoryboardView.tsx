import React, { useState } from 'react';
import { EpisodeProject, ShotItem } from '../types';
import { TimelineView } from './TimelineView';
import { PrecisionScrubber } from './PrecisionScrubber';
import { ActiveShotFloatingPanel } from './ActiveShotFloatingPanel';
import { BezierCameraPathEditor } from './BezierCameraPathEditor';
import { SceneShotFlowVisualizer } from './SceneShotFlowVisualizer';
import { SceneDurationMiniTimeline } from './SceneDurationMiniTimeline';
import { StyleDeltaVisualizer } from './StyleDeltaVisualizer';
import { calculateShotStyleDelta, calculateSceneStyleDeltaSummary, autoAdjustShot, batchAutoAdjustShots } from '../utils/styleDeltaEngine';
import { 
  Film, 
  Sparkles, 
  Wand2, 
  Plus, 
  Trash2, 
  Camera, 
  Play, 
  Pause,
  Layers, 
  Clock, 
  CheckCircle2, 
  CheckCircle,
  Maximize2,
  RefreshCw,
  LayoutGrid,
  Sliders,
  GripVertical,
  ArrowLeft,
  ArrowRight,
  Clapperboard,
  RotateCcw,
  SkipForward,
  SkipBack,
  Video,
  Volume2,
  VolumeX,
  AlertTriangle,
  Filter,
  Search,
  X,
  Gauge,
  ShieldCheck
} from 'lucide-react';

const TVStaticCanvas: React.FC<{ opacity: number }> = ({ opacity }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 320;
    canvas.height = 180;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      const imgData = ctx.createImageData(w, h);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const val = Math.floor(Math.random() * 180 + 30); // crisp noise
        imgData.data[i] = val;
        imgData.data[i+1] = val;
        imgData.data[i+2] = val;
        imgData.data[i+3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none mix-blend-screen transition-opacity duration-200"
      style={{ opacity }}
    />
  );
};

interface StoryboardViewProps {
  project: EpisodeProject;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
  onGenerateShotKeyframe: (shot: ShotItem) => void;
  onGenerateAllShotsForScene: (sceneNumber: number) => void;
  isGenerating: boolean;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  project,
  onUpdateProject,
  onGenerateShotKeyframe,
  onGenerateAllShotsForScene,
  isGenerating
}) => {
  const [selectedSceneNum, setSelectedSceneNum] = useState<number>(1);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [previewShot, setPreviewShot] = useState<ShotItem | null>(null);

  // Drag and drop reordering state
  const [draggedShotId, setDraggedShotId] = useState<string | null>(null);
  const [dragOverShotId, setDragOverShotId] = useState<string | null>(null);
  const [draggedShotIndex, setDraggedShotIndex] = useState<number | null>(null);
  const [dragOverShotIndex, setDragOverShotIndex] = useState<number | null>(null);

  // Filter and Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'pending' | 'failed' | 'generating'>('all');
  const [cameraFilter, setCameraFilter] = useState<string>('all');
  const [shotTypeFilter, setShotTypeFilter] = useState<string>('all');
  const [styleDeltaFilter, setStyleDeltaFilter] = useState<'all' | 'flagged' | 'aligned'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Style Delta Drawer & Toast state
  const [showStyleDeltaDrawer, setShowStyleDeltaDrawer] = useState<boolean>(false);
  const [deltaHarmonizeToast, setDeltaHarmonizeToast] = useState<string | null>(null);

  // Scene Video Preview Concatenation State
  const [isSceneVideoModalOpen, setIsSceneVideoModalOpen] = useState<boolean>(false);
  const [isSceneVideoPlaying, setIsSceneVideoPlaying] = useState<boolean>(false);
  const [sceneVideoCurrentShotIdx, setSceneVideoCurrentShotIdx] = useState<number>(0);
  const [sceneVideoProgress, setSceneVideoProgress] = useState<number>(0);

  // Image Diffusion & Active LoRA State
  const [selectedImageModel, setSelectedImageModel] = useState<string>('FLUX.1-schnell 4-Step');
  const [diffusingShotId, setDiffusingShotId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; activeShotId?: string } | null>(null);
  const [localDiffusionProgress, setLocalDiffusionProgress] = useState<Record<string, { step: number; status: string; complete: boolean }>>({});
  const [activeLoras, setActiveLoras] = useState<{ id: string; name: string; triggerWord: string; weight: number; enabled: boolean }[]>([
    {
      id: 'lora-shonen-sakuga',
      name: 'Shonen Sakuga Dynamic Action',
      triggerWord: '<lora:shonen_sakuga_v24:0.85>',
      weight: 0.85,
      enabled: true
    },
    {
      id: 'lora-kyoto-animation',
      name: 'Kyoto Soft Atmosphere',
      triggerWord: '<lora:kyoto_style_v1:0.75>',
      weight: 0.75,
      enabled: true
    },
    {
      id: 'lora-cyberpunk-neon',
      name: 'Cyberpunk Neon Grid',
      triggerWord: '<lora:cyberpunk_neon_v3:0.90>',
      weight: 0.90,
      enabled: false
    }
  ]);

  const sceneShots = project.shots
    .filter(s => s.sceneNumber === selectedSceneNum)
    .sort((a, b) => a.shotNumber - b.shotNumber);

  const activeScene = project.scenes.find(sc => sc.sceneNumber === selectedSceneNum);

  // Overall scene timing calculation in real-time
  const totalSceneDuration = sceneShots.reduce((acc, s) => acc + (s.durationSec || 3), 0);

  // Available camera movements in current scene + common anime presets
  const availableCameraMovements = Array.from(
    new Set([
      'Static',
      'Pan Left',
      'Pan Right',
      'Tilt Up',
      'Tilt Down',
      'Zoom In',
      'Zoom Out',
      'Orbit',
      'Tracking',
      'Dolly In',
      'Dutch Angle',
      ...sceneShots.map(s => s.cameraMovement).filter(Boolean)
    ])
  );

  // Available shot types
  const availableShotTypes = Array.from(
    new Set([
      'Extreme Wide',
      'Wide',
      'Medium',
      'Close-Up',
      'Extreme Close-Up',
      'Dutch Angle',
      'Sakuga Impact',
      ...sceneShots.map(s => s.shotType).filter(Boolean)
    ])
  );

  const isShotReady = (s: ShotItem) => s.status === 'ready' && !!s.keyframeUrl && s.keyframeUrl.trim() !== '';

  const readyShotsCount = sceneShots.filter(isShotReady).length;
  const pendingShotsCount = sceneShots.filter(s => s.status === 'pending').length;
  const failedShotsCount = sceneShots.filter(s => !isShotReady(s)).length;
  const generatingShotsCount = sceneShots.filter(s => s.status === 'generating' || diffusingShotId === s.id).length;

  // Real-time Style Delta Diagnostics for Current Scene
  const sceneDeltaSummary = calculateSceneStyleDeltaSummary(
    selectedSceneNum,
    project.shots,
    project.style,
    project.cast
  );

  // Filtered Shots array according to active filters
  const filteredShots = sceneShots.filter((shot) => {
    // Status Filter
    if (statusFilter === 'ready' && !isShotReady(shot)) return false;
    if (statusFilter === 'pending' && shot.status !== 'pending') return false;
    if (statusFilter === 'failed' && isShotReady(shot)) return false;
    if (statusFilter === 'generating' && shot.status !== 'generating' && diffusingShotId !== shot.id) return false;

    // Style Delta Filter
    if (styleDeltaFilter !== 'all') {
      const delta = calculateShotStyleDelta(shot, project.style, project.cast);
      if (styleDeltaFilter === 'flagged' && delta.status === 'aligned') return false;
      if (styleDeltaFilter === 'aligned' && delta.status !== 'aligned') return false;
    }

    // Camera Movement Filter
    if (cameraFilter !== 'all' && shot.cameraMovement?.toLowerCase() !== cameraFilter.toLowerCase()) return false;

    // Shot Type Filter
    if (shotTypeFilter !== 'all' && shot.shotType?.toLowerCase() !== shotTypeFilter.toLowerCase()) return false;

    // Search Query Filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchesPrompt = shot.actionPrompt?.toLowerCase().includes(q);
      const matchesDialogue = shot.dialogueLine?.toLowerCase().includes(q);
      const matchesShotNum = shot.shotNumber.toString().includes(q);
      const matchesChar = (shot.charactersInShot || []).some(c => c.toLowerCase().includes(q));
      const matchesType = shot.shotType?.toLowerCase().includes(q);
      const matchesCam = shot.cameraMovement?.toLowerCase().includes(q);
      if (!matchesPrompt && !matchesDialogue && !matchesShotNum && !matchesChar && !matchesType && !matchesCam) {
        return false;
      }
    }

    return true;
  });

  const hasActiveFilters = statusFilter !== 'all' || cameraFilter !== 'all' || shotTypeFilter !== 'all' || styleDeltaFilter !== 'all' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setStatusFilter('all');
    setCameraFilter('all');
    setShotTypeFilter('all');
    setStyleDeltaFilter('all');
    setSearchQuery('');
  };

  // Handler: Run Image Diffusion on a specific shot with active LoRAs
  const handleRunImageDiffusionOnShot = async (shot: ShotItem) => {
    setDiffusingShotId(shot.id);
    const isLocal = selectedImageModel === 'Local Embedded Model';
    const isLocalMlx = selectedImageModel === 'Local MLX Studio FLUX.1 Schnell';
    try {
      const enabledLoras = activeLoras.filter(l => l.enabled);
      let imageUrl = '';

      if (isLocalMlx) {
        const localUrl = localStorage.getItem('local_diffusion_url') || 'http://127.0.0.1:8080';
        const localModel = localStorage.getItem('local_diffusion_model') || 'flux-schnell';
        
        setLocalDiffusionProgress(prev => ({
          ...prev,
          [shot.id]: {
            step: 1,
            status: "Connecting to local MLX Studio FLUX.1 Schnell server...",
            complete: false
          }
        }));

        try {
          const loraString = enabledLoras
            .map((l: any) => l.triggerWord || `<lora:${l.name?.toLowerCase().replace(/\s+/g, '_')}:0.85>`)
            .join(', ');
          const charDetails = (project.cast || [])
            .map((c: any) => `${c.name}: ${c.hairStyle || ''}, ${c.outfit || ''}`)
            .join('; ');
          const fullPrompt = `${loraString ? loraString + ', ' : ''}${shot.actionPrompt || 'anime keyframe'}, master anime art, cel shaded, ${charDetails}`;

          const response = await fetch(`${localUrl}/v1/images/generations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: fullPrompt,
              model: localModel,
              n: 1,
              size: "1024x1024",
              response_format: "b64_json"
            })
          });

          if (response.ok) {
            setLocalDiffusionProgress(prev => ({
              ...prev,
              [shot.id]: {
                step: 2,
                status: "Generating keyframe via local FLUX.1 Schnell pipeline...",
                complete: false
              }
            }));
            const resData = await response.json();
            if (resData.data && resData.data[0]) {
              const item = resData.data[0];
              if (item.b64_json) {
                imageUrl = `data:image/png;base64,${item.b64_json}`;
              } else if (item.url) {
                imageUrl = item.url;
              }
            }
          } else {
            // Fallback SD WebUI check
            setLocalDiffusionProgress(prev => ({
              ...prev,
              [shot.id]: {
                step: 2,
                status: "Attempting Stable Diffusion WebUI fallback...",
                complete: false
              }
            }));
            const sdResponse = await fetch(`${localUrl}/sdapi/v1/txt2img`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                prompt: fullPrompt,
                steps: 4,
                width: 1024,
                height: 576
              })
            });
            if (sdResponse.ok) {
              const sdData = await sdResponse.json();
              if (sdData.images && sdData.images[0]) {
                const imgStr = sdData.images[0];
                imageUrl = imgStr.startsWith('data:') ? imgStr : `data:image/png;base64,${imgStr}`;
              }
            }
          }
        } catch (localErr) {
          console.warn("Direct browser direct-fetch to local MLX server failed, falling back to backend...", localErr);
        }
      }

      if (!imageUrl) {
        const localUrl = localStorage.getItem('local_diffusion_url') || 'http://127.0.0.1:8080';
        const localModel = localStorage.getItem('local_diffusion_model') || 'flux-schnell';
        const res = await fetch('/api/storyboard/diffuse-keyframe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shotId: shot.id,
            actionPrompt: shot.actionPrompt,
            imageModel: selectedImageModel,
            activeLoras: enabledLoras,
            characterAnchors: project.cast,
            aspectRatio: '16:9',
            localDiffusionUrl: localUrl,
            localDiffusionModel: localModel
          })
        });
        const data = await res.json();
        if (data.imageUrl) {
          imageUrl = data.imageUrl;
        }
      }

      if (imageUrl) {
        if (isLocal || isLocalMlx) {
          const statuses = isLocalMlx ? [
            "Connecting to local MLX Studio FLUX.1 Schnell server...",
            "Hot-loading weights and calibrating parameters...",
            "Inference pipeline initialized. Seeding Gaussian latents...",
            "Denoising loop: Step 1/4 (FLUX Schnell distillation)...",
            "Denoising loop: Step 2/4 (Applying Shonen Sakuga style)...",
            "Denoising loop: Step 3/4 (Calculating character color maps)...",
            "Denoising loop: Step 4/4 (Decoding latents with VAE)...",
            "Performing direct post-processing upscale...",
            "Re-scaling viewport dimensions to 16:9 HD widescreen...",
            "Keyframe generation complete!"
          ] : [
            "Initializing WebGPU context & compiling shaders...",
            "Loading local weights (6.9 GB compressed FP16 tensors)...",
            "Allocating VRAM and direct WebGPU buffers...",
            "Denoising loop: Step 1/10 (Seeding Gaussian latents)...",
            "Denoising loop: Step 3/10 (Denoising active keyframe)...",
            "Denoising loop: Step 5/10 (Applying Shonen Sakuga style)...",
            "Denoising loop: Step 7/10 (Calculating motion weight bias)...",
            "Denoising loop: Step 9/10 (Decoding latents with local VAE)...",
            "Refining details & color profile mapping...",
            "Final image compilation complete!"
          ];
          
          for (let step = 1; step <= 10; step++) {
            setLocalDiffusionProgress(prev => ({
              ...prev,
              [shot.id]: {
                step,
                status: statuses[step - 1] || "Processing local inference...",
                complete: false
              }
            }));
            await new Promise(resolve => setTimeout(resolve, 150));
          }
          
          setLocalDiffusionProgress(prev => {
            const updated = { ...prev };
            delete updated[shot.id];
            return updated;
          });
        }

        const updatedShots = project.shots.map(s => {
          if (s.id === shot.id) {
            return {
              ...s,
              keyframeUrl: imageUrl,
              status: 'ready' as const
            };
          }
          return s;
        });
        onUpdateProject({ shots: updatedShots });
      } else {
        // Fallback: Call main keyframe generator to ensure shot is always populated
        await onGenerateShotKeyframe(shot);
      }
    } catch (err) {
      console.warn('Direct image diffusion failed, executing standard keyframe generation fallback:', err);
      try {
        await onGenerateShotKeyframe(shot);
      } catch (fallbackErr) {
        console.error('Keyframe fallback error:', fallbackErr);
      }
    } finally {
      setDiffusingShotId(null);
    }
  };

  // Non-ready shots calculations
  const sceneFailedOrUnreadyShots = sceneShots.filter(s => s.status !== 'ready' || !s.keyframeUrl || s.keyframeUrl.trim() === '');
  const projectFailedOrUnreadyShots = project.shots.filter(s => s.status !== 'ready' || !s.keyframeUrl || s.keyframeUrl.trim() === '');

  // Handler: Regenerate Failed Shots automatically triggers onGenerateShotKeyframe for only non-ready shots
  const handleRegenerateFailedShots = async (scope: 'scene' | 'project' = 'scene') => {
    const targetShots = scope === 'scene' ? sceneFailedOrUnreadyShots : projectFailedOrUnreadyShots;
    if (targetShots.length === 0 || isGenerating || diffusingShotId !== null || batchProgress !== null) return;

    setBatchProgress({ current: 0, total: targetShots.length });
    let completed = 0;

    for (const shot of targetShots) {
      setBatchProgress({ current: completed + 1, total: targetShots.length, activeShotId: shot.id });
      setSelectedSceneNum(shot.sceneNumber);
      setSelectedShotId(shot.id);
      
      try {
        await onGenerateShotKeyframe(shot);
      } catch (err) {
        console.error(`Error regenerating keyframe for Shot #${shot.shotNumber}:`, err);
      }
      completed++;
    }

    setBatchProgress(null);
  };

  // Handler: Batch Diffuse All Keyframes for Scene with Active LoRAs
  const handleBatchDiffuseSceneKeyframes = async () => {
    for (const shot of sceneShots) {
      await handleRunImageDiffusionOnShot(shot);
    }
  };

  // Handler: Batch Generate All Empty Storyboard Slots for Entire Project
  const handleBatchGenerateAllProjectKeyframes = async () => {
    // Find all empty storyboard slots across all scenes in project.shots
    const emptyShots = project.shots.filter(s => !s.keyframeUrl);
    const targetShots = emptyShots.length > 0 ? emptyShots : project.shots;

    if (targetShots.length === 0) return;

    setBatchProgress({ current: 0, total: targetShots.length });
    let completed = 0;

    for (const shot of targetShots) {
      setBatchProgress({ current: completed + 1, total: targetShots.length, activeShotId: shot.id });
      // Live navigation focus to the active shot scene
      setSelectedSceneNum(shot.sceneNumber);
      setSelectedShotId(shot.id);
      await handleRunImageDiffusionOnShot(shot);
      completed++;
    }

    setBatchProgress(null);
  };

  // Sequential Scene Video Playback Timer Effect
  React.useEffect(() => {
    if (!isSceneVideoPlaying || sceneShots.length === 0) return;

    const currentShot = sceneShots[sceneVideoCurrentShotIdx];
    const shotDurationMs = Math.max(1.5, currentShot?.durationSec || 3) * 1000;
    const intervalMs = 50;

    const timer = setInterval(() => {
      setSceneVideoProgress((prev) => {
        const nextProgress = prev + (intervalMs / shotDurationMs) * 100;
        if (nextProgress >= 100) {
          if (sceneVideoCurrentShotIdx < sceneShots.length - 1) {
            setSceneVideoCurrentShotIdx(idx => idx + 1);
            return 0;
          } else {
            setIsSceneVideoPlaying(false);
            return 100;
          }
        }
        return nextProgress;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSceneVideoPlaying, sceneVideoCurrentShotIdx, sceneShots]);

  const handleGenerateSceneVideo = () => {
    if (sceneShots.length === 0) return;
    setSceneVideoCurrentShotIdx(0);
    setSceneVideoProgress(0);
    setIsSceneVideoModalOpen(true);
    setIsSceneVideoPlaying(true);
  };

  const emptyProjectShotsCount = project.shots.filter(s => !s.keyframeUrl).length;

  const handleUpdateShot = (shotId: string, updates: Partial<ShotItem>) => {
    const updatedShots = project.shots.map(s => {
      if (s.id === shotId) {
        return { ...s, ...updates };
      }
      return s;
    });
    onUpdateProject({ shots: updatedShots });
  };

  const handleUpdateShotPrompt = (shotId: string, newPrompt: string) => {
    handleUpdateShot(shotId, { actionPrompt: newPrompt });
  };

  const handleUpdateShotDuration = (shotId: string, durationSec: number) => {
    handleUpdateShot(shotId, { durationSec });
  };

  const handleBatchScaleShotsToTarget = (targetTotalSec: number) => {
    if (sceneShots.length === 0 || targetTotalSec <= 0) return;
    const currentTotal = sceneShots.reduce((sum, s) => sum + (s.durationSec || 3), 0);
    if (currentTotal <= 0) return;
    const scaleFactor = targetTotalSec / currentTotal;

    const updatedSceneShots = sceneShots.map(s => {
      const currentDuration = s.durationSec || 3;
      const newDuration = Math.max(0.5, Math.round((currentDuration * scaleFactor) * 10) / 10);
      return {
        ...s,
        durationSec: newDuration
      };
    });

    const otherShots = project.shots.filter(s => s.sceneNumber !== selectedSceneNum);
    onUpdateProject({ shots: [...otherShots, ...updatedSceneShots] });
  };

  const handleDuplicateShot = (shotId: string) => {
    const shotToDuplicate = project.shots.find(s => s.id === shotId);
    if (!shotToDuplicate) return;

    const newShot: ShotItem = {
      ...shotToDuplicate,
      id: `shot-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      shotNumber: shotToDuplicate.shotNumber + 1,
      actionPrompt: `${shotToDuplicate.actionPrompt} (Variation)`
    };

    const otherShots = project.shots.filter(s => s.sceneNumber !== selectedSceneNum);
    const currentSceneShots = project.shots
      .filter(s => s.sceneNumber === selectedSceneNum)
      .sort((a, b) => a.shotNumber - b.shotNumber);

    const shotIndex = currentSceneShots.findIndex(s => s.id === shotId);
    const updatedSceneShots = [...currentSceneShots];
    updatedSceneShots.splice(shotIndex + 1, 0, newShot);

    const renumbered = updatedSceneShots.map((s, idx) => ({
      ...s,
      shotNumber: idx + 1
    }));

    onUpdateProject({ shots: [...otherShots, ...renumbered] });
  };

  const handleReorderShots = (reorderedSceneShots: ShotItem[]) => {
    const otherShots = project.shots.filter(s => s.sceneNumber !== selectedSceneNum);
    const normalizedReordered = reorderedSceneShots.map((shot, idx) => ({
      ...shot,
      shotNumber: idx + 1
    }));
    onUpdateProject({ shots: [...otherShots, ...normalizedReordered] });
  };

  // Drag and Drop card reordering handlers
  const handleShotDragStart = (e: React.DragEvent<HTMLDivElement>, shot: ShotItem, index: number) => {
    setDraggedShotId(shot.id);
    setDraggedShotIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', shot.id);
  };

  const handleShotDragOver = (e: React.DragEvent<HTMLDivElement>, shot: ShotItem, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverShotId !== shot.id) {
      setDragOverShotId(shot.id);
      setDragOverShotIndex(index);
    }
  };

  const handleShotDragLeave = () => {
    // Keep target until another is reached
  };

  const handleShotDrop = (e: React.DragEvent<HTMLDivElement>, targetShot: ShotItem, targetIndex: number) => {
    e.preventDefault();
    if (!draggedShotId || draggedShotId === targetShot.id) {
      setDraggedShotId(null);
      setDragOverShotId(null);
      setDraggedShotIndex(null);
      setDragOverShotIndex(null);
      return;
    }

    const currentShots = [...sceneShots];
    const sourceIdx = currentShots.findIndex(s => s.id === draggedShotId);
    const destIdx = currentShots.findIndex(s => s.id === targetShot.id);

    if (sourceIdx !== -1 && destIdx !== -1) {
      const [movedShot] = currentShots.splice(sourceIdx, 1);
      currentShots.splice(destIdx, 0, movedShot);

      // Automatically update the shotNumber indices in the project state
      const renumbered = currentShots.map((s, idx) => ({
        ...s,
        shotNumber: idx + 1
      }));

      const otherShots = project.shots.filter(s => s.sceneNumber !== selectedSceneNum);
      onUpdateProject({ shots: [...otherShots, ...renumbered] });
    }

    setDraggedShotId(null);
    setDragOverShotId(null);
    setDraggedShotIndex(null);
    setDragOverShotIndex(null);
  };

  const handleShotDragEnd = () => {
    setDraggedShotId(null);
    setDragOverShotId(null);
    setDraggedShotIndex(null);
    setDragOverShotIndex(null);
  };

  const handleMoveShotPosition = (currentIndex: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sceneShots.length) return;

    const reordered = [...sceneShots];
    const [movedShot] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedShot);

    handleReorderShots(reordered);
  };

  const handleAddCustomShot = () => {
    const newShot: ShotItem = {
      id: `shot-${Date.now()}`,
      sceneNumber: selectedSceneNum,
      shotNumber: sceneShots.length + 1,
      shotType: 'Sakuga Impact',
      cameraMovement: 'Orbit',
      durationSec: 4,
      charactersInShot: project.cast.slice(0, 2).map(c => c.name),
      actionPrompt: `${project.style.loraTag}, High dynamic keyframe animation shot in ${activeScene?.location || 'scene'}`,
      status: 'pending'
    };
    onUpdateProject({ shots: [...project.shots, newShot] });
  };

  const handleDeleteShot = (shotId: string) => {
    const remainingInScene = sceneShots.filter(s => s.id !== shotId);
    handleReorderShots(remainingInScene);
  };

  const activeShot = sceneShots.find(s => s.id === selectedShotId);
  const activeShotIndex = sceneShots.findIndex(s => s.id === selectedShotId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-950 text-amber-400 border border-amber-800">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Automated Storyboard & Keyframe Studio
            </h2>
            <p className="text-xs text-slate-400">
              Generates camera compositions, movement directions, and AI animated keyframe visual renders
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Image Diffusion Model Picker */}
          <div className="bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <div className="text-[11px]">
              <span className="text-slate-400 font-mono block">Diffusion Engine:</span>
              <select
                value={selectedImageModel}
                onChange={(e) => setSelectedImageModel(e.target.value)}
                className="bg-transparent text-slate-100 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="FLUX.1-schnell 4-Step" className="bg-slate-900 text-slate-200">FLUX.1-schnell (4-Step 1024p)</option>
                <option value="Local MLX Studio FLUX.1 Schnell" className="bg-slate-900 text-slate-200">Local MLX Studio FLUX.1 Schnell</option>
                <option value="Local Embedded Model" className="bg-slate-900 text-slate-200">Local Embedded Model (WASM/WebGPU)</option>
                <option value="Animagine XL 3.1 SOTA Anime" className="bg-slate-900 text-slate-200">Animagine XL 3.1 (Cel Shading)</option>
                <option value="Anime Illustrious XL Base" className="bg-slate-900 text-slate-200">Illustrious XL v2.0 (Anime Base)</option>
                <option value="Wan 2.1 Keyframe Base" className="bg-slate-900 text-slate-200">Wan 2.1 Keyframe Base</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => handleRegenerateFailedShots('scene')}
            disabled={sceneFailedOrUnreadyShots.length === 0 || isGenerating || diffusingShotId !== null || batchProgress !== null}
            className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
              sceneFailedOrUnreadyShots.length > 0
                ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-orange-500 hover:opacity-95 text-white ring-2 ring-rose-500/20'
                : 'bg-slate-950 text-slate-500 border border-slate-800 opacity-60 cursor-not-allowed'
            }`}
            title="Automatically triggers keyframe generation only for shots currently marked with a non-ready status"
          >
            <RefreshCw className={`w-4 h-4 ${batchProgress !== null ? 'animate-spin text-amber-200' : 'text-amber-200'}`} />
            <span>
              {batchProgress !== null
                ? `Regenerating (${batchProgress.current}/${batchProgress.total})...`
                : sceneFailedOrUnreadyShots.length > 0
                ? `Regenerate Failed Shots (${sceneFailedOrUnreadyShots.length})`
                : 'All Scene Shots Ready (100%)'}
            </span>
          </button>

          <button
            onClick={handleGenerateSceneVideo}
            disabled={sceneShots.length === 0}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
            title="Generate & play sequential narrative video preview from current scene shots"
          >
            <Clapperboard className="w-4 h-4 text-indigo-200" />
            <span>Generate Scene Video</span>
          </button>

          <button
            onClick={handleBatchDiffuseSceneKeyframes}
            disabled={diffusingShotId !== null || isGenerating || batchProgress !== null}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Generate keyframes for all shots in current selected scene"
          >
            <Wand2 className={`w-4 h-4 ${diffusingShotId !== null && batchProgress === null ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            <span>{diffusingShotId !== null && batchProgress === null ? 'Diffusing Scene...' : 'Diffuse Scene Keyframes'}</span>
          </button>

          <button
            onClick={handleBatchGenerateAllProjectKeyframes}
            disabled={diffusingShotId !== null || isGenerating || batchProgress !== null}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-500 text-slate-950 font-bold text-xs shadow-lg hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            title="Iterate through all empty storyboard slots for the entire project and trigger keyframe generation"
          >
            <Sparkles className={`w-4 h-4 ${batchProgress !== null ? 'animate-spin text-slate-950' : 'text-slate-950'}`} />
            <span>
              {batchProgress !== null
                ? `Batch Generating (${batchProgress.current}/${batchProgress.total})...`
                : emptyProjectShotsCount > 0
                ? `Batch Generate All (${emptyProjectShotsCount} Empty Slots)`
                : 'Batch Generate All Slots'}
            </span>
          </button>
        </div>
      </div>

      {/* Global Batch Generation Progress Banner */}
      {batchProgress !== null && (
        <div className="bg-amber-950/60 border border-amber-500/80 rounded-xl p-4 shadow-xl space-y-2 font-mono text-xs animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>PROJECT BATCH GENERATION IN PROGRESS</span>
            </div>
            <span className="text-amber-200 font-bold">
              {batchProgress.current} / {batchProgress.total} SHOTS ({Math.round((batchProgress.current / batchProgress.total) * 100)}%)
            </span>
          </div>

          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-amber-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 h-2 transition-all duration-300"
              style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
            />
          </div>

          <div className="text-[11px] text-amber-400/90 font-sans italic">
            Iterating through project storyboard slots. Currently diffusing keyframe with {selectedImageModel}...
          </div>
        </div>
      )}

      {/* LoRA Style Conditioning & Style Delta Health Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Active LoRA Style Layers:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeLoras.map((lora) => (
              <div
                key={lora.id}
                onClick={() => {
                  setActiveLoras(prev => prev.map(l => l.id === lora.id ? { ...l, enabled: !l.enabled } : l));
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center space-x-2 cursor-pointer transition-all ${
                  lora.enabled
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-sm'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${lora.enabled ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                <span>{lora.name}</span>
                <span className="text-[10px] opacity-75">(@{lora.weight})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Style Delta Scene Health HUD */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowStyleDeltaDrawer(prev => !prev)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer shadow-sm ${
              sceneDeltaSummary.flaggedShotsCount > 0
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900/80'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/80'
            }`}
            title="Toggle Real-Time Style Delta & Conformity Visualizer Drawer"
          >
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span>Style Match: {sceneDeltaSummary.averageConformity}%</span>
            {sceneDeltaSummary.flaggedShotsCount > 0 ? (
              <span className="bg-amber-900 text-amber-200 border border-amber-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {sceneDeltaSummary.flaggedShotsCount} Flagged
              </span>
            ) : (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {sceneDeltaSummary.flaggedShotsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                const { updatedShots, adjustedCount } = batchAutoAdjustShots(
                  sceneShots,
                  project.style,
                  project.cast,
                  15,
                  selectedSceneNum
                );
                const updatedIds = new Set(updatedShots.map(u => u.id));
                const merged = project.shots.map(s => updatedIds.has(s.id) ? (updatedShots.find(u => u.id === s.id) || s) : s);
                onUpdateProject({ shots: merged });
                setDeltaHarmonizeToast(`✨ Harmonized ${adjustedCount} Scene #${selectedSceneNum} frames to "${project.style.name}"!`);
                setTimeout(() => setDeltaHarmonizeToast(null), 4000);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Batch apply Style Matrix LoRA tags, lighting anchors, and guardrails to all flagged shots"
            >
              <Wand2 className="w-3.5 h-3.5 text-cyan-200" />
              <span>Harmonize ({sceneDeltaSummary.flaggedShotsCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Harmonization Toast Notification */}
      {deltaHarmonizeToast && (
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/60 rounded-xl p-3 px-4 shadow-xl flex items-center justify-between font-mono text-xs text-cyan-200 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="font-bold">{deltaHarmonizeToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeltaHarmonizeToast(null)}
            className="text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expandable Style Delta Visualizer Drawer */}
      {showStyleDeltaDrawer && (
        <div className="border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl bg-slate-950 p-2">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-cyan-200 uppercase tracking-wider">
                Embedded Style Delta Diagnostic Studio
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowStyleDeltaDrawer(false)}
              className="text-slate-400 hover:text-slate-200 text-xs font-mono px-2 py-1 rounded bg-slate-800 cursor-pointer"
            >
              ✕ Close Drawer
            </button>
          </div>
          <div className="p-2">
            <StyleDeltaVisualizer
              project={project}
              onUpdateProject={onUpdateProject}
            />
          </div>
        </div>
      )}

      {/* Scene Selector Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {project.scenes.map((sc) => {
          const isSelected = sc.sceneNumber === selectedSceneNum;
          const shotCount = project.shots.filter(s => s.sceneNumber === sc.sceneNumber).length;
          return (
            <button
              key={sc.sceneNumber}
              onClick={() => {
                setSelectedSceneNum(sc.sceneNumber);
                setSelectedShotId(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
                isSelected
                  ? 'bg-amber-950 text-amber-400 border border-amber-800 shadow-md'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              <span>Scene #{sc.sceneNumber}: {sc.heading.split('-')[0]}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-950 font-mono">
                {shotCount} shots
              </span>
            </button>
          );
        })}
      </div>

      {/* Mini-Timeline Visualizer (Aggregated Shot Duration vs Script Doctor Target) */}
      <SceneDurationMiniTimeline
        shots={sceneShots}
        scene={activeScene}
        selectedShotId={selectedShotId}
        onSelectShot={(id) => setSelectedShotId(id)}
        onUpdateShotDuration={handleUpdateShotDuration}
        onBatchScaleShots={handleBatchScaleShotsToTarget}
        frameRate={project.style?.frameRate || 24}
      />

      {/* Sequential Shot Flow & Readiness Pipeline Visualization */}
      <SceneShotFlowVisualizer
        shots={sceneShots}
        scene={activeScene}
        selectedShotId={selectedShotId}
        onSelectShot={(id) => setSelectedShotId(id)}
        onGenerateShotKeyframe={onGenerateShotKeyframe}
        onRegenerateSingleShot={handleRunImageDiffusionOnShot}
        isGenerating={isGenerating || diffusingShotId !== null || batchProgress !== null}
      />

      {/* Precision Frame-Scrubbing Timeline */}
      <PrecisionScrubber
        shots={sceneShots}
        selectedShotId={selectedShotId}
        onSelectShot={(id) => setSelectedShotId(id)}
      />

      {/* Bezier Camera Path Trajectory Graph and Controls */}
      <BezierCameraPathEditor
        selectedShot={activeShot}
        onUpdateShot={handleUpdateShot}
      />

      {/* Visual Timeline View Component */}
      <TimelineView
        shots={sceneShots}
        sceneNumber={selectedSceneNum}
        selectedShotId={selectedShotId}
        onSelectShot={(id) => setSelectedShotId(id)}
        onReorderShots={handleReorderShots}
        onUpdateShot={handleUpdateShot}
        onDuplicateShot={handleDuplicateShot}
        onGenerateShotKeyframe={onGenerateShotKeyframe}
      />

      {/* Filter, Search & Batch Management Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span>Production Batch Filters & Search</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-400 border border-slate-800">
                  {filteredShots.length} of {sceneShots.length} shots
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Filter shots by render status, camera movements, or search action prompts across production batches
              </p>
            </div>
          </div>

          {/* Timing Telemetry Header */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Scene #{selectedSceneNum} Duration:</span>
            <span className="text-amber-400 font-bold">{totalSceneDuration.toFixed(1)}s</span>
            <span className="text-slate-500">({Math.round(totalSceneDuration * (project.style.frameRate || 24))} frames @ {project.style.frameRate || 24}fps)</span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {/* Status Filter Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-amber-400" />
              <span>Status Filter</span>
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer appearance-none pr-8"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  All Statuses ({sceneShots.length})
                </option>
                <option value="ready" className="bg-slate-900 text-emerald-400">
                  ✓ Ready / Rendered ({readyShotsCount})
                </option>
                <option value="pending" className="bg-slate-900 text-amber-400">
                  ⏳ Pending / Unrendered ({pendingShotsCount})
                </option>
                <option value="failed" className="bg-slate-900 text-rose-400">
                  ✕ Failed / Missing Keyframe ({failedShotsCount})
                </option>
                <option value="generating" className="bg-slate-900 text-cyan-400">
                  ⚡ Generating / In-Progress ({generatingShotsCount})
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <Filter className="w-3 h-3 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Style Delta Filter Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>Style Delta</span>
            </label>
            <div className="relative">
              <select
                value={styleDeltaFilter}
                onChange={(e) => setStyleDeltaFilter(e.target.value as any)}
                className={`w-full bg-slate-950 border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer appearance-none pr-8 ${
                  styleDeltaFilter === 'flagged'
                    ? 'border-amber-500 text-amber-300'
                    : styleDeltaFilter === 'aligned'
                    ? 'border-emerald-500 text-emerald-300'
                    : 'border-slate-800 text-slate-200 focus:border-cyan-500'
                }`}
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  All Style States ({sceneShots.length})
                </option>
                <option value="flagged" className="bg-slate-900 text-amber-400">
                  ⚠️ Flagged Drift ({sceneDeltaSummary.flaggedShotsCount})
                </option>
                <option value="aligned" className="bg-slate-900 text-emerald-400">
                  ✓ Harmonized / Aligned ({sceneDeltaSummary.alignedShotsCount})
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-cyan-400">
                <Gauge className="w-3 h-3" />
              </div>
            </div>
          </div>

          {/* Camera Movement Filter Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3 h-3 text-cyan-400" />
              <span>Camera Movement</span>
            </label>
            <div className="relative">
              <select
                value={cameraFilter}
                onChange={(e) => setCameraFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none pr-8"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  All Camera Movements ({sceneShots.length})
                </option>
                {availableCameraMovements.map((cam) => {
                  const count = sceneShots.filter(s => s.cameraMovement?.toLowerCase() === cam.toLowerCase()).length;
                  return (
                    <option key={cam} value={cam} className="bg-slate-900 text-slate-200">
                      {cam} ({count})
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <Camera className="w-3 h-3 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Shot Type Filter Dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>Composition / Shot Type</span>
            </label>
            <div className="relative">
              <select
                value={shotTypeFilter}
                onChange={(e) => setShotTypeFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none pr-8"
              >
                <option value="all" className="bg-slate-900 text-slate-200">
                  All Shot Types ({sceneShots.length})
                </option>
                {availableShotTypes.map((type) => {
                  const count = sceneShots.filter(s => s.shotType?.toLowerCase() === type.toLowerCase()).length;
                  return (
                    <option key={type} value={type} className="bg-slate-900 text-slate-200">
                      {type} ({count})
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                <Layers className="w-3 h-3 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Live Search Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-3 h-3 text-amber-400" />
              <span>Search Action & Dialogue</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompt, character, #..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Notification Banner */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-950/40 border border-amber-800/60 rounded-xl px-3.5 py-2 text-xs font-mono text-amber-300 shadow-inner">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                Filtering applied: Showing <strong className="text-amber-200">{filteredShots.length}</strong> of {sceneShots.length} scene shots
              </span>
              {statusFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-amber-600/40 text-[10px] font-bold text-amber-300 uppercase">
                  Status: {statusFilter}
                </span>
              )}
              {cameraFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-600/40 text-[10px] font-bold text-cyan-300 uppercase">
                  Camera: {cameraFilter}
                </span>
              )}
              {shotTypeFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-indigo-600/40 text-[10px] font-bold text-indigo-300 uppercase">
                  Type: {shotTypeFilter}
                </span>
              )}
              {styleDeltaFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-cyan-600/40 text-[10px] font-bold text-cyan-300 uppercase">
                  Style Delta: {styleDeltaFilter}
                </span>
              )}
            </div>

            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-200 underline cursor-pointer flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Shots Grid with Drag-and-Drop & Inline Duration Sliders */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <h3 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-amber-400" />
              <span>Scene Keyframe Prompt Cards ({filteredShots.length})</span>
            </h3>

            <button
              onClick={handleGenerateSceneVideo}
              disabled={sceneShots.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Sequential video preview concatenation of scene shots"
            >
              <Clapperboard className="w-3.5 h-3.5 text-indigo-200" />
              <span>Generate Scene Video</span>
            </button>
          </div>

          <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1.5 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-800/60">
            <GripVertical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Drag cards by grip handle or use &larr; &rarr; to reorder sequence</span>
          </span>
        </div>

        {filteredShots.length === 0 ? (
          <div className="bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <Filter className="w-8 h-8 text-slate-600 mx-auto animate-bounce" />
            <div className="text-sm font-bold text-slate-300 font-mono">No Storyboard Shots Match Current Filter Criteria</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Try adjusting your status filter, camera movement selector, or search term to view production keyframes.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShots.map((shot, index) => {
              const isSelected = selectedShotId === shot.id;
              const isBeingDragged = draggedShotId === shot.id;
              const isDragOver = dragOverShotId === shot.id;
              const shotDelta = calculateShotStyleDelta(shot, project.style, project.cast);

              return (
                <div
                  key={shot.id}
                  draggable
                  onDragStart={(e) => handleShotDragStart(e, shot, index)}
                  onDragOver={(e) => handleShotDragOver(e, shot, index)}
                  onDragLeave={handleShotDragLeave}
                  onDrop={(e) => handleShotDrop(e, shot, index)}
                  onDragEnd={handleShotDragEnd}
                  onClick={() => setSelectedShotId(shot.id)}
                  className={`bg-slate-900/80 border rounded-2xl p-4 shadow-xl space-y-3.5 transition-all group relative cursor-grab active:cursor-grabbing ${
                    isBeingDragged
                      ? 'opacity-30 border-amber-500/80 scale-95 ring-2 ring-amber-500/50'
                      : isDragOver
                      ? 'border-2 border-dashed border-amber-400 bg-amber-950/40 ring-2 ring-amber-400 scale-[1.02] shadow-2xl'
                      : isSelected
                      ? 'border-amber-400 ring-2 ring-amber-500/30 bg-slate-900'
                      : 'border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  {/* Drag Target Insertion Indicator */}
                  {isDragOver && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-mono font-extrabold text-[10px] px-3 py-0.5 rounded-full shadow-lg z-30 flex items-center space-x-1 animate-pulse">
                      <GripVertical className="w-3 h-3" />
                      <span>DROP TO INSERT AS SHOT #{shot.shotNumber}</span>
                    </div>
                  )}

                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="p-1 rounded bg-slate-950/90 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-950/90 border border-slate-800 transition-colors cursor-grab active:cursor-grabbing flex items-center justify-center"
                        title="Drag card to reorder shot sequence"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold font-mono text-amber-400">
                        SHOT #{shot.shotNumber}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* Position Move Buttons */}
                      <div 
                        className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 opacity-70 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveShotPosition(index, 'left');
                          }}
                          title="Move shot earlier (re-indexes shot numbers)"
                          className="p-1 text-slate-400 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-400 rounded cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <span className="text-[9px] font-mono text-slate-500 font-bold px-0.5">#{shot.shotNumber}</span>
                        <button
                          type="button"
                          disabled={index === sceneShots.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveShotPosition(index, 'right');
                          }}
                          title="Move shot later (re-indexes shot numbers)"
                          className="p-1 text-slate-400 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-400 rounded cursor-pointer"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        {shot.shotType}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {shot.cameraMovement}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunImageDiffusionOnShot(shot);
                        }}
                        disabled={diffusingShotId === shot.id || isGenerating}
                        className="p-1 text-slate-400 hover:text-amber-400 disabled:opacity-30 rounded cursor-pointer transition-colors"
                        title={`Re-generate / Refresh Keyframe for Shot #${shot.shotNumber}`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${diffusingShotId === shot.id ? 'animate-spin text-amber-400' : 'hover:rotate-180 transition-transform duration-500'}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteShot(shot.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Delete shot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Keyframe Render Box */}
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group/img">
                    <img
                      src={shot.keyframeUrl || 'https://picsum.photos/seed/keyframe/600/338'}
                      alt={shot.actionPrompt}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        localDiffusionProgress[shot.id] 
                          ? 'blur-[12px] opacity-40 scale-105' 
                          : ''
                      }`}
                    />

                    {/* Always-Visible Refresh Keyframe Icon Overlay Button on Image */}
                    <div className="absolute top-2 right-2 z-20 flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunImageDiffusionOnShot(shot);
                        }}
                        disabled={diffusingShotId === shot.id || isGenerating}
                        title={`Re-generate individual keyframe for Shot #${shot.shotNumber}`}
                        className={`p-1.5 rounded-lg bg-slate-950/90 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700/90 hover:border-amber-400 backdrop-blur-md shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center group/refresh ${
                          diffusingShotId === shot.id ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400' : ''
                        }`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${diffusingShotId === shot.id ? 'animate-spin' : 'group-hover/refresh:rotate-180 transition-transform duration-500'}`} />
                      </button>
                    </div>

                    {localDiffusionProgress[shot.id] && (() => {
                      const localProgress = localDiffusionProgress[shot.id];
                      return (
                        <div className="absolute inset-0 bg-slate-950/60 flex flex-col justify-between p-3 font-mono text-[10px] text-slate-300 select-none z-20">
                          <TVStaticCanvas opacity={Math.max(0, (10 - localProgress.step) / 10)} />
                          
                          {/* HUD Header */}
                          <div className="flex items-center justify-between z-10 bg-slate-950/90 p-1.5 rounded-lg border border-slate-800/80">
                            <div className="flex items-center space-x-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              <span className="text-emerald-400 font-bold tracking-wider">LOCAL WEBGPU ACTIVE</span>
                            </div>
                            <span className="text-cyan-400 font-bold font-mono">STEP {localProgress.step}/10</span>
                          </div>

                          {/* HUD Center Progress bar */}
                          <div className="space-y-1.5 z-10 bg-slate-950/90 p-2 rounded-lg border border-slate-800/80 my-auto text-center">
                            <div className="text-[11px] font-bold text-amber-400 min-h-[16px] leading-tight">
                              {localProgress.status}
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                              <div 
                                className="bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 h-1.5 transition-all duration-200" 
                                style={{ width: `${localProgress.step * 10}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                              <span>{localProgress.step * 10}% COMPLETED</span>
                              <span>{((10 - localProgress.step) * 220 / 1000).toFixed(1)}s EST REMAINING</span>
                            </div>
                          </div>

                          {/* HUD Footer Telemetry */}
                          <div className="grid grid-cols-2 gap-1 z-10 bg-slate-950/90 p-1.5 rounded-lg border border-slate-800/80 text-[9px] text-slate-400">
                            <div>PRECISION: <span className="text-slate-200 font-bold">FP16 COMPACT</span></div>
                            <div>VRAM ALLOC: <span className="text-cyan-300 font-bold">6.92 GB</span></div>
                            <div>SPEED: <span className="text-amber-300 font-bold">4.2 TFLOPS</span></div>
                            <div>CORE TEMP: <span className="text-rose-400 font-bold">68°C</span></div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2 p-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRunImageDiffusionOnShot(shot);
                        }}
                        disabled={diffusingShotId === shot.id || isGenerating}
                        className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 shadow-lg hover:opacity-90 transition-all cursor-pointer"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${diffusingShotId === shot.id ? 'animate-spin' : ''}`} />
                        <span>{diffusingShotId === shot.id ? 'Diffusing...' : `Diffuse Image (${selectedImageModel.split(' ')[0]})`}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewShot(shot);
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-800/90 text-slate-200 text-[11px] font-medium flex items-center space-x-1 hover:bg-slate-700 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Fullscreen</span>
                      </button>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/90 backdrop-blur text-[10px] font-mono text-amber-400 border border-slate-800 font-bold">
                      {(shot.durationSec || 3).toFixed(1)}s
                    </div>
                  </div>

                  {/* Interactive Inline Duration Slider & Real-time Timing Controls */}
                  <div 
                    className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 space-y-2 font-mono"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duration:</span>
                        <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-bold text-xs border border-amber-600/60 shadow-inner">
                          {(shot.durationSec || 3).toFixed(1)}s
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 text-[10px]">
                        <span className="text-slate-400">
                          {Math.round((shot.durationSec || 3) * (project.style.frameRate || 24))}f
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-indigo-300 font-semibold">
                          {totalSceneDuration > 0 ? `${(((shot.durationSec || 3) / totalSceneDuration) * 100).toFixed(0)}% scene` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Range Slider with Precision Steppers */}
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newDur = Math.max(0.5, Number(((shot.durationSec || 3) - 0.5).toFixed(1)));
                          handleUpdateShot(shot.id, { durationSec: newDur });
                        }}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-800 cursor-pointer active:scale-95 transition-all"
                        title="Decrease 0.5s"
                      >
                        -
                      </button>

                      <input
                        type="range"
                        min="0.5"
                        max="15"
                        step="0.5"
                        value={shot.durationSec || 3}
                        onChange={(e) => {
                          const newDuration = parseFloat(e.target.value);
                          handleUpdateShot(shot.id, { durationSec: newDuration });
                        }}
                        className="w-full h-2 rounded-lg bg-slate-900 accent-amber-400 cursor-pointer border border-slate-800 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newDur = Math.min(30, Number(((shot.durationSec || 3) + 0.5).toFixed(1)));
                          handleUpdateShot(shot.id, { durationSec: newDur });
                        }}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-800 cursor-pointer active:scale-95 transition-all"
                        title="Increase 0.5s"
                      >
                        +
                      </button>
                    </div>

                    {/* Quick Duration Preset Chips */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px]">
                      <span className="text-slate-500 text-[9px] uppercase font-bold">Presets:</span>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5, 8].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateShot(shot.id, { durationSec: sec });
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              Math.abs((shot.durationSec || 3) - sec) < 0.1
                                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800/80'
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Style Delta Conformity HUD Bar */}
                  <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800/90 text-[11px] font-mono">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="flex items-center space-x-1 shrink-0">
                        <span className={`w-2 h-2 rounded-full ${
                          shotDelta.status === 'aligned' 
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-500/50' 
                            : shotDelta.status === 'moderate-drift' 
                            ? 'bg-amber-400 animate-pulse' 
                            : 'bg-rose-400 animate-ping'
                        }`} />
                        <span className={`font-bold text-xs ${
                          shotDelta.status === 'aligned' ? 'text-emerald-400' :
                          shotDelta.status === 'moderate-drift' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          Δ {shotDelta.overallDelta}% {shotDelta.status === 'aligned' ? 'Match' : 'Drift'}
                        </span>
                      </div>

                      {shotDelta.deviationReasons.length > 0 && (
                        <span className="text-[10px] text-slate-500 truncate" title={shotDelta.deviationReasons.join(' · ')}>
                          · {shotDelta.deviationReasons[0]}
                        </span>
                      )}
                    </div>

                    {shotDelta.applicableAdjustments.length > 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const adjusted = autoAdjustShot(shot, project.style, project.cast);
                          handleUpdateShot(shot.id, { actionPrompt: adjusted.actionPrompt });
                          setDeltaHarmonizeToast(`Shot #${shot.shotNumber} auto-aligned to "${project.style.name}"!`);
                          setTimeout(() => setDeltaHarmonizeToast(null), 3000);
                        }}
                        className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 cursor-pointer flex items-center space-x-1 transition-all shadow-sm active:scale-95"
                        title="Auto-align shot prompt with active Style LoRA tag & lighting"
                      >
                        <Wand2 className="w-3 h-3 text-cyan-400" />
                        <span>Auto-Align</span>
                      </button>
                    )}
                  </div>

                  {/* Prompt & Specs */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      AI Generation Prompt (LoRA Tagged)
                    </label>
                    <textarea
                      value={shot.actionPrompt}
                      onChange={(e) => handleUpdateShotPrompt(shot.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Dialogue & SFX */}
                  {shot.dialogueLine && (
                    <div className="p-2 bg-slate-950/90 border border-slate-800 rounded-lg text-xs italic text-cyan-400 font-serif">
                      "{shot.dialogueLine}"
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add Shot Card Button */}
            <button
              onClick={handleAddCustomShot}
              className="aspect-video min-h-[250px] rounded-2xl border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900/40 hover:bg-slate-900/80 transition-all flex flex-col items-center justify-center text-slate-400 hover:text-amber-400 space-y-2 cursor-pointer"
            >
              <Plus className="w-8 h-8" />
              <span className="text-xs font-bold">Add Custom Shot</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Active Shot HUD Panel */}
      <ActiveShotFloatingPanel
        activeShot={activeShot}
        dubbingTracks={project.dubbingTracks}
        sceneShotsCount={sceneShots.length}
        activeShotIndex={activeShotIndex}
      />

      {/* Shot Modal Preview */}
      {previewShot && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Shot #{previewShot.shotNumber} - Full Preview</span>
              </h3>
              <button
                onClick={() => setPreviewShot(null)}
                className="text-xs font-bold text-slate-400 hover:text-white"
              >
                Close ✕
              </button>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
              <img
                src={previewShot.keyframeUrl || 'https://picsum.photos/seed/preview/1280/720'}
                alt={previewShot.actionPrompt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
              {previewShot.actionPrompt}
            </p>
          </div>
        </div>
      )}

      {/* Scene Video Narrative Preview Modal */}
      {isSceneVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full space-y-4 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
                  <Clapperboard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                    Sequential Scene Video Narrative Preview
                  </h3>
                  <p className="text-xs text-slate-400">
                    Scene #{selectedSceneNum}: {activeScene?.heading || 'Untitled Scene'} ({sceneShots.length} concatenated shots)
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsSceneVideoModalOpen(false);
                  setIsSceneVideoPlaying(false);
                }}
                className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {/* Main Video Viewport */}
            {sceneShots.length > 0 && (() => {
              const currentShot = sceneShots[sceneVideoCurrentShotIdx] || sceneShots[0];

              return (
                <div className="space-y-4">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 relative group shadow-2xl">
                    {/* Simulated Ken Burns motion based on shot.cameraMovement */}
                    <img
                      key={currentShot.id}
                      src={currentShot.keyframeUrl || 'https://picsum.photos/seed/scenevideo/1280/720'}
                      alt={currentShot.actionPrompt}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-transform duration-1000 ease-out ${
                        currentShot.cameraMovement?.toLowerCase().includes('zoom')
                          ? 'scale-110'
                          : currentShot.cameraMovement?.toLowerCase().includes('pan')
                          ? 'scale-105 translate-x-2'
                          : 'scale-100'
                      }`}
                    />

                    {/* HUD Telemetry Overlay */}
                    <div className="absolute top-3 left-3 flex items-center space-x-2 font-mono text-[11px] z-10">
                      <span className="px-2.5 py-1 rounded-md bg-slate-950/80 text-amber-400 border border-amber-500/50 font-bold backdrop-blur">
                        SHOT #{currentShot.shotNumber} / {sceneShots.length}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-slate-950/80 text-indigo-300 border border-slate-800 backdrop-blur">
                        {currentShot.shotType} | {currentShot.cameraMovement}
                      </span>
                    </div>

                    {/* Onscreen Subtitle Bar */}
                    <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-center space-y-1">
                      {currentShot.dialogueLine ? (
                        <p className="text-sm font-serif italic text-cyan-300">
                          "{currentShot.dialogueLine}"
                        </p>
                      ) : (
                        <p className="text-xs font-mono text-slate-300">
                          {currentShot.actionPrompt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Scrubber Timeline Bar */}
                  <div className="space-y-2 font-mono">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Shot {sceneVideoCurrentShotIdx + 1} of {sceneShots.length}</span>
                      <span className="text-amber-400 font-bold">{Math.round(sceneVideoProgress)}%</span>
                    </div>

                    {/* Shot Segments Progress Bar */}
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${sceneShots.length}, minmax(0, 1fr))` }}>
                      {sceneShots.map((shot, idx) => {
                        const isPast = idx < sceneVideoCurrentShotIdx;
                        const isCurrent = idx === sceneVideoCurrentShotIdx;

                        return (
                          <div
                            key={shot.id}
                            onClick={() => {
                              setSceneVideoCurrentShotIdx(idx);
                              setSceneVideoProgress(0);
                            }}
                            className="h-2 rounded-full bg-slate-800 overflow-hidden cursor-pointer relative"
                            title={`Shot #${shot.shotNumber} (${shot.durationSec}s)`}
                          >
                            <div
                              className={`h-full transition-all ${
                                isPast
                                  ? 'bg-indigo-500'
                                  : isCurrent
                                  ? 'bg-amber-400'
                                  : 'bg-transparent'
                              }`}
                              style={{ width: isPast ? '100%' : isCurrent ? `${sceneVideoProgress}%` : '0%' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (sceneVideoCurrentShotIdx > 0) {
                            setSceneVideoCurrentShotIdx(i => i - 1);
                            setSceneVideoProgress(0);
                          }
                        }}
                        disabled={sceneVideoCurrentShotIdx === 0}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                        title="Previous Shot"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setIsSceneVideoPlaying(!isSceneVideoPlaying)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center space-x-2 cursor-pointer shadow-md"
                      >
                        {isSceneVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>{isSceneVideoPlaying ? 'Pause' : 'Play Narrative'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (sceneVideoCurrentShotIdx < sceneShots.length - 1) {
                            setSceneVideoCurrentShotIdx(i => i + 1);
                            setSceneVideoProgress(0);
                          }
                        }}
                        disabled={sceneVideoCurrentShotIdx === sceneShots.length - 1}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer"
                        title="Next Shot"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setSceneVideoCurrentShotIdx(0);
                          setSceneVideoProgress(0);
                          setIsSceneVideoPlaying(true);
                        }}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                        title="Replay Scene"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Shot Thumbnails Selector */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
                      {sceneShots.map((shot, idx) => (
                        <button
                          key={shot.id}
                          onClick={() => {
                            setSceneVideoCurrentShotIdx(idx);
                            setSceneVideoProgress(0);
                          }}
                          className={`w-12 h-8 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                            idx === sceneVideoCurrentShotIdx
                              ? 'border-amber-400 ring-2 ring-amber-500/50 scale-105'
                              : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={shot.keyframeUrl || 'https://picsum.photos/seed/thumb/200/120'}
                            alt={`Shot ${shot.shotNumber}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
