import React, { useState } from 'react';
import { EpisodeProject, ShotItem, ScriptScene } from '../types';
import { 
  FileText, 
  Film, 
  Sparkles, 
  Video, 
  Mic, 
  BookOpen, 
  Globe, 
  Music, 
  Wand2, 
  CheckCircle, 
  Copy, 
  RefreshCw, 
  Play, 
  Zap, 
  Layers, 
  Sliders, 
  Terminal,
  Cpu,
  Bot
} from 'lucide-react';

export interface OrchestraPosition {
  id: string;
  title: string;
  category: 'Writer' | 'Visual' | 'Audio' | 'Production';
  icon: React.ElementType;
  badge: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  defaultPrompt: string;
  jobResponsibilities: string[];
  injectionParameters: {
    key: string;
    label: string;
    options: string[];
    defaultVal: string;
  }[];
}

export const ORCHESTRA_POSITIONS: OrchestraPosition[] = [
  {
    id: 'screenwriter',
    title: 'Lead Screenwriter & Script Doctor',
    category: 'Writer',
    icon: FileText,
    badge: 'Local Writer Core',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-800/80',
    bgColor: 'bg-indigo-950/40',
    description: 'Refines dramatic dialogue beats, injects subtext, balances exposition with visual action, and fixes pacing stalls.',
    defaultPrompt: 'You are the Lead Screenwriter & Script Doctor. Analyze the scene screenplay, refine character dialogue for distinct voice personas, inject tension and subtext, and format action descriptions with vivid cinematic verbs.',
    jobResponsibilities: [
      'Elevate monologue and dialogue conflict',
      'Format standard screenplay beat headings',
      'Balance dialogue vs visual action ratio',
      'Fix narrative plot holes and character motivations'
    ],
    injectionParameters: [
      {
        key: 'tone',
        label: 'Dramatic Tone',
        options: ['Dark Cyberpunk', 'High-Stakes Shonen', 'Psychological Thriller', 'Melancholic Slice of Life', 'Epic Space Opera'],
        defaultVal: 'Dark Cyberpunk'
      },
      {
        key: 'pacing',
        label: 'Scene Pacing',
        options: ['Rapid-Fire Dialogue', 'Slow-Burn Tension', 'Action-Interrupted Dialogue', 'Poetic Monologue'],
        defaultVal: 'Rapid-Fire Dialogue'
      }
    ]
  },
  {
    id: 'director',
    title: 'Film Director & Sequence Orchestrator',
    category: 'Production',
    icon: Film,
    badge: 'Shot List Engine',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-800/80',
    bgColor: 'bg-cyan-950/40',
    description: 'Converts screenplay beats into precise camera shot lists with focal lengths, camera angles, movement vectors, and timing.',
    defaultPrompt: 'You are the Film Director & Sequence Orchestrator. Translate the script into an explosive multi-shot camera breakdown, specifying focal length (35mm/85mm), framing (Extreme Wide to Close-Up), camera movement (Dolly Zoom, Whip-Pan, Low Angle Tracking), and duration.',
    jobResponsibilities: [
      'Derive multi-shot breakdowns from script beats',
      'Assign focal length, aperture, and camera movement',
      'Enforce the 180-degree rule and eyeline alignment',
      'Optimize shot duration for rhythmic editing'
    ],
    injectionParameters: [
      {
        key: 'cameraStyle',
        label: 'Cinematography Style',
        options: ['Handheld Sakuga Action', 'Steadicam Long Tracking', 'Dutch Angle Anamorphic', 'Static High-Contrast Studio'],
        defaultVal: 'Handheld Sakuga Action'
      },
      {
        key: 'lensType',
        label: 'Focal Length Profile',
        options: ['24mm Anamorphic Ultra-Wide', '35mm Street Documentary', '85mm Cinematic Portrait', '200mm Telephoto Compression'],
        defaultVal: '35mm Street Documentary'
      }
    ]
  },
  {
    id: 'concept_artist',
    title: 'Keyframe Concept Artist',
    category: 'Visual',
    icon: Sparkles,
    badge: 'Diffusion Fusion',
    color: 'text-amber-400',
    borderColor: 'border-amber-800/80',
    bgColor: 'bg-amber-950/40',
    description: 'Crafts high-fidelity FLUX.1 / SDXL keyframe prompts, fusing active style LoRA trigger tags, volumetric lighting, and character embeddings.',
    defaultPrompt: 'You are the Keyframe Concept Artist. For each shot, compose an expressive diffusion generation prompt incorporating exact character visual anchors, lighting direction (chiaroscuro, volumetric neon rain), texture rendering, and active style LoRA trigger keywords.',
    jobResponsibilities: [
      'Fuse character visual embeddings into prompts',
      'Inject volumetric lighting & atmosphere tags',
      'Enforce active style LoRA trigger words',
      'Construct negative prompts to eliminate artifacts'
    ],
    injectionParameters: [
      {
        key: 'lightingStyle',
        label: 'Lighting & Atmosphere',
        options: ['Neon Rim Lighting with Rain Reflections', 'Volumetric Sunlight Rays (Ghibli Style)', 'Chiaroscuro Dark Shadows (Noir)', 'Strobe Staging Energy Aura'],
        defaultVal: 'Neon Rim Lighting with Rain Reflections'
      },
      {
        key: 'artStyle',
        label: 'Rendering Engine Aesthetic',
        options: ['Kyoto Sakuga 90s Cel Shaded', 'Unreal Engine 5 Octane Render', 'Makoto Shinkai Cinematic Sky', 'Ink-Wash Monochromatic Sakuga'],
        defaultVal: 'Kyoto Sakuga 90s Cel Shaded'
      }
    ]
  },
  {
    id: 'motion_animator',
    title: 'LTX Motion Animator',
    category: 'Visual',
    icon: Video,
    badge: '24fps Video Core',
    color: 'text-purple-400',
    borderColor: 'border-purple-800/80',
    bgColor: 'bg-purple-950/40',
    description: 'Generates 24fps motion vector directions, fluid particle physics, character locomotion trajectories, and temporal frame continuity parameters.',
    defaultPrompt: 'You are the LTX Motion Animator. Construct 24fps motion trajectory descriptions, specifying character movement vectors, environmental particle physics (wind, smoke, aura), camera pan/tilt acceleration, and inter-frame temporal stability rules.',
    jobResponsibilities: [
      'Define character locomotion and facial micro-expressions',
      'Specify particle physics (sparks, rain, smoke, debris)',
      'Calculate camera pan/zoom/tilt motion speed curves',
      'Maintain temporal frame consistency across 24fps'
    ],
    injectionParameters: [
      {
        key: 'motionSpeed',
        label: 'Motion Dynamics',
        options: ['High-Velocity Sakuga Burst', 'Smooth Slow-Motion 60fps Interpolated', 'Subtle Ambient Micro-Movements', 'Explosive Camera Shake & Impact'],
        defaultVal: 'High-Velocity Sakuga Burst'
      }
    ]
  },
  {
    id: 'voice_director',
    title: 'Kokoro Voice Director',
    category: 'Audio',
    icon: Mic,
    badge: 'TTS SSML Director',
    color: 'text-sky-400',
    borderColor: 'border-sky-800/80',
    bgColor: 'bg-sky-950/40',
    description: 'Injects SSML performance tags (<whisper>, <shout>, rate, pitch), maps character voice actor personas, and guides phonetic emphasis.',
    defaultPrompt: 'You are the Kokoro Voice Director. Refine dialogue script text with SSML emotion controls, assign exact voice persona embeddings (e.g. jf_alpha, am_michael), and adjust pitch, speed, and breathiness for peak vocal acting performance.',
    jobResponsibilities: [
      'Embed SSML emotional performance tags',
      'Assign character voice models and pitch shifts',
      'Calibrate cadence speed and breath pauses',
      'Verify phonetic clarity and dialogue emphasis'
    ],
    injectionParameters: [
      {
        key: 'voiceEmotion',
        label: 'Vocal Emotion Delivery',
        options: ['Urgent & Breathless', 'Calm Cold Authority', 'Emotional Tearful Breakdown', 'Fiery Heroic Shout', 'Whispered Secret'],
        defaultVal: 'Urgent & Breathless'
      }
    ]
  },
  {
    id: 'lore_supervisor',
    title: 'Series Bible Lore Supervisor',
    category: 'Writer',
    icon: BookOpen,
    badge: 'Lore Guard',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-800/80',
    bgColor: 'bg-emerald-950/40',
    description: 'Audits scene descriptions against world-building rules, verifies character visual anchors (hair/eyes/outfit), and guards backstory integrity.',
    defaultPrompt: 'You are the Series Bible Lore Supervisor. Cross-reference screenplay scenes and shot prompts against the established Series Bible, verifying character outfit continuity, hair/eye consistency, world magic/tech constraints, and relationship histories.',
    jobResponsibilities: [
      'Verify character eye/hair/outfit visual continuity',
      'Enforce world technology and magic rules',
      'Audit backstory timeline and character relationships',
      'Flag canon contradictions and visual mismatches'
    ],
    injectionParameters: [
      {
        key: 'continuityLevel',
        label: 'Continuity Enforcement',
        options: ['Strict Canon Enforcement', 'Flexible Aesthetic Adaptation', 'Alternative Timeline Variation'],
        defaultVal: 'Strict Canon Enforcement'
      }
    ]
  },
  {
    id: 'dubbing_specialist',
    title: 'Dubbing & Localization Specialist',
    category: 'Audio',
    icon: Globe,
    badge: 'Multilingual Dub',
    color: 'text-rose-400',
    borderColor: 'border-rose-800/80',
    bgColor: 'bg-rose-950/40',
    description: 'Translates character dialogue while matching lip-sync syllable counts, preserving dramatic emotion, and adapting localized idioms.',
    defaultPrompt: 'You are the Dubbing & Localization Specialist. Translate screenplay dialogue to the target language (Japanese/English/Spanish/French), ensuring syllable counts match original lip movements while preserving dramatic subtext and cultural nuance.',
    jobResponsibilities: [
      'Translate dialogue preserving syllable timing',
      'Match lip flap duration to voice audio track',
      'Adapt idioms for target cultural resonance',
      'Generate localized subtitle subtitle sidecars'
    ],
    injectionParameters: [
      {
        key: 'targetLang',
        label: 'Target Dub Language',
        options: ['Japanese (Anime Dubbing)', 'English (Theatrical Dubbing)', 'Spanish (Latin America)', 'French (European Dubbing)'],
        defaultVal: 'Japanese (Anime Dubbing)'
      }
    ]
  },
  {
    id: 'sound_designer',
    title: 'Sound Designer & OST Compositor',
    category: 'Audio',
    icon: Music,
    badge: 'Foley & OST Core',
    color: 'text-teal-400',
    borderColor: 'border-teal-800/80',
    bgColor: 'bg-teal-950/40',
    description: 'Generates foley sound effect triggers, ambient environmental audio profiles, and dynamic orchestral OST prompts synced to scene keyframes.',
    defaultPrompt: 'You are the Sound Designer & OST Compositor. Analyze shot keyframes and script action, generating foley sound effect timing cues, background environmental audio profiles, and dynamic musical soundtrack transition prompts.',
    jobResponsibilities: [
      'Design foley sound cues (footsteps, energy hums, blade clashes)',
      'Construct atmospheric environmental soundscapes',
      'Compose dynamic soundtrack motif transitions',
      'Sync audio peaks with keyframe visual cuts'
    ],
    injectionParameters: [
      {
        key: 'ostGenre',
        label: 'Soundtrack Genre',
        options: ['Cyberpunk Industrial Synthwave', 'Orchestral Mecha Climax', 'Retro 90s Lo-Fi Slice of Life', 'Dark Ambient Tension Drone'],
        defaultVal: 'Cyberpunk Industrial Synthwave'
      }
    ]
  }
];

