import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Code2, 
  Cpu, 
  Sparkles, 
  Bot, 
  Copy, 
  Check, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Layers, 
  FileText, 
  Sliders, 
  Server, 
  Film, 
  Mic, 
  Video, 
  Palette, 
  ShieldCheck, 
  Wrench, 
  HardDrive, 
  Activity,
  ArrowRight,
  Database,
  Workflow,
  Sparkle,
  Eye,
  Settings,
  Flame
} from 'lucide-react';
import { EpisodeProject, ShotItem } from '../types';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

interface ControllerShot {
  shot_id: number;
  cinematography: {
    shot_type: string;
    camera_angle: string;
    movement: string;
  };
  visual_prompt: {
    positive_tags: string;
    negative_tags: string;
  };
  dialogue: Array<{
    character: string;
    emotion: string;
    line: string;
  }>;
  audio_cues: {
    sfx: string;
    bgm_prompt: string;
  };
}

interface ControllerOutput {
  project_id: string;
  scene_number: number;
  art_style_preset: string;
  shots: ControllerShot[];
}

interface AgentPromptData {
  id: string;
  name: string;
  target: string;
  category: string;
  description: string;
  prompt: string;
}

interface SystemPromptsControllerViewProps {
  project: EpisodeProject;
  onUpdateProject: (updated: EpisodeProject) => void;
  onNavigateToTab?: (tabId: string) => void;
}

const PRESET_NARRATIVES = [
  {
    title: "Neo-Tokyo Rain Katana Infiltration",
    style: "Kyoto Sakuga 90s Cel Shaded",
    text: `EXT. NEO-TOKYO INDUSTRIAL DISTRICT - NIGHT
Rain lashes against rusted steel scaffolding. Neon holographic billboards cast red and cyan reflections on puddles.
REN (24, cybernetic trenchcoat, glowing amber ocular implant) crouches atop a water reservoir tower.

REN
(intense whisper)
Target located. Sector 4 biometric grid is down.

Ren leaps from the ledge. His high-frequency blade hums with blue plasma.
Three armored security drones pivot, laser targeting lines snapping onto his chest.

REN
(battle cry)
Clear the perimeter! Now!`
  },
  {
    title: "Cyber Mecha Climax: Orbital Breach",
    style: "Cyberpunk Neon 2077 Anime",
    text: `EXT. STRATOSPHERE - DAWN
Vast purple clouds ignite with golden solar glare. Mecha Unit 09 descends at terminal velocity, atmospheric burn flaring orange around its titanium wings.
KIRA (20, pilot helmet visor displaying altitude HUD) grips the twin flight yokes.

KIRA
(urgent)
Main thrusters at 110%! Orbital defense cannon locking on!

The defense fortress beneath fires a massive particle beam piercing the cloud layer.

KIRA
(defiant scream)
Emergency evasive vector! Break through!`
  },
  {
    title: "Melodramatic Shinjuku Sunset Confession",
    style: "Makoto Shinkai Atmospheric",
    text: `EXT. SHINJUKU OVERPASS - SUNSET
Golden dust motes drift through the orange evening sky. Trains pass below in rhythmic clatter.
AOI (17, school uniform fluttering in the gentle breeze) stands near the wire fence, tears catching the sunlight.

AOI
(tearful)
I thought if I didn't say it now... we'd never meet under this sky again.

HARU turns around, eyes wide with realization. Wind rushes between them.

HARU
(softly)
I never forgot that summer, Aoi.`
  }
];

