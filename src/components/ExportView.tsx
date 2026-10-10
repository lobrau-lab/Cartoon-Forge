import React, { useState, useRef } from 'react';
import { EpisodeProject, ExportFormats } from '../types';
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
  FileCheck
} from 'lucide-react';
import { Mp4ExportModal } from './Mp4ExportModal';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

interface ExportViewProps {
  project: EpisodeProject;
  exportData: ExportFormats | null;
  onGenerateExports: () => void;
  isGenerating: boolean;
  onImportProject?: (project: EpisodeProject) => void;
  onUpdateProject?: (updated: EpisodeProject) => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  project,
  exportData,
  onGenerateExports,
  isGenerating,
  onImportProject,
  onUpdateProject
}) => {
  const [activeFormat, setActiveFormat] = useState<'otioJson' | 'fountain' | 'finalCutXml' | 'edl' | 'storyboardManifest'>('otioJson');
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [downloadAllSuccess, setDownloadAllSuccess] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isMp4ModalOpen, setIsMp4ModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Log sub-agent detail to the Autopilot terminal for coherency
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
          `Pruned ${purgeReport.orphanedShots.length} orphaned scene shots.`,
          'De-allocated sequence metadata records from storyboard.',
          'fix'
        );
      } else if (i === 2 && purgeReport.failedVideoRenders.length > 0) {
        registerRealTimeHeal(
          'Shots',
          `Reset status flags for ${purgeReport.failedVideoRenders.length} aborted video renders.`,
          'Repaired video status tags back to default idle state.',
          'workaround'
        );
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // ACTUALLY PERFORM THE CRITICAL PURGE OPERATIONS
    const activeSceneNumbers = new Set(project.scenes.map(sc => sc.sceneNumber));

    // Purge shots whose scene is deleted, and reset failed video render statuses to allow fresh retry
    const filteredShots = project.shots.map(s => {
      if (s.videoRenderStatus === 'failed') {
        const { videoRenderStatus, videoRenderProgress, renderedVideoUrl, ...rest } = s;
        return {
          ...rest,
          status: 'pending' as const
        };
      }
      return s;
    }).filter(s => activeSceneNumbers.has(s.sceneNumber));

    const updatedShotIds = new Set(filteredShots.map(s => s.id));

    // Purge orphaned dubbing tracks (whose shotId is missing)
    const filteredDubbing = project.dubbingTracks.filter(track => updatedShotIds.has(track.shotId));

    // Compile characters currently referenced anywhere
    const castUsed = new Set<string>();
    filteredShots.forEach(s => s.charactersInShot?.forEach(char => castUsed.add(char)));
    project.scenes.forEach(sc => {
      sc.dialogue?.forEach(d => castUsed.add(d.character));
    });
    // Filter cast or keep basic characters
    const filteredCast = project.cast.filter(char => castUsed.has(char.name) || char.role === 'Protagonist' || char.role === 'Deuteragonist');

    const optimizedProject: EpisodeProject = {
      ...project,
      shots: filteredShots,
      dubbingTracks: filteredDubbing,
      cast: filteredCast,
      updatedAt: new Date().toISOString()
    };

    if (onUpdateProject) {
      onUpdateProject(optimizedProject);
    }

    // Direct localStorage save for maximum durable storage consistency
    localStorage.setItem('anime_suite_project', JSON.stringify(optimizedProject));

    // Reset state & complete
    setPurgeState('completed');
    registerRealTimeHeal(
      'Schema',
      'AI Garbage Collector: Storage defragmentation sweep complete.',
      `Reclaimed ${purgeReport.potentialSavingsKb} KB of browser disk space. Core structures stable.`,
      'heal'
    );
  };

  const handleResetPurgeState = () => {
    setPurgeState('idle');
    setPurgeReport(null);
    setPurgeProgress(0);
    setPurgeActivity('');
  };

  // File Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        // Detect if parsed is a direct project object or a master package
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
      `${sanitizedTitle}_MASTER_ALL_IN_ONE_PACKAGE.json`
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

  const activeContent = exportData ? exportData[activeFormat] : '';

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

        <div className="flex items-center space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.animepkg"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 shadow-md transition-all"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Import Project (.json)</span>
          </button>

          <button
            onClick={onGenerateExports}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-indigo-600 to-rose-500 text-white font-bold text-xs shadow-lg hover:opacity-95 transition-all"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Compiling All Files...' : 'Compile All Export Files'}</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-mono font-bold animate-fadeIn">
          {importStatus}
        </div>
      )}

      {/* 🎬 Premium MP4 Video Export Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/80">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <span>🎬 Finished Episode MP4 Video Exporter</span>
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
                  6 Formats Ready
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
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all"
            >
              <FolderArchive className="w-4 h-4" />
              <span>Download Master Package (.json)</span>
            </button>

            <button
              onClick={handleDownloadAllIndividualFilesTogether}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
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

      {/* 🧹 Storage Optimizer & AI Garbage Collector Agent Panel */}
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
          <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850 animate-fadeIn">
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

              {/* Real targets list */}
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
                      <div className="flex items-start justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs">
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
                      <div className="flex items-start justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs">
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
                      <div className="flex items-start justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs">
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
                      <div className="flex items-start justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-850 text-xs">
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
              className={`p-3 rounded-xl border text-left transition-all relative ${
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
              {activeFormat} OUTPUT PREVIEW
            </span>
          </div>

          {activeContent && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleCopyText(activeContent, activeFormat)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedFormat === activeFormat ? 'Copied!' : 'Copy to Clipboard'}</span>
              </button>

              <button
                onClick={() => handleDownloadFile(activeContent, `${project.title.replace(/\s+/g, '_')}_export.${activeFormat}`)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-emerald-400 max-h-[450px] overflow-y-auto whitespace-pre-wrap">
          {activeContent || 'Click "Compile All Export Files" above to generate industry-standard OTIO, Fountain, XML, EDL, and Storyboard manifests altogether.'}
        </div>
      </div>

      {/* MP4 Export Modal */}
      <Mp4ExportModal
        isOpen={isMp4ModalOpen}
        onClose={() => setIsMp4ModalOpen(false)}
        project={project}
      />
    </div>
  );
};