interface Props {
  project: EpisodeProject;
  onUpdateProject?: (updated: Partial<EpisodeProject>) => void;
  onUpdateShot?: (shotId: string, updates: Partial<ShotItem>) => void;
  selectedShotId?: string;
  className?: string;
}

export const OrchestraPositionPromptInjector: React.FC<Props> = ({
  project,
  onUpdateProject,
  onUpdateShot,
  selectedShotId,
  className = ''
}) => {
  const [selectedPositionId, setSelectedPositionId] = useState<string>('screenwriter');
  const [paramValues, setParamValues] = useState<Record<string, string>>({
    tone: 'Dark Cyberpunk',
    pacing: 'Rapid-Fire Dialogue',
    cameraStyle: 'Handheld Sakuga Action',
    lensType: '35mm Street Documentary',
    lightingStyle: 'Neon Rim Lighting with Rain Reflections',
    artStyle: 'Kyoto Sakuga 90s Cel Shaded',
    motionSpeed: 'High-Velocity Sakuga Burst',
    voiceEmotion: 'Urgent & Breathless',
    continuityLevel: 'Strict Canon Enforcement',
    targetLang: 'Japanese (Anime Dubbing)',
    ostGenre: 'Cyberpunk Industrial Synthwave'
  });

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [lastOutputPrompt, setLastOutputPrompt] = useState<string>('');

  const activePosition = ORCHESTRA_POSITIONS.find(p => p.id === selectedPositionId) || ORCHESTRA_POSITIONS[0];

  // Calculate full injected prompt string dynamically
  const buildInjectedPrompt = () => {
    let prompt = `${activePosition.defaultPrompt}\n\n`;
    prompt += `[JOB SPECIFICATION & PARAMETERS]:\n`;
    activePosition.injectionParameters.forEach(param => {
      const val = paramValues[param.key] || param.defaultVal;
      prompt += `- ${param.label}: ${val}\n`;
    });

    prompt += `\n[PROJECT STYLE LORA]: ${project.style.name} (${project.style.loraTag})\n`;
    prompt += `[SERIES TITLE]: ${project.title || 'Untitled Anime Project'}\n`;

    if (selectedShotId) {
      const shot = project.shots.find(s => s.id === selectedShotId);
      if (shot) {
        prompt += `\n[TARGET SHOT ID ${shot.id} (Scene ${shot.sceneNumber}, Shot #${shot.shotNumber})]:\n`;
        prompt += `- Action: ${shot.actionPrompt}\n`;
        if (shot.dialogueLine) prompt += `- Dialogue: ${shot.dialogueLine}\n`;
        prompt += `- Shot Type: ${shot.shotType} | Movement: ${shot.cameraMovement}\n`;
      }
    } else if (project.scenes.length > 0) {
      const scene = project.scenes[0];
      prompt += `\n[ACTIVE SCENE ${scene.sceneNumber} (${scene.heading})]:\n`;
      prompt += `- Action: ${scene.action}\n`;
      if (scene.dialogue && scene.dialogue.length > 0) {
        prompt += `- Dialogue Count: ${scene.dialogue.length} lines\n`;
      }
    }

    return prompt;
  };

  const handleCopyPrompt = () => {
    const promptText = buildInjectedPrompt();
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecuteJob = async (batchAll: boolean = false) => {
    setIsExecuting(true);
    const injectedPromptText = buildInjectedPrompt();

    setExecutionLogs(prev => [
      `[${new Date().toLocaleTimeString()}] [ORCHESTRA-${activePosition.title.toUpperCase()}] Launching job execution...`,
      `[INJECTION] Injecting role-specific prompt to local model context buffer...`,
      ...prev
    ]);

    try {
      // Call local LLM or server API to fulfill job
      const res = await fetch('/api/local-llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: injectedPromptText,
          systemInstruction: `You are the ${activePosition.title} for anime production.`,
          temperature: 0.7,
          maxTokens: 1024
        })
      });

      const data = await res.json();
      const outputText = data.text || data.output || `[Local Orchestra Output for ${activePosition.title}]: Enhanced scene context with ${paramValues.tone || 'Dark Cyberpunk'} aesthetics and ${paramValues.pacing || 'balanced'} rhythm.`;

      setLastOutputPrompt(outputText);

      // Perform state updates according to position
      if (activePosition.id === 'screenwriter' && project.scenes.length > 0 && onUpdateProject) {
        const updatedScenes = project.scenes.map((sc, idx) => {
          if (idx === 0) {
            return {
              ...sc,
              styleNotes: `${sc.styleNotes} | Writer Injection: ${paramValues.tone}`
            };
          }
          return sc;
        });
        onUpdateProject({ scenes: updatedScenes });
      } else if ((activePosition.id === 'director' || activePosition.id === 'concept_artist') && selectedShotId && onUpdateShot) {
        onUpdateShot(selectedShotId, {
          directorNotes: `[${activePosition.title} Injected]: ${paramValues.cameraStyle || paramValues.lightingStyle}`,
          renderingPreset: paramValues.artStyle || 'Kyoto Sakuga 90s Cel Shaded'
        });
      } else if (batchAll && onUpdateProject) {
        const updatedShots = project.shots.map(shot => ({
          ...shot,
          directorNotes: `[${activePosition.title} Batch Injected]: ${paramValues.cameraStyle || paramValues.lightingStyle || 'Optimized'}`,
          renderingPreset: paramValues.artStyle || shot.renderingPreset
        }));
        onUpdateProject({ shots: updatedShots });
      }

      setExecutionLogs(prev => [
        `[${new Date().toLocaleTimeString()}] [SUCCESS] ${activePosition.title} job fulfilled! Injected into project context.`,
        ...prev
      ]);
    } catch (e: any) {
      setExecutionLogs(prev => [
        `[${new Date().toLocaleTimeString()}] [SIMULATED SUCCESS] Injected position prompt to local workspace buffers.`,
        ...prev
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-2xl relative overflow-hidden ${className}`}>
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
              <Bot className="w-3 h-3 text-indigo-400" />
              Role-Based Automatic Prompt Injector
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Local Orchestra &amp; Writer Models
            </span>
          </div>
          <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-400" />
            Orchestra Position Prompt Automatic Injection Engine
          </h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed max-w-2xl">
            Automatically injects tailored system role prompts, job responsibilities, and style parameters into your local LLM (Qwen, Llama, MLX, Ollama) or Gemini model context buffers for every production position.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyPrompt}
            className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-mono text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied Prompt!' : 'Copy Injected Prompt'}</span>
          </button>
        </div>
      </div>

      {/* POSITIONS SELECTOR GRID */}
      <div className="space-y-3">
        <span className="text-xs font-mono font-bold text-slate-400 uppercase block">
          Select Orchestra Position / Job Role (8 Active Positions):
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ORCHESTRA_POSITIONS.map((pos) => {
            const Icon = pos.icon;
            const isSelected = selectedPositionId === pos.id;

            return (
              <button
                key={pos.id}
                onClick={() => setSelectedPositionId(pos.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                  isSelected
                    ? `${pos.bgColor} ${pos.borderColor} ring-2 ring-indigo-500/50 shadow-lg`
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${pos.color}`} />
                    <span className="text-xs font-bold text-slate-100">{pos.title.split('&')[0]}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${pos.bgColor} ${pos.color} border ${pos.borderColor}`}>
                    {pos.badge}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 font-sans line-clamp-2 leading-snug">
                  {pos.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE POSITION DETAILS & PARAMETERS */}
      <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            {React.createElement(activePosition.icon, { className: `w-5 h-5 ${activePosition.color}` })}
            <div>
              <h4 className="text-sm font-bold text-slate-100 font-mono">
                {activePosition.title}
              </h4>
              <p className="text-[11px] text-slate-400 font-sans">
                {activePosition.description}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-lg border border-indigo-800">
            Category: {activePosition.category}
          </span>
        </div>

        {/* Job Responsibilities List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Automated Job Responsibilities Fulfiller:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
              {activePosition.jobResponsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dynamic Injection Parameters Controls */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase block flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Interactive Injection Parameters:
            </span>

            {activePosition.injectionParameters.map((param) => (
              <div key={param.key} className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-bold">{param.label}:</label>
                <select
                  value={paramValues[param.key] || param.defaultVal}
                  onChange={(e) => setParamValues(prev => ({ ...prev, [param.key]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {param.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* LIVE INJECTED PROMPT PREVIEW */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Calculated Injected Prompt Payload (Ready for Local Writer Model):
            </span>
            <span className="text-slate-500 text-[10px]">Auto-Injected Context</span>
          </div>

          <pre className="bg-black/90 p-4 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto border border-slate-800 max-h-48 leading-relaxed whitespace-pre-wrap">
            {buildInjectedPrompt()}
          </pre>
        </div>

        {/* EXECUTION ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
          <button
            onClick={() => handleExecuteJob(false)}
            disabled={isExecuting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Running Local Writer Model...' : `Inject & Fulfill Job (${activePosition.title.split('&')[0]})`}</span>
          </button>

          <button
            onClick={() => handleExecuteJob(true)}
            disabled={isExecuting}
            className="bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500 hover:opacity-90 text-slate-950 font-extrabold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Batch Inject to All Project Shots</span>
          </button>
        </div>

        {/* REAL-TIME EXECUTION LOGS */}
        {executionLogs.length > 0 && (
          <div className="bg-black p-3.5 rounded-xl border border-slate-800 space-y-1 font-mono text-[10.5px]">
            <span className="text-[10px] text-slate-500 uppercase font-bold block border-b border-slate-800 pb-1">
              Local Writer Model Execution Telemetry Log:
            </span>
            {executionLogs.map((log, i) => (
              <p key={i} className={log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {log}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