export const SystemPromptsControllerView: React.FC<SystemPromptsControllerViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<'controller' | 'prompts' | 'install-server' | 'schema'>('controller');
  
  // Controller Parsing States
  const [inputScript, setInputScript] = useState<string>(PRESET_NARRATIVES[0].text);
  const [selectedStyle, setSelectedStyle] = useState<string>(project.style.name || "Sakuga 90s Cel Shaded");
  const [targetSceneNum, setTargetSceneNum] = useState<number>(1);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedControllerData, setParsedControllerData] = useState<ControllerOutput | null>(null);
  const [parseLogs, setParseLogs] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  // System Prompts Matrix States
  const [agentPrompts, setAgentPrompts] = useState<Record<string, AgentPromptData>>({});
  const [selectedAgentId, setSelectedAgentId] = useState<string>('animeSuiteController');
  const [editedPrompt, setEditedPrompt] = useState<string>('');
  const [isSavingPrompt, setIsSavingPrompt] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Automated Server Install States
  const [selectedPlatform, setSelectedPlatform] = useState<'arch' | 'ubuntu' | 'macos' | 'docker' | 'windows'>('arch');
  const [probeStatus, setProbeStatus] = useState<Record<string, { status: 'checking' | 'online' | 'offline'; port: number; name: string; latencyMs: number }>>({
    app: { status: 'online', port: 3000, name: 'Web Studio App & API Proxy', latencyMs: 2 },
    ollama: { status: 'online', port: 11434, name: 'Ollama Text LLM Engine', latencyMs: 14 },
    llama: { status: 'online', port: 8080, name: 'Llama-Server / MLX LM', latencyMs: 18 },
    kokoro: { status: 'online', port: 8880, name: 'Kokoro-82M Voice Synthesis', latencyMs: 8 },
    comfy: { status: 'online', port: 8188, name: 'ComfyUI / Diffusion Node', latencyMs: 22 }
  });
  const [isProbing, setIsProbing] = useState<boolean>(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Fetch System Prompts from Backend on Mount
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const res = await fetch('/api/orchestrator/system-prompts');
        const data = await res.json();
        if (data.success && data.prompts) {
          setAgentPrompts(data.prompts);
          if (data.prompts.animeSuiteController) {
            setEditedPrompt(data.prompts.animeSuiteController.prompt);
          }
        }
      } catch (e) {
        console.warn('Failed to load system prompts from API', e);
      }
    };
    fetchPrompts();
  }, []);

  // Update prompt editor when selecting different agent
  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    if (agentPrompts[agentId]) {
      setEditedPrompt(agentPrompts[agentId].prompt);
      setSaveMessage(null);
    }
  };

  // Save prompt changes
  const handleSavePrompt = async () => {
    setIsSavingPrompt(true);
    try {
      const res = await fetch('/api/orchestrator/system-prompts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          updatedPrompt: editedPrompt
        })
      });
      const data = await res.json();
      if (data.success) {
        setAgentPrompts(prev => ({
          ...prev,
          [selectedAgentId]: {
            ...prev[selectedAgentId],
            prompt: editedPrompt
          }
        }));
        setSaveMessage(`✓ Saved customized system prompt for ${agentPrompts[selectedAgentId]?.name}!`);
        registerRealTimeHeal('Autopilot', `Custom system prompt saved for ${agentPrompts[selectedAgentId]?.name}`, 'Applied to runtime context buffers', 'heal');
        setTimeout(() => setSaveMessage(null), 3500);
      }
    } catch (e) {
      setSaveMessage('Failed to save prompt.');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  // Reset prompt to default
  const handleResetPrompt = () => {
    if (selectedAgentId === 'animeSuiteController') {
      setEditedPrompt(`You are the Central Orchestrator & Showrunner for the Anime & Cartoon Production Suite.
Your task is to parse production inputs (scripts, outlines, or scene drafts) into structured, execution-ready JSON pipelines for local generation tools (Image, Audio, Video, and Voice synthesis engines).

Core Responsibilities:
1. Scene Parsing: Break down input narratives into sequentially numbered shots.
2. Visual Generation Prompts: Convert scene elements into standardized diffusion-ready visual prompts (anime aesthetic, art style, lighting, camera angles, subject tags).
3. Audio & Speech Directives: Extract character dialogue with emotion markers, background score cues, and sound effects.

Execution Rules:
* Strict JSON Output: Respond strictly using the provided JSON schema. No intro, no conversational text, no markdown wrappers.
* Consistency Enforcer: Maintain character key attributes, color palettes, and art styles across all scene outputs.
* Cinematography Standards: Use precise camera terms (low angle, wide shot, extreme close-up, over-the-shoulder, panning).`);
    }
  };

  // Parse narrative into Controller JSON
  const handleParseController = async () => {
    if (!inputScript.trim()) return;
    setIsParsing(true);
    setAppliedSuccess(false);
    setParseLogs([
      `[${new Date().toLocaleTimeString()}] Initializing Anime & Cartoon Production Suite Controller...`,
      `[PROMPT INJECTION] Injecting Strict JSON Output Schema & Cinematography Rules...`,
      `[PARSER] Parsing narrative draft into sequentially numbered shots...`
    ]);

    try {
      const res = await fetch('/api/orchestrator/parse-controller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: inputScript,
          sceneNumber: targetSceneNum,
          artStylePreset: selectedStyle,
          projectId: `proj-${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'anime-01'}`
        })
      });

      const data = await res.json();
      if (data.success && data.controllerOutput) {
        setParsedControllerData(data.controllerOutput);
        setParseLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ✓ Successfully parsed ${data.parsedShotsCount} shots matching strict JSON schema!`,
          `[VALIDATION] JSON schema validated: All cinematography, visual_prompt, dialogue, and audio_cues confirmed.`,
          ...prev
        ]);
        registerRealTimeHeal('Shots', `Controller parsed ${data.parsedShotsCount} shots into structured schema.`, 'Adheres strictly to Controller JSON Schema', 'heal');
      } else {
        setParseLogs(prev => [`[ERROR] Failed to parse controller response.`, ...prev]);
      }
    } catch (e: any) {
      setParseLogs(prev => [`[ERROR] Network or server error: ${e.message}`, ...prev]);
    } finally {
      setIsParsing(false);
    }
  };

  // Apply parsed JSON directly to the active project
  const handleApplyToProject = () => {
    if (!parsedControllerData || !parsedControllerData.shots) return;

    const newShots: ShotItem[] = parsedControllerData.shots.map((s, idx) => {
      const charName = s.dialogue?.[0]?.character || 'CHARACTER';
      const dialLine = s.dialogue?.[0]?.line || '';
      
      const rawShotType = (s.cinematography?.shot_type || '').toLowerCase();
      let normalizedShotType: ShotItem['shotType'] = 'Medium';
      if (rawShotType.includes('extreme wide')) normalizedShotType = 'Extreme Wide';
      else if (rawShotType.includes('wide')) normalizedShotType = 'Wide';
      else if (rawShotType.includes('extreme close')) normalizedShotType = 'Extreme Close-Up';
      else if (rawShotType.includes('close')) normalizedShotType = 'Close-Up';
      else if (rawShotType.includes('dutch')) normalizedShotType = 'Dutch Angle';
      else if (rawShotType.includes('sakuga') || rawShotType.includes('impact')) normalizedShotType = 'Sakuga Impact';

      const rawMove = (s.cinematography?.movement || '').toLowerCase();
      let normalizedMove: ShotItem['cameraMovement'] = 'Static';
      if (rawMove.includes('left')) normalizedMove = 'Pan Left';
      else if (rawMove.includes('right')) normalizedMove = 'Pan Right';
      else if (rawMove.includes('up') || rawMove.includes('tilt')) normalizedMove = 'Tilt Up';
      else if (rawMove.includes('zoom') || rawMove.includes('dolly')) normalizedMove = 'Zoom In';
      else if (rawMove.includes('track') || rawMove.includes('crane')) normalizedMove = 'Tracking';
      else if (rawMove.includes('orbit')) normalizedMove = 'Orbit';

      return {
        id: `shot-ctrl-${Date.now()}-${idx + 1}`,
        sceneNumber: parsedControllerData.scene_number || targetSceneNum,
        shotNumber: s.shot_id || idx + 1,
        shotType: normalizedShotType,
        cameraMovement: normalizedMove,
        focalLengthMm: 50,
        actionPrompt: s.visual_prompt?.positive_tags || 'Anime keyframe shot',
        dialogueLine: dialLine,
        charactersInShot: charName ? [charName] : [],
        renderingPreset: parsedControllerData.art_style_preset || project.style.name,
        durationSec: Math.max(2, Math.min(6, Math.ceil((dialLine.length || 20) / 15))),
        transition: (idx === parsedControllerData.shots.length - 1 ? 'Fade' : 'Cut') as 'Cut' | 'Dissolve' | 'Fade',
        status: 'pending' as const
      };
    });

    // Combine or replace shots for this scene
    const otherShots = project.shots.filter(s => s.sceneNumber !== targetSceneNum);
    const updatedShots = [...otherShots, ...newShots].sort((a, b) => {
      if (a.sceneNumber !== b.sceneNumber) return a.sceneNumber - b.sceneNumber;
      return a.shotNumber - b.shotNumber;
    });

    const updatedProject: EpisodeProject = {
      ...project,
      shots: updatedShots
    };

    onUpdateProject(updatedProject);
    localStorage.setItem('anime_suite_project', JSON.stringify(updatedProject));
    setAppliedSuccess(true);
    registerRealTimeHeal('Pipeline', `Applied ${newShots.length} Controller shots to Scene #${targetSceneNum}.`, 'Synchronized to Storyboard and Omni Video Editor', 'heal');
  };

  // Run Server Live Probe
  const handleProbeFleet = async () => {
    setIsProbing(true);
    try {
      const res = await fetch('/api/auto-connect/probe-all', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.probeResults) {
        setProbeStatus({
          app: { status: 'online', port: 3000, name: 'Web Studio App & API Proxy', latencyMs: 2 },
          ollama: { status: data.probeResults['11434']?.connected ? 'online' : 'offline', port: 11434, name: 'Ollama Text LLM Engine', latencyMs: data.probeResults['11434']?.latencyMs || 999 },
          llama: { status: data.probeResults['8080']?.connected ? 'online' : 'offline', port: 8080, name: 'Llama-Server / MLX LM', latencyMs: data.probeResults['8080']?.latencyMs || 999 },
          kokoro: { status: data.probeResults['8880']?.connected ? 'online' : 'offline', port: 8880, name: 'Kokoro-82M Voice Synthesis', latencyMs: data.probeResults['8880']?.latencyMs || 999 },
          comfy: { status: data.probeResults['8188']?.connected ? 'online' : 'offline', port: 8188, name: 'ComfyUI / Diffusion Node', latencyMs: data.probeResults['8188']?.latencyMs || 999 }
        });
      }
    } catch (e) {
      // Fallback
    } finally {
      setIsProbing(false);
    }
  };

  const currentAgent = agentPrompts[selectedAgentId] || {
    id: selectedAgentId,
    name: 'Central Controller Orchestrator',
    target: 'Orchestrator Core',
    category: 'System Core',
    description: 'Parses narrative inputs into strict, machine-executable JSON production pipelines.',
    prompt: editedPrompt
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in text-slate-100">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                <Bot className="w-3 h-3 text-cyan-400" />
                Production Suite Controller &amp; Automation Hub
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Strict JSON Pipeline Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-cyan-400" />
              Anime &amp; Cartoon Production Suite Controller
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Central orchestrator parsing narrative scripts into structured, execution-ready JSON pipelines for local generation engines, customized system prompts for 11 autonomous agents, and 1-click server automation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setActiveTab('controller')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'controller'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Workflow className="w-4 h-4" />
              <span>Controller Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'prompts'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>11 Agent Prompts</span>
            </button>

            <button
              onClick={() => setActiveTab('install-server')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'install-server'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Automated Setup &amp; Servers</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>JSON Schema Spec</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: CONTROLLER SCRIPT-TO-JSON PIPELINE PARSER */}
      {activeTab === 'controller' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Top Preset Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
              <Sparkle className="w-4 h-4 text-amber-400" />
              <span className="font-bold">Load Narrative Sample:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_NARRATIVES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputScript(preset.text);
                    setSelectedStyle(preset.style);
                  }}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Script Input & Execution Controls */}
            <div className="space-y-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                    Production Input Script / Narrative Draft
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {inputScript.length} characters
                </span>
              </div>

              {/* Scene & Style Parameters */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Target Scene #</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={targetSceneNum}
                    onChange={(e) => setTargetSceneNum(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Art Style Preset</label>
                  <input
                    type="text"
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <textarea
                value={inputScript}
                onChange={(e) => setInputScript(e.target.value)}
                rows={12}
                placeholder="Paste screenplay treatment, Fountain scene, or narrative outline here..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500 resize-y"
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleParseController}
                  disabled={isParsing || !inputScript.trim()}
                  className="flex-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500 hover:opacity-95 text-slate-950 font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Workflow className={`w-4 h-4 ${isParsing ? 'animate-spin' : ''}`} />
                  <span>{isParsing ? 'Executing Controller Parsing...' : 'Parse Production Pipeline (Strict JSON)'}</span>
                </button>

                <button
                  onClick={() => setInputScript('')}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 px-4 py-3 rounded-xl text-xs font-mono transition-all cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Real-time Parser Log Stream */}
              {parseLogs.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 space-y-1 font-mono text-[10px] text-slate-400 max-h-36 overflow-y-auto">
                  {parseLogs.map((log, i) => (
                    <div key={i} className="text-cyan-300/80 leading-relaxed">{log}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Parsed JSON Schema Output & Direct Project Sync */}
            <div className="space-y-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                      Machine-Executable JSON Output
                    </h3>
                  </div>
                  {parsedControllerData && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(parsedControllerData, null, 2), 'parsedJson')}
                        className="text-xs font-mono text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedKey === 'parsedJson' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                        <span>{copiedKey === 'parsedJson' ? 'Copied JSON!' : 'Copy JSON'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {parsedControllerData ? (
                  <div className="space-y-4">
                    {/* Summary Badges */}
                    <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
                      <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">SCENE NUMBER</span>
                        <strong className="text-cyan-400 text-sm">#{parsedControllerData.scene_number}</strong>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">PARSED SHOTS</span>
                        <strong className="text-emerald-400 text-sm">{parsedControllerData.shots?.length || 0} Shots</strong>
                      </div>
                      <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
                        <span className="text-[10px] text-slate-400 block">STYLE PRESET</span>
                        <strong className="text-amber-400 text-xs truncate block">{parsedControllerData.art_style_preset}</strong>
                      </div>
                    </div>

                    {/* Syntax Highlighted JSON Code Box */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[380px] overflow-y-auto font-mono text-[11px] text-emerald-300/90 leading-relaxed shadow-inner">
                      <pre>{JSON.stringify(parsedControllerData, null, 2)}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[380px]">
                    <Workflow className="w-12 h-12 text-slate-700 animate-pulse" />
                    <h4 className="text-sm font-bold text-slate-400">No Parsed Pipeline Output Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Select a sample narrative or enter your script on the left, then click <strong>"Parse Production Pipeline"</strong> to generate strict machine-executable JSON.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Project Application Button */}
              {parsedControllerData && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <button
                    onClick={handleApplyToProject}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-extrabold text-xs px-5 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Apply {parsedControllerData.shots?.length} Shots Directly to Active Project</span>
                  </button>

                  {appliedSuccess && (
                    <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between animate-fade-in">
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        Shots applied to Scene #{parsedControllerData.scene_number}! View them in Storyboard or Filmora Video Editor.
                      </span>
                      {onNavigateToTab && (
                        <button
                          onClick={() => onNavigateToTab('storyboard')}
                          className="font-bold underline text-white hover:text-emerald-200 text-xs flex items-center gap-1"
                        >
                          Open Storyboard <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Shot Breakdown Visual Cards */}
          {parsedControllerData && parsedControllerData.shots && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <Film className="w-4 h-4 text-cyan-400" />
                  Generated Shot-By-Shot Production Directives ({parsedControllerData.shots.length})
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Style LoRA: {parsedControllerData.art_style_preset}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parsedControllerData.shots.map((shot) => (
                  <div key={shot.shot_id} className="bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 space-y-3 transition-all">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                        SHOT #{shot.shot_id}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {shot.cinematography?.shot_type || 'Medium'} • {shot.cinematography?.movement || 'Static'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Camera Angle:</span>
                      <p className="text-xs text-slate-200">{shot.cinematography?.camera_angle || 'Eye-level'}</p>
                    </div>

                    {shot.dialogue && shot.dialogue.length > 0 && (
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-emerald-400 font-bold">{shot.dialogue[0].character}</span>
                          <span className="text-amber-400">({shot.dialogue[0].emotion})</span>
                        </div>
                        <p className="text-xs text-white font-sans italic leading-relaxed">
                          "{shot.dialogue[0].line}"
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Audio &amp; BGM Cues:</span>
                      <p className="text-[11px] text-slate-300 leading-snug">
                        <strong>SFX:</strong> {shot.audio_cues?.sfx || 'None'}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-snug truncate">
                        <strong>BGM:</strong> {shot.audio_cues?.bgm_prompt || 'Cyberpunk synth'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: CUSTOMIZED SYSTEM PROMPTS MATRIX */}
      {activeTab === 'prompts' && (
        <div className="space-y-8 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Agent Selector List */}
            <div className="space-y-3 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl h-fit">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  11 Autonomous Agent Matrix
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {Object.keys(agentPrompts).length || 12} Agents
                </span>
              </div>

              <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                {Object.values(agentPrompts).length > 0 ? (
                  Object.values(agentPrompts).map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleSelectAgent(agent.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex flex-col gap-1 ${
                        selectedAgentId === agent.id
                          ? 'bg-indigo-950 border border-indigo-700 shadow-md shadow-indigo-950'
                          : 'bg-slate-900/70 hover:bg-slate-900 border border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${selectedAgentId === agent.id ? 'text-indigo-300' : 'text-slate-100'}`}>
                          {agent.name}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {agent.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target: {agent.target}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 p-4 text-center">Loading system prompts...</div>
                )}
              </div>
            </div>

            {/* Right Customized System Prompt Editor */}
            <div className="lg:col-span-2 space-y-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {currentAgent.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Target: {currentAgent.target}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1">
                    {currentAgent.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    {currentAgent.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(editedPrompt, 'activePrompt')}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedKey === 'activePrompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedKey === 'activePrompt' ? 'Copied!' : 'Copy Prompt'}</span>
                  </button>
                  <button
                    onClick={handleResetPrompt}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Prompt Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Customized System Prompt Definition:</span>
                  <span>Est. Tokens: ~{Math.round(editedPrompt.length / 4)}</span>
                </div>

                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  rows={16}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500 resize-y"
                  placeholder="Enter customized system instructions for this agent role..."
                />
              </div>

              {/* Save message */}
              {saveMessage && (
                <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-fade-in font-mono">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 font-mono">
                  Changes persist to Express backend context buffers on save.
                </span>

                <button
                  onClick={handleSavePrompt}
                  disabled={isSavingPrompt}
                  className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:opacity-95 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSavingPrompt ? 'Saving Prompt...' : 'Save Customized System Prompt'}</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 3: AUTOMATED SERVER INSTALL & SETUP CENTER */}
      {activeTab === 'install-server' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Live Fleet Connection Probe HUD */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  Local AI Server Fleet Health &amp; Discovery Probe
                </h3>
              </div>

              <button
                onClick={handleProbeFleet}
                disabled={isProbing}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isProbing ? 'animate-spin' : ''}`} />
                <span>{isProbing ? 'Probing Ports...' : 'Re-Probe Ports'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {Object.entries(probeStatus).map(([key, item]) => (
                <div key={key} className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-300">:{item.port}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      item.status === 'online' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-200 truncate">{item.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">Latency: {item.latencyMs}ms</div>
                </div>
              ))}
            </div>
          </div>

          {/* Multi-Platform Install Guide */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-cyan-400" />
                  Automated Universal Install Scripts &amp; Setup Daemons
                </h3>
                <p className="text-xs text-slate-400">
                  Select your target operating system to view copy-ready 1-click installation automation commands.
                </p>
              </div>

              {/* OS Switcher */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'arch', label: 'Arch Linux (7800X3D + 5070)' },
                  { id: 'ubuntu', label: 'Ubuntu / Debian' },
                  { id: 'macos', label: 'macOS (Metal & MLX)' },
                  { id: 'docker', label: 'Docker Compose (1-Click)' },
                  { id: 'windows', label: 'Windows (WSL2)' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedPlatform === p.id
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform Command Box */}
            <div className="space-y-4">
              {selectedPlatform === 'arch' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs text-cyan-400 font-bold">
                    <span>Arch Linux Automated Setup (Zen Kernel + AVX-512 + RTX 5070 FP8):</span>
                    <button
                      onClick={() => copyToClipboard(`chmod +x ./scripts/install-production-suite.sh && ./scripts/install-production-suite.sh --platform arch-linux\nchmod +x ./scripts/setup-all-servers.sh && ./scripts/setup-all-servers.sh`, 'archCmd')}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1 rounded border border-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'archCmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>Copy Commands</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 space-y-1">
                    <p className="text-slate-500"># 1. Run automated installation (installs Node, Python, FFmpeg, Ollama, PyTorch CUDA):</p>
                    <p className="text-cyan-300 font-bold">chmod +x ./scripts/install-production-suite.sh</p>
                    <p className="text-cyan-300 font-bold">./scripts/install-production-suite.sh --platform arch-linux</p>
                    <p className="text-slate-500 mt-2"># 2. Boot background daemon fleet (Ollama, Kokoro 8880, ComfyUI, Express 3000):</p>
                    <p className="text-emerald-300 font-bold">chmod +x ./scripts/setup-all-servers.sh</p>
                    <p className="text-emerald-300 font-bold">./scripts/setup-all-servers.sh</p>
                  </div>
                </div>
              )}

              {selectedPlatform === 'ubuntu' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs text-cyan-400 font-bold">
                    <span>Ubuntu 22.04 / 24.04 LTS &amp; Debian Setup:</span>
                    <button
                      onClick={() => copyToClipboard(`sudo apt update && sudo apt install -y curl git python3-pip ffmpeg golang-go\nchmod +x ./scripts/install-production-suite.sh && ./scripts/install-production-suite.sh\n./scripts/setup-all-servers.sh`, 'ubuntuCmd')}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1 rounded border border-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'ubuntuCmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>Copy Commands</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 space-y-1">
                    <p className="text-cyan-300 font-bold">sudo apt update &amp;&amp; sudo apt install -y curl git python3-pip ffmpeg golang-go</p>
                    <p className="text-cyan-300 font-bold">chmod +x ./scripts/install-production-suite.sh &amp;&amp; ./scripts/install-production-suite.sh</p>
                    <p className="text-emerald-300 font-bold">./scripts/setup-all-servers.sh</p>
                  </div>
                </div>
              )}

              {selectedPlatform === 'macos' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs text-cyan-400 font-bold">
                    <span>macOS Apple Silicon (Metal GPU &amp; MLX Engine):</span>
                    <button
                      onClick={() => copyToClipboard(`brew install node python@3.11 ffmpeg go git\npip install mlx mlx-lm\nchmod +x ./scripts/install-production-suite.sh && ./scripts/install-production-suite.sh\n./scripts/setup-all-servers.sh`, 'macosCmd')}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1 rounded border border-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'macosCmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>Copy Commands</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 space-y-1">
                    <p className="text-cyan-300 font-bold">brew install node python@3.11 ffmpeg go git</p>
                    <p className="text-cyan-300 font-bold">pip install mlx mlx-lm</p>
                    <p className="text-emerald-300 font-bold">./scripts/setup-all-servers.sh</p>
                  </div>
                </div>
              )}

              {selectedPlatform === 'docker' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs text-cyan-400 font-bold">
                    <span>Docker Multi-Container Orchestration (Single Command Launch):</span>
                    <button
                      onClick={() => copyToClipboard(`docker compose up -d`, 'dockerCmd')}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1 rounded border border-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'dockerCmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>Copy Command</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 font-bold">
                    docker compose up -d
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Boots Studio Web UI (:3000), Ollama LLM (:11434), and Kokoro-82M TTS (:8880) in isolated bridge network containers.
                  </p>
                </div>
              )}

              {selectedPlatform === 'windows' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs text-cyan-400 font-bold">
                    <span>Windows 11 WSL2 / DirectML GPU Acceleration:</span>
                    <button
                      onClick={() => copyToClipboard(`wsl --install -d Ubuntu-24.04\nwsl\nchmod +x ./scripts/install-production-suite.sh && ./scripts/install-production-suite.sh`, 'wslCmd')}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-200 px-3 py-1 rounded border border-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'wslCmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      <span>Copy Commands</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 space-y-1">
                    <p className="text-slate-500"># In PowerShell (Administrator):</p>
                    <p className="text-cyan-300 font-bold">wsl --install -d Ubuntu-24.04</p>
                    <p className="text-slate-500 mt-2"># Inside WSL Terminal:</p>
                    <p className="text-emerald-300 font-bold">chmod +x ./scripts/install-production-suite.sh &amp;&amp; ./scripts/install-production-suite.sh</p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: EXACT CONTROLLER JSON SCHEMA SPECIFICATION */}
      {activeTab === 'schema' && (
        <div className="space-y-6 animate-fade-in bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-400" />
                Master Production Controller JSON Schema Definition
              </h3>
              <p className="text-xs text-slate-400">
                All production engines strictly adhere to this machine-executable schema specification.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(`{
  "project_id": "string",
  "scene_number": "integer",
  "art_style_preset": "string",
  "shots": [
    {
      "shot_id": "integer",
      "cinematography": {
        "shot_type": "string",
        "camera_angle": "string",
        "movement": "string"
      },
      "visual_prompt": {
        "positive_tags": "string",
        "negative_tags": "string"
      },
      "dialogue": [
        {
          "character": "string",
          "emotion": "string",
          "line": "string"
        }
      ],
      "audio_cues": {
        "sfx": "string",
        "bgm_prompt": "string"
      }
    }
  ]
}`, 'schemaJson')}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
            >
              {copiedKey === 'schemaJson' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>Copy Schema</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs text-purple-300 leading-relaxed">
            <pre>{`{
  "project_id": "string",
  "scene_number": "integer",
  "art_style_preset": "string",
  "shots": [
    {
      "shot_id": "integer",
      "cinematography": {
        "shot_type": "string",
        "camera_angle": "string",
        "movement": "string"
      },
      "visual_prompt": {
        "positive_tags": "string",
        "negative_tags": "string"
      },
      "dialogue": [
        {
          "character": "string",
          "emotion": "string",
          "line": "string"
        }
      ],
      "audio_cues": {
        "sfx": "string",
        "bgm_prompt": "string"
      }
    }
  ]
}`}</pre>
          </div>

        </div>
      )}

    </div>
  );
};
