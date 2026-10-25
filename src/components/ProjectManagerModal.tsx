import React, { useState } from 'react';
import { EpisodeProject } from '../types';
import { ProjectMetadata, createBlankProject, clearProjectExamples } from '../utils/projectStorage';
import { PRESET_STYLES } from '../data/sampleProjects';
import { 
  FolderGit2, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Save, 
  Zap, 
  Clock, 
  Sparkles, 
  FileText, 
  Film, 
  Users, 
  Mic, 
  Sliders, 
  X, 
  AlertTriangle, 
  Eraser, 
  Download, 
  Upload,
  HardDrive,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: EpisodeProject;
  projectsList: ProjectMetadata[];
  onSwitchProject: (projectId: string) => void;
  onCreateNewProject: (newProject: EpisodeProject) => void;
  onDeleteProject: (projectId: string) => void;
  onDuplicateProject: (project: EpisodeProject) => void;
  onClearExamples: () => void;
  onManualSave: () => void;
  isAutoSaveEnabled: boolean;
  onToggleAutoSave: (enabled: boolean) => void;
  autoSaveIntervalSec: number;
  onChangeAutoSaveInterval: (sec: number) => void;
  lastSavedAt?: string;
  hasUnsavedChanges: boolean;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  projectsList,
  onSwitchProject,
  onCreateNewProject,
  onDeleteProject,
  onDuplicateProject,
  onClearExamples,
  onManualSave,
  isAutoSaveEnabled,
  onToggleAutoSave,
  autoSaveIntervalSec,
  onChangeAutoSaveInterval,
  lastSavedAt,
  hasUnsavedChanges
}) => {
  const [activeTab, setActiveTab] = useState<'switch' | 'create' | 'settings'>('switch');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('Episode 01: The Iron Dawn');
  const [newSeries, setNewSeries] = useState('CYBER HORIZON');
  const [newEpNum, setNewEpNum] = useState<number>(1);
  const [newDuration, setNewDuration] = useState<number>(24);
  const [newStyleId, setNewStyleId] = useState<string>(PRESET_STYLES[0].id);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const styleObj = PRESET_STYLES.find(s => s.id === newStyleId) || PRESET_STYLES[0];
    const created = createBlankProject(
      newTitle.trim() || 'Untitled Anime Episode',
      newSeries.trim() || 'Original Series',
      newEpNum || 1,
      styleObj
    );
    created.targetDurationMin = newDuration || 24;
    onCreateNewProject(created);
    onClose();
  };

  const handleSaveClick = () => {
    onManualSave();
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const hasExamples = (
    currentProject.scenes.length > 0 || 
    currentProject.shots.length > 0 || 
    currentProject.cast.length > 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase tracking-wider">
                  Production Suite Storage Hub
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {projectsList.length} Saved Projects
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-0.5 flex items-center gap-2">
                <span>Multi-Project &amp; Autosave Center</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveClick}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg transition-all cursor-pointer"
            >
              {saveSuccessNotice ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Project Now</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/40 flex space-x-4 text-xs font-medium relative z-10">
          <button
            onClick={() => setActiveTab('switch')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'switch'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Switch / Manage Projects ({projectsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Blank Project (Clean Slate)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Autosave &amp; Storage Options</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
          {/* Active Project Banner with Clear Examples Shortcut */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Currently Active Project</span>
                <span className="text-[10px] font-mono text-slate-500">•</span>
                <span className="text-[10px] font-mono text-slate-400">ID: {currentProject.id}</span>
              </div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{currentProject.title}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {currentProject.seriesTitle} · Ep {currentProject.episodeNumber}
                </span>
              </h3>
              <div className="flex items-center space-x-4 text-xs font-mono text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{currentProject.scenes?.length || 0} Scenes</span>
                </span>
                <span className="flex items-center gap-1">
                  <Film className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{currentProject.shots?.length || 0} Shots</span>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentProject.cast?.length || 0} Cast</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentProject.targetDurationMin}m Target</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Clear Examples Button */}
              {hasExamples && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-bold transition-all cursor-pointer"
                  title="Clear example scenes, shots, and cast to start completely blank"
                >
                  <Eraser className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear Examples (Start Blank)</span>
                </button>
              )}

              {/* Duplicate Active Project */}
              <button
                onClick={() => onDuplicateProject(currentProject)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Duplicate this project"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Clone Project</span>
              </button>
            </div>
          </div>

          {/* Clear Examples Confirmation Dialog */}
          {showClearConfirm && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/50 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-200">
                    Clear all scenes, cast members, and shots from this project?
                  </h4>
                  <p className="text-xs text-rose-300/80 mt-1">
                    This will empty the current project's script, storyboard, and character matrix so you can start with a fresh blank canvas. This action will be automatically saved.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClearExamples();
                    setShowClearConfirm(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Yes, Clear All Examples</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: SWITCH / MANAGE PROJECTS */}
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Select a project to switch working workspace:</span>
                <button
                  onClick={() => setActiveTab('create')}
                  className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Blank Project</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {projectsList.map((p) => {
                  const isCurrent = p.id === currentProject.id;
                  const isPendingDelete = deleteConfirmId === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between space-y-3 ${
                        isCurrent
                          ? 'bg-cyan-950/20 border-cyan-500/70 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">
                              {p.seriesTitle} · EP {p.episodeNumber}
                            </span>
                            <h4 className="text-sm font-bold text-slate-100 mt-0.5 line-clamp-1">
                              {p.title}
                            </h4>
                          </div>
                          {isCurrent ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold shrink-0">
                              ACTIVE
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                onSwitchProject(p.id);
                                onClose();
                              }}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition cursor-pointer shrink-0"
                            >
                              Switch to this
                            </button>
                          )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 mt-2.5">
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {p.sceneCount} Scenes
                          </span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {p.shotCount} Shots
                          </span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {p.castCount} Cast
                          </span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-amber-300">
                            {p.styleName}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>Updated: {new Date(p.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        
                        <div className="flex items-center space-x-1">
                          {isPendingDelete ? (
                            <div className="flex items-center space-x-1 animate-fadeIn">
                              <span className="text-rose-400 font-bold">Delete?</span>
                              <button
                                onClick={() => {
                                  onDeleteProject(p.id);
                                  setDeleteConfirmId(null);
                                }}
                                className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            !isCurrent && projectsList.length > 1 && (
                              <button
                                onClick={() => setDeleteConfirmId(p.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                title="Delete project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW BLANK PROJECT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-cyan-300 block mb-1">Pristine Blank Canvas</span>
                Creating a new project initializes an empty script, storyboard, and cast matrix without any sample or mock data.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Episode Title:
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500"
                    placeholder="e.g. Episode 01: The Iron Dawn"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Series / Franchise Title:
                  </label>
                  <input
                    type="text"
                    required
                    value={newSeries}
                    onChange={(e) => setNewSeries(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500"
                    placeholder="e.g. CYBER HORIZON"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Episode Number:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={newEpNum}
                    onChange={(e) => setNewEpNum(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Target Duration (Minutes):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value, 10) || 24)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Initial Style LoRA Preset:
                  </label>
                  <select
                    value={newStyleId}
                    onChange={(e) => setNewStyleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-cyan-500"
                  >
                    {PRESET_STYLES.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.frameRate} fps) — {s.description.substring(0, 70)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('switch')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create &amp; Switch to Blank Project</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: AUTOSAVE & STORAGE OPTIONS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Autosave Switch Panel */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Zap className={`w-4 h-4 ${isAutoSaveEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                      <h4 className="text-sm font-bold text-slate-100">
                        Automatic Background Project Autosave
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                      When enabled, any script revisions, storyboard keyframe generation, cast modifications, or dubbing changes are seamlessly persisted to browser local storage.
                    </p>
                  </div>

                  <button
                    onClick={() => onToggleAutoSave(!isAutoSaveEnabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      isAutoSaveEnabled
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isAutoSaveEnabled ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                    <span>{isAutoSaveEnabled ? 'Autosave: ENABLED' : 'Autosave: DISABLED'}</span>
                  </button>
                </div>

                {/* Interval Selection */}
                {isAutoSaveEnabled && (
                  <div className="pt-3 border-t border-slate-850 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-slate-400 font-mono">Autosave Timer Cadence:</span>
                    <div className="flex items-center space-x-2">
                      {[10, 15, 30, 60].map((sec) => (
                        <button
                          key={sec}
                          onClick={() => onChangeAutoSaveInterval(sec)}
                          className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition cursor-pointer ${
                            autoSaveIntervalSec === sec
                              ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          Every {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Diagnostic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Session Status</span>
                  <div className="flex items-center space-x-1.5 text-slate-200 font-bold">
                    <span className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span>{hasUnsavedChanges ? 'Unsynced edits pending' : 'All changes saved'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Last Autosave Timestamp</span>
                  <div className="text-slate-200 font-bold">
                    {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Just now'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Storage Target</span>
                  <div className="text-cyan-400 font-bold truncate">
                    anime_suite_project_{currentProject.id}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Active Project: <strong className="text-slate-200">{currentProject.title}</strong></span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveClick}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>Force Save Now</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
