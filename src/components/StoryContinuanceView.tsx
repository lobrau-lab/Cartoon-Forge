import React, { useState, useEffect } from 'react';
import { EpisodeProject, CharacterAnchor } from '../types';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Sparkles, 
  Users, 
  FileText, 
  History, 
  Check, 
  Lock, 
  Unlock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Plus,
  BookOpen,
  Layers,
  Database,
  ArrowUpRight,
  Copy,
  Info
} from 'lucide-react';
import { MOCK_PROJECT } from '../data/sampleProjects';

interface SaveSlot {
  id: string;
  name: string;
  timestamp: string;
  project: EpisodeProject;
}

interface StoryContinuanceViewProps {
  project: EpisodeProject;
  onUpdateProject: (updated: EpisodeProject) => void;
}

export const StoryContinuanceView: React.FC<StoryContinuanceViewProps> = ({
  project,
  onUpdateProject
}) => {
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [newSlotName, setNewSlotName] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  
  // HUD Actions & Copy States
  const [copiedBridge, setCopiedBridge] = useState<boolean>(false);
  const [copiedCast, setCopiedCast] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Smart Narrative Continuance parameters
  const [nextEpFocus, setNextEpFocus] = useState<string>('Ren discovers the dark energy crystal inside the core chamber, while Lyra flees to the lower slums.');
  const [customBridgeSummary, setCustomBridgeSummary] = useState<string>('');
  const [isBridging, setIsBridging] = useState<boolean>(false);

  // Load slots from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('anime_suite_saves');
    if (saved) {
      try {
        setSaveSlots(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load save slots', e);
      }
    } else {
      // Seed with an initial backup draft slot representing the start
      const initialSlot: SaveSlot = {
        id: 'slot-initial',
        name: 'Aether Shift 2099 - Prologue Draft',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        project: {
          ...MOCK_PROJECT,
          title: 'Episode 01: Awakening of the Quantum Blade (Backup)'
        }
      };
      setSaveSlots([initialSlot]);
      localStorage.setItem('anime_suite_saves', JSON.stringify([initialSlot]));
    }
  }, []);

  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // 1. Create named Save Slot
  const handleSaveToNewSlot = () => {
    const name = newSlotName.trim() || `${project.seriesTitle} - Ep ${project.episodeNumber} (${project.title.substring(0, 15)}...)`;
    const newSlot: SaveSlot = {
      id: `slot-${Date.now()}`,
      name,
      timestamp: new Date().toISOString(),
      project: JSON.parse(JSON.stringify(project)) // Deep copy
    };

    const updated = [newSlot, ...saveSlots];
    setSaveSlots(updated);
    localStorage.setItem('anime_suite_saves', JSON.stringify(updated));
    setNewSlotName('');
    showFeedback(`Successfully saved story state to "${name}"!`, 'success');
  };

  // 2. Overwrite an existing slot
  const handleOverwriteSlot = (slotId: string) => {
    const updated = saveSlots.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          timestamp: new Date().toISOString(),
          project: JSON.parse(JSON.stringify(project))
        };
      }
      return slot;
    });
    setSaveSlots(updated);
    localStorage.setItem('anime_suite_saves', JSON.stringify(updated));
    showFeedback(`Overwrote save slot successfully.`, 'success');
  };

  // 3. Load Slot back into working workspace
  const handleLoadSlot = (slot: SaveSlot) => {
    if (window.confirm(`Load story state from "${slot.name}"? This will replace your current script, cast roster, and storyboard workspace.`)) {
      onUpdateProject(JSON.parse(JSON.stringify(slot.project)));
      localStorage.setItem('anime_suite_project', JSON.stringify(slot.project));
      showFeedback(`Loaded "${slot.name}" into active session!`, 'success');
    }
  };

  // 4. Delete Slot
  const handleDeleteSlot = (slotId: string) => {
    const updated = saveSlots.filter(slot => slot.id !== slotId);
    setSaveSlots(updated);
    localStorage.setItem('anime_suite_saves', JSON.stringify(updated));
    showFeedback(`Deleted save slot.`, 'info');
  };

  // 5. Export Story Package File
  const handleExportBundleFile = () => {
    const bundleData = {
      exportedAt: new Date().toISOString(),
      appVersion: '2.1.0-win11-dml',
      project
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(bundleData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const fileName = `${project.seriesTitle.replace(/\s+/g, '_')}_Ep_${project.episodeNumber}_Continuance.json`;
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback('Exported portable story package to local disk!', 'success');
  };

  // 6. Import Story Package File
  const handleImportBundleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.project) {
          onUpdateProject(parsed.project);
          localStorage.setItem('anime_suite_project', JSON.stringify(parsed.project));
          showFeedback(`Imported story package: "${parsed.project.title}" successfully!`, 'success');
        } else {
          showFeedback('Invalid story file format. Could not locate project fields.', 'error');
        }
      } catch (err) {
        showFeedback('Failed to parse JSON bundle.', 'error');
      }
    };
    fileReader.readAsText(file);
  };

  // 7. Export CAST Matrix only (Character anchor consistency)
  const handleExportCastOnly = () => {
    const castData = {
      castProfileTitle: `${project.seriesTitle} Locked Cast Profile`,
      exportedAt: new Date().toISOString(),
      cast: project.cast
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(castData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const fileName = `${project.seriesTitle.replace(/\s+/g, '_')}_Locked_Cast.json`;
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback('Character cast lock profile exported!', 'success');
  };

  // 8. Import CAST Matrix only (Seamlessly merges or overwrites characters)
  const handleImportCastOnly = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.cast)) {
          if (window.confirm(`Import and overwrite current cast matrix with ${parsed.cast.length} characters? This guarantees character and voice seed consistency.`)) {
            onUpdateProject({
              ...project,
              cast: parsed.cast
            });
            showFeedback(`Cast profile synchronized. Loaded ${parsed.cast.length} characters.`, 'success');
          }
        } else {
          showFeedback('Invalid cast file format.', 'error');
        }
      } catch (err) {
        showFeedback('Failed to parse cast bundle.', 'error');
      }
    };
    fileReader.readAsText(file);
  };

  // 9. Reset current workspace
  const handleResetWorkspace = () => {
    if (window.confirm('Reset current active session? Make sure you have saved your storyline to a slot first, or it will be permanently cleared from this view.')) {
      onUpdateProject({
        ...MOCK_PROJECT,
        id: `proj-${Date.now()}`,
        title: 'New Episode Draft',
        scenes: [],
        shots: [],
        dubbingTracks: []
      });
      showFeedback('Active screenplay workspace cleared!', 'info');
    }
  };

  // 10. Synthesize Continuance Narrative Bridge (Episode continuation prompter)
  const handleSynthesizeBridge = () => {
    setIsBridging(true);
    setTimeout(() => {
      const activeCharacters = project.cast.map(c => `• ${c.name} (${c.role}) [Seed: #${c.seed}, Outfit LoRA: ${c.loraEmbedding.split(',')[0]}]`).join('\n');
      const lastSceneText = project.scenes.length > 0 
        ? project.scenes[project.scenes.length - 1].action 
        : "No scenes drafted yet.";
      
      const bridgeText = `===========================================
EPISODE CONTINUANCE NARRATIVE SYSTEM
===========================================
SERIES CONTEXT: ${project.seriesTitle}
LAST EPISODE CLIMAX INDEX: Ep ${project.episodeNumber} - "${project.title}"

--- [PREVIOUS EPISODE FINALE CLIMAX] ---
${lastSceneText}

--- [ACTIVE CHARACTER ANCHORS (RETENTION VERIFIED)] ---
${activeCharacters}

--- [CONTINUITY NARRATIVE SLATE FOR EPISODE ${project.episodeNumber + 1}] ---
Plot Core Hook: ${nextEpFocus}

DIAGNOSTIC PROMPT FOR NEXT SCENE SCREENPLAY GENERATOR:
"Generate the opening script for ${project.seriesTitle} Episode ${project.episodeNumber + 1} carrying forward the narrative state where ${nextEpFocus}. Maintain the established characters (${project.cast.map(c => c.name).join(', ')}) with precise visual descriptions conforming strictly to their locked identity embeddings. Establish high tension action in Cel-Shaded anime render, matching style: ${project.style.name}."`;

      setCustomBridgeSummary(bridgeText);
      setIsBridging(false);
      showFeedback('Narrative bridge synthesized!', 'success');
    }, 1200);
  };

  // Auto-generate bridge summary when project or parameters change
  useEffect(() => {
    if (customBridgeSummary === '') {
      handleSynthesizeBridge();
    }
  }, [project]);

  const copyToClipboard = (text: string, isCast: boolean) => {
    navigator.clipboard.writeText(text);
    if (isCast) {
      setCopiedCast(true);
      setTimeout(() => setCopiedCast(false), 2000);
    } else {
      setCopiedBridge(true);
      setTimeout(() => setCopiedBridge(false), 2000);
    }
  };

  return (
    <div id="story-continuance-view" className="space-y-8 animate-fadeIn">
      
      {/* Alert Banner / Notification toast feedback */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-xs font-mono font-bold animate-bounce ${
          feedbackMsg.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-400' :
          feedbackMsg.type === 'error' ? 'bg-rose-950 border-rose-500 text-rose-400' :
          'bg-cyan-950 border-cyan-500 text-cyan-400'
        }`}>
          <span>●</span>
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Banner Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.1),transparent)] pointer-events-none" />
        
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-indigo-950 text-indigo-400 font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-indigo-800">
              Retention &amp; Story Continuance Engine
            </span>
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Save className="w-6 h-6 text-indigo-400" />
            <span>Storyline &amp; Cast Retention Vault</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ensure character and script preservation. Save secure local story snapshots, manage visual anchor matrices across multiple episodes, and automatically synthesize plot bridges to maintain exact shonen pacing and character seeds.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={handleExportBundleFile}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Story Package</span>
          </button>
          
          <label className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import Package</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportBundleFile} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Saved Slots & Cast Sync */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Snapshots & Save Slots */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Named Story Save Slots (Backup Recovery)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Local Browser Snapshot Engine</span>
            </div>

            {/* Quick-Save Bar */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <span className="text-xs font-bold text-slate-200 block">Commit Current Workspace Session</span>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter custom draft/save name (e.g. Cyberpunk Episode 1 Climax)..."
                  value={newSlotName}
                  onChange={(e) => setNewSlotName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />
                <button
                  onClick={handleSaveToNewSlot}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-extrabold text-xs transition-all active:scale-98 cursor-pointer shadow-lg shadow-indigo-500/10 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Commit Save Slot</span>
                </button>
              </div>
            </div>

            {/* Save Slots List */}
            <div className="space-y-3">
              {saveSlots.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-mono text-xs">
                  No saved drafts found in local storage slots. Commit a backup above.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {saveSlots.map((slot) => (
                    <div 
                      key={slot.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-xs font-bold text-slate-200 truncate">{slot.name}</span>
                          <span className="text-[9px] bg-slate-900 text-cyan-400 border border-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">
                            EP {slot.project.episodeNumber}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-[10px] font-mono text-slate-400 flex-wrap gap-y-1">
                          <span className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5 text-indigo-400" />
                            <span>{slot.project.cast.length} Cast</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{slot.project.scenes.length} Scenes</span>
                          </span>
                          <span className="text-slate-500">
                            Saved: {new Date(slot.timestamp).toLocaleDateString()} {new Date(slot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleLoadSlot(slot)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] transition-all cursor-pointer"
                        >
                          Load Draft
                        </button>
                        <button
                          onClick={() => handleOverwriteSlot(slot.id)}
                          className="px-2 py-1.5 rounded-lg bg-indigo-950/40 text-indigo-400 hover:bg-indigo-950/80 border border-indigo-900/40 text-[11px] font-bold transition-all cursor-pointer"
                          title="Overwrite this slot with current workspace session"
                        >
                          Overwrite
                        </button>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
                          title="Delete slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workspace Operations Footer */}
            <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[11px]">
              <div className="text-slate-400">
                Active Session: <strong className="text-slate-200">"{project.title}"</strong>
              </div>
              <button
                onClick={handleResetWorkspace}
                className="text-rose-400 hover:text-rose-300 font-bold transition-all hover:underline cursor-pointer"
              >
                Clear Working Workspace
              </button>
            </div>
          </div>

          {/* Section 2: Character Cast Profile Exporter / Importer (Preservation Mode) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Character Matrix &amp; Seeds Synchronization
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-900">
                Active Cast: {project.cast.length}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When creating a sequel, spin-off, or Episode 2 screenplay, you must carry forward the exact same character weights, voice pitch configurations, and locked diffusion seeds to prevent identity drifting. Export or import <strong>Locked Cast Profiles</strong> exclusively below:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-200 block">Export Locked Cast Profile</span>
                  <span className="text-[11px] text-slate-400 block font-sans">
                    Saves seed list and LoRA prompt tags for the current {project.cast.length} cast members.
                  </span>
                </div>
                <button
                  onClick={handleExportCastOnly}
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
                >
                  Download Locked_Cast.json
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-200 block">Import / Merge Character Roster</span>
                  <span className="text-[11px] text-slate-400 block font-sans">
                    Load visual seeds directly from a cast profile file to align characters.
                  </span>
                </div>
                <label className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-xs font-bold text-center block cursor-pointer transition-all">
                  <span>Upload Cast JSON</span>
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportCastOnly} 
                    className="hidden" 
                  />
                </label>
              </div>
            </div>

            {/* Quick glance list of locked characters */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60 flex flex-wrap gap-2">
              {project.cast.map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg flex items-center space-x-2 text-[10px] text-slate-300">
                  <img src={c.turnaroundUrl} className="w-5 h-5 rounded-md object-cover" alt="" />
                  <span><strong>{c.name}</strong> ({c.role})</span>
                  <span className="text-slate-500 font-mono">Seed: #{c.seed}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Narrative Episode Bridge builder & Continuance generator */}
        <div className="space-y-8">
          
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Story Episode Bridge Builder
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesize a narrative summary and screenplay coordinate prompt based on your climax scene. This links characters and core items to the next episode:
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-300 font-bold uppercase block">Episode {project.episodeNumber + 1} Direction Focus</label>
                <textarea
                  rows={4}
                  value={nextEpFocus}
                  onChange={(e) => setNextEpFocus(e.target.value)}
                  placeholder="E.g. What happens next? Ren struggles to survive after the core explosion..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-sans resize-none"
                />
              </div>

              <button
                onClick={handleSynthesizeBridge}
                disabled={isBridging}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white font-extrabold text-xs shadow-lg active:scale-98 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isBridging ? 'animate-spin' : ''}`} />
                <span>{isBridging ? 'Compiling Script Climax...' : 'Synthesize Narrative Bridge'}</span>
              </button>

              {customBridgeSummary && (
                <div className="space-y-2 animate-fadeIn">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Generated Bridge prompt</span>
                    <button
                      onClick={() => copyToClipboard(customBridgeSummary, false)}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedBridge ? 'COPIED!' : 'COPY PROMPT'}</span>
                    </button>
                  </div>
                  <pre className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-[10px] text-slate-300 font-mono overflow-auto max-h-[250px] leading-relaxed select-text whitespace-pre-wrap whitespace-pre border-dashed border">
                    {customBridgeSummary}
                  </pre>
                </div>
              )}
            </div>

            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850 text-[11px] text-slate-400 leading-relaxed flex gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p>
                Paste this bridge directly into your next <strong>Script Doctor Prompt</strong> inside Episode {project.episodeNumber + 1} to continue writing character arcs seamlessly!
              </p>
            </div>
          </div>

          {/* Quick-Help Guidelines */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyan-400" />
              Preservation Checklists
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ensure you do the following before closing your browser to secure your creative timeline:
            </p>
            <ul className="space-y-1.5 font-mono text-[10px] text-slate-300 list-disc pl-4 leading-relaxed">
              <li>Save current state as a named draft slot.</li>
              <li>Export a portable JSON file to your Windows 11 device.</li>
              <li>Save Character Cast locks as a separate roster for quick importation in future spins.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
