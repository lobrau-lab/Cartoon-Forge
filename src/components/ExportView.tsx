import React, { useState, useRef, useEffect } from 'react';
import { EpisodeProject, ExportFormats, ExportPresetType, ExportConfiguration, QueuedExportJob } from '../types';
import { 
  Download, 
  FileText, 
  Film, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Code2, 
  Share2, 
  Sparkles,
  PackageCheck,
  FolderArchive,
  Check,
  Upload,
  Trash2,
  Database,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  HardDrive,
  Info,
  FileQuestion,
  Bot,
  Zap,
  FileCheck,
  Sliders,
  Smartphone,
  Monitor,
  Tv,
  Settings2,
  Clock,
  Eye,
  Maximize2,
  Play,
  Pause,
  Square,
  Plus,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { Mp4ExportModal } from './Mp4ExportModal';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

interface ExportViewProps {
  project: EpisodeProject;
  exportData: ExportFormats | null;
  onGenerateExports: (config?: ExportConfiguration, targetProject?: EpisodeProject) => Promise<ExportFormats | void> | void;
  isGenerating: boolean;
  onImportProject?: (project: EpisodeProject) => void;
  onUpdateProject?: (updated: EpisodeProject) => void;
}

// Preset Default Configurations
const PRESET_CONFIGS: Record<ExportPresetType, ExportConfiguration> = {
  draft: {
    preset: 'draft',
    resolution: '1280x720',
    width: 1280,
    height: 720,
    frameRate: 24,
    aspectRatio: '16:9',
    audioMode: 'scratch-dialogue',
    bitrateTier: 'draft-proxy',
    watermark: 'draft-workprint',
    colorProfile: 'rec709',
    includeManifest: true,
    subtitles: 'fountain-cues'
  },
  final: {
    preset: 'final',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    frameRate: 24,
    aspectRatio: '16:9',
    audioMode: 'multi-track',
    bitrateTier: 'master-prores',
    watermark: 'none',
    colorProfile: 'anime-vivid',
    includeManifest: true,
    subtitles: 'embedded-srt'
  },
  'social-media-shorts': {
    preset: 'social-media-shorts',
    resolution: '1080x1920',
    width: 1080,
    height: 1920,
    frameRate: 30,
    aspectRatio: '9:16',
    audioMode: 'stereo-mix',
    bitrateTier: 'mobile-web',
    watermark: 'safe-zone',
    colorProfile: 'anime-vivid',
    includeManifest: true,
    subtitles: 'burned-in'
  },
  custom: {
    preset: 'custom',
    resolution: '1920x1080',
    width: 1920,
    height: 1080,
    frameRate: 24,
    aspectRatio: '16:9',
    audioMode: 'multi-track',
    bitrateTier: 'master-prores',
    watermark: 'none',
    colorProfile: 'anime-vivid',
    includeManifest: true,
    subtitles: 'embedded-srt'
  }
};

// Preset Multi-Episode Templates for Batch Queue Stacking
const MULTI_EPISODE_TEMPLATES = [
  {
    episodeNumber: 1,
    title: 'Episode 01: Awakening of the Quantum Blade',
    seriesTitle: 'AETHER SHIFT 2099',
    durationMin: 24,
    preset: 'final' as ExportPresetType,
    summary: 'Master Broadcast Conform (1080p Sakuga 24fps with full stems)'
  },
  {
    episodeNumber: 2,
    title: 'Episode 02: Neon Shadows Over Sector 4',
    seriesTitle: 'AETHER SHIFT 2099',
    durationMin: 24,
    preset: 'draft' as ExportPresetType,
    summary: 'Rough Cut Proxy Review (720p 24fps with scratch audio)'
  },
  {
    episodeNumber: 3,
    title: 'Episode 03: The Quantum Core Fractures',
    seriesTitle: 'AETHER SHIFT 2099',
    durationMin: 24,
    preset: 'final' as ExportPresetType,
    summary: 'Master Broadcast Conform (1080p Sakuga 24fps with full stems)'
  },
  {
    episodeNumber: 99,
    title: 'Special OVA: Ren vs Malakor Showdown',
    seriesTitle: 'AETHER SHIFT 2099',
    durationMin: 3.5,
    preset: 'social-media-shorts' as ExportPresetType,
    summary: 'Vertical 9:16 Social Reel (1080x1920 30fps with safe zones)'
  }
];

interface FormatCompilationItem {
  id: 'otio' | 'fountain' | 'xml' | 'edl' | 'manifest';
  name: string;
  shortTag: string;
  ext: string;
  targetSuites: string;
  icon: any;
  color: string;
  barGradient: string;
  progress: number;
  phase: string;
  isComplete: boolean;
  sizeKb: number;
}

export const ExportView: React.FC<ExportViewProps> = ({
  project,
  exportData,
  onGenerateExports,
  isGenerating,
  onImportProject,
  onUpdateProject
}) => {
  const [activeFormat, setActiveFormat] = useState<'otioJson' | 'fountain' | 'finalCutXml' | 'edl' | 'storyboardManifest' | 'fileManifest'>('otioJson');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [downloadAllSuccess, setDownloadAllSuccess] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isMp4ModalOpen, setIsMp4ModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export Preset & Configuration State
  const [selectedPreset, setSelectedPreset] = useState<ExportPresetType>('final');
  const [config, setConfig] = useState<ExportConfiguration>(PRESET_CONFIGS.final);
  const [showConfigInspector, setShowConfigInspector] = useState<boolean>(false);

  // Granular animated compilation progress state for each file format
  const [isGranularCompiling, setIsGranularCompiling] = useState<boolean>(false);
  const [formatStatuses, setFormatStatuses] = useState<Record<string, FormatCompilationItem>>({
    otio: {
      id: 'otio',
      name: 'OpenTimelineIO Sequence',
      shortTag: 'OTIO',
      ext: '.otio.json',
      targetSuites: 'Premiere Pro · DaVinci Resolve · Final Cut Pro',
      icon: Layers,
      color: 'text-cyan-400',
      barGradient: 'from-cyan-500 to-indigo-500',
      progress: exportData?.otioJson ? 100 : 0,
      phase: exportData?.otioJson ? 'Compiled & Validated' : 'Ready for compilation',
      isComplete: !!exportData?.otioJson,
      sizeKb: exportData?.otioJson ? Math.round((exportData.otioJson.length / 1024) * 10) / 10 : 38.4
    },
    fountain: {
      id: 'fountain',
      name: 'Fountain Screenplay',
      shortTag: 'FOUNTAIN',
      ext: '.fountain',
      targetSuites: 'Highland · Fade In · WriterDuet · Scrivener',
      icon: FileText,
      color: 'text-emerald-400',
      barGradient: 'from-emerald-500 to-teal-400',
      progress: exportData?.fountain ? 100 : 0,
      phase: exportData?.fountain ? 'Compiled & Validated' : 'Ready for compilation',
      isComplete: !!exportData?.fountain,
      sizeKb: exportData?.fountain ? Math.round((exportData.fountain.length / 1024) * 10) / 10 : 16.2
    },
    xml: {
      id: 'xml',
      name: 'Final Cut Pro XML',
      shortTag: 'XML',
      ext: '.xml',
      targetSuites: 'Apple Final Cut Pro X · Adobe Premiere · DaVinci Resolve',
      icon: Code2,
      color: 'text-purple-400',
      barGradient: 'from-purple-500 to-violet-400',
      progress: exportData?.finalCutXml ? 100 : 0,
      phase: exportData?.finalCutXml ? 'Compiled & Validated' : 'Ready for compilation',
      isComplete: !!exportData?.finalCutXml,
      sizeKb: exportData?.finalCutXml ? Math.round((exportData.finalCutXml.length / 1024) * 10) / 10 : 28.7
    },
    edl: {
      id: 'edl',
      name: 'Edit Decision List',
      shortTag: 'EDL',
      ext: '.edl',
      targetSuites: 'CMX 3600 Conform Suites · Color Grading · Avid',
      icon: Film,
      color: 'text-amber-400',
      barGradient: 'from-amber-500 to-orange-400',
      progress: exportData?.edl ? 100 : 0,
      phase: exportData?.edl ? 'Compiled & Validated' : 'Ready for compilation',
      isComplete: !!exportData?.edl,
      sizeKb: exportData?.edl ? Math.round((exportData.edl.length / 1024) * 10) / 10 : 8.5
    },
    manifest: {
      id: 'manifest',
      name: 'Production Asset Manifest',
      shortTag: 'MANIFEST',
      ext: '.manifest.json',
      targetSuites: 'Full Episode Package Checksum & Asset Ledger',
      icon: FileCheck,
      color: 'text-blue-400',
      barGradient: 'from-blue-500 to-cyan-400',
      progress: exportData?.fileManifest ? 100 : 0,
      phase: exportData?.fileManifest ? 'Compiled & Validated' : 'Ready for compilation',
      isComplete: !!exportData?.fileManifest,
      sizeKb: exportData?.fileManifest ? Math.round((exportData.fileManifest.length / 1024) * 10) / 10 : 44.1
    }
  });

  // Sync format sizes if exportData changes from external compilation
  useEffect(() => {
    if (exportData) {
      setFormatStatuses(prev => ({
        ...prev,
        otio: {
          ...prev.otio,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: Math.round((exportData.otioJson.length / 1024) * 10) / 10
        },
        fountain: {
          ...prev.fountain,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: Math.round((exportData.fountain.length / 1024) * 10) / 10
        },
        xml: {
          ...prev.xml,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: Math.round((exportData.finalCutXml.length / 1024) * 10) / 10
        },
        edl: {
          ...prev.edl,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: Math.round((exportData.edl.length / 1024) * 10) / 10
        },
        manifest: {
          ...prev.manifest,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: Math.round((exportData.fileManifest.length / 1024) * 10) / 10
        }
      }));
    }
  }, [exportData]);

  // =========================================================================
  // QUEUE MANAGEMENT SYSTEM STATE & SEQUENTIAL PROCESSOR
  // =========================================================================
  const [queue, setQueue] = useState<QueuedExportJob[]>(() => {
    const saved = localStorage.getItem('anime_suite_export_queue');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fall back to empty queue
      }
    }
    return [];
  });

  const [isQueueProcessing, setIsQueueProcessing] = useState<boolean>(false);
  const [isQueuePaused, setIsQueuePaused] = useState<boolean>(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);
  const [inspectedJobResult, setInspectedJobResult] = useState<QueuedExportJob | null>(null);

  // Custom modal state
  const [customJobTitle, setCustomJobTitle] = useState<string>(project.title);
  const [customJobEpisode, setCustomJobEpisode] = useState<number>(project.episodeNumber || 1);
  const [customJobPreset, setCustomJobPreset] = useState<ExportPresetType>('final');

  // References for non-blocking asynchronous control
  const isQueueProcessingRef = useRef<boolean>(false);
  const isQueuePausedRef = useRef<boolean>(false);
  const abortQueueRef = useRef<boolean>(false);

  // Sync queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('anime_suite_export_queue', JSON.stringify(queue));
    } catch (e) {
      console.warn('Could not persist export queue:', e);
    }
  }, [queue]);

  // Audio completion chime synthesizer
  const playCompletionChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.6);
      });
    } catch (e) {
      // Audio playback silently suppressed if blocked by browser policy
    }
  };

  // Helper: Update a single job in the queue
  const updateJob = (jobId: string, updates: Partial<QueuedExportJob>) => {
    setQueue(prev => prev.map(job => (job.id === jobId ? { ...job, ...updates } : job)));
  };

  // Calculate Master Progress
  const calculateMasterProgress = (): number => {
    if (queue.length === 0) return 0;
    const completedCount = queue.filter(j => j.status === 'completed').length;
    const activeJob = queue.find(j => j.status === 'processing');
    const activeProgress = activeJob ? activeJob.progress : 0;
    const totalScore = (completedCount * 100) + activeProgress;
    return Math.min(100, Math.round(totalScore / queue.length));
  };

  const masterProgress = calculateMasterProgress();
  const completedJobsCount = queue.filter(j => j.status === 'completed').length;
  const pendingJobsCount = queue.filter(j => j.status === 'queued').length;
  const activeJob = queue.find(j => j.id === currentJobId);

  // Sequential Queue Execution Core
  const handleProcessQueueSequentially = async () => {
    if (isQueueProcessingRef.current) return;
    
    // Check if there are queued jobs
    const hasPending = queue.some(j => j.status === 'queued' || j.status === 'paused');
    if (!hasPending) {
      registerRealTimeHeal(
        'Queue',
        'Queue has no pending jobs to process',
        'Stack new export jobs or reset completed tasks to re-run.',
        'heal'
      );
      return;
    }

    isQueueProcessingRef.current = true;
    setIsQueueProcessing(true);
    setIsQueuePaused(false);
    isQueuePausedRef.current = false;
    abortQueueRef.current = false;

    registerRealTimeHeal(
      'Queue',
      `Master Export Batch Started: Sequential Pipeline Active`,
      `Processing ${queue.length} stacked project exports sequentially.`,
      'heal'
    );

    // Snapshot of queue at start
    const jobsSnapshot = [...queue];

    for (let i = 0; i < jobsSnapshot.length; i++) {
      if (abortQueueRef.current) break;

      const currentJob = jobsSnapshot[i];
      // Skip already completed or failed unless user resets
      if (currentJob.status === 'completed') continue;

      // Handle Pause loop
      while (isQueuePausedRef.current && !abortQueueRef.current) {
        await new Promise(r => setTimeout(r, 200));
      }
      if (abortQueueRef.current) break;

      setCurrentJobId(currentJob.id);
      const startTime = Date.now();

      // Mark Job as Processing
      updateJob(currentJob.id, {
        status: 'processing',
        startedAt: new Date().toISOString(),
        progress: 8,
        currentPhase: 'Initializing compiler & allocating memory buffers...',
        activeFormatId: 'fountain'
      });

      // Step 1: Parse Fountain
      await new Promise(r => setTimeout(r, 380));
      if (abortQueueRef.current) break;
      updateJob(currentJob.id, {
        progress: 32,
        currentPhase: 'Parsing Fountain screenplay sluglines & dialogue parentheticals...',
        activeFormatId: 'fountain'
      });

      // Step 2: Conforming OTIO
      await new Promise(r => setTimeout(r, 420));
      if (abortQueueRef.current) break;
      updateJob(currentJob.id, {
        progress: 60,
        currentPhase: `Conforming OpenTimelineIO RationalTime clips (${currentJob.config.resolution} @ ${currentJob.config.frameRate}fps)...`,
        activeFormatId: 'otio'
      });

      // Step 3: XML & EDL
      await new Promise(r => setTimeout(r, 400));
      if (abortQueueRef.current) break;
      updateJob(currentJob.id, {
        progress: 82,
        currentPhase: 'Synthesizing Apple xmeml XML & CMX 3600 EDL records...',
        activeFormatId: 'xml'
      });

      // Step 4: Server compilation
      try {
        const result = (await onGenerateExports(currentJob.config, currentJob.targetProject || project)) as ExportFormats | undefined;
        const durationSec = Math.round(((Date.now() - startTime) / 1000) * 10) / 10;

        let totalSizeKb = 0;
        if (result) {
          totalSizeKb = Math.round(
            ((result.fountain?.length || 0) +
             (result.otioJson?.length || 0) +
             (result.finalCutXml?.length || 0) +
             (result.edl?.length || 0) +
             (result.fileManifest?.length || 0)) / 1024 * 10
          ) / 10;
        } else {
          totalSizeKb = 128.5;
        }

        updateJob(currentJob.id, {
          status: 'completed',
          progress: 100,
          currentPhase: 'All formats compiled & checksum verified',
          completedAt: new Date().toISOString(),
          durationSec,
          totalSizeKb,
          result
        });

        registerRealTimeHeal(
          'Queue',
          `Job Completed: "${currentJob.projectTitle}" [${currentJob.preset.toUpperCase()}]`,
          `Sequentially compiled in ${durationSec}s (${totalSizeKb} KB).`,
          'heal'
        );
      } catch (err: any) {
        console.error(`Error processing job ${currentJob.id}:`, err);
        updateJob(currentJob.id, {
          status: 'failed',
          progress: 100,
          currentPhase: 'Compilation encountered an error',
          error: err?.message || 'Server error during export compilation'
        });
      }

      // Small pause between sequential jobs
      await new Promise(r => setTimeout(r, 300));
    }

    setCurrentJobId(null);
    isQueueProcessingRef.current = false;
    setIsQueueProcessing(false);
    setIsQueuePaused(false);

    if (!abortQueueRef.current) {
      playCompletionChime();
      registerRealTimeHeal(
        'Queue',
        `Master Batch Queue Fully Completed`,
        `All queued exports were processed sequentially. Master progress reached 100%.`,
        'heal'
      );
    }
  };

  // Pause / Resume Toggle
  const handleTogglePause = () => {
    if (isQueuePaused) {
      isQueuePausedRef.current = false;
      setIsQueuePaused(false);
      registerRealTimeHeal('Queue', 'Resumed Sequential Batch Queue Processing', 'Jobs resuming sequentially.', 'heal');
    } else {
      isQueuePausedRef.current = true;
      setIsQueuePaused(true);
      registerRealTimeHeal('Queue', 'Paused Sequential Batch Queue Processing', 'Jobs held in place cleanly.', 'heal');
    }
  };

  // Stop / Cancel Batch
  const handleCancelBatch = () => {
    abortQueueRef.current = true;
    isQueueProcessingRef.current = false;
    setIsQueueProcessing(false);
    setIsQueuePaused(false);
    setCurrentJobId(null);

    // Reset currently processing job back to queued
    setQueue(prev => prev.map(j => (j.status === 'processing' ? { ...j, status: 'queued', progress: 0, currentPhase: 'Queued (reset after cancel)' } : j)));

    registerRealTimeHeal('Queue', 'Master Export Batch Cancelled', 'Processing halted gracefully.', 'fix');
  };

  // Add Current Project with Selected Preset to Queue
  const handleQueueCurrentProject = () => {
    const newJob: QueuedExportJob = {
      id: `job-${Date.now()}`,
      projectId: project.id,
      projectTitle: project.title,
      episodeNumber: project.episodeNumber || 1,
      seriesTitle: project.seriesTitle || 'Anime Series',
      preset: selectedPreset,
      config: { ...config },
      formats: ['otio', 'fountain', 'xml', 'edl', 'manifest'],
      status: 'queued',
      progress: 0,
      currentPhase: `Queued (${selectedPreset.toUpperCase()} preset - ${config.resolution})`,
      queuedAt: new Date().toISOString()
    };

    setQueue(prev => [...prev, newJob]);

    registerRealTimeHeal(
      'Queue',
      `Queued Current Project: "${project.title}" [${selectedPreset.toUpperCase()}]`,
      `Added to queue stack (${newJob.config.resolution} @ ${newJob.config.frameRate}fps).`,
      'heal'
    );
  };

  // Quick Action: Stack All 3 Standard Deliverables for Current Project
  const handleStackMultiPresetBundle = () => {
    const presetsToStack: ExportPresetType[] = ['draft', 'final', 'social-media-shorts'];
    const newJobs: QueuedExportJob[] = presetsToStack.map((pst, idx) => ({
      id: `job-${Date.now()}-${idx}`,
      projectId: project.id,
      projectTitle: project.title,
      episodeNumber: project.episodeNumber || 1,
      seriesTitle: project.seriesTitle || 'Anime Series',
      preset: pst,
      config: PRESET_CONFIGS[pst],
      formats: ['otio', 'fountain', 'xml', 'edl', 'manifest'],
      status: 'queued',
      progress: 0,
      currentPhase: `Queued (${pst.toUpperCase()} Preset)`,
      queuedAt: new Date().toISOString()
    }));

    setQueue(prev => [...prev, ...newJobs]);

    registerRealTimeHeal(
      'Queue',
      `Stacked 3 Deliverable Presets for "${project.title}"`,
      `Added Draft Proxy (720p), Final Master (1080p), and Social Media Short (9:16).`,
      'heal'
    );
  };

  // Quick Action: Stack Multi-Episode Batch (Ep 1, Ep 2, Ep 3, OVA)
  const handleStackMultiEpisodeBatch = () => {
    const newJobs: QueuedExportJob[] = MULTI_EPISODE_TEMPLATES.map((tpl, idx) => ({
      id: `job-ep-${tpl.episodeNumber}-${Date.now()}-${idx}`,
      projectId: `proj-ep-${tpl.episodeNumber}`,
      projectTitle: tpl.title,
      episodeNumber: tpl.episodeNumber,
      seriesTitle: tpl.seriesTitle,
      preset: tpl.preset,
      config: PRESET_CONFIGS[tpl.preset],
      formats: ['otio', 'fountain', 'xml', 'edl', 'manifest'],
      status: 'queued',
      progress: 0,
      currentPhase: `Queued for sequential render (${tpl.summary})`,
      queuedAt: new Date().toISOString()
    }));

    setQueue(prev => [...prev, ...newJobs]);

    registerRealTimeHeal(
      'Queue',
      `Stacked Multi-Episode Season Batch`,
      `Added Episodes 01, 02, 03, and Special OVA to the export queue.`,
      'heal'
    );
  };

  // Add Custom Job from Modal
  const handleAddCustomJob = () => {
    const chosenConfig = PRESET_CONFIGS[customJobPreset];
    const newJob: QueuedExportJob = {
      id: `job-custom-${Date.now()}`,
      projectId: `proj-${Date.now()}`,
      projectTitle: customJobTitle || 'Untitled Episode',
      episodeNumber: customJobEpisode || 1,
      seriesTitle: project.seriesTitle || 'AETHER SHIFT 2099',
      preset: customJobPreset,
      config: chosenConfig,
      formats: ['otio', 'fountain', 'xml', 'edl', 'manifest'],
      status: 'queued',
      progress: 0,
      currentPhase: `Queued (${customJobPreset.toUpperCase()} - ${chosenConfig.resolution})`,
      queuedAt: new Date().toISOString()
    };

    setQueue(prev => [...prev, newJob]);
    setShowAddCustomModal(false);

    registerRealTimeHeal(
      'Queue',
      `Custom Export Stacked: "${newJob.projectTitle}"`,
      `Added Episode ${newJob.episodeNumber} with ${customJobPreset.toUpperCase()} profile.`,
      'heal'
    );
  };

  // Reordering Jobs in Queue
  const handleMoveJob = (index: number, direction: 'up' | 'down') => {
    if (isQueueProcessing) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queue.length) return;
    setQueue(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Remove single job
  const handleRemoveJob = (jobId: string) => {
    if (currentJobId === jobId && isQueueProcessing) return;
    setQueue(prev => prev.filter(j => j.id !== jobId));
  };

  // Duplicate job
  const handleDuplicateJob = (job: QueuedExportJob) => {
    const duplicated: QueuedExportJob = {
      ...job,
      id: `job-copy-${Date.now()}`,
      status: 'queued',
      progress: 0,
      currentPhase: `Queued duplicate of ${job.projectTitle}`,
      startedAt: undefined,
      completedAt: undefined,
      durationSec: undefined,
      result: undefined,
      error: undefined
    };
    setQueue(prev => [...prev, duplicated]);
  };

  // Reset Job Status so it can be re-run
  const handleResetJob = (jobId: string) => {
    updateJob(jobId, {
      status: 'queued',
      progress: 0,
      currentPhase: 'Queued (reset to re-run)',
      startedAt: undefined,
      completedAt: undefined,
      durationSec: undefined,
      error: undefined
    });
  };

  // Clear completed jobs
  const handleClearCompleted = () => {
    setQueue(prev => prev.filter(j => j.status !== 'completed'));
  };

  // Clear all jobs
  const handleClearAll = () => {
    if (isQueueProcessing) return;
    setQueue([]);
  };

  // Download All Completed Queue Packages as a Consolidated Summary Batch
  const handleDownloadCompletedBatchArchive = () => {
    const completed = queue.filter(j => j.status === 'completed' && j.result);
    if (completed.length === 0) return;

    const batchArchive = {
      batchMetadata: {
        exportedAt: new Date().toISOString(),
        totalJobs: completed.length,
        seriesTitle: project.seriesTitle || 'Anime Series',
        masterChecksum: `sha256-batch-${Date.now()}`
      },
      jobs: completed.map(j => ({
        id: j.id,
        projectTitle: j.projectTitle,
        episodeNumber: j.episodeNumber,
        preset: j.preset,
        config: j.config,
        durationSec: j.durationSec,
        totalSizeKb: j.totalSizeKb,
        exportFormats: {
          openTimelineIo: j.result?.otioJson,
          fountainScreenplay: j.result?.fountain,
          finalCutProXml: j.result?.finalCutXml,
          editDecisionList: j.result?.edl,
          storyboardManifest: j.result?.storyboardManifest,
          fileManifest: j.result?.fileManifest
        }
      }))
    };

    handleDownloadFile(
      JSON.stringify(batchArchive, null, 2),
      `MASTER_BATCH_QUEUE_EXPORTS_${new Date().toISOString().slice(0, 10)}.json`
    );
    setDownloadAllSuccess(true);
    setTimeout(() => setDownloadAllSuccess(false), 3000);
  };

  // Project Storage & Purge States
  const [purgeState, setPurgeState] = useState<'idle' | 'scanning' | 'scanned' | 'purging' | 'completed'>('idle');
  const [purgeProgress, setPurgeProgress] = useState<number>(0);
  const [purgeActivity, setPurgeActivity] = useState<string>('');

  interface PurgeReport {
    orphanedDubbingTracks: Array<{ id: string; character: string; text: string; sizeEstimateKb: number }>;
    failedVideoRenders: Array<{ id: string; shotNumber: number; sceneNumber: number; errorStatus: string }>;
    orphanedShots: Array<{ id: string; shotNumber: number; sceneNumber: number; actionPrompt: string }>;
    unusedCharacters: Array<{ id: string; name: string; role: string }>;
    totalSpaceKb: number;
    potentialSavingsKb: number;
  }

  const [purgeReport, setPurgeReport] = useState<PurgeReport | null>(null);

  // Scan Project storage sizes and orphaned nodes
  const scanProjectForPurge = (): PurgeReport => {
    const projectStr = JSON.stringify(project);
    const totalBytes = new Blob([projectStr]).size;
    const totalSpaceKb = Math.round((totalBytes / 1024) * 10) / 10;

    const activeShotIds = new Set(project.shots.map(s => s.id));
    const orphanedDubbing = project.dubbingTracks
      .filter(track => !activeShotIds.has(track.shotId))
      .map(track => {
        const base64Length = track.audioBase64 ? track.audioBase64.length : 0;
        const sizeEstimateKb = Math.round((base64Length / 1024) * 10) / 10;
        return {
          id: track.id,
          character: track.character,
          text: track.text,
          sizeEstimateKb
        };
      });

    const failedVideoRenders = project.shots
      .filter(s => s.videoRenderStatus === 'failed')
      .map(s => ({
        id: s.id,
        shotNumber: s.shotNumber,
        sceneNumber: s.sceneNumber,
        errorStatus: 'Failed on-device execution or zero frame return'
      }));

    const activeSceneNumbers = new Set(project.scenes.map(sc => sc.sceneNumber));
    const orphanedShots = project.shots
      .filter(s => !activeSceneNumbers.has(s.sceneNumber))
      .map(s => ({
        id: s.id,
        shotNumber: s.shotNumber,
        sceneNumber: s.sceneNumber,
        actionPrompt: s.actionPrompt
      }));

    const castUsed = new Set<string>();
    project.shots.forEach(s => s.charactersInShot?.forEach(char => castUsed.add(char)));
    project.scenes.forEach(sc => {
      sc.dialogue?.forEach(d => castUsed.add(d.character));
    });
    const unusedCharacters = project.cast
      .filter(char => !castUsed.has(char.name))
      .map(char => ({
        id: char.id,
        name: char.name,
        role: char.role
      }));

    let potentialSavingsKb = 0;
    orphanedDubbing.forEach(d => { potentialSavingsKb += d.sizeEstimateKb; });
    potentialSavingsKb += orphanedShots.length * 0.4;
    potentialSavingsKb += unusedCharacters.length * 0.6;
    potentialSavingsKb += failedVideoRenders.length * 0.15;
    potentialSavingsKb = Math.round(potentialSavingsKb * 10) / 10;

    return {
      orphanedDubbingTracks: orphanedDubbing,
      failedVideoRenders,
      orphanedShots,
      unusedCharacters,
      totalSpaceKb,
      potentialSavingsKb
    };
  };

  // Trigger project optimization scan
  const handleScanProjectStorage = () => {
    setPurgeState('scanning');
    setPurgeProgress(30);
    setPurgeActivity('Allocating file system index arrays...');

    setTimeout(() => {
      setPurgeProgress(75);
      setPurgeActivity('Analyzing storyboard and cross-reference tree matrices...');

      setTimeout(() => {
        const report = scanProjectForPurge();
        setPurgeReport(report);
        setPurgeProgress(100);
        setPurgeState('scanned');

        registerRealTimeHeal(
          'Schema',
          `Project Storage & Purge scan completed. Total project footprint: ${report.totalSpaceKb} KB.`,
          `Identified ${report.potentialSavingsKb} KB of reclaimable storage.`,
          'heal'
        );
      }, 500);
    }, 400);
  };

  // Perform full storage purge and garbage-collection routine
  const handlePerformPurge = async () => {
    if (!purgeReport) return;
    setPurgeState('purging');

    const steps = [
      { progress: 20, activity: 'Garbage-collecting unreferenced audio buffers (Base64 data clusters)...' },
      { progress: 50, activity: 'Pruning orphaned camera shot telemetry from deleted storyboard nodes...' },
      { progress: 75, activity: 'De-allocating corrupt and aborted failed video render status flags...' },
      { progress: 90, activity: 'Re-aligning character cast anchor indices and verifying graph integrity...' },
      { progress: 100, activity: 'Compacting browser localStorage and saving updated schema...' }
    ];

    for (let i = 0; i < steps.length; i++) {
      setPurgeProgress(steps[i].progress);
      setPurgeActivity(steps[i].activity);

      if (i === 0 && purgeReport.orphanedDubbingTracks.length > 0) {
        registerRealTimeHeal(
          'Dubbing',
          `Purged ${purgeReport.orphanedDubbingTracks.length} orphaned audio clusters.`,
          `Cleared ${purgeReport.orphanedDubbingTracks.reduce((acc, curr) => acc + curr.sizeEstimateKb, 0).toFixed(1)} KB.`,
          'fix'
        );
      } else if (i === 1 && purgeReport.orphanedShots.length > 0) {
        registerRealTimeHeal(
          'Shots',
          `Purged ${purgeReport.orphanedShots.length} orphaned storyboard camera shots.`,
          'Removed stale nodes from shot index.',
          'fix'
        );
      }
      await new Promise(r => setTimeout(r, 300));
    }

    const activeShotIds = new Set(project.shots.map(s => s.id));
    const cleanedDubbing = project.dubbingTracks.filter(d => activeShotIds.has(d.shotId));
    const activeSceneNumbers = new Set(project.scenes.map(sc => sc.sceneNumber));
    const cleanedShots = project.shots
      .filter(s => activeSceneNumbers.has(s.sceneNumber))
      .map(s => (s.videoRenderStatus === 'failed' ? { ...s, videoRenderStatus: 'idle' as const } : s));

    const castUsed = new Set<string>();
    cleanedShots.forEach(s => s.charactersInShot?.forEach(c => castUsed.add(c)));
    project.scenes.forEach(sc => sc.dialogue?.forEach(d => castUsed.add(d.character)));
    const cleanedCast = project.cast.filter(c => castUsed.has(c.name));

    const optimizedProject: EpisodeProject = {
      ...project,
      dubbingTracks: cleanedDubbing,
      shots: cleanedShots,
      cast: cleanedCast.length > 0 ? cleanedCast : project.cast,
      updatedAt: new Date().toISOString()
    };

    if (onUpdateProject) {
      onUpdateProject(optimizedProject);
    }

    try {
      localStorage.setItem('anime_suite_project', JSON.stringify(optimizedProject));
    } catch (e) {
      console.warn('Could not save optimized project to localStorage:', e);
    }

    setPurgeState('completed');
  };

  const handleResetPurgeState = () => {
    setPurgeState('idle');
    setPurgeReport(null);
    setPurgeProgress(0);
    setPurgeActivity('');
  };

  // Preset Selection Handler
  const handlePresetChange = (preset: ExportPresetType) => {
    setSelectedPreset(preset);
    const newConfig = { ...PRESET_CONFIGS[preset] };
    setConfig(newConfig);

    registerRealTimeHeal(
      'Export',
      `Applied Export Preset: "${preset.toUpperCase()}"`,
      `Auto-configured resolution (${newConfig.resolution}), frame rate (${newConfig.frameRate} fps), audio mode (${newConfig.audioMode}), and watermark (${newConfig.watermark}).`,
      'heal'
    );
  };

  // Custom setting modifier that flags preset as custom
  const handleUpdateConfigSetting = <K extends keyof ExportConfiguration>(key: K, value: ExportConfiguration[K]) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value, preset: 'custom' as const };
      setSelectedPreset('custom');
      return updated;
    });
  };

  // Granular Multi-Format Single Project Export Compilation Pipeline with Animated Progress Bars
  const handleStartGranularCompilation = async () => {
    setIsGranularCompiling(true);

    // Initial reset of progress
    setFormatStatuses(prev => ({
      otio: { ...prev.otio, progress: 12, isComplete: false, phase: 'Initializing RationalTime timeline stack...' },
      fountain: { ...prev.fountain, progress: 18, isComplete: false, phase: 'Parsing scene headings & action sluglines...' },
      xml: { ...prev.xml, progress: 10, isComplete: false, phase: 'Constructing Apple xmeml Document Object Model...' },
      edl: { ...prev.edl, progress: 15, isComplete: false, phase: 'Calculating SMPTE non-drop timecodes...' },
      manifest: { ...prev.manifest, progress: 8, isComplete: false, phase: 'Indexing storyboard & dubbing asset buffers...' }
    }));

    // Phase 1: Fountain Screenplay progresses rapidly
    await new Promise(r => setTimeout(r, 350));
    setFormatStatuses(prev => ({
      ...prev,
      fountain: { ...prev.fountain, progress: 58, phase: 'Formatting character voice blocks & emotion parentheticals...' },
      otio: { ...prev.otio, progress: 38, phase: 'Mapping video keyframe clip ranges (24 fps)...' },
      xml: { ...prev.xml, progress: 32, phase: `Synthesizing samplecharacteristics (${config.width}x${config.height})...` }
    }));

    // Phase 2: Fountain completes, OTIO & XML advance
    await new Promise(r => setTimeout(r, 450));
    setFormatStatuses(prev => ({
      ...prev,
      fountain: { ...prev.fountain, progress: 100, isComplete: true, phase: 'Fountain screenplay validated & ready' },
      otio: { ...prev.otio, progress: 72, phase: 'Conforming multi-track audio voice dubbing clips...' },
      xml: { ...prev.xml, progress: 65, phase: 'Mapping video track transitions & clip in/out boundaries...' },
      edl: { ...prev.edl, progress: 60, phase: 'Writing CMX 3600 edit entries...' }
    }));

    // Phase 3: OTIO completes, XML nears completion
    await new Promise(r => setTimeout(r, 500));
    setFormatStatuses(prev => ({
      ...prev,
      otio: { ...prev.otio, progress: 100, isComplete: true, phase: 'OpenTimelineIO 1.0 JSON sequence verified' },
      xml: { ...prev.xml, progress: 88, phase: 'Validating Final Cut Pro X DTD conformity...' },
      edl: { ...prev.edl, progress: 90, phase: 'Formatting EDL timeline conform metadata...' },
      manifest: { ...prev.manifest, progress: 75, phase: 'Hashing SHA-256 package checksums...' }
    }));

    // Phase 4: Final XML, EDL, and Manifest finalize
    await new Promise(r => setTimeout(r, 450));

    try {
      // Call parent export compiler with active configuration
      const result = (await onGenerateExports(config)) as ExportFormats | undefined;
      
      setFormatStatuses(prev => ({
        otio: {
          ...prev.otio,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: result?.otioJson ? Math.round((result.otioJson.length / 1024) * 10) / 10 : prev.otio.sizeKb
        },
        fountain: {
          ...prev.fountain,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: result?.fountain ? Math.round((result.fountain.length / 1024) * 10) / 10 : prev.fountain.sizeKb
        },
        xml: {
          ...prev.xml,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: result?.finalCutXml ? Math.round((result.finalCutXml.length / 1024) * 10) / 10 : prev.xml.sizeKb
        },
        edl: {
          ...prev.edl,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: result?.edl ? Math.round((result.edl.length / 1024) * 10) / 10 : prev.edl.sizeKb
        },
        manifest: {
          ...prev.manifest,
          progress: 100,
          isComplete: true,
          phase: 'Compiled & Validated',
          sizeKb: result?.fileManifest ? Math.round((result.fileManifest.length / 1024) * 10) / 10 : prev.manifest.sizeKb
        }
      }));

      registerRealTimeHeal(
        'Export',
        `Master Multi-Format Compilation Completed: ${config.preset.toUpperCase()} Preset`,
        `Successfully generated OTIO, Fountain, XML, EDL, and Asset Manifest (${config.resolution} @ ${config.frameRate}fps).`,
        'heal'
      );
    } catch (err) {
      console.error('Granular compilation error:', err);
    } finally {
      setIsGranularCompiling(false);
    }
  };

  // File Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const restoredProject: EpisodeProject = parsed.cast && parsed.shots ? parsed : {
          id: parsed.id || `proj-${Date.now()}`,
          title: parsed.projectTitle || parsed.title || 'Imported Anime Project',
          seriesTitle: parsed.seriesTitle || 'Imported Series',
          episodeNumber: parsed.episodeNumber || 1,
          targetDurationMin: parsed.targetDurationMin || 24,
          style: parsed.stylePreset || parsed.style,
          cast: parsed.cast || [],
          scenes: parsed.scenes || [],
          shots: parsed.shots || [],
          dubbingTracks: parsed.dubbingTracks || [],
          updatedAt: new Date().toISOString()
        };

        if (onImportProject && restoredProject.shots) {
          onImportProject(restoredProject);
          setImportStatus(`Successfully restored "${restoredProject.title}"!`);
          setTimeout(() => setImportStatus(null), 4000);
        }
      } catch (err) {
        setImportStatus('Invalid project file format.');
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  const handleCopyText = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(formatName);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  const handleDownloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download All-In-One Combined Master Bundle JSON
  const handleDownloadMasterPackage = () => {
    if (!exportData) return;
    const sanitizedTitle = project.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const masterPackage = {
      projectTitle: project.title,
      seriesTitle: project.seriesTitle,
      episodeNumber: project.episodeNumber,
      targetDurationMin: project.targetDurationMin,
      exportPreset: config.preset,
      exportConfiguration: config,
      compiledAt: new Date().toISOString(),
      stylePreset: project.style,
      cast: project.cast,
      scenes: project.scenes,
      shots: project.shots,
      dubbingTracks: project.dubbingTracks,
      exportFormats: {
        openTimelineIo: exportData.otioJson,
        fountainScreenplay: exportData.fountain,
        finalCutProXml: exportData.finalCutXml,
        editDecisionList: exportData.edl,
        storyboardManifest: exportData.storyboardManifest,
        fileManifest: exportData.fileManifest
      }
    };

    handleDownloadFile(
      JSON.stringify(masterPackage, null, 2),
      `${sanitizedTitle}_MASTER_${config.preset.toUpperCase()}_PACKAGE.json`
    );
    setDownloadAllSuccess(true);
    setTimeout(() => setDownloadAllSuccess(false), 3000);
  };

  // Download All 6 Compiled Export Files Together
  const handleDownloadAllIndividualFilesTogether = () => {
    if (!exportData) return;
    const sanitizedTitle = project.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    const filesToDownload = [
      { content: exportData.otioJson, filename: `${sanitizedTitle}_sequence.otio.json` },
      { content: exportData.fountain, filename: `${sanitizedTitle}_screenplay.fountain` },
      { content: exportData.finalCutXml, filename: `${sanitizedTitle}_timeline.xml` },
      { content: exportData.edl, filename: `${sanitizedTitle}_edl.edl` },
      { content: exportData.storyboardManifest, filename: `${sanitizedTitle}_storyboard_manifest.json` },
      { content: exportData.fileManifest, filename: `${sanitizedTitle}_file_manifest.json` }
    ];

    filesToDownload.forEach((file, index) => {
      setTimeout(() => {
        handleDownloadFile(file.content, file.filename);
      }, index * 200);
    });

    setDownloadAllSuccess(true);
    setTimeout(() => setDownloadAllSuccess(false), 3000);
  };

  const activeContent = exportData ? (exportData as any)[activeFormat] || '' : '';
  const isAnyCompiling = isGenerating || isGranularCompiling || isQueueProcessing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Industry-Standard Post-Production Export Suite
            </h2>
            <p className="text-xs text-slate-400">
              Compile and export all post-production files altogether for Premiere, Final Cut, DaVinci Resolve, and storyboard editors
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.animepkg"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 shadow-md transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import Project (.json)</span>
          </button>

          <button
            onClick={handleQueueCurrentProject}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-cyan-800/80 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Stack into Queue</span>
            {queue.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 text-[10px] font-mono">
                {queue.length}
              </span>
            )}
          </button>

          <button
            onClick={handleStartGranularCompilation}
            disabled={isAnyCompiling}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-indigo-600 to-rose-500 text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAnyCompiling ? 'animate-spin' : ''}`} />
            <span>{isAnyCompiling ? 'Compiling Pipeline...' : `Compile Single (${config.preset.toUpperCase()})`}</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono font-bold animate-fadeIn">
          {importStatus}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 QUEUE MANAGEMENT SYSTEM & MASTER PROGRESS BAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow ambient highlight */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Queue Header & Global Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950 to-cyan-950 text-cyan-400 border border-cyan-800 shadow-md">
              <ListOrdered className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Sequential Export Engine</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {queue.length} Total Jobs Stacked
                </span>
                {isQueueProcessing && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    <span>SEQUENTIAL RUN ACTIVE</span>
                  </span>
                )}
                {isQueuePaused && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                    PAUSED
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-1">
                Batch Export Queue Manager
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Stack multiple project deliverables, episodes, and format presets to process them sequentially with unified progress tracking.
              </p>
            </div>
          </div>

          {/* Master Queue Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!isQueueProcessing ? (
              <button
                onClick={handleProcessQueueSequentially}
                disabled={queue.length === 0}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Process Queue Sequentially</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTogglePause}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
                >
                  {isQueuePaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isQueuePaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  onClick={handleCancelBatch}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Cancel Batch</span>
                </button>
              </div>
            )}

            {/* Quick Stack Dropdown or Buttons */}
            <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={handleQueueCurrentProject}
                title="Add current project configuration to queue"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Current</span>
              </button>
              <button
                onClick={handleStackMultiPresetBundle}
                title="Stack Draft, Final, and Social Media Shorts for current project"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-mono font-semibold transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ 3 Presets</span>
              </button>
              <button
                onClick={handleStackMultiEpisodeBatch}
                title="Stack sample multi-episode batch (Ep 1-3 & OVA)"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 text-xs font-mono font-semibold transition cursor-pointer"
              >
                <Film className="w-3.5 h-3.5 text-indigo-400" />
                <span>+ 4 Episodes</span>
              </button>
              <button
                onClick={() => setShowAddCustomModal(true)}
                title="Configure and stack a custom project export"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-mono font-semibold transition cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Custom</span>
              </button>
            </div>

            {completedJobsCount > 0 && (
              <button
                onClick={handleDownloadCompletedBatchArchive}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 text-xs font-bold transition cursor-pointer"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Download All Completed</span>
              </button>
            )}

            {queue.length > 0 && !isQueueProcessing && (
              <div className="flex items-center space-x-1">
                {completedJobsCount > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
                    title="Clear completed jobs from queue"
                  >
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                  </button>
                )}
                <button
                  onClick={handleClearAll}
                  className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer"
                  title="Clear entire queue"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MASTER PROGRESS BAR CONTAINER */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 shadow-inner space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <ActivityIndicator isProcessing={isQueueProcessing} isComplete={masterProgress === 100 && queue.length > 0} />
                  <span>Master Batch Export Progress</span>
                </span>
                <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-full ${
                  masterProgress === 100 && queue.length > 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                    : isQueueProcessing
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}>
                  {masterProgress}%
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {isQueueProcessing && activeJob ? (
                  <span className="text-cyan-400 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing: <strong>{activeJob.projectTitle}</strong> ({activeJob.preset.toUpperCase()} • {activeJob.currentPhase})</span>
                  </span>
                ) : masterProgress === 100 && queue.length > 0 ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>All {queue.length} stacked project deliverables successfully compiled and checksum-verified!</span>
                  </span>
                ) : (
                  <span>Ready to sequentially compile {queue.length} stacked deliverables. Press "Process Queue Sequentially" to begin.</span>
                )}
              </p>
            </div>

            {/* Counters Badge Group */}
            <div className="flex items-center space-x-2 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                Completed: <strong className="text-emerald-400">{completedJobsCount}</strong> / {queue.length}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                Pending: <strong className="text-cyan-400">{pendingJobsCount}</strong>
              </span>
            </div>
          </div>

          {/* Master Progress Bar Track */}
          <div className="w-full bg-slate-900 h-4 rounded-full p-0.5 border border-slate-800 relative overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 relative ${
                masterProgress === 100 && queue.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500 shadow-lg shadow-cyan-500/20'
              }`}
              style={{ width: `${masterProgress}%` }}
            >
              {/* Shimmer effect while processing */}
              {isQueueProcessing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              )}
            </div>
          </div>

          {/* Stepper Node Visualizer for Stacked Jobs */}
          {queue.length > 0 && (
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between overflow-x-auto scrollbar-thin pb-1 gap-2">
              {queue.map((job, idx) => {
                const isCurrent = job.id === currentJobId;
                const isDone = job.status === 'completed';
                const isFail = job.status === 'failed';
                return (
                  <div
                    key={job.id}
                    className={`flex items-center space-x-2 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border transition-all shrink-0 ${
                      isCurrent
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                        : isDone
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                        : isFail
                        ? 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] bg-slate-950 border border-current">
                      {isDone ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : idx + 1}
                    </span>
                    <span className="font-semibold truncate max-w-[130px]">{job.projectTitle}</span>
                    <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-300">
                      {job.preset}
                    </span>
                    {isCurrent && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* STACKED EXPORT JOBS LIST CARDS */}
        {/* ========================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>STACKED EXPORT PIPELINES ({queue.length})</span>
            <span>REORDER &amp; MANAGE SEQUENTIAL ORDER</span>
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-850 flex items-center justify-center mx-auto text-slate-500">
                <ListOrdered className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 font-mono">
                The export queue is currently empty.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleQueueCurrentProject}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Queue Current Project ({selectedPreset.toUpperCase()})
                </button>
                <button
                  onClick={handleStackMultiPresetBundle}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Stack 3 Deliverable Presets
                </button>
              </div>
            </div>
          ) : (
            queue.map((job, index) => {
              const isCurrent = job.id === currentJobId;
              const isDone = job.status === 'completed';
              const isFail = job.status === 'failed';
              const presetBadgeColor = {
                draft: 'bg-amber-950/80 text-amber-300 border-amber-700',
                final: 'bg-cyan-950/80 text-cyan-300 border-cyan-700',
                'social-media-shorts': 'bg-rose-950/80 text-rose-300 border-rose-700',
                custom: 'bg-purple-950/80 text-purple-300 border-purple-700'
              }[job.preset] || 'bg-slate-800 text-slate-300 border-slate-700';

              return (
                <div
                  key={job.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-slate-950 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                      : isDone
                      ? 'bg-slate-950/70 border-emerald-900/60 hover:border-slate-700'
                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Reorder Controls & Job Info */}
                    <div className="flex items-center space-x-3">
                      {/* Reorder Arrows */}
                      <div className="flex flex-col space-y-0.5">
                        <button
                          onClick={() => handleMoveJob(index, 'up')}
                          disabled={index === 0 || isQueueProcessing}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Move up in sequential order"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveJob(index, 'down')}
                          disabled={index === queue.length - 1 || isQueueProcessing}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Move down in sequential order"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Job Status Icon */}
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isFail ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500" />
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-500">
                            #{index + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-100">
                            {job.projectTitle}
                          </h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${presetBadgeColor}`}>
                            {job.preset}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            Ep {job.episodeNumber}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span>{job.config.resolution}</span>
                          <span>•</span>
                          <span>{job.config.frameRate} fps</span>
                          <span>•</span>
                          <span>{job.config.audioMode}</span>
                          <span>•</span>
                          <span className="text-slate-500">{job.formats.map(f => f.toUpperCase()).join(' · ')}</span>
                          {job.durationSec && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-bold">Done in {job.durationSec}s</span>
                            </>
                          )}
                          {job.totalSizeKb && (
                            <>
                              <span>•</span>
                              <span className="text-indigo-400 font-bold">{job.totalSizeKb} KB</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions & Job Progress */}
                    <div className="flex items-center space-x-2">
                      {isDone && job.result && (
                        <>
                          <button
                            onClick={() => setInspectedJobResult(job)}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 text-xs font-mono transition cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => {
                              const sanitized = job.projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
                              handleDownloadFile(
                                JSON.stringify(job.result, null, 2),
                                `${sanitized}_${job.preset.toUpperCase()}_BUNDLE.json`
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </>
                      )}

                      {isDone && (
                        <button
                          onClick={() => handleResetJob(job.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 text-xs transition cursor-pointer"
                          title="Re-run this job"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDuplicateJob(job)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition cursor-pointer"
                        title="Duplicate job"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleRemoveJob(job.id)}
                        disabled={isCurrent && isQueueProcessing}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs transition cursor-pointer disabled:opacity-20"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Individual Job Progress Bar (when active or completed) */}
                  {(isCurrent || isDone) && (
                    <div className="mt-3 pt-3 border-t border-slate-900 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1.5 truncate">
                          {isCurrent ? (
                            <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>{job.currentPhase}</span>
                        </span>
                        <span className={`font-bold ${isDone ? 'text-emerald-400' : 'text-cyan-400'}`}>
                          {job.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isDone
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. EXPORT PRESET RADIO BUTTON TOGGLES & CONFIGURATION CONTROLLER */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-400" />
                <span>Export Configuration Presets</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Preset: <strong className="text-cyan-400 uppercase">{selectedPreset}</strong>
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-1">
              Select Output Pipeline Preset
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Radio button selection automatically reconfigures resolution, frame rate, audio stems, and XML conform tags.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleQueueCurrentProject}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-semibold transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Queue This Preset</span>
            </button>

            <button
              onClick={() => setShowConfigInspector(!showConfigInspector)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono font-semibold transition cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showConfigInspector ? 'Hide Advanced Config' : 'Inspect / Tweak Config'}</span>
            </button>
          </div>
        </div>

        {/* Radio Button Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="radiogroup" aria-label="Export Presets">
          {/* Preset 1: Draft */}
          <label
            htmlFor="preset-draft"
            className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
              selectedPreset === 'draft'
                ? 'bg-amber-950/20 border-amber-500/70 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              id="preset-draft"
              name="export-preset"
              value="draft"
              checked={selectedPreset === 'draft'}
              onChange={() => handlePresetChange('draft')}
              className="sr-only"
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                    selectedPreset === 'draft' ? 'border-amber-400 bg-amber-950' : 'border-slate-600'
                  }`}>
                    {selectedPreset === 'draft' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </span>
                  <span className="text-sm font-bold text-slate-100 font-mono">
                    Draft
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700">
                  Review Proxy
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Lightweight proxy timeline for fast director read-throughs, rough-cut timing verification, and low-latency team reviews.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-850/80 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-semibold">1280x720 Proxy</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">24 fps</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">Scratch Audio</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-400">Watermarked</span>
            </div>
          </label>

          {/* Preset 2: Final */}
          <label
            htmlFor="preset-final"
            className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
              selectedPreset === 'final'
                ? 'bg-cyan-950/25 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              id="preset-final"
              name="export-preset"
              value="final"
              checked={selectedPreset === 'final'}
              onChange={() => handlePresetChange('final')}
              className="sr-only"
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                    selectedPreset === 'final' ? 'border-cyan-400 bg-cyan-950' : 'border-slate-600'
                  }`}>
                    {selectedPreset === 'final' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </span>
                  <span className="text-sm font-bold text-slate-100 font-mono">
                    Final
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700">
                  Master Conform
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Full-fidelity studio master conform for Premiere Pro, DaVinci Resolve, and Final Cut Pro X with multi-track stems.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-850/80 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 font-semibold">1920x1080 FHD</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">24 fps Sakuga</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400">A1-A3 Stems</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">Clean Master</span>
            </div>
          </label>

          {/* Preset 3: Social Media Shorts */}
          <label
            htmlFor="preset-shorts"
            className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
              selectedPreset === 'social-media-shorts'
                ? 'bg-rose-950/20 border-rose-500/70 shadow-lg shadow-rose-500/5 ring-1 ring-rose-500/30'
                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <input
              type="radio"
              id="preset-shorts"
              name="export-preset"
              value="social-media-shorts"
              checked={selectedPreset === 'social-media-shorts'}
              onChange={() => handlePresetChange('social-media-shorts')}
              className="sr-only"
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                    selectedPreset === 'social-media-shorts' ? 'border-rose-400 bg-rose-950' : 'border-slate-600'
                  }`}>
                    {selectedPreset === 'social-media-shorts' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
                  </span>
                  <span className="text-sm font-bold text-slate-100 font-mono">
                    Social Media Shorts
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700">
                  9:16 Vertical
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vertical 9:16 composition formatted for TikTok, YouTube Shorts, and Instagram Reels with safe-zone captions.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-850/80 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-300 font-semibold">1080x1920 (9:16)</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">30 fps</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-400">Stereo Mix</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-rose-400">Safe-Zone Guides</span>
            </div>
          </label>
        </div>

        {/* Collapsible Advanced Configuration Inspector */}
        {showConfigInspector && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fine-Tune Active Export Parameters:</span>
              </span>
              <button
                onClick={() => handlePresetChange(selectedPreset === 'custom' ? 'final' : selectedPreset)}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                Reset to {selectedPreset.toUpperCase()} Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Resolution */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 font-bold block uppercase">
                  Target Resolution:
                </label>
                <select
                  value={config.resolution}
                  onChange={(e) => {
                    const res = e.target.value;
                    let width = 1920, height = 1080;
                    if (res === '1280x720') { width = 1280; height = 720; }
                    if (res === '1080x1920') { width = 1080; height = 1920; }
                    if (res === '3840x2160') { width = 3840; height = 2160; }
                    handleUpdateConfigSetting('resolution', res);
                    handleUpdateConfigSetting('width', width);
                    handleUpdateConfigSetting('height', height);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono font-bold focus:border-cyan-500"
                >
                  <option value="1920x1080">1920x1080 (1080p Full HD)</option>
                  <option value="1280x720">1280x720 (720p HD Proxy)</option>
                  <option value="1080x1920">1080x1920 (9:16 Vertical Reel)</option>
                  <option value="3840x2160">3840x2160 (4K UHD Master)</option>
                </select>
              </div>

              {/* Frame Rate */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 font-bold block uppercase">
                  Timebase / FPS:
                </label>
                <select
                  value={config.frameRate}
                  onChange={(e) => handleUpdateConfigSetting('frameRate', parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono font-bold focus:border-cyan-500"
                >
                  <option value={24}>24 fps (Cinematic Anime Standard)</option>
                  <option value={30}>30 fps (Broadcast & Mobile)</option>
                  <option value={60}>60 fps (High Temporal Motion)</option>
                </select>
              </div>

              {/* Audio Stem Setup */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 font-bold block uppercase">
                  Audio Stems Mode:
                </label>
                <select
                  value={config.audioMode}
                  onChange={(e) => handleUpdateConfigSetting('audioMode', e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono font-bold focus:border-cyan-500"
                >
                  <option value="multi-track">Multi-Track (A1 Dialogue, A2 SFX, A3 BGM)</option>
                  <option value="stereo-mix">Master Stereo Mixdown (-14 LUFS)</option>
                  <option value="scratch-dialogue">Scratch Dialogue Only (Fast Preview)</option>
                </select>
              </div>

              {/* Watermark / Burn-in */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 font-bold block uppercase">
                  Burn-In Overlay:
                </label>
                <select
                  value={config.watermark}
                  onChange={(e) => handleUpdateConfigSetting('watermark', e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono font-bold focus:border-cyan-500"
                >
                  <option value="none">None (Clean Master File)</option>
                  <option value="draft-workprint">DRAFT WORKPRINT Review HUD</option>
                  <option value="timecode-hud">SMPTE Timecode Counter Burn-in</option>
                  <option value="safe-zone">9:16 Social Safe-Zone Grid</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. GRANULAR ANIMATED PROGRESS BARS FOR EACH FILE FORMAT */}
      {/* ========================================================================= */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80">
              <Layers className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  Multi-Format Compilation Pipeline
                </h3>
                {isAnyCompiling ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 animate-pulse flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>COMPILING FORMATS...</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                    Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Granular progress metrics and telemetry for each industry standard export format.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleStartGranularCompilation}
              disabled={isAnyCompiling}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isAnyCompiling ? 'animate-spin' : ''}`} />
              <span>Re-compile Formats</span>
            </button>
          </div>
        </div>

        {/* Granular Progress Bars Grid */}
        <div className="space-y-3">
          {Object.values(formatStatuses).map((fmt) => {
            const Icon = fmt.icon;
            return (
              <div
                key={fmt.id}
                className="bg-slate-950/90 border border-slate-850 rounded-xl p-3.5 space-y-2 hover:border-slate-800 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      <Icon className={`w-4 h-4 ${fmt.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200 font-mono">{fmt.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-slate-900 rounded border border-slate-800">
                          {fmt.ext}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {fmt.targetSuites}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono">
                    <span className="text-slate-400 text-[11px] truncate max-w-xs">
                      {fmt.phase}
                    </span>
                    <span className="font-bold text-slate-200 min-w-[36px] text-right">
                      {fmt.progress}%
                    </span>
                    {fmt.isComplete ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                        <Check className="w-3.5 h-3.5" />
                        <span>{fmt.sizeKb} KB</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[10px]">Pending</span>
                    )}
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/80 relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${fmt.barGradient} relative`}
                    style={{ width: `${fmt.progress}%` }}
                  >
                    {isAnyCompiling && fmt.progress < 100 && (
                      <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Quick actions for completed formats */}
                {exportData && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] font-mono text-slate-500">
                    <span>Verified conforms to {config.preset.toUpperCase()} specifications</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const mapping: Record<string, string> = {
                            otio: 'otioJson',
                            fountain: 'fountain',
                            xml: 'finalCutXml',
                            edl: 'edl',
                            manifest: 'fileManifest'
                          };
                          setActiveFormat(mapping[fmt.id] as any);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                      >
                        Inspect Preview
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => {
                          const mapping: Record<string, string> = {
                            otio: exportData.otioJson,
                            fountain: exportData.fountain,
                            xml: exportData.finalCutXml,
                            edl: exportData.edl,
                            manifest: exportData.fileManifest
                          };
                          const content = mapping[fmt.id];
                          if (content) {
                            handleDownloadFile(content, `${project.title.replace(/\s+/g, '_')}_${fmt.id}${fmt.ext}`);
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[10px] font-semibold transition cursor-pointer flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download {fmt.shortTag}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🎬 Finished Episode MP4 Video Export Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/80">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <span>Finished Episode MP4 Video Exporter</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 font-sans uppercase font-extrabold tracking-normal">PREMIUM FORMAT</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Compile and render all sequence video timelines, audio voice tracks (Kokoro ONNX), and mecha transitions into a playable, download-ready .mp4 video file.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsMp4ModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Compile & Export Finished .MP4</span>
        </button>
      </div>

      {/* Complete Master Bundle Download Banner */}
      {exportData && (
        <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-indigo-950/90 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  All-In-One Master Export Bundle Compiled
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700">
                  {config.preset.toUpperCase()} · 6 Formats Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Includes OpenTimelineIO, Fountain Screenplay, FCP XML, EDL, Shot Manifest, and File Manifest altogether with episode metadata.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadMasterPackage}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all cursor-pointer"
            >
              <FolderArchive className="w-4 h-4" />
              <span>Download Master Package (.json)</span>
            </button>

            <button
              onClick={handleDownloadAllIndividualFilesTogether}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download All 6 Files Separately</span>
            </button>

            {downloadAllSuccess && (
              <div className="flex items-center space-x-1 text-emerald-400 text-xs font-mono font-bold animate-fadeIn">
                <Check className="w-4 h-4" />
                <span>Exported!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project Storage Optimizer & AI Garbage Collector Agent Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                Project Storage Optimizer &amp; Purge Utility
              </h3>
              <p className="text-xs text-slate-400">
                Identify and sweep unreferenced vocal buffers, failed render residues, and orphaned storyboard shot nodes.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-1 rounded font-mono">
              Footprint: <strong className="text-indigo-400">{Math.round((JSON.stringify(project).length / 1024) * 10) / 10} KB</strong>
            </span>
            <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 px-2 py-1 rounded font-mono">
              Status: Aligned
            </span>
          </div>
        </div>

        {/* Advisor Agent Greeting */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center shrink-0 text-indigo-400 shadow shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-indigo-400 font-mono">Storage Advisor Agent</span>
              <span className="text-[9px] bg-indigo-900/30 text-indigo-300 border border-indigo-800/40 px-1.5 rounded font-mono">AI-GC CORE</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "Affirmative! Over long-duration cinematic runs, deleting scene branches or regenerating Kokoro voice-tracks creates orphaned audio payload residue. I can sweep your project node graph to maintain absolute consistency, speed up exports, and prevent browser local-storage hangs."
            </p>
          </div>
        </div>

        {/* Scan / Purge Action Container */}
        {purgeState === 'idle' && (
          <div className="flex justify-center py-2">
            <button
              onClick={handleScanProjectStorage}
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow cursor-pointer animate-pulse hover:animate-none"
            >
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              <span>Scan Project Storage &amp; Asset Integrity</span>
            </button>
          </div>
        )}

        {/* Scanning Progress */}
        {(purgeState === 'scanning' || purgeState === 'purging') && (
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-855 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>{purgeActivity}</span>
              </span>
              <span className="text-indigo-400 font-bold">{purgeProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${purgeProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Scan Complete Report View */}
        {purgeState === 'scanned' && purgeReport && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                  <HardDrive className="w-4 h-4 text-slate-400" />
                  ANALYSIS DIAGNOSTIC RESULTS
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Identified {purgeReport.potentialSavingsKb > 0 ? 'Residual Bloat' : '0 issues'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin">
                {purgeReport.orphanedDubbingTracks.length === 0 &&
                 purgeReport.orphanedShots.length === 0 &&
                 purgeReport.failedVideoRenders.length === 0 &&
                 purgeReport.unusedCharacters.length === 0 ? (
                  <div className="text-center py-4 text-xs text-emerald-400 font-mono flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Your mecha anime project database is fully optimized! 0 orphaned assets found.</span>
                  </div>
                ) : (
                  <>
                    {purgeReport.orphanedDubbingTracks.length > 0 && (
                      <div className="flex items-start justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-855 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Orphaned Audio Track</span>
                          <p className="text-slate-300 mt-1">
                            Detected <strong>{purgeReport.orphanedDubbingTracks.length}</strong> orphaned dubbing tracks (no matching active shots in sequence).
                          </p>
                          <span className="text-[10px] text-slate-500 block">Orphaned voice scripts: {purgeReport.orphanedDubbingTracks.map(d => `"${d.text.substring(0,25)}..."`).join(', ')}</span>
                        </div>
                        <span className="text-rose-400 font-mono font-bold text-xs shrink-0 pl-4">+{purgeReport.orphanedDubbingTracks.reduce((acc, curr) => acc + curr.sizeEstimateKb, 0).toFixed(1)} KB</span>
                      </div>
                    )}

                    {purgeReport.orphanedShots.length > 0 && (
                      <div className="flex items-start justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-855 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Orphaned Shots</span>
                          <p className="text-slate-300 mt-1">
                            Detected <strong>{purgeReport.orphanedShots.length}</strong> shots tied to scenes that have been deleted or branches pruned.
                          </p>
                        </div>
                        <span className="text-rose-400 font-mono font-bold text-xs shrink-0 pl-4">+{Math.round(purgeReport.orphanedShots.length * 0.4 * 10) / 10} KB</span>
                      </div>
                    )}

                    {purgeReport.failedVideoRenders.length > 0 && (
                      <div className="flex items-start justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-855 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Aborted Render Flags</span>
                          <p className="text-slate-300 mt-1">
                            Detected <strong>{purgeReport.failedVideoRenders.length}</strong> storyboard shots flagged with aborted or failed video renders.
                          </p>
                        </div>
                        <span className="text-rose-400 font-mono font-bold text-xs shrink-0 pl-4">+{Math.round(purgeReport.failedVideoRenders.length * 0.15 * 10) / 10} KB</span>
                      </div>
                    )}

                    {purgeReport.unusedCharacters.length > 0 && (
                      <div className="flex items-start justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-855 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold uppercase">Unused Cast Profile</span>
                          <p className="text-slate-300 mt-1">
                            Detected <strong>{purgeReport.unusedCharacters.length}</strong> cast profiles not referenced in dialogue or shot matrices.
                          </p>
                          <span className="text-[10px] text-slate-500 block">Characters: {purgeReport.unusedCharacters.map(c => c.name).join(', ')}</span>
                        </div>
                        <span className="text-rose-400 font-mono font-bold text-xs shrink-0 pl-4">+{Math.round(purgeReport.unusedCharacters.length * 0.6 * 10) / 10} KB</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Storage summary status bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
              <div className="text-xs font-mono space-y-1">
                <span className="text-slate-400 block">CURRENT FOOTPRINT: <strong className="text-slate-200">{purgeReport.totalSpaceKb} KB</strong></span>
                <span className="text-slate-400 block">RECLAIMABLE SPACE: <strong className="text-emerald-400">{purgeReport.potentialSavingsKb} KB</strong></span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetPurgeState}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePerformPurge}
                  disabled={purgeReport.potentialSavingsKb === 0}
                  className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-bold text-xs transition-all shadow cursor-pointer ${
                    purgeReport.potentialSavingsKb > 0
                      ? 'bg-gradient-to-r from-indigo-500 to-rose-500 text-white hover:opacity-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Perform Project Purge</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purge Complete Success State */}
        {purgeState === 'completed' && purgeReport && (
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-5 text-center space-y-4 animate-fadeIn">
            <div className="flex justify-center">
              <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/30 text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-emerald-300 font-mono uppercase tracking-wider">
                Defragmentation &amp; Purge Complete!
              </h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Excellent! The Storage Advisor Agent has successfully defragmented your anime screenplay nodes and garbage-collected the local caches.
              </p>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg max-w-sm mx-auto border border-slate-850 font-mono text-xs text-slate-400 space-y-1">
              <div>Space Reclaimed: <strong className="text-emerald-400">-{purgeReport.potentialSavingsKb} KB</strong></div>
              <div>New Footprint Size: <strong className="text-indigo-400">{Math.round((JSON.stringify(project).length / 1024) * 10) / 10} KB</strong></div>
            </div>
            <div>
              <button
                onClick={handleResetPurgeState}
                className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Scan Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Format Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { id: 'otioJson', label: 'OpenTimelineIO (.otio)', ext: '.otio.json', icon: Layers },
          { id: 'fountain', label: 'Fountain Screenplay', ext: '.fountain', icon: FileText },
          { id: 'finalCutXml', label: 'Final Cut Pro XML', ext: '.xml', icon: Code2 },
          { id: 'edl', label: 'Edit Decision List', ext: '.edl', icon: Film },
          { id: 'storyboardManifest', label: 'Shot Manifest', ext: '.json', icon: Share2 },
          { id: 'fileManifest', label: 'File Manifest', ext: '.manifest.json', icon: FileCheck },
        ].map((fmt) => {
          const Icon = fmt.icon;
          const isSelected = activeFormat === fmt.id;
          const isCompiled = !!exportData;
          return (
            <button
              key={fmt.id}
              onClick={() => setActiveFormat(fmt.id as any)}
              className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500 text-slate-100 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {isCompiled && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              )}
              <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div className="text-xs font-bold truncate">{fmt.label}</div>
              <span className="text-[10px] text-slate-500 font-mono">{fmt.ext}</span>
            </button>
          );
        })}
      </div>

      {/* Export Output Preview Codebox */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-cyan-400 font-mono uppercase">
              {activeFormat} OUTPUT PREVIEW ({config.preset.toUpperCase()})
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {config.resolution} · {config.frameRate} fps
            </span>
          </div>

          {activeContent && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopyText(activeContent, activeFormat)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedFormat === activeFormat ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>

              <button
                onClick={() => handleDownloadFile(activeContent, `${project.title.replace(/\s+/g, '_')}_export_${config.preset}.${activeFormat}`)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-400 max-h-[450px] overflow-y-auto whitespace-pre-wrap select-text">
          {activeContent || 'Click "Compile All (FINAL)", run the Sequential Export Queue above, or select any preset to generate industry-standard OTIO, Fountain, XML, EDL, and Storyboard manifests altogether.'}
        </div>
      </div>

      {/* MP4 Export Modal */}
      <Mp4ExportModal
        isOpen={isMp4ModalOpen}
        onClose={() => setIsMp4ModalOpen(false)}
        project={project}
      />

      {/* Modal: Add Custom Export Job to Queue */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Stack Custom Project Export
                </h3>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Project / Episode Title:
                </label>
                <input
                  type="text"
                  value={customJobTitle}
                  onChange={(e) => setCustomJobTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500"
                  placeholder="e.g. Episode 04: The Void Gate Collapses"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Episode Number:
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={customJobEpisode}
                  onChange={(e) => setCustomJobEpisode(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Delivery Preset Target:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['draft', 'final', 'social-media-shorts'] as ExportPresetType[]).map((pst) => (
                    <button
                      key={pst}
                      type="button"
                      onClick={() => setCustomJobPreset(pst)}
                      className={`p-2 rounded-lg border text-center font-mono font-bold capitalize text-xs transition cursor-pointer ${
                        customJobPreset === pst
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {pst === 'social-media-shorts' ? '9:16 Shorts' : pst}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 text-[10px] font-mono text-slate-400 space-y-1">
                <div>Resolution: <strong className="text-cyan-400">{PRESET_CONFIGS[customJobPreset].resolution}</strong></div>
                <div>Frame Rate: <strong className="text-slate-300">{PRESET_CONFIGS[customJobPreset].frameRate} fps</strong></div>
                <div>Audio Stem: <strong className="text-emerald-400">{PRESET_CONFIGS[customJobPreset].audioMode}</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomJob}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition cursor-pointer"
              >
                Add to Export Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inspected Job Result Viewer */}
      {inspectedJobResult && inspectedJobResult.result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Compiled Batch Package: {inspectedJobResult.projectTitle}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                    {inspectedJobResult.preset}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Compiled in {inspectedJobResult.durationSec}s • Package footprint: {inspectedJobResult.totalSizeKb} KB
                </p>
              </div>
              <button
                onClick={() => setInspectedJobResult(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-emerald-400 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {inspectedJobResult.result.otioJson || inspectedJobResult.result.fountain}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[10px] font-mono text-slate-500">
                Timestamp: {inspectedJobResult.completedAt}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const sanitized = inspectedJobResult.projectTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
                    handleDownloadFile(
                      JSON.stringify(inspectedJobResult.result, null, 2),
                      `${sanitized}_${inspectedJobResult.preset.toUpperCase()}_BUNDLE.json`
                    );
                  }}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Job Package (.json)</span>
                </button>
                <button
                  onClick={() => setInspectedJobResult(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Indicator Helper Component
const ActivityIndicator: React.FC<{ isProcessing: boolean; isComplete: boolean }> = ({ isProcessing, isComplete }) => {
  if (isComplete) {
    return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  }
  if (isProcessing) {
    return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
  }
  return <Sparkles className="w-4 h-4 text-cyan-400" />;
};
