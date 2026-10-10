import React, { useState } from 'react';
import { EpisodeProject, ScriptScene, DialogueLine, ShotItem } from '../types';
import { OrchestraPositionPromptInjector } from './OrchestraPositionPromptInjector';
import { MoodColorPaletteSuggester } from './MoodColorPaletteSuggester';
import { normalizeEmotionToMood, MOOD_PALETTE_DATABASE } from '../utils/moodColorCorrelationEngine';
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Wand2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Film,
  Bot,
  GripVertical,
  Palette
} from 'lucide-react';

interface ScriptViewProps {
  project: EpisodeProject;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
  onRunScriptDoctor: (model: string) => void;
  onGenerateShotsFromScene: (scene: ScriptScene) => void;
  isGenerating: boolean;
  diagnosticReport: string;
  selectedTextModel?: string;
  onSelectTextModel?: (model: string) => void;
}

export const ScriptView: React.FC<ScriptViewProps> = ({
  project,
  onUpdateProject,
  onRunScriptDoctor,
  onGenerateShotsFromScene,
  isGenerating,
  diagnosticReport,
  selectedTextModel = 'gemini-3.5-flash',
  onSelectTextModel
}) => {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
  const [isAddingScene, setIsAddingScene] = useState(false);
  const [newHeading, setNewHeading] = useState('INT. COMMAND CORE - NIGHT');
  const [newAction, setNewAction] = useState('Red emergency strobe lights flash across the terminal controls.');
  const [newTransition, setNewTransition] = useState<'Cut' | 'Fade In' | 'Dissolve' | 'Fade Out' | 'Wipe' | string>('Cut');
  const [newDialogueChar, setNewDialogueChar] = useState(project.cast[0]?.name || 'REN');
  const [newDialogueLine, setNewDialogueLine] = useState('');
  const [newDialogueEmotion, setNewDialogueEmotion] = useState('Urgent');
  const [isEditingStyleNotes, setIsEditingStyleNotes] = useState(false);
  const [styleNotesDraft, setStyleNotesDraft] = useState('');

  // Target Scene Duration State for Pacing Meter
  const [targetSceneDuration, setTargetSceneDuration] = useState<number>(3.0);

  const handleUpdateActiveScene = (updatedScene: ScriptScene) => {
    const updatedScenes = [...project.scenes];
    updatedScenes[selectedSceneIndex] = updatedScene;
    onUpdateProject({ scenes: updatedScenes });
  };

  const handleUpdateShots = (updatedShots: ShotItem[]) => {
    onUpdateProject({ shots: updatedShots });
  };

  const handleDeleteDialogue = (dialogueIndex: number) => {
    if (!activeScene) return;
    const updatedDialogue = activeScene.dialogue.filter((_, idx) => idx !== dialogueIndex);
    handleUpdateActiveScene({
      ...activeScene,
      dialogue: updatedDialogue
    });
  };

  const handleUpdateDialogueEmotion = (dialogueIndex: number, newEmotion: string) => {
    if (!activeScene) return;
    const updatedDialogue = activeScene.dialogue.map((dlg, idx) => {
      if (idx === dialogueIndex) {
        return { ...dlg, emotion: newEmotion };
      }
      return dlg;
    });
    handleUpdateActiveScene({
      ...activeScene,
      dialogue: updatedDialogue
    });
  };

  // Helper to calculate dialogue-to-action details for any scene
  const getScenePacingStats = (sc: ScriptScene) => {
    if (!sc) return null;
    const dialogueCharCount = sc.dialogue ? sc.dialogue.reduce((sum, d) => sum + (d.line?.length || 0), 0) : 0;
    const actionCharCount = sc.action ? sc.action.length : 0;
    const totalCharCount = dialogueCharCount + actionCharCount;
    
    const dialoguePct = totalCharCount === 0 ? 50 : Math.round((dialogueCharCount / totalCharCount) * 100);
    const actionPct = 100 - dialoguePct;

    // Determine verbal / pacing classification
    let classification = 'Balanced';
    let styleColor = 'text-cyan-400';
    if (dialoguePct > 65) {
      classification = 'Dialogue-Heavy (Exposition)';
      styleColor = 'text-indigo-400';
    } else if (dialoguePct < 25) {
      classification = 'Action-Heavy (Cinematic)';
      styleColor = 'text-amber-400';
    }

    // Determine speed deviation vs target duration
    let pacingStatus: 'fast' | 'balanced' | 'slow' = 'balanced';
    if (sc.timingEstMin < targetSceneDuration * 0.7) {
      pacingStatus = 'fast';
    } else if (sc.timingEstMin > targetSceneDuration * 1.3) {
      pacingStatus = 'slow';
    }

    const ratio = sc.timingEstMin / (targetSceneDuration || 1);

    return {
      dialogueCharCount,
      actionCharCount,
      dialoguePct,
      actionPct,
      classification,
      styleColor,
      pacingStatus,
      ratio
    };
  };

  // Drag and Drop States for Scenes Reordering
  const [draggedSceneIndex, setDraggedSceneIndex] = useState<number | null>(null);
  const [dragOverSceneIndex, setDragOverSceneIndex] = useState<number | null>(null);

  const activeScene = project.scenes[selectedSceneIndex] || project.scenes[0];

  const handleDropScene = (targetIdx: number) => {
    if (draggedSceneIndex === null || draggedSceneIndex === targetIdx) return;

    const updatedScenes = [...project.scenes];
    const [draggedScene] = updatedScenes.splice(draggedSceneIndex, 1);
    updatedScenes.splice(targetIdx, 0, draggedScene);

    // Build map for old to new scene numbers
    const oldToNewMap: Record<number, number> = {};
    const reindexedScenes = updatedScenes.map((scene, index) => {
      const newSceneNum = index + 1;
      oldToNewMap[scene.sceneNumber] = newSceneNum;
      return {
        ...scene,
        sceneNumber: newSceneNum,
      };
    });

    // Also update all shots to map their old sceneNumber to the new sceneNumber
    const updatedShots = project.shots.map(shot => {
      const newSceneNum = oldToNewMap[shot.sceneNumber];
      if (newSceneNum !== undefined) {
        return {
          ...shot,
          sceneNumber: newSceneNum
        };
      }
      return shot;
    });

    onUpdateProject({
      scenes: reindexedScenes,
      shots: updatedShots
    });

    setSelectedSceneIndex(targetIdx);
    setDraggedSceneIndex(null);
    setDragOverSceneIndex(null);
  };

  const handleAddScene = () => {
    if (!newHeading) return;
    const newSc: ScriptScene = {
      sceneNumber: project.scenes.length + 1,
      heading: newHeading,
      location: newHeading.split('-')[0] || 'LOCATION',
      timeOfDay: newHeading.includes('NIGHT') ? 'NIGHT' : 'DAY',
      action: newAction,
      timingEstMin: 3.0,
      styleNotes: `Style LoRA alignment: ${project.style.loraTag}`,
      transition: newTransition || 'Cut',
      dialogue: []
    };
    onUpdateProject({ scenes: [...project.scenes, newSc] });
    setIsAddingScene(false);
    setSelectedSceneIndex(project.scenes.length);
  };

  const handleAddDialogueToActiveScene = () => {
    if (!newDialogueLine || !activeScene) return;
    const newDlg: DialogueLine = {
      id: `d-${Date.now()}`,
      character: newDialogueChar,
      line: newDialogueLine,
      emotion: newDialogueEmotion,
      durationEst: Math.max(2, Math.round(newDialogueLine.length / 15))
    };

    const updatedScenes = [...project.scenes];
    updatedScenes[selectedSceneIndex] = {
      ...activeScene,
      dialogue: [...activeScene.dialogue, newDlg]
    };

    onUpdateProject({ scenes: updatedScenes });
    setNewDialogueLine('');
  };

  const handleDeleteScene = (idx: number) => {
    const updated = project.scenes.filter((_, i) => i !== idx);
    onUpdateProject({ scenes: updated });
    setSelectedSceneIndex(Math.max(0, idx - 1));
  };

  const totalMin = project.scenes.reduce((acc, s) => acc + s.timingEstMin, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Screenplay & AI Script Doctor
            </h2>
            <p className="text-xs text-slate-400">
              Structured 30-min episode format with automated pacing calculations and LoRA style enforcement
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-400 block font-mono">Pacing Target</span>
            <span className="text-sm font-bold text-cyan-400">
              {totalMin.toFixed(1)} / {project.targetDurationMin} Mins
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs">
            <span className="text-slate-400 block font-mono text-[9px] mb-0.5">Doctor Model</span>
            <select
              value={selectedTextModel}
              onChange={(e) => onSelectTextModel?.(e.target.value)}
              className="bg-transparent text-slate-100 font-bold text-[11px] focus:outline-none cursor-pointer p-0 border-0"
            >
              <option value="gemini-3.5-flash" className="bg-slate-900 text-slate-200">Gemini 3.5 Flash</option>
              <option value="local-llama-mlx" className="bg-slate-900 text-slate-200">Local Llama / MLX Serve</option>
              <option value="gemma-2b-local" className="bg-slate-900 text-slate-200">Gemma 2 2B (Local)</option>
              <option value="ollama" className="bg-slate-900 text-slate-200">Ollama (Local LLM)</option>
            </select>
          </div>

          <button
            onClick={() => onRunScriptDoctor(selectedTextModel)}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-indigo-600 to-rose-500 text-white font-semibold text-xs shadow-lg hover:opacity-95 transition-all"
          >
            <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Doctoring Script...' : 'Run AI Script Doctor & Fix Style'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Scene List Selector */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">
              Scene Directory ({project.scenes.length})
            </h3>
            <button
              onClick={() => setIsAddingScene(true)}
              className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Scene</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {project.scenes.map((sc, idx) => {
              const isSelected = selectedSceneIndex === idx;
              const isDragged = draggedSceneIndex === idx;
              const isDragOver = dragOverSceneIndex === idx;
              const stats = getScenePacingStats(sc);

              // Calculate pacing color for non-selected items to make them pop out of the queue
              let pacingCardStyles = 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700';
              if (isSelected) {
                pacingCardStyles = 'bg-slate-800/90 border-cyan-500 text-slate-100 shadow-md';
              } else if (stats) {
                if (stats.pacingStatus === 'fast') {
                  pacingCardStyles = 'bg-slate-950/80 border-rose-950/60 hover:border-rose-800 text-slate-300';
                } else if (stats.pacingStatus === 'slow') {
                  pacingCardStyles = 'bg-slate-950/80 border-amber-950/60 hover:border-amber-800 text-slate-300';
                }
              }

              return (
                <div
                  id={`scene-item-${sc.sceneNumber}`}
                  key={idx}
                  draggable={true}
                  onDragStart={(e) => {
                    setDraggedSceneIndex(idx);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverSceneIndex !== idx) {
                      setDragOverSceneIndex(idx);
                    }
                  }}
                  onDragEnd={() => {
                    setDraggedSceneIndex(null);
                    setDragOverSceneIndex(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleDropScene(idx);
                  }}
                  onClick={() => setSelectedSceneIndex(idx)}
                  className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing transition-all ${pacingCardStyles} ${
                    isDragged ? 'opacity-40 border-dashed border-slate-750' : ''
                  } ${
                    isDragOver ? 'border-cyan-400 scale-[1.02] bg-slate-900/95' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                      <span className="text-xs font-bold font-mono text-cyan-400">
                        SCENE #{sc.sceneNumber}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                        {sc.transition || 'Cut'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      {stats && (
                        <span className={`text-[8px] font-extrabold font-mono px-1 py-0.5 rounded tracking-wider ${
                          stats.pacingStatus === 'fast' ? 'bg-rose-950/80 text-rose-400 border border-rose-900/60' :
                          stats.pacingStatus === 'slow' ? 'bg-amber-950/80 text-amber-400 border border-amber-900/60' :
                          'bg-emerald-950/80 text-emerald-400 border border-emerald-900/60'
                        }`}>
                          {stats.pacingStatus.toUpperCase()}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        ~{sc.timingEstMin} mins
                      </span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-1 truncate">
                    {sc.heading}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {sc.action}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Episode-Wide Pacing Analyzer Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Episode Pacing Analyzer
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">
                Target: {targetSceneDuration.toFixed(1)}m / scene
              </span>
            </div>

            {/* Slider to define target scene duration */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Target Scene Length:</span>
                <span className="text-slate-200 font-bold">{targetSceneDuration.toFixed(1)} mins</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="8.0"
                step="0.5"
                value={targetSceneDuration}
                onChange={(e) => setTargetSceneDuration(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[9px] text-slate-500 block leading-normal font-sans">
                Adjust slider to test pacing rules: &lt;70% is <strong className="text-rose-400">Fast</strong>; &gt;130% is <strong className="text-amber-400">Slow</strong>.
              </span>
            </div>

            {/* Pacing Highlights Count */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-bold">
              {(() => {
                let fastCount = 0;
                let balancedCount = 0;
                let slowCount = 0;
                project.scenes.forEach(sc => {
                  const s = getScenePacingStats(sc);
                  if (s) {
                    if (s.pacingStatus === 'fast') fastCount++;
                    else if (s.pacingStatus === 'slow') slowCount++;
                    else balancedCount++;
                  }
                });
                return (
                  <>
                    <div className="bg-rose-950/40 border border-rose-900/40 rounded p-1.5 text-rose-400">
                      <div>{fastCount} Fast</div>
                      <div className="text-[8px] text-slate-500 mt-0.5">Rush Rate</div>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-900/40 rounded p-1.5 text-emerald-400">
                      <div>{balancedCount} Optimal</div>
                      <div className="text-[8px] text-slate-500 mt-0.5">Golden Zone</div>
                    </div>
                    <div className="bg-amber-950/40 border border-amber-900/40 rounded p-1.5 text-amber-400">
                      <div>{slowCount} Slow</div>
                      <div className="text-[8px] text-slate-500 mt-0.5">Drag Rate</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* AI Diagnostic Report Box */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold">
              <Bot className="w-4 h-4" />
              <span>AI Script Doctor Diagnostic</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900 p-2.5 rounded border border-slate-800/80">
              {diagnosticReport || 'Run AI Script Doctor to analyze screenplay pacing, character voice consistency, and style LoRA alignment.'}
            </p>
          </div>
        </div>

        {/* Right 8 Cols: Scene Details & Dialogue Editor */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          {activeScene ? (
            <>
              {/* Scene Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                      SCENE {activeScene.sceneNumber} / {project.scenes.length}
                    </span>
                    <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-0.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400">Transition:</span>
                      <select
                        value={activeScene.transition || 'Cut'}
                        onChange={(e) => {
                          const updatedScenes = [...project.scenes];
                          updatedScenes[selectedSceneIndex] = {
                            ...activeScene,
                            transition: e.target.value
                          };
                          onUpdateProject({ scenes: updatedScenes });
                        }}
                        className="bg-transparent text-xs font-mono font-bold text-cyan-300 focus:outline-none cursor-pointer p-0 border-0"
                      >
                        <option value="Cut" className="bg-slate-900 text-slate-100">Cut</option>
                        <option value="Fade In" className="bg-slate-900 text-slate-100">Fade In</option>
                        <option value="Dissolve" className="bg-slate-900 text-slate-100">Dissolve</option>
                        <option value="Fade Out" className="bg-slate-900 text-slate-100">Fade Out</option>
                        <option value="Wipe" className="bg-slate-900 text-slate-100">Wipe</option>
                      </select>
                    </div>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-100 tracking-wide font-mono">
                    {activeScene.heading}
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onGenerateShotsFromScene(activeScene)}
                    disabled={isGenerating}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-950 text-amber-400 border border-amber-800 text-xs font-semibold hover:bg-amber-900"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Generate Storyboard Shots</span>
                  </button>

                  <button
                    onClick={() => handleDeleteScene(selectedSceneIndex)}
                    className="p-1.5 rounded-lg bg-rose-950 text-rose-400 border border-rose-800 hover:bg-rose-900"
                    title="Delete Scene"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Description Block */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Action & Visual Setting
                </label>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed">
                  {activeScene.action}
                </div>
              </div>

              {/* Scene Visual Theme & Color Palette Notes Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-pink-950 text-pink-400 border border-pink-800">
                      <Palette className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                        Visual Theme Notes & Cel-Shading Directives
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Lighting conditions, color anchors, and LoRA prompt styling correlated from dialogue
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {activeScene.colorPalette && activeScene.colorPalette.length > 0 && (
                      <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1">
                        <span className="text-[9px] font-mono text-slate-400 mr-1">Active Swatches:</span>
                        {activeScene.colorPalette.map((hex, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-slate-700 shadow-sm"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (isEditingStyleNotes) {
                          handleUpdateActiveScene({
                            ...activeScene,
                            styleNotes: styleNotesDraft
                          });
                          setIsEditingStyleNotes(false);
                        } else {
                          setStyleNotesDraft(activeScene.styleNotes || '');
                          setIsEditingStyleNotes(true);
                        }
                      }}
                      className="px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center space-x-1 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-750 transition"
                    >
                      <Edit3 className="w-3 h-3 text-cyan-400" />
                      <span>{isEditingStyleNotes ? 'Save Notes' : 'Edit Notes'}</span>
                    </button>
                  </div>
                </div>

                {isEditingStyleNotes ? (
                  <div className="space-y-2">
                    <textarea
                      rows={5}
                      value={styleNotesDraft}
                      onChange={(e) => setStyleNotesDraft(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 leading-relaxed"
                      placeholder="Enter visual theme notes, lighting, and style instructions..."
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setIsEditingStyleNotes(false)}
                        className="px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateActiveScene({
                            ...activeScene,
                            styleNotes: styleNotesDraft
                          });
                          setIsEditingStyleNotes(false);
                        }}
                        className="px-3 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400"
                      >
                        Save Visual Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/90 border border-slate-850 rounded-lg text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {activeScene.styleNotes || 'No visual theme notes defined yet. Use the Mood Color Palette Suggester below to correlate dialogue emotions into visual theme notes.'}
                  </div>
                )}
              </div>

              {/* Mood-Based Color Palette Suggestion Tool */}
              <MoodColorPaletteSuggester
                scene={activeScene}
                project={project}
                onUpdateScene={handleUpdateActiveScene}
                onUpdateProjectShots={handleUpdateShots}
              />

              {/* Analytical Pacing Meter for Active Scene */}
              {(() => {
                const stats = getScenePacingStats(activeScene);
                if (!stats) return null;
                const {
                  dialogueCharCount,
                  actionCharCount,
                  dialoguePct,
                  actionPct,
                  classification,
                  styleColor,
                  pacingStatus
                } = stats;

                return (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                          <Clock className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                            Scene Pacing Meter & Ratio
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Dialogue vs Action verbal density and speed bounds
                          </p>
                        </div>
                      </div>

                      {/* Speed bounds label */}
                      <div>
                        {pacingStatus === 'fast' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-950/80 text-rose-400 border border-rose-800/80 text-[10px] font-bold font-mono">
                            <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                            TOO FAST (RUSHED)
                          </span>
                        )}
                        {pacingStatus === 'slow' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-amber-950/80 text-amber-400 border border-amber-800/80 text-[10px] font-bold font-mono">
                            <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-400" />
                            TOO SLOW (DRAGS)
                          </span>
                        )}
                        {pacingStatus === 'balanced' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[10px] font-bold font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            OPTIMAL PACING
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dialogue-to-Action Ratio Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-cyan-400 font-bold">Dialogue ({dialoguePct}%)</span>
                        <span className="text-slate-500 font-normal">Ratio: {actionCharCount > 0 ? (dialogueCharCount / actionCharCount).toFixed(2) : dialogueCharCount} : 1</span>
                        <span className="text-amber-400 font-bold">Action ({actionPct}%)</span>
                      </div>
                      
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-500" 
                          style={{ width: `${dialoguePct}%` }}
                        />
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-500" 
                          style={{ width: `${actionPct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>{dialogueCharCount} chars spoken</span>
                        <span>{actionCharCount} chars action setting</span>
                      </div>
                    </div>

                    {/* Feedback Explanation */}
                    <div className="bg-slate-900 border border-slate-850 rounded-lg p-2.5 text-xs space-y-1 leading-relaxed">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 font-mono">Verbal density classification:</span>
                        <span className={`font-extrabold font-mono uppercase text-[10px] ${styleColor}`}>
                          {classification}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-300 font-sans mt-1">
                        {pacingStatus === 'fast' && (
                          <span>
                            This scene (~{activeScene.timingEstMin.toFixed(1)} mins) is quite short relative to the target {targetSceneDuration.toFixed(1)} mins duration. Rushed scenes reduce exposition depth. To slow things down, add some character dialogue or detail additional ambient elements.
                          </span>
                        )}
                        {pacingStatus === 'slow' && (
                          <span>
                            This scene (~{activeScene.timingEstMin.toFixed(1)} mins) is much longer than the target {targetSceneDuration.toFixed(1)} mins. Expositions can drag and disrupt storytelling pace. Consider editing Dialogue lines or splitting into another scene slugline.
                          </span>
                        )}
                        {pacingStatus === 'balanced' && (
                          <span>
                            This scene (~{activeScene.timingEstMin.toFixed(1)} mins) is beautifully proportioned! The ratio stays in the golden zone relative to the target scene length of {targetSceneDuration.toFixed(1)} minutes.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Dialogue Lines Stack */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Dialogue Blocks ({activeScene.dialogue.length})
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    LoRA Style: {project.style.name}
                  </span>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {activeScene.dialogue.map((dlg, i) => {
                    const moodKey = normalizeEmotionToMood(dlg.emotion);
                    const moodColor = MOOD_PALETTE_DATABASE[moodKey]?.swatches[0]?.hex || '#E11D48';
                    return (
                      <div
                        key={dlg.id || i}
                        className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 group hover:border-slate-700 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-400 font-mono uppercase">
                            {dlg.character}
                          </span>
                          <div className="flex items-center space-x-2">
                            {/* Correlated Emotion Badge with Dynamic Mood Color */}
                            <span 
                              className="text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 border transition"
                              style={{ 
                                borderColor: `${moodColor}70`, 
                                color: moodColor,
                                backgroundColor: `${moodColor}15`
                              }}
                              title={`Mood correlated color: ${moodColor}`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: moodColor }} />
                              <span>{dlg.emotion}</span>
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              ~{dlg.durationEst}s
                            </span>
                            <button
                              onClick={() => handleDeleteDialogue(i)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                              title="Delete Dialogue Line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-200 italic font-serif pl-2 border-l-2" style={{ borderColor: `${moodColor}80` }}>
                          "{dlg.line}"
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Add Dialogue Inline Form */}
                <div className="pt-2 bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Add Dialogue Line
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={newDialogueChar}
                      onChange={(e) => setNewDialogueChar(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                    >
                      {project.cast.map(c => (
                        <option key={c.id} value={c.name.toUpperCase()}>
                          {c.name} ({c.role})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={newDialogueEmotion}
                      onChange={(e) => setNewDialogueEmotion(e.target.value)}
                      placeholder="Emotion (e.g. Desperate)"
                      className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-200"
                    />

                    <button
                      onClick={handleAddDialogueToActiveScene}
                      className="px-3 py-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-xs font-semibold hover:bg-cyan-900"
                    >
                      + Append Dialogue
                    </button>
                  </div>

                  {/* Quick Emotion Selector Chips */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[9px] text-slate-500 font-mono mr-1">Mood Preset:</span>
                    {['Urgent', 'Fierce', 'Melancholic', 'Cold', 'Tender', 'Whisper', 'Hopeful', 'Desperate', 'Sinister', 'Solemn'].map(emo => {
                      const moodKey = normalizeEmotionToMood(emo);
                      const hex = MOOD_PALETTE_DATABASE[moodKey]?.swatches[0]?.hex || '#E11D48';
                      const isSelected = newDialogueEmotion.toLowerCase() === emo.toLowerCase();
                      return (
                        <button
                          key={emo}
                          type="button"
                          onClick={() => setNewDialogueEmotion(emo)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center space-x-1 border transition ${
                            isSelected 
                              ? 'bg-slate-800 text-white border-cyan-400 shadow-sm' 
                              : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hex }} />
                          <span>{emo}</span>
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    value={newDialogueLine}
                    onChange={(e) => setNewDialogueLine(e.target.value)}
                    placeholder="Enter spoken dialogue line..."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <FileText className="w-10 h-10 mx-auto opacity-50" />
              <p className="text-xs">Select a scene from the left list or create a new scene.</p>
            </div>
          )}
        </div>
      </div>

      {/* Orchestra Position Prompt Automatic Injector for Writers */}
      <div className="pt-4">
        <OrchestraPositionPromptInjector 
          project={project}
          onUpdateProject={(updated) => onUpdateProject(updated)}
        />
      </div>

      {/* Add Scene Modal */}
      {isAddingScene && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Create New Scene</span>
            </h3>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Scene Heading (Slugline)
              </label>
              <input
                type="text"
                value={newHeading}
                onChange={(e) => setNewHeading(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Transition Type
              </label>
              <select
                value={newTransition}
                onChange={(e) => setNewTransition(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200 font-mono"
              >
                <option value="Cut">Cut</option>
                <option value="Fade In">Fade In</option>
                <option value="Dissolve">Dissolve</option>
                <option value="Fade Out">Fade Out</option>
                <option value="Wipe">Wipe</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Action Summary
              </label>
              <textarea
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsAddingScene(false)}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddScene}
                className="px-4 py-1.5 rounded bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400"
              >
                Add Scene
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
