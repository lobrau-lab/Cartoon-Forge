import React, { useState, useRef } from 'react';
import { ShotItem } from '../types';
import { 
  GripHorizontal, 
  Clock, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Volume2, 
  Sparkles,
  Scissors,
  Blend,
  SunDim,
  FileText,
  Tag,
  Check,
  Edit3,
  Sliders,
  SlidersHorizontal,
  Search,
  X,
  Copy,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
  Sun,
  Palette,
  Camera,
  Film,
  Zap,
  Info,
  RefreshCw
} from 'lucide-react';

interface TimelineViewProps {
  shots: ShotItem[];
  sceneNumber: number;
  selectedShotId?: string | null;
  onSelectShot: (shotId: string) => void;
  onReorderShots: (reorderedShots: ShotItem[]) => void;
  onUpdateShot?: (shotId: string, updates: Partial<ShotItem>) => void;
  onDuplicateShot?: (shotId: string) => void;
  onGenerateShotKeyframe?: (shot: ShotItem) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  shots,
  sceneNumber,
  selectedShotId,
  onSelectShot,
  onReorderShots,
  onUpdateShot,
  onDuplicateShot,
  onGenerateShotKeyframe
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePlayheadTime, setActivePlayheadTime] = useState<number>(0);
  const [openTransitionMenuIndex, setOpenTransitionMenuIndex] = useState<number | null>(null);
  
  // Focus Mode Toggle State
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Multi-Select Mode & Batch Tagging State
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedShotIdsForBatch, setSelectedShotIdsForBatch] = useState<string[]>([]);

  // Batch Update Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [batchLighting, setBatchLighting] = useState<string>('Sunset Golden Hour');
  const [batchPreset, setBatchPreset] = useState<string>('Kyoto Sakuga High Dynamics');
  const [batchCamera, setBatchCamera] = useState<string>('');
  const [batchShotType, setBatchShotType] = useState<string>('');
  const [batchTransition, setBatchTransition] = useState<string>('');
  const [batchDuration, setBatchDuration] = useState<string>('');
  const [batchNotesTag, setBatchNotesTag] = useState<string>('');
  const [batchSuccessToast, setBatchSuccessToast] = useState<string | null>(null);

  const playheadRef = useRef<NodeJS.Timeout | null>(null);

  // Total scene duration calculation based on all shots
  const totalDurationSec = shots.reduce((sum, s) => sum + (s.durationSec || 3), 0);

  // Search filter matching
  const filteredShots = shots.filter((shot) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const promptMatch = shot.actionPrompt.toLowerCase().includes(q);
    const dialogueMatch = shot.dialogueLine?.toLowerCase().includes(q) || false;
    const charMatch = shot.charactersInShot?.some(c => c.toLowerCase().includes(q)) || false;
    const shotTypeMatch = shot.shotType.toLowerCase().includes(q);
    const cameraMatch = shot.cameraMovement.toLowerCase().includes(q);
    const notesMatch = shot.directorNotes?.toLowerCase().includes(q) || false;
    const lightingMatch = shot.lightingCondition?.toLowerCase().includes(q) || false;
    const presetMatch = shot.renderingPreset?.toLowerCase().includes(q) || false;

    return promptMatch || dialogueMatch || charMatch || shotTypeMatch || cameraMatch || notesMatch || lightingMatch || presetMatch;
  });

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newShots = [...shots];
    const [movedShot] = newShots.splice(draggedIndex, 1);
    newShots.splice(targetIndex, 0, movedShot);

    // Re-assign shot numbers cleanly
    const updatedShots = newShots.map((shot, idx) => ({
      ...shot,
      shotNumber: idx + 1
    }));

    onReorderShots(updatedShots);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Button move handlers for accessibility
  const handleMoveShot = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shots.length) return;

    const newShots = [...shots];
    const [movedShot] = newShots.splice(index, 1);
    newShots.splice(targetIndex, 0, movedShot);

    const updatedShots = newShots.map((shot, idx) => ({
      ...shot,
      shotNumber: idx + 1
    }));

    onReorderShots(updatedShots);
  };

  // Timeline playback simulation
  const togglePlayback = () => {
    if (isPlaying) {
      if (playheadRef.current) clearInterval(playheadRef.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playheadRef.current = setInterval(() => {
        setActivePlayheadTime((prev) => {
          if (prev >= totalDurationSec) {
            if (playheadRef.current) clearInterval(playheadRef.current);
            setIsPlaying(false);
            return 0;
          }
          return Math.min(totalDurationSec, prev + 0.1);
        });
      }, 100);
    }
  };

  // Time ruler ticks
  const generateRulerTicks = () => {
    const ticks = [];
    const step = Math.max(1, Math.ceil(totalDurationSec / 10));
    for (let t = 0; t <= totalDurationSec; t += step) {
      ticks.push(t);
    }
    return ticks;
  };

  // Quick director tag insertion for single shot
  const handleAddTagToNotes = (shot: ShotItem, tag: string) => {
    if (!onUpdateShot) return;
    const currentNotes = shot.directorNotes || '';
    const newNotes = currentNotes.includes(tag) 
      ? currentNotes 
      : currentNotes ? `${currentNotes} ${tag}` : tag;
    onUpdateShot(shot.id, { directorNotes: newNotes });
  };

  // Batch Tag Application for Multi-Selected Shots
  const handleApplyBatchTag = (tag: string) => {
    if (!onUpdateShot || selectedShotIdsForBatch.length === 0) return;
    selectedShotIdsForBatch.forEach((shotId) => {
      const shot = shots.find(s => s.id === shotId);
      if (shot) {
        const currentNotes = shot.directorNotes || '';
        const newNotes = currentNotes.includes(tag)
          ? currentNotes
          : currentNotes ? `${currentNotes} ${tag}` : tag;
        onUpdateShot(shotId, { directorNotes: newNotes });
      }
    });
  };

  // Batch Duration Application
  const handleApplyBatchDuration = (duration: number) => {
    if (!onUpdateShot || selectedShotIdsForBatch.length === 0) return;
    selectedShotIdsForBatch.forEach((shotId) => {
      onUpdateShot(shotId, { durationSec: duration });
    });
  };

  // Execute Comprehensive Batch Metadata Update Modal
  const handleExecuteBatchMetadataUpdate = () => {
    if (!onUpdateShot || selectedShotIdsForBatch.length === 0) return;

    selectedShotIdsForBatch.forEach((shotId) => {
      const updates: Partial<ShotItem> = {};
      if (batchLighting.trim()) updates.lightingCondition = batchLighting.trim();
      if (batchPreset.trim()) updates.renderingPreset = batchPreset.trim();
      if (batchCamera) updates.cameraMovement = batchCamera as any;
      if (batchShotType) updates.shotType = batchShotType as any;
      if (batchTransition) updates.transition = batchTransition as any;
      if (batchDuration && !isNaN(parseFloat(batchDuration))) updates.durationSec = parseFloat(batchDuration);
      
      if (batchNotesTag.trim()) {
        const shot = shots.find(s => s.id === shotId);
        const existing = shot?.directorNotes || '';
        updates.directorNotes = existing ? `${existing} ${batchNotesTag.trim()}` : batchNotesTag.trim();
      }

      onUpdateShot(shotId, updates);
    });

    setIsBatchModalOpen(false);
    setBatchSuccessToast(`Updated ${selectedShotIdsForBatch.length} shots with bulk metadata!`);
    setTimeout(() => setBatchSuccessToast(null), 3000);
  };

  const handleToggleShotBatchSelect = (shotId: string) => {
    setSelectedShotIdsForBatch((prev) => 
      prev.includes(shotId) ? prev.filter(id => id !== shotId) : [...prev, shotId]
    );
  };

  const handleSelectAllBatch = () => {
    if (selectedShotIdsForBatch.length === filteredShots.length) {
      setSelectedShotIdsForBatch([]);
    } else {
      setSelectedShotIdsForBatch(filteredShots.map(s => s.id));
    }
  };

  const handleSetTransition = (shotId: string, transition: 'Cut' | 'Dissolve' | 'Fade') => {
    if (onUpdateShot) {
      onUpdateShot(shotId, { transition });
    }
    setOpenTransitionMenuIndex(null);
  };

  // Cumulative start time calculation
  let currentAccumulatedTime = 0;

  return (
    <div className={`transition-all duration-300 ${
      isFocusMode 
        ? 'fixed inset-3 z-50 bg-slate-950/98 border-2 border-amber-500/50 rounded-2xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-y-auto' 
        : 'bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-2xl space-y-4'
    }`}>
      {/* Toast Notification for Batch Updates */}
      {batchSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-amber-300 flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{batchSuccessToast}</span>
        </div>
      )}

      {/* Timeline Header Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-950 text-amber-400 border border-amber-800 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Scene #{sceneNumber} Sequence Timeline
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                {shots.length} Shots
              </span>
              {isFocusMode && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 animate-pulse font-bold">
                  FOCUS MODE ACTIVE
                </span>
              )}
            </div>
            {!isFocusMode && (
              <p className="text-[11px] text-slate-400">
                Drag-and-drop shot blocks to reorder • Set boundary transitions • Edit director cues & shot durations
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Focus Mode Toggle Switch */}
          <button
            type="button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-md ${
              isFocusMode
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-2 ring-emerald-400/50'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
            }`}
            title="Toggle Focus Mode to maximize editor workspace"
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFocusMode ? 'Exit Focus' : 'Focus Mode'}</span>
          </button>

          {/* Multi-Select Mode Toggle Button */}
          <button
            type="button"
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              if (isMultiSelectMode) setSelectedShotIdsForBatch([]);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              isMultiSelectMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{isMultiSelectMode ? 'Multi-Select Active' : 'Batch Multi-Select'}</span>
          </button>

          {/* Total Duration Indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Total: {totalDurationSec.toFixed(1)}s</span>
          </div>

          {/* Regenerate Failed Shots in Timeline */}
          {onGenerateShotKeyframe && shots.some(s => s.status !== 'ready' || !s.keyframeUrl) && (
            <button
              onClick={async () => {
                const unreadyShots = shots.filter(s => s.status !== 'ready' || !s.keyframeUrl);
                for (const shot of unreadyShots) {
                  onSelectShot(shot.id);
                  await onGenerateShotKeyframe(shot);
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-gradient-to-r from-rose-600 to-amber-600 hover:opacity-90 text-white shadow-md cursor-pointer"
              title="Automatically trigger keyframe generation for unready shots in this scene"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-200" />
              <span>Regenerate Failed ({shots.filter(s => s.status !== 'ready' || !s.keyframeUrl).length})</span>
            </button>
          )}

          {/* Timeline Playback Simulator */}
          <button
            onClick={togglePlayback}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-rose-500 text-slate-950 shadow-md ring-2 ring-rose-400/50'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Preview Timeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Input Bar & Active Filters (Hidden or Compact in Focus Mode) */}
      {!isFocusMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shots by keyword, action prompt, character name, dialogue, lighting, or preset..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {searchQuery.trim() && (
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Filtered {filteredShots.length} of {shots.length} shots
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-amber-400 underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}

      {/* Multi-Select Batch Actions Bar & Batch Metadata Update Modal Launcher */}
      {(isMultiSelectMode || selectedShotIdsForBatch.length > 0) && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAllBatch}
              className="flex items-center space-x-1 text-xs font-bold text-amber-300 bg-slate-900 px-2.5 py-1 rounded border border-amber-700/80 hover:bg-slate-850"
            >
              {selectedShotIdsForBatch.length === filteredShots.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-amber-400" />
                  <span>Select All ({filteredShots.length})</span>
                </>
              )}
            </button>

            <span className="text-xs font-mono text-amber-200 font-bold">
              {selectedShotIdsForBatch.length} Shots Selected
            </span>

            {/* Batch Update Metadata Modal Button */}
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              disabled={selectedShotIdsForBatch.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-md border border-amber-300 transition-all disabled:opacity-40"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Batch Update Metadata</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold text-amber-400 flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span>Quick Tag:</span>
            </span>
            {['#Action', '#Dialogue', '#Transition', '#Sakuga', '#VFX', '#Cinematic', '#WideShot', '#Climax'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleApplyBatchTag(tag)}
                disabled={selectedShotIdsForBatch.length === 0}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-amber-800 text-amber-300 hover:bg-amber-500 hover:text-slate-950 transition-all disabled:opacity-40"
              >
                {tag}
              </button>
            ))}

            <div className="h-4 w-px bg-amber-800/80 mx-1" />

            <span className="text-[10px] uppercase font-mono font-bold text-amber-400">Duration:</span>
            {[2, 3, 5, 8].map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => handleApplyBatchDuration(dur)}
                disabled={selectedShotIdsForBatch.length === 0}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-amber-800 text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-all disabled:opacity-40"
              >
                {dur}s
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Batch Update Metadata Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Bulk Batch Metadata Update ({selectedShotIdsForBatch.length} Shots)
                </h3>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Apply bulk lighting conditions, rendering presets, camera movements, and shot types across all selected shots simultaneously.
            </p>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Lighting Condition Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Lighting Condition Preset</span>
                </label>
                <select
                  value={batchLighting}
                  onChange={(e) => setBatchLighting(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Sunset Golden Hour">Sunset Golden Hour (Warm & Volumetric)</option>
                  <option value="Cyberpunk Neon Blue/Pink">Cyberpunk Neon Blue/Pink (High Contrast Night)</option>
                  <option value="Dramatic High Contrast Chiaroscuro">Dramatic High Contrast Chiaroscuro</option>
                  <option value="Soft Natural Overcast Daylight">Soft Natural Overcast Daylight</option>
                  <option value="Night Moonlight Ambient">Night Moonlight Ambient</option>
                  <option value="Indoor Warm Tungsten Cozy">Indoor Warm Tungsten Cozy</option>
                </select>
              </div>

              {/* Rendering Preset Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rendering & Visual Preset</span>
                </label>
                <select
                  value={batchPreset}
                  onChange={(e) => setBatchPreset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Kyoto Sakuga High Dynamics">Kyoto Sakuga High Dynamics (Fluid Keyframes)</option>
                  <option value="Ufotable 3D VFX Compositing">Ufotable 3D VFX Compositing (Particle Effects)</option>
                  <option value="Makoto Shinkai Atmospheric Sky">Makoto Shinkai Atmospheric Sky & Reflections</option>
                  <option value="Trigger Energetic Impact Frames">Trigger Energetic Impact Frames (Aggressive Angles)</option>
                  <option value="Studio Ghibli Painterly Watercolor">Studio Ghibli Painterly Watercolor</option>
                </select>
              </div>

              {/* Camera Movement Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Camera Movement Override</span>
                </label>
                <select
                  value={batchCamera}
                  onChange={(e) => setBatchCamera(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">(Keep Existing Camera Movement)</option>
                  <option value="Static">Static Hold</option>
                  <option value="Pan Left">Pan Left</option>
                  <option value="Pan Right">Pan Right</option>
                  <option value="Tilt Up">Tilt Up</option>
                  <option value="Zoom In">Zoom In</option>
                  <option value="Tracking">Tracking Shot</option>
                  <option value="Orbit">Orbit Dynamic</option>
                </select>
              </div>

              {/* Shot Type Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>Shot Type framing Override</span>
                </label>
                <select
                  value={batchShotType}
                  onChange={(e) => setBatchShotType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">(Keep Existing Framing)</option>
                  <option value="Extreme Wide">Extreme Wide</option>
                  <option value="Wide">Wide</option>
                  <option value="Medium">Medium</option>
                  <option value="Close-Up">Close-Up</option>
                  <option value="Extreme Close-Up">Extreme Close-Up</option>
                  <option value="Dutch Angle">Dutch Angle</option>
                  <option value="Sakuga Impact">Sakuga Impact</option>
                </select>
              </div>

              {/* Duration & Tag Append */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-300">Set Duration (sec)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    placeholder="e.g. 4"
                    value={batchDuration}
                    onChange={(e) => setBatchDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-300">Append Director Cue Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. #climaxHold"
                    value={batchNotesTag}
                    onChange={(e) => setBatchNotesTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBatchMetadataUpdate}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg"
              >
                Apply Batch Changes to {selectedShotIdsForBatch.length} Shots
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Ruler Bar */}
      <div className="relative h-6 bg-slate-950 rounded-lg border border-slate-800/80 px-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="absolute left-2 text-amber-400 font-bold">00:00.0s</div>
        {generateRulerTicks().map((tick) => (
          <div key={tick} className="flex flex-col items-center">
            <div className="h-2 w-px bg-slate-700 mb-0.5" />
            <span>{tick}s</span>
          </div>
        ))}
        <div className="absolute right-2 text-amber-400 font-bold">{totalDurationSec.toFixed(1)}s</div>

        {/* Playhead Scrubber */}
        {totalDurationSec > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 transition-all duration-100"
            style={{
              left: `${Math.min(100, (activePlayheadTime / totalDurationSec) * 100)}%`
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -translate-x-1/2 -top-1 absolute shadow-lg ring-2 ring-rose-300" />
          </div>
        )}
      </div>

      {/* Filtered Shots Strip Empty State */}
      {filteredShots.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-dashed border-slate-800 space-y-2">
          <p className="text-xs text-slate-400 font-mono">No shots found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold text-amber-400 hover:underline"
          >
            Clear Search Query
          </button>
        </div>
      ) : (
        /* Scrollable Horizontal Strip for Drag-and-Drop Shots with Transitions & Controls */
        <div className="relative overflow-x-auto pb-6 pt-2 no-scrollbar">
          <div className="flex items-start space-x-2 min-w-max px-2 py-2">
            {filteredShots.map((shot, index) => {
              const shotStartTime = currentAccumulatedTime;
              currentAccumulatedTime += shot.durationSec || 3;
              const isSelected = selectedShotId === shot.id;
              const isBatchSelected = selectedShotIdsForBatch.includes(shot.id);
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const transitionType = shot.transition || 'Cut';

              return (
                <React.Fragment key={shot.id}>
                  {/* Shot Card Container with CSS Scaling Animation */}
                  <div
                    draggable={!isMultiSelectMode}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      if (isMultiSelectMode) {
                        handleToggleShotBatchSelect(shot.id);
                      } else {
                        onSelectShot(shot.id);
                      }
                    }}
                    className={`relative group flex-shrink-0 w-80 rounded-xl border p-3.5 transition-all duration-300 ease-out select-none ${
                      isMultiSelectMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                    } ${
                      isDragging
                        ? 'opacity-30 border-dashed border-amber-400 bg-slate-800 scale-95'
                        : isDragOver
                        ? 'border-2 border-amber-400 bg-amber-950/40 shadow-2xl scale-105 z-20'
                        : isBatchSelected
                        ? 'bg-amber-950/50 border-2 border-amber-400 ring-2 ring-amber-500/40 shadow-xl'
                        : isSelected
                        ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30 border-2 border-amber-400 ring-4 ring-amber-500/25 shadow-[0_0_25px_rgba(245,158,11,0.25)] scale-[1.03] z-20'
                        : 'bg-slate-950/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 hover:scale-[1.01]'
                    }`}
                  >
                    {/* Selected Active Glow Badge */}
                    {isSelected && !isMultiSelectMode && (
                      <div className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[9px] uppercase tracking-wider flex items-center space-x-1 shadow-lg ring-2 ring-amber-300 animate-pulse z-30">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                        <span>Active Edit Shot</span>
                      </div>
                    )}

                    {/* Batch Selection Checkbox Badge */}
                    {isMultiSelectMode && (
                      <div className="absolute -top-3 left-4 z-30">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleShotBatchSelect(shot.id);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border flex items-center space-x-1 shadow-md transition-all ${
                            isBatchSelected
                              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-500'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isBatchSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          <span>{isBatchSelected ? 'Selected' : 'Select'}</span>
                        </button>
                      </div>
                    )}

                    {/* Drag Handle & Reorder Control Bar */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2 mt-0.5">
                      <div className="flex items-center space-x-1.5">
                        <GripHorizontal className={`w-4 h-4 transition-colors ${isSelected ? 'text-amber-400' : 'text-slate-500 group-hover:text-amber-400'}`} />
                        <span className={`text-xs font-bold font-mono ${isSelected ? 'text-amber-300' : 'text-amber-400'}`}>
                          SHOT #{shot.shotNumber}
                        </span>
                      </div>

                      {/* Control Menu: Duplicate & Nudge Buttons */}
                      <div className="flex items-center space-x-1.5">
                        {/* Duplicate Button */}
                        {onDuplicateShot && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateShot(shot.id);
                            }}
                            className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 text-[10px] font-bold transition-all border border-slate-700"
                            title="Duplicate this shot configuration"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Duplicate</span>
                          </button>
                        )}

                        {/* Left / Right Nudge Buttons */}
                        <div className="flex items-center space-x-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveShot(index, 'left');
                            }}
                            disabled={index === 0}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20"
                            title="Move shot left"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveShot(index, 'right');
                            }}
                            disabled={index === shots.length - 1}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20"
                            title="Move shot right"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Keyframe Thumbnail */}
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900 relative border border-slate-800 mb-2.5">
                      <img
                        src={shot.keyframeUrl || 'https://picsum.photos/seed/keyframe/600/338'}
                        alt={shot.actionPrompt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-950/85 text-[9px] font-semibold text-amber-300 border border-amber-800/60 backdrop-blur">
                        {shot.shotType}
                      </div>
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/90 text-[9px] font-mono text-slate-300 backdrop-blur">
                        {shot.durationSec || 3}s
                      </div>
                    </div>

                    {/* Lighting & Rendering Badges */}
                    {(shot.lightingCondition || shot.renderingPreset) && (
                      <div className="flex flex-wrap items-center gap-1 mb-2">
                        {shot.lightingCondition && (
                          <span className="flex items-center space-x-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-800/80 truncate max-w-full">
                            <Sun className="w-2.5 h-2.5 flex-shrink-0 text-amber-400" />
                            <span className="truncate">{shot.lightingCondition}</span>
                          </span>
                        )}
                        {shot.renderingPreset && (
                          <span className="flex items-center space-x-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/90 text-indigo-300 border border-indigo-800/80 truncate max-w-full">
                            <Palette className="w-2.5 h-2.5 flex-shrink-0 text-indigo-400" />
                            <span className="truncate">{shot.renderingPreset}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Shot Specs & Dynamic Duration Slider */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Cam: {shot.cameraMovement}</span>
                        <span>T: {shotStartTime.toFixed(1)}s - {(shotStartTime + (shot.durationSec || 3)).toFixed(1)}s</span>
                      </div>

                      {/* Duration Adjustment Slider */}
                      <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 space-y-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                          <span className="flex items-center space-x-1 font-bold text-amber-400">
                            <Sliders className="w-3 h-3" />
                            <span>Duration:</span>
                          </span>
                          <span className="font-bold text-amber-300 bg-slate-900 px-1.5 py-0.2 rounded border border-amber-800">
                            {shot.durationSec || 3} seconds
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          step="0.5"
                          value={shot.durationSec || 3}
                          onChange={(e) => {
                            if (onUpdateShot) {
                              onUpdateShot(shot.id, { durationSec: parseFloat(e.target.value) });
                            }
                          }}
                          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                        />
                        <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                          <span>1s</span>
                          <span>6s</span>
                          <span>12s</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-200 line-clamp-2 italic font-sans leading-snug">
                        {shot.actionPrompt}
                      </p>

                      {shot.dialogueLine && (
                        <div className="flex items-center space-x-1 text-[10px] text-cyan-400 truncate bg-slate-900/90 px-2 py-1 rounded border border-slate-800 font-serif">
                          <Volume2 className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">"{shot.dialogueLine}"</span>
                        </div>
                      )}

                      {/* Director Production Notes Field */}
                      <div className="pt-2 border-t border-slate-800/80 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center space-x-1">
                            <FileText className="w-3 h-3 text-amber-400" />
                            <span>Director Cue Notes</span>
                          </label>

                          {/* Quick Tag Insert Buttons */}
                          <div className="flex items-center space-x-1">
                            {['#sakuga', '#lighting', '#sfx'].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => handleAddTagToNotes(shot, tag)}
                                className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-700 transition-colors"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          value={shot.directorNotes || ''}
                          onChange={(e) => {
                            if (onUpdateShot) {
                              onUpdateShot(shot.id, { directorNotes: e.target.value });
                            }
                          }}
                          placeholder="Add production cues e.g. #lighting warm sunset, hold camera on impact..."
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[11px] text-amber-200/90 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Reorder Drop Target Highlight Overlay */}
                    {isDragOver && (
                      <div className="absolute inset-0 rounded-xl bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center backdrop-blur-xs pointer-events-none">
                        <span className="text-xs font-bold text-amber-300 bg-slate-950/90 px-3 py-1 rounded-full border border-amber-500">
                          Drop Shot Here
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Transition Boundary Connector (Between Shot i and Shot i+1) */}
                  <div className="flex flex-col items-center justify-center self-center px-1 z-10 relative">
                    {/* Transition Pill Selector */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenTransitionMenuIndex(openTransitionMenuIndex === index ? null : index);
                        }}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-[10px] font-mono font-bold border transition-all shadow-md ${
                          transitionType === 'Cut'
                            ? 'bg-slate-950 text-slate-300 border-slate-700 hover:border-cyan-500 hover:text-cyan-400'
                            : transitionType === 'Dissolve'
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-700 hover:border-indigo-400'
                            : 'bg-rose-950 text-rose-300 border-rose-700 hover:border-rose-400'
                        }`}
                        title="Set Cut/Dissolve/Fade Transition"
                      >
                        {transitionType === 'Cut' && <Scissors className="w-3 h-3 text-cyan-400" />}
                        {transitionType === 'Dissolve' && <Blend className="w-3 h-3 text-indigo-400" />}
                        {transitionType === 'Fade' && <SunDim className="w-3 h-3 text-rose-400" />}
                        <span>{transitionType}</span>
                      </button>

                      {/* Transition Dropdown Popover */}
                      {openTransitionMenuIndex === index && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-36 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl z-50 space-y-1">
                          <div className="text-[9px] font-mono font-bold text-slate-400 px-2 py-0.5 border-b border-slate-800">
                            Boundary Transition
                          </div>
                          {[
                            { name: 'Cut', desc: 'Instant cut (0s)', icon: Scissors, color: 'text-cyan-400' },
                            { name: 'Dissolve', desc: 'Cross dissolve (1.0s)', icon: Blend, color: 'text-indigo-400' },
                            { name: 'Fade', desc: 'Fade to black (1.5s)', icon: SunDim, color: 'text-rose-400' }
                          ].map((t) => {
                            const Icon = t.icon;
                            const isActive = transitionType === t.name;
                            return (
                              <button
                                key={t.name}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetTransition(shot.id, t.name as any);
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-all ${
                                  isActive ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5">
                                  <Icon className={`w-3.5 h-3.5 ${t.color}`} />
                                  <div>
                                    <div className="text-xs">{t.name}</div>
                                    <div className="text-[8px] text-slate-500 font-mono">{t.desc}</div>
                                  </div>
                                </div>
                                {isActive && <Check className="w-3.5 h-3.5 text-amber-400" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

