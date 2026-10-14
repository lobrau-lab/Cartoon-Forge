import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  Trash2, 
  Save, 
  Database, 
  Globe, 
  Brain, 
  Heart, 
  Activity, 
  RefreshCw, 
  FolderOpen, 
  ShieldAlert, 
  CheckCircle2, 
  UserPlus, 
  AlertCircle, 
  Layers, 
  Compass, 
  FileText,
  Workflow,
  Cpu,
  Bookmark,
  ShieldCheck,
  Send,
  ArrowRight,
  Upload,
  FileUp,
  X,
  AlertTriangle,
  Zap,
  Archive,
  Download
} from 'lucide-react';
import { ShowBible, SeasonArc, StoryArc, LoreSetting, CharacterInternalArc, EpisodeProject, CharacterAnchor, ScriptScene, ShotItem } from '../types';
import { PRESET_STYLES, INITIAL_CAST } from '../data/sampleProjects';
import { registerRealTimeHeal } from '../utils/selfHealingEngine';

// Preloaded Sample Series Bibles to give the user immediate fully-populated state
const PRELOADED_SHOWS: ShowBible[] = [
  {
    id: 'show-aether-shift',
    title: 'AETHER SHIFT 2099',
    premise: 'In a rain-drenched Neo-Tokyo powered by raw spiritual Aether, cybernetic mech pilots defend the last server farm against celestial bio-mechanical entities called "Archangels". At its heart, the series explores the commodification of the soul in a post-human landscape.',
    themes: ['Soul Commodification', 'Grief & Mechanical Visage', 'Rebellion against Divine Automation', 'Cybernetic Isolation'],
    visualAesthetic: 'Cyber-Sakuga neon, high-contrast rain reflections, vibrant magenta and deep cobalt glow, dark metallic frames.',
    targetAudience: 'Seinen, Mecha enthusiasts, cyber-noir narrative lovers.',
    cast: INITIAL_CAST,
    characterArcs: [
      {
        characterId: 'char-ren',
        characterName: 'Ren Kusanagi',
        startingState: 'Guilt-ridden and reckless survivor of the Sector 7 critical melt, pilot without a cause.',
        keyTraumaOrMotivation: 'Wants to discover the truth behind the phantom signal that consumed his sister’s digital soul.',
        midseasonTurningPoint: 'Forced to cooperate with Malakor during the Orbital Server breach, discovering his sister is the Archangel core.',
        targetResolutionState: 'Accepts his grief, letting go of her ghost to shut down the Aether grid and free humanity.',
        emotionalTrajectory: 'Redemption',
        relationshipMatrices: [
          { targetCharacterName: 'Lyra Vance', relationshipType: 'Tense partnership turning into profound platonic anchor', tensionLevel: 4 },
          { targetCharacterName: 'General Malakor', relationshipType: 'Nihilistic blood feud masked as pilot-commander hierarchy', tensionLevel: 9 }
        ]
      },
      {
        characterId: 'char-lyra',
        characterName: 'Lyra Vance',
        startingState: 'Hyper-focused tech savant who relies strictly on statistical variables to avoid personal connection.',
        keyTraumaOrMotivation: 'Her father designed the original cybernetic spine stabilizer that paralyzed pilots during sync fail.',
        midseasonTurningPoint: 'Her Visor-Engine intercepts the frequency of a sentient Aether anomaly, forcing her to trust intuition over raw data.',
        targetResolutionState: 'Steps out of the operations booth to pilot the salvage Mech "Argo-06", repairing the logic bypass manually.',
        emotionalTrajectory: 'Positive Growth',
        relationshipMatrices: [
          { targetCharacterName: 'Ren Kusanagi', relationshipType: 'Data analyst providing anchor, hidden respect', tensionLevel: 3 }
        ]
      }
    ],
    seasonArcs: [
      {
        seasonNumber: 1,
        episodesPlanned: 12,
        premiseAndLogline: 'Ren Kusanagi activates the forbidden Quantum Blade, triggering Malakor\'s surveillance grid and a massive Archangel incursive wave.',
        centralConflict: 'Securing the decryption keys for the Sector 7 mainframe while keeping the military command from executing the pilots.',
        climaxEvent: 'The fall of the high-altitude Aether Siphon over Neo-Tokyo.',
        themeBeats: ['Decryption of self', 'Corporate divine proxies', 'The weight of a hand on a lever']
      }
    ],
    storyArcs: [
      {
        id: 'arc-quantum-blade',
        title: 'Awakening the Forbidden Core',
        type: 'Main Plot',
        description: 'Ren unlocks the illegal bio-Aether drive hidden inside his mech frame, which starts rewriting his nervous system but grants visual prediction matrix capabilities.',
        episodesActive: ['Episode 1', 'Episode 2', 'Episode 4'],
        climaxEpisode: 'Episode 4: Redline Pulse',
        status: 'Scripted'
      },
      {
        id: 'arc-lyra-visor',
        title: 'The Ghost in the Hologram',
        type: 'Sub-Plot',
        description: 'Lyra hunts a recursive echo in her HUD software that whispers architectural coordinates of a forgotten subterranean lab.',
        episodesActive: ['Episode 2', 'Episode 3', 'Episode 5'],
        climaxEpisode: 'Episode 5: Static Whispers',
        status: 'Outline'
      }
    ],
    settings: [
      {
        id: 'loc-sector-7',
        name: 'Sector 7 Central Melt',
        type: 'Location',
        description: 'A deep subterranean crater glowing with green Aether radiation, cluttered with rusted mech scrap and glowing crystal formations.',
        visualStylePrompt: 'green luminescence, eerie mist, metallic debris, high contrast shadows'
      },
      {
        id: 'tech-quantum-blade',
        name: 'The Quantum Aether Blade',
        type: 'Technology',
        description: 'A weapon system that folds dimensional space-time using the pilot\'s own neural synapse frequency, burning user memory buffers as ammunition.',
        visualStylePrompt: 'crystalline blade, plasma discharge, cyan electric arcing, holographic telemetry'
      }
    ],
    episodesList: [
      { episodeNumber: 1, title: 'Awakening of the Quantum Blade', synopsis: 'Ren Kusanagi triggers an illegal experimental reactor to protect a collapsing civilian sector, meeting Lyra.', status: 'Active' },
      { episodeNumber: 2, title: 'The Cobalt Fracture', synopsis: 'Lyra attempts to stabilize Ren\'s burned neural pathways while General Malakor\'s strike unit surrounds the warehouse.', status: 'Planned' },
      { episodeNumber: 3, title: 'Aether Rain Symphony', synopsis: 'A silent rogue Archangel infiltrates the lower drainage vents of Neo-Tokyo, calling to Ren\'s sister.', status: 'Planned' }
    ]
  },
  {
    id: 'show-occult-investigator',
    title: 'NEO-HEIAN OCCULT DETECTIVE',
    premise: 'In a retro-futuristic Kyoto styled with wooden pagodas topped with satellite dishes, a cynical detective with spiritual-channeling ocular implants investigates crimes committed by digital Yokai summoned via cellular malware.',
    themes: ['Tradition vs Cyber-Decadence', 'Techno-Shamanism', 'Memory Tampering', 'Spectral Cyber-Weapons'],
    visualAesthetic: 'Lofi visual texture, wooden architectures layered with neon talismans, VHS tracking lines, traditional ink brushes bleeding on active screens.',
    targetAudience: 'Occult cyberpunk fans, retro 90s aesthetic lovers.',
    cast: [
      {
        id: 'char-daigo',
        name: 'Daigo Abe',
        role: 'Protagonist',
        visualSummary: 'Disheveled detective wearing a frayed paper-cloth trench coat, smoking electronic paper talismans, with a rotating brass ocular iris replacing his left eye.',
        loraEmbedding: '<lora:daigo_abe_detective:1.0>, paper trench coat, rotating brass eye, electronic incense smoke',
        hairStyle: 'Messy raven black',
        eyeColor: 'Luminescent Blue / Brass Ocular',
        outfit: 'Paper-cloth trench coat with digital sutra scripts glowing along the hem',
        seed: 485901,
        voicePersona: 'Fenrir',
        voicePitch: -3,
        expressions: [
          { name: 'Weary', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80' }
        ]
      },
      {
        id: 'char-shiori',
        name: 'Lady Shiori',
        role: 'Antagonist',
        visualSummary: 'Holographic cyber-shaman wielding fan-shaped quantum capacitors, dressed in high-contrast digital ceremonial silk.',
        loraEmbedding: '<lora:shiori_shaman:1.0>, digital kimono, holographic hair pins, cyber fan',
        hairStyle: 'Geisha bun with floating circuit needles',
        eyeColor: 'Violet laser',
        outfit: 'Luminescent violet kimono with active fiber-optic screens',
        seed: 712394,
        voicePersona: 'Zephyr',
        voicePitch: 3,
        expressions: [
          { name: 'Wicked Smile', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80' }
        ]
      }
    ],
    characterArcs: [
      {
        characterId: 'char-daigo',
        characterName: 'Daigo Abe',
        startingState: 'Cynical, drinking sake-coolant, grieving the spiritual deletion of his apprentice.',
        keyTraumaOrMotivation: 'Solve the cyber-curse of Lady Shiori to restore his apprentice\'s frozen digital matrix.',
        midseasonTurningPoint: 'Realizes Shiori is using his apprentices own floating memories to power her Yokai servers.',
        targetResolutionState: 'Purges his own cybernetic eye to break the digital illusion, freeing his apprentice.',
        emotionalTrajectory: 'Tragic Descent',
        relationshipMatrices: [
          { targetCharacterName: 'Lady Shiori', relationshipType: 'Arch-rival with deep shared history in the corporate shrine', tensionLevel: 10 }
        ]
      }
    ],
    seasonArcs: [
      {
        seasonNumber: 1,
        episodesPlanned: 10,
        premiseAndLogline: 'Daigo Abe pursues the distributor of the "Goryo.exe" virus, exposing Lady Shiori\'s control over the regional telecomm shrines.',
        centralConflict: 'Preventing the digital ascension ceremony during the Gion Cyber-Festival.',
        climaxEvent: 'The hacking of the Great Bell of Gion, broadcasting an auditory malware virus across 40 million residents.',
        themeBeats: ['Techno-Shamanism', 'Gnosticism of data', 'Sutras on silicone']
      }
    ],
    storyArcs: [
      {
        id: 'arc-goryo-spread',
        title: 'The Goryo Malware Epidemic',
        type: 'Main Plot',
        description: 'An untraceable cellular curse spreads through augmented vision implants, rendering users comatose while summoning digital poltergeists.',
        episodesActive: ['Episode 1', 'Episode 2', 'Episode 3'],
        climaxEpisode: 'Episode 3: Ghost in the Router',
        status: 'Drafting'
      }
    ],
    settings: [
      {
        id: 'loc-pagoda',
        name: 'Gion Cyber-Pagoda Shrine',
        type: 'Location',
        description: 'A 5-story mahogany pagoda wrapped in glowing Ethernet cables, fiber-optic paper lanterns, and high-frequency microwave dishes.',
        visualStylePrompt: 'wooden pagoda, ethernet cables wrapped around pillars, digital paper lanterns'
      }
    ],
    episodesList: [
      { episodeNumber: 1, title: 'The Goryo.exe Curse', synopsis: 'Daigo is hired to investigate a mysterious corporate heir whose eyes turned into active terminals before he collapsed.', status: 'Planned' }
    ]
  }
];

interface UploadedDoc {
  name: string;
  size: number;
  text: string;
}

export function processBulkDocumentsToFreshSeries(
  uploadedFiles: UploadedDoc[],
  pastedContent: string,
  userTitle?: string
): { newShow: ShowBible; newProject: EpisodeProject } {
  const fileBlocks = uploadedFiles.map(f => `=== FILE: ${f.name} ===\n${f.text}`).join('\n\n');
  const fullRawText = `${fileBlocks}\n\n=== PASTED LORE & OUTLINES ===\n${pastedContent}`.trim();

  // 1. Title Inference
  let title = (userTitle || '').trim();
  if (!title) {
    const titleMatch = fullRawText.match(/(?:title|series|show|project)\s*:\s*([^\n\r]+)/i) ||
                       fullRawText.match(/^#\s*([^\n\r]+)/m) ||
                       fullRawText.match(/^([A-Z0-9\s:,\-]{4,40})/m);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    } else if (uploadedFiles.length > 0) {
      title = uploadedFiles[0].name.replace(/\.[^/.]+$/, "").replace(/[_\-]/g, " ").toUpperCase();
    } else {
      title = "NEW UNIVERSE CHRONICLES";
    }
  }

  // 2. Premise
  let premise = "";
  const premiseMatch = fullRawText.match(/(?:premise|logline|synopsis|summary|overview|world)\s*:\s*([\s\S]{20,500}?)(?=\n\n|\n[A-Z\s]{3,}:|$)/i);
  if (premiseMatch && premiseMatch[1]) {
    premise = premiseMatch[1].trim();
  } else {
    const paragraphs = fullRawText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20 && !p.startsWith('==='));
    premise = paragraphs[0] || `An original anime series production centered around "${title}".`;
  }

  // 3. Characters
  const cast: CharacterAnchor[] = [];
  const charRegex = /(?:character|cast|protagonist|antagonist|hero|heroine|person)\s*:\s*([^\n\r]+)/gi;
  let match;
  const namesFound: string[] = [];
  while ((match = charRegex.exec(fullRawText)) !== null) {
    if (match[1] && !namesFound.includes(match[1].trim())) {
      namesFound.push(match[1].trim());
    }
  }

  const lines = fullRawText.split('\n');
  for (const line of lines) {
    const m = line.match(/^(?:-\s*)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[-:]\s*(.+)/);
    if (m && m[1] && m[2] && m[2].length > 10 && !['Title', 'Premise', 'Genre', 'Theme', 'Setting', 'Scene', 'Episode', 'Season'].includes(m[1])) {
      if (!namesFound.includes(m[1])) {
        namesFound.push(m[1]);
      }
    }
  }

  const defaultRoles: ('Protagonist' | 'Deuteragonist' | 'Antagonist' | 'Supporting')[] = [
    'Protagonist', 'Deuteragonist', 'Antagonist', 'Supporting', 'Supporting'
  ];

  if (namesFound.length > 0) {
    namesFound.slice(0, 5).forEach((name, i) => {
      const cleanName = name.replace(/^(Protagonist|Antagonist|Character|Hero)\s*/i, '').trim();
      cast.push({
        id: `char-ingest-${Date.now()}-${i}`,
        name: cleanName || `Hero ${i + 1}`,
        role: defaultRoles[i] || 'Supporting',
        visualSummary: `Character extracted from ingested documents for ${title}. High detail anime design.`,
        loraEmbedding: `<lora:${(cleanName || 'hero').toLowerCase().replace(/\s+/g, '_')}:1.0>`,
        hairStyle: i % 2 === 0 ? 'Spiky Dark' : 'Long Silver',
        eyeColor: i % 2 === 0 ? 'Cyan Ember' : 'Amethyst',
        outfit: 'Custom production costume',
        seed: Math.floor(Math.random() * 899999) + 100000,
        voicePersona: i % 2 === 0 ? 'Fenrir' : 'Zephyr',
        voicePitch: 0,
        expressions: [{ name: 'Neutral' }, { name: 'Determined' }]
      });
    });
  } else {
    cast.push(
      {
        id: `char-ingest-${Date.now()}-1`,
        name: `${title.split(' ')[0]} Lead`,
        role: 'Protagonist',
        visualSummary: `Central protagonist of ${title}, energetic and determined anime character.`,
        loraEmbedding: `<lora:${title.toLowerCase().replace(/\s+/g, '_')}_lead:1.0>`,
        hairStyle: 'Tousled Raven',
        eyeColor: 'Luminescent Amber',
        outfit: 'Signature hero jacket',
        seed: 412093,
        voicePersona: 'Zephyr',
        voicePitch: 2,
        expressions: [{ name: 'Neutral' }, { name: 'Focus' }]
      },
      {
        id: `char-ingest-${Date.now()}-2`,
        name: `Rival Anchor`,
        role: 'Antagonist',
        visualSummary: `Formidable rival character driving the primary conflict in ${title}.`,
        loraEmbedding: `<lora:rival_anchor:1.0>`,
        hairStyle: 'Sleek Silver',
        eyeColor: 'Crimson Laser',
        outfit: 'Command coat',
        seed: 890123,
        voicePersona: 'Fenrir',
        voicePitch: -2,
        expressions: [{ name: 'Calculating' }]
      }
    );
  }

  // 4. Settings
  const settings: LoreSetting[] = [
    {
      id: `set-ingest-${Date.now()}-1`,
      name: `${title} Primary Citadel`,
      type: 'Location',
      description: `Central hub location ingested from universe materials for ${title}.`,
      visualStylePrompt: `epic atmospheric background render, highly detailed, dramatic lighting`
    },
    {
      id: `set-ingest-${Date.now()}-2`,
      name: `Core Artifact / Grid`,
      type: 'Technology',
      description: `Primary technological or magic system anchor.`,
      visualStylePrompt: `glowing energetic core, intricate machinery, cyan particle energy`
    }
  ];

  // 5. ShowBible
  const newShow: ShowBible = {
    id: `show-${Date.now()}`,
    title: title.toUpperCase(),
    premise: premise,
    themes: ['Ingested Narrative Lore', 'Destiny & Choice', 'World Reset'],
    visualAesthetic: 'High-contrast cinematic anime, crisp sakuga cell shading, rich atmospheric volumetric lighting.',
    targetAudience: 'Shonen / Seinen Anime Community',
    cast: cast,
    characterArcs: cast.map((c, idx) => ({
      characterId: c.id,
      characterName: c.name,
      startingState: `Initial state at start of ${title}.`,
      keyTraumaOrMotivation: `Core drive extracted from series documents.`,
      midseasonTurningPoint: `Dramatic turning point in Episode 06.`,
      targetResolutionState: `Fully resolved climax closure.`,
      emotionalTrajectory: idx % 2 === 0 ? 'Positive Growth' : 'Redemption',
      relationshipMatrices: []
    })),
    seasonArcs: [
      {
        seasonNumber: 1,
        episodesPlanned: 12,
        premiseAndLogline: `Season 1 of ${title}: The initial awakening and rising conflict.`,
        centralConflict: `Establish control and resolve the inciting incident from ingested lore.`,
        climaxEvent: `The battle at the Primary Citadel.`,
        themeBeats: ['Genesis', 'Trial by Fire', 'Rebirth']
      }
    ],
    storyArcs: [
      {
        id: `arc-ingest-${Date.now()}`,
        title: 'Inciting Incident & World Awakening',
        type: 'Main Plot',
        description: `The main storyline initialized for ${title}.`,
        episodesActive: ['Episode 1', 'Episode 2'],
        climaxEpisode: 'Episode 2',
        status: 'Scripted'
      }
    ],
    settings: settings,
    episodesList: [
      { episodeNumber: 1, title: `Episode 01: Awakening of ${title}`, synopsis: premise.substring(0, 160) + '...', status: 'Active' }
    ]
  };

  // 6. Starter Script Scenes & Storyboard Shots
  const starterScenes: ScriptScene[] = [
    {
      sceneNumber: 1,
      heading: `EXT. ${title.toUpperCase()} CITADEL - DAY`,
      location: `${title} Citadel Exterior`,
      timeOfDay: 'DAY',
      action: `The camera swoops over the massive landscape of ${title}. Wind carries debris through atmospheric haze as ${cast[0]?.name || 'the protagonist'} stands on the overlook.`,
      dialogue: [
        {
          id: `dial-1-${Date.now()}`,
          character: cast[0]?.name || 'HERO',
          line: `So this is where it all begins... the start of a new series.`,
          emotion: 'Determined',
          durationEst: 3.5
        },
        {
          id: `dial-2-${Date.now()}`,
          character: cast[1]?.name || 'RIVAL',
          line: `Don't get ahead of yourself. The real trial is just ahead.`,
          emotion: 'Stern',
          durationEst: 3.0
        }
      ],
      timingEstMin: 1.5,
      styleNotes: 'Wide epic panoramic establishing shot with slow camera pan.'
    },
    {
      sceneNumber: 2,
      heading: `INT. CITADEL COMMAND CORE - NIGHT`,
      location: 'Citadel Core Room',
      timeOfDay: 'NIGHT',
      action: `Holographic data screens hum as emergency alarms pulse in crimson light. ${cast[0]?.name || 'The lead'} steps up to the central terminal.`,
      dialogue: [
        {
          id: `dial-3-${Date.now()}`,
          character: cast[0]?.name || 'HERO',
          line: `Initiating full system override!`,
          emotion: 'Shouting',
          durationEst: 2.5
        }
      ],
      timingEstMin: 1.0,
      styleNotes: 'High-contrast neon shadows, dramatic extreme close-up impact.'
    }
  ];

  const starterShots: ShotItem[] = [
    {
      id: `shot-ingest-1-${Date.now()}`,
      sceneNumber: 1,
      shotNumber: 1,
      shotType: 'Wide',
      cameraMovement: 'Pan Right',
      durationSec: 4.5,
      charactersInShot: [cast[0]?.name || 'HERO'],
      actionPrompt: `Wide panoramic anime establishing shot of ${title} citadel under dramatic clouds, ${cast[0]?.name || 'hero'} looking towards the horizon`,
      dialogueLine: `So this is where it all begins...`,
      soundEffect: 'Whistling wind and distant rumble',
      keyframeUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
      transition: 'Cut',
      directorNotes: 'Establish scale and mood of the new series environment.',
      status: 'ready'
    },
    {
      id: `shot-ingest-2-${Date.now()}`,
      sceneNumber: 1,
      shotNumber: 2,
      shotType: 'Close-Up',
      cameraMovement: 'Static',
      durationSec: 3.0,
      charactersInShot: [cast[0]?.name || 'HERO'],
      actionPrompt: `Close-up shot of ${cast[0]?.name || 'hero'} with eyes reflecting glowing cyan light, intense expression`,
      dialogueLine: `...the start of a new series.`,
      keyframeUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
      transition: 'Cut',
      directorNotes: 'Focus on determination in eyes.',
      status: 'ready'
    },
    {
      id: `shot-ingest-3-${Date.now()}`,
      sceneNumber: 2,
      shotNumber: 3,
      shotType: 'Medium',
      cameraMovement: 'Zoom In',
      durationSec: 3.5,
      charactersInShot: [cast[1]?.name || 'RIVAL'],
      actionPrompt: `Medium shot of ${cast[1]?.name || 'rival'} emerging from shadows in citadel command core with crimson lighting`,
      dialogueLine: `The real trial is just ahead.`,
      keyframeUrl: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=1200&auto=format&fit=crop&q=80',
      transition: 'Cut',
      status: 'ready'
    }
  ];

  const newProject: EpisodeProject = {
    id: `proj-${Date.now()}`,
    title: `Episode 01: Awakening of ${title}`,
    seriesTitle: title.toUpperCase(),
    episodeNumber: 1,
    targetDurationMin: 22,
    style: PRESET_STYLES[0],
    cast: cast,
    scenes: starterScenes,
    shots: starterShots,
    dubbingTracks: [],
    updatedAt: new Date().toISOString()
  };

  return { newShow, newProject };
}

interface SeriesBibleViewProps {
  project: EpisodeProject;
  onUpdateProject: (updated: Partial<EpisodeProject>) => void;
  onResetAllTabsAndStartFresh?: (newShowBible: ShowBible, newEpisodeProject: EpisodeProject) => void;
}

export const SeriesBibleView: React.FC<SeriesBibleViewProps> = ({ project, onUpdateProject, onResetAllTabsAndStartFresh }) => {
  // Load Bibles list from LocalStorage or default preloaded list
  const [bibles, setBibles] = useState<ShowBible[]>(() => {
    const saved = localStorage.getItem('multiverse_show_bibles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse show bibles list', e);
      }
    }
    return PRELOADED_SHOWS;
  });

  // Current Active Show Bible selected
  const [activeShowId, setActiveShowId] = useState<string>(() => {
    const lastActive = localStorage.getItem('multiverse_active_show_id');
    if (lastActive && PRELOADED_SHOWS.some(b => b.id === lastActive || bibles.some(sb => sb.id === lastActive))) {
      return lastActive;
    }
    return 'show-aether-shift';
  });

  const activeBible = bibles.find(b => b.id === activeShowId) || bibles[0] || PRELOADED_SHOWS[0];

  // Tab routing inside the Series Bible view
  const [subTab, setSubTab] = useState<'meta' | 'cast' | 'arcs' | 'settings' | 'agent' | 'archive'>('meta');

  // Input states for Show creation
  const [newShowTitle, setNewShowTitle] = useState('');
  const [newShowPremise, setNewShowPremise] = useState('');
  const [showCreationModal, setShowCreationModal] = useState(false);

  // Fresh Series Ingestion & Mass Upload Modal State
  const [showFreshIngestionModal, setShowFreshIngestionModal] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedDoc[]>([]);
  const [pastedContent, setPastedContent] = useState<string>('');
  const [freshSeriesTitle, setFreshSeriesTitle] = useState<string>('');
  const [isParsingDocuments, setIsParsingDocuments] = useState<boolean>(false);
  const [ingestionToast, setIngestionToast] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Editing forms
  const [editPremise, setEditPremise] = useState(activeBible.premise);
  const [editThemes, setEditThemes] = useState(activeBible.themes.join(', '));
  const [editAesthetic, setEditAesthetic] = useState(activeBible.visualAesthetic);
  const [editTargetAudience, setEditTargetAudience] = useState(activeBible.targetAudience);

  // Narrative verification state (virtual multi-agent agent)
  const [verificationState, setVerificationState] = useState<'idle' | 'verifying' | 'completed'>('idle');
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationLogs, setVerificationLogs] = useState<Array<{ agent: string; type: 'info' | 'warn' | 'success' | 'critical'; text: string }>>([]);
  const [verificationRating, setVerificationRating] = useState<number | null>(null);

  // Handle File Upload Reading
  const handleFileUpload = (files: FileList | File[]) => {
    const fileList = Array.from(files);
    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string || '';
        setUploadedFiles(prev => [...prev, { name: file.name, size: file.size, text }]);
      };
      reader.readAsText(file);
    });
  };

  const handleRemoveUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, idx) => idx !== index));
  };

  // Execute Ingestion and Reset All Tabs
  const handleExecuteFreshSeriesIngestion = () => {
    setIsParsingDocuments(true);
    setTimeout(() => {
      const { newShow, newProject } = processBulkDocumentsToFreshSeries(
        uploadedFiles,
        pastedContent,
        freshSeriesTitle
      );

      // Add to bibles and set active
      const updatedBibles = [newShow, ...bibles];
      saveBiblesList(updatedBibles);
      setActiveShowId(newShow.id);
      localStorage.setItem('multiverse_active_show_id', newShow.id);

      // Reset all tabs if handler provided
      if (onResetAllTabsAndStartFresh) {
        onResetAllTabsAndStartFresh(newShow, newProject);
      } else {
        onUpdateProject(newProject);
      }

      // Reset state
      setIsParsingDocuments(false);
      setShowFreshIngestionModal(false);
      setUploadedFiles([]);
      setPastedContent('');
      setFreshSeriesTitle('');

      // Display Toast
      setIngestionToast(`✓ FRESH SERIES INITIALIZED: "${newShow.title}". All tabs (Script, Cast, Storyboard, Dubbing, Video Generator, Export) have been cleared and re-seeded for this new series!`);
      setTimeout(() => {
        setIngestionToast(null);
      }, 9000);
    }, 600);
  };

  // Sync state variables when active show switches
  useEffect(() => {
    setEditPremise(activeBible.premise);
    setEditThemes(activeBible.themes.join(', '));
    setEditAesthetic(activeBible.visualAesthetic);
    setEditTargetAudience(activeBible.targetAudience);
    setVerificationState('idle');
    setVerificationLogs([]);
    setVerificationRating(null);
  }, [activeShowId, bibles]);

  // Persist show bibles
  const saveBiblesList = (updatedBibles: ShowBible[]) => {
    setBibles(updatedBibles);
    localStorage.setItem('multiverse_show_bibles', JSON.stringify(updatedBibles));
  };

  // Switch show runner selection
  const handleSelectShow = (id: string) => {
    setActiveShowId(id);
    localStorage.setItem('multiverse_active_show_id', id);
    
    // Also sync the series title in the active screenwriting project for brand coherency!
    const targetShow = bibles.find(b => b.id === id);
    if (targetShow) {
      onUpdateProject({
        seriesTitle: targetShow.title.toUpperCase()
      });
      registerRealTimeHeal(
        'Schema',
        `AI Showrunner: Switched context to "${targetShow.title}".`,
        `Loaded series premise, master cast directory, and developmental arcs.`,
        'heal'
      );
    }
  };

  // Add new Show Bible from templates
  const handleCreateNewShow = (type: 'scratch' | 'fantasy_rpg' | 'cyber_detective') => {
    let title = newShowTitle || 'Untitled Show';
    let premise = newShowPremise || 'Introduce a compelling cyberpunk or fantasy premise here.';
    let themes = ['Identity', 'Consequences'];
    let visualAesthetic = 'Crisp shonen anime cel-shading.';
    let targetAudience = 'Shonen / Young Adult.';
    let cast: CharacterAnchor[] = [];
    let characterArcs: CharacterInternalArc[] = [];
    let settings: LoreSetting[] = [];

    if (type === 'fantasy_rpg') {
      title = title || 'CHRONICLES OF ELDERLIGHT';
      premise = 'In a floating archipelago world powered by fading dragon crystal remnants, airship skyfarers battle a sky-devouring shadow blight.';
      themes = ['Legacy of Elder Dragons', 'Finiteness of Energy', 'Comradeship of Skyfarers'];
      visualAesthetic = 'Warm painterly watercolor, bright Ghibli-esque meadow lighting, wind speed lines.';
      targetAudience = 'All Ages, Fantasy enthusiasts.';
      cast = [
        {
          id: 'char-zephyr',
          name: 'Kael Skywind',
          role: 'Protagonist',
          visualSummary: 'Young navigator wearing a leather pilot cap, goggles, and a flowing azure scarf, carrying a brass compass.',
          loraEmbedding: '<lora:kael_skywind:1.0>, pilot cap, azure scarf, brass goggles',
          hairStyle: 'Messy Golden',
          eyeColor: 'Sky Blue',
          outfit: 'Airship pilot waistcoat and cyan scarf',
          seed: 120485,
          voicePersona: 'Zephyr',
          voicePitch: 3,
          expressions: [{ name: 'Neutral' }]
        }
      ];
      characterArcs = [
        {
          characterId: 'char-zephyr',
          characterName: 'Kael Skywind',
          startingState: 'Fearful rookie sky-pilot hiding a broken family compass.',
          keyTraumaOrMotivation: 'Wants to reach the Golden Shore where his father vanished.',
          midseasonTurningPoint: 'Airship engine breaks inside the Storm Vortex, forcing him to take manual rudder command.',
          targetResolutionState: 'Confident Airship Captain leading the final defensive fleet against the blight.',
          emotionalTrajectory: 'Positive Growth',
          relationshipMatrices: []
        }
      ];
      settings = [
        {
          id: 'loc-elderlight-port',
          name: 'Port Zenith Sky-Harbor',
          type: 'Location',
          description: 'A bustling market town built on floating magnetic docks, surrounded by windmills and tethered wooden airships.',
          visualStylePrompt: 'floating islands, tethered sky airships, glowing windmills, sunny clouds'
        }
      ];
    } else if (type === 'cyber_detective') {
      title = title || 'NEON APOCRYPHA';
      premise = 'In a sprawling megalopolis controlled by corporate conglomerates, rogue artificial intelligence units seek spiritual transcendence through human memory banks.';
      themes = ['AI Spiritual Awakening', 'Shattered Memories', 'Digital Deceptions'];
      visualAesthetic = 'Deep ultraviolet and neon amber palette, high-contrast shadows, rain reflections, retro-cyberpunk cell shading.';
      cast = [];
    }

    const newShow: ShowBible = {
      id: `show-${Date.now()}`,
      title: title.toUpperCase(),
      premise,
      themes,
      visualAesthetic,
      targetAudience,
      cast,
      characterArcs,
      seasonArcs: [
        {
          seasonNumber: 1,
          episodesPlanned: 12,
          premiseAndLogline: `The opening season detailing the discovery of the central mystery in ${title}.`,
          centralConflict: 'Surviving regional incursions while researching corporate espionage leaks.',
          climaxEvent: 'The orbital mainframe collision.',
          themeBeats: ['First awakening', 'Loss of trust']
        }
      ],
      storyArcs: [
        {
          id: `arc-${Date.now()}`,
          title: 'The Conspiracy Unfolds',
          type: 'Main Plot',
          description: 'A secret file containing code signatures is leaked to the core team, driving suspicion.',
          episodesActive: ['Episode 1', 'Episode 2'],
          climaxEpisode: 'Episode 2',
          status: 'Drafting'
        }
      ],
      settings,
      episodesList: [
        { episodeNumber: 1, title: 'Episode 01: Pilot', synopsis: 'Introduction to characters and the inciting incident.', status: 'Active' }
      ]
    };

    const updatedBibles = [...bibles, newShow];
    saveBiblesList(updatedBibles);
    handleSelectShow(newShow.id);
    setNewShowTitle('');
    setNewShowPremise('');
    setShowCreationModal(false);

    registerRealTimeHeal(
      'Schema',
      `Series Bible: Created new show bible "${newShow.title}".`,
      `Initialized full cast schema, settings matrix, and season 1 arcs.`,
      'heal'
    );
  };

  // Remove Show Bible from index
  const handleDeleteShowBible = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bibles.length <= 1) {
      alert('Cannot delete the last remaining series bible. Retain at least one universe template.');
      return;
    }
    const filtered = bibles.filter(b => b.id !== id);
    saveBiblesList(filtered);
    if (activeShowId === id) {
      handleSelectShow(filtered[0].id);
    }
  };

  // Update Core metadata fields
  const handleSaveMetadataChanges = () => {
    const updated = bibles.map(b => {
      if (b.id === activeShowId) {
        return {
          ...b,
          premise: editPremise,
          themes: editThemes.split(',').map(t => t.trim()).filter(Boolean),
          visualAesthetic: editAesthetic,
          targetAudience: editTargetAudience
        };
      }
      return b;
    });
    saveBiblesList(updated);
    registerRealTimeHeal(
      'Schema',
      `Series Bible "${activeBible.title}" updated successfully.`,
      'Premise and theme vectors updated for AI contextual injection.',
      'heal'
    );
  };

  // Sync a master character to the current screenplay project cast
  const handleSyncCharacterToScreenplay = (char: CharacterAnchor) => {
    const castExists = project.cast.some(c => c.name === char.name);
    if (castExists) {
      // update
      const updatedCast = project.cast.map(c => c.name === char.name ? { ...c, ...char } : c);
      onUpdateProject({ cast: updatedCast });
    } else {
      // add
      onUpdateProject({ cast: [...project.cast, char] });
    }

    registerRealTimeHeal(
      'Cast',
      `Synced Character "${char.name}" to Active Screenplay.`,
      `Integrated visual embedding and voice persona properties into local project state.`,
      'heal'
    );
  };

  // Add Cast Member to Master Bible
  const handleAddMasterCastMember = () => {
    const name = prompt('Enter new cast member name:');
    if (!name) return;
    const roleInput = prompt('Enter role (Protagonist, Deuteragonist, Antagonist, Supporting, Mascot):', 'Supporting');
    const role = (['Protagonist', 'Deuteragonist', 'Antagonist', 'Supporting', 'Mascot'].includes(roleInput || '') 
      ? roleInput 
      : 'Supporting') as any;

    const visualSummary = prompt('Enter a short visual summary / appearance prompt:', 'High contrast anime styling...');
    if (!visualSummary) return;

    const newChar: CharacterAnchor = {
      id: `char-master-${Date.now()}`,
      name,
      role,
      visualSummary,
      loraEmbedding: `<lora:${name.toLowerCase().replace(/\s+/g, '_')}_anchor:1.0>, ${visualSummary.toLowerCase()}`,
      hairStyle: 'Short dark hair',
      eyeColor: 'Charcoal Grey',
      outfit: 'Standard pilot jacket',
      seed: Math.floor(Math.random() * 999999),
      voicePersona: 'Kore',
      voicePitch: 0,
      expressions: [{ name: 'Neutral' }]
    };

    const updated = bibles.map(b => {
      if (b.id === activeShowId) {
        // also add an empty character arc node automatically to keep schema clean!
        const newArcNode: CharacterInternalArc = {
          characterId: newChar.id,
          characterName: newChar.name,
          startingState: 'Unestablished starting motivation.',
          keyTraumaOrMotivation: 'Seeking a solid path in the series.',
          midseasonTurningPoint: 'Inciting confrontation under challenging trials.',
          targetResolutionState: 'Fully resolved character closure state.',
          emotionalTrajectory: 'Positive Growth',
          relationshipMatrices: []
        };
        return {
          ...b,
          cast: [...b.cast, newChar],
          characterArcs: [...b.characterArcs, newArcNode]
        };
      }
      return b;
    });

    saveBiblesList(updated);
    registerRealTimeHeal(
      'Cast',
      `Added "${name}" to the master cast directory of ${activeBible.title}.`,
      'Generated matching psychological character arc template node automatically.',
      'heal'
    );
  };

  // Edit fields inside custom tables / subelements
  const handleUpdateSeasonArc = (index: number, fields: Partial<SeasonArc>) => {
    const updated = bibles.map(b => {
      if (b.id === activeShowId) {
        const copy = [...b.seasonArcs];
        copy[index] = { ...copy[index], ...fields };
        return { ...b, seasonArcs: copy };
      }
      return b;
    });
    saveBiblesList(updated);
  };

  const handleUpdateStoryArc = (index: number, fields: Partial<StoryArc>) => {
    const updated = bibles.map(b => {
      if (b.id === activeShowId) {
        const copy = [...b.storyArcs];
        copy[index] = { ...copy[index], ...fields };
        return { ...b, storyArcs: copy };
      }
      return b;
    });
    saveBiblesList(updated);
  };

  const handleUpdateCharArc = (index: number, fields: Partial<CharacterInternalArc>) => {
    const updated = bibles.map(b => {
      if (b.id === activeShowId) {
        const copy = [...b.characterArcs];
        copy[index] = { ...copy[index], ...fields };
        return { ...b, characterArcs: copy };
      }
      return b;
    });
    saveBiblesList(updated);
  };

  const handleUpdateSetting = (index: number, fields: Partial<LoreSetting>) => {
    const updated = bibles.map(b => {
      if (b.id === activeShowId) {
        const copy = [...b.settings];
        copy[index] = { ...copy[index], ...fields };
        return { ...b, settings: copy };
      }
      return b;
    });
    saveBiblesList(updated);
  };

  const handleAddSetting = () => {
    const name = prompt('Enter setting/location name:');
    if (!name) return;
    const typeInput = prompt('Enter type (Location, Technology, Artifact, Faction):', 'Location');
    const type = (['Location', 'Technology', 'Artifact', 'Faction'].includes(typeInput || '') 
      ? typeInput 
      : 'Location') as any;

    const description = prompt('Provide lore description:', 'A critical zone in the regional sectors...');
    if (!description) return;

    const newSetting: LoreSetting = {
      id: `set-${Date.now()}`,
      name,
      type,
      description,
      visualStylePrompt: `${name.toLowerCase()}, highly detailed environment render, celestial lighting`
    };

    const updated = bibles.map(b => {
      if (b.id === activeShowId) {
        return { ...b, settings: [...b.settings, newSetting] };
      }
      return b;
    });
    saveBiblesList(updated);
  };

  const handleAddStoryArc = () => {
    const title = prompt('Enter story arc thread title:');
    if (!title) return;
    const desc = prompt('Enter plot thread description:');
    if (!desc) return;

    const newArc: StoryArc = {
      id: `arc-${Date.now()}`,
      title,
      type: 'Main Plot',
      description: desc,
      episodesActive: ['Episode 1', 'Episode 2'],
      climaxEpisode: 'Episode 3',
      status: 'Drafting'
    };

    const updated = bibles.map(b => {
      if (b.id === activeShowId) {
        return { ...b, storyArcs: [...b.storyArcs, newArc] };
      }
      return b;
    });
    saveBiblesList(updated);
  };

  // Trigger Multi-Agent Narrative Consistency Alignment Simulator
  const handleVerifyNarrativeAlignment = () => {
    setVerificationState('verifying');
    setVerificationProgress(10);
    setVerificationLogs([
      { agent: 'Showrunner', type: 'info', text: 'Initializing multi-agent narrative consensus engine...' }
    ]);

    // Stage 1: Load Bible context vector space
    setTimeout(() => {
      setVerificationProgress(35);
      setVerificationLogs(prev => [
        ...prev,
        { agent: 'Archivist Agent', type: 'info', text: `Loaded Show Bible context vectors for "${activeBible.title}".` },
        { agent: 'Script Doctor', type: 'info', text: `Scanning active screenplay project: "${project.title}" (Series: "${project.seriesTitle}").` }
      ]);

      // Stage 2: Cross reference cast members
      setTimeout(() => {
        setVerificationProgress(60);
        
        // Find cast inconsistencies
        const logsToAdd: typeof verificationLogs = [];
        const activeCharactersInScreenplay = new Set(project.cast.map(c => c.name));
        
        // Check if there are active dialogue speakers not in the master cast list
        const dialogueSpeakers = new Set<string>();
        project.scenes.forEach(s => s.dialogue.forEach(d => dialogueSpeakers.add(d.character.toUpperCase())));
        
        const masterNamesUpper = new Set(activeBible.cast.map(c => c.name.toUpperCase()));

        dialogueSpeakers.forEach(speaker => {
          if (!masterNamesUpper.has(speaker)) {
            logsToAdd.push({
              agent: 'Casting Director',
              type: 'warn',
              text: `Dialogue Speaker "${speaker}" is missing from the Series Bible master cast. High risk of character drift.`
            });
          }
        });

        // Check if active character internal arcs match
        activeBible.characterArcs.forEach(arc => {
          const matchingSpeaker = Array.from(dialogueSpeakers).find(s => s.includes(arc.characterName.toUpperCase()));
          if (matchingSpeaker) {
            logsToAdd.push({
              agent: 'Psychological Arc Evaluator',
              type: 'success',
              text: `Verified character motivation anchor for "${arc.characterName}". Emotion trajectory matching: [${arc.emotionalTrajectory}].`
            });
          }
        });

        // Locate any anachronistic settings or technology in the active screenplay action text
        let techMatchCount = 0;
        activeBible.settings.forEach(setting => {
          const matchRegex = new RegExp(setting.name, 'gi');
          project.scenes.forEach(sc => {
            if (sc.action.match(matchRegex) || sc.heading.match(matchRegex)) {
              techMatchCount++;
              logsToAdd.push({
                agent: 'Lore Continuity Guardian',
                type: 'success',
                text: `Successfully synchronized setting anchor: "${setting.name}" detected in Active Scene heading/action.`
              });
            }
          });
        });

        if (techMatchCount === 0 && activeBible.settings.length > 0) {
          logsToAdd.push({
            agent: 'Lore Continuity Guardian',
            type: 'warn',
            text: 'Screenplay does not reference any registered Lore Locations or Technologies. Add world details to maintain scenic immersion.'
          });
        }

        setVerificationLogs(prev => [...prev, ...logsToAdd]);

        // Stage 3: Compile final consistency index
        setTimeout(() => {
          setVerificationProgress(100);
          setVerificationState('completed');
          
          const issuesCount = logsToAdd.filter(l => l.type === 'warn' || l.type === 'critical').length;
          const score = Math.max(20, 100 - (issuesCount * 15));
          setVerificationRating(score);

          setVerificationLogs(prev => [
            ...prev,
            { 
              agent: 'Showrunner', 
              type: score >= 80 ? 'success' : 'warn', 
              text: `Narrative Consistency Audit completed. Score: ${score}/100. ${issuesCount} alignment warnings flagged.` 
            }
          ]);

          registerRealTimeHeal(
            'Schema',
            'AI Showrunner Consistency Audit complete.',
            `Screenplay coherence score evaluated at ${score}%. Recommendations registered.`,
            score >= 80 ? 'heal' : 'workaround'
          );

        }, 700);
      }, 700);
    }, 600);
  };

  // Inject Show Bible background prompt telemetry directly into the screenplay text generator context
  const handleInjectBibleContext = () => {
    // Format a gorgeous prompt injection block and store it in localStorage for the text model to pick up
    const injectionBlock = `
====== MULTIVERSE SERIES BIBLE MEMORY CONTEXT INJECTION ======
ACTIVE SERIES TITLE: ${activeBible.title}
SERIES PREMISE: ${activeBible.premise}
VISUAL AESTHETIC: ${activeBible.visualAesthetic}
THEME PATHS: ${activeBible.themes.join(', ')}

WORLD SETTINGS & LORE ANCHORS:
${activeBible.settings.map(s => `- [${s.type}] ${s.name}: ${s.description}`).join('\n')}

MASTER CAST & INTERNAL PSYCHOLOGICAL ARCS:
${activeBible.characterArcs.map(arc => `- ${arc.characterName}:
  * Starting State: ${arc.startingState}
  * Trauma/Motivation: ${arc.keyTraumaOrMotivation}
  * Turning Point: ${arc.midseasonTurningPoint}
  * Resolution State: ${arc.targetResolutionState}
  * Trajectory: ${arc.emotionalTrajectory}`).join('\n')}
============================================================
`;
    localStorage.setItem('anime_bible_prompt_context', injectionBlock);
    
    // Also update project settings to align titles
    onUpdateProject({
      seriesTitle: activeBible.title.toUpperCase()
    });

    alert('Show Bible Context successfully injected into active memory! The local LLM & WebGPU Screenplay Orchestrator will automatically use this context during next screenplay generation.');

    registerRealTimeHeal(
      'Schema',
      'AI Showrunner: Injected Series Bible context vectors into prompt generator.',
      'Active memory successfully expanded to retain full show arcs and world lore.',
      'heal'
    );
  };

  // Quick alignment fix: Automatically align the screenplay series title and inject missing character entries
  const handleApplyQuickAlignmentHeal = () => {
    // Align seriesTitle
    const updates: Partial<EpisodeProject> = {
      seriesTitle: activeBible.title.toUpperCase()
    };

    // Inject any missing cast members from bible master cast
    if (activeBible.cast.length > 0) {
      const existingCastIds = new Set(project.cast.map(c => c.id));
      const missingCast = activeBible.cast.filter(c => !existingCastIds.has(c.id));

      if (missingCast.length > 0) {
        updates.cast = [...project.cast, ...missingCast];
      }
    }

    onUpdateProject(updates);
    
    // Reset alignment
    setVerificationState('idle');
    setVerificationLogs([]);
    setVerificationRating(null);

    registerRealTimeHeal(
      'Cast',
      'AI Showrunner: Screenplay layout healed.',
      `Synchronized series title to "${activeBible.title.toUpperCase()}" and verified casting lists.`,
      'fix'
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn" id="series-bible-root">
      
      {/* 🚀 Top Multi-Show Selection & Universe Control Board */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider font-mono">
                Multiverse Show Bible &amp; Narrative Memory Vault
              </h2>
              <p className="text-xs text-slate-400">
                Retain deep cast lore, multi-tier season arcs, characters psychological motivations, and plot vectors across multiple shows.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFreshIngestionModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:brightness-110 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer font-mono"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
              <span>Start Fresh Series (Upload &amp; Reset All Tabs)</span>
            </button>

            <button
              onClick={() => setShowCreationModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all shadow cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>New Show Bible</span>
            </button>
          </div>
        </div>

        {/* Show Selector Chips */}
        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-800/60">
          {bibles.map(show => {
            const isActive = show.id === activeShowId;
            return (
              <div
                key={show.id}
                onClick={() => handleSelectShow(show.id)}
                className={`group flex items-center space-x-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-slate-900 to-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-md shadow-cyan-500/5'
                    : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Database className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="text-xs font-bold font-mono tracking-wider">{show.title}</span>
                
                {/* Space indicator */}
                <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500 group-hover:text-cyan-400 transition-colors font-mono">
                  {show.cast.length} CHARS
                </span>

                <button
                  onClick={(e) => handleDeleteShowBible(show.id, e)}
                  title="Prune this universe from index memory"
                  className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Creation Modal */}
      {showCreationModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
              <Plus className="text-cyan-400 w-5 h-5" />
              CONSTRUCT NEW SHOW UNIVERSE
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Show Title / Series Handle</label>
                <input
                  type="text"
                  placeholder="e.g. MECHA OVERDRIVE: GENERATION ZERO"
                  value={newShowTitle}
                  onChange={(e) => setNewShowTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Central Premise &amp; Logline</label>
                <textarea
                  placeholder="Describe the central conflict, lore, science/magic system, and core themes..."
                  value={newShowPremise}
                  onChange={(e) => setNewShowPremise(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleCreateNewShow('scratch')}
                className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-bold font-mono cursor-pointer"
              >
                SCRATCH TEMPLATE
              </button>
              <button
                onClick={() => handleCreateNewShow('fantasy_rpg')}
                className="py-2.5 px-3 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-800 text-[10px] font-bold font-mono cursor-pointer"
              >
                FANTASY RPG TEMPLATE
              </button>
              <button
                onClick={() => handleCreateNewShow('cyber_detective')}
                className="py-2.5 px-3 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 border border-indigo-800 text-[10px] font-bold font-mono cursor-pointer"
              >
                CYBER DETECTIVE
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCreationModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold font-mono cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Division Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side Sub-Navigation Columns */}
        <div className="lg:col-span-1 space-y-3">
          <button
            onClick={() => setSubTab('meta')}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              subTab === 'meta'
                ? 'bg-gradient-to-r from-slate-900 to-cyan-950/40 border-cyan-500/60 text-cyan-400'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold font-mono tracking-wider">Premise &amp; Themes</span>
            </div>
            <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80 text-slate-500">Core</span>
          </button>

          <button
            onClick={() => setSubTab('cast')}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              subTab === 'cast'
                ? 'bg-gradient-to-r from-slate-900 to-cyan-950/40 border-cyan-500/60 text-cyan-400'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <UserPlus className="w-4 h-4" />
              <span className="text-xs font-bold font-mono tracking-wider">Cast &amp; Directories</span>
            </div>
            <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80 text-slate-500">
              {activeBible.cast.length} Chars
            </span>
          </button>

          <button
            onClick={() => setSubTab('arcs')}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              subTab === 'arcs'
                ? 'bg-gradient-to-r from-slate-900 to-cyan-950/40 border-cyan-500/60 text-cyan-400'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-bold font-mono tracking-wider">Arcs &amp; Plot Lines</span>
            </div>
            <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80 text-slate-500">
              {activeBible.storyArcs.length} Threads
            </span>
          </button>

          <button
            onClick={() => setSubTab('settings')}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              subTab === 'settings'
                ? 'bg-gradient-to-r from-slate-900 to-cyan-950/40 border-cyan-500/60 text-cyan-400'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Compass className="w-4 h-4" />
              <span className="text-xs font-bold font-mono tracking-wider">Settings &amp; Lore</span>
            </div>
            <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/80 text-slate-500">
              {activeBible.settings.length} Anchors
            </span>
          </button>

          <button
            onClick={() => setSubTab('agent')}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              subTab === 'agent'
                ? 'bg-gradient-to-r from-indigo-950/50 to-purple-950/20 border-indigo-500/60 text-indigo-400 shadow-lg shadow-indigo-500/5'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Brain className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-xs font-bold font-mono tracking-wider">Narrative Alignment Agent</span>
            </div>
            <span className="text-[9px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-800/60 font-mono font-bold animate-pulse">
              AI RUNNER
            </span>
          </button>

          <button
            onClick={() => setSubTab('archive')}
            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
              subTab === 'archive'
                ? 'bg-gradient-to-r from-amber-950/50 to-yellow-950/20 border-amber-500/60 text-amber-300 shadow-lg'
                : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Database className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-mono tracking-wider">Archived Series Vault</span>
            </div>
            <span className="text-[9px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/60 font-mono font-bold">
              IN THE BOOKS
            </span>
          </button>

          {/* Quick Info Block */}
          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 space-y-2 text-xs">
            <h4 className="font-bold text-slate-300 flex items-center gap-1.5 font-mono text-[10px] uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              OFFLINE CACHE SECURITY
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Show bibles are stored in high-performance browser LocalStorage blocks, giving you resilient state memory between system reboots and export runs.
            </p>
          </div>
        </div>

        {/* Right Side Main Sub-Viewport View */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Sub-Tab 1: Premise & Themes */}
          {subTab === 'meta' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-cyan-400 uppercase font-mono tracking-widest">SHOW LORE PROFILE</h3>
                <h4 className="text-md font-bold text-slate-100">{activeBible.title} Core Premise</h4>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1.5">Series Logline / Premise</label>
                  <textarea
                    value={editPremise}
                    onChange={(e) => setEditPremise(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1.5">Central Themes (Comma separated)</label>
                    <input
                      type="text"
                      value={editThemes}
                      onChange={(e) => setEditThemes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1.5">Target Audience Segment</label>
                    <input
                      type="text"
                      value={editTargetAudience}
                      onChange={(e) => setEditTargetAudience(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1.5">Visual Art Aesthetic &amp; Cel Notes</label>
                  <input
                    type="text"
                    value={editAesthetic}
                    onChange={(e) => setEditAesthetic(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-mono">ID: {activeBible.id}</span>
                  <button
                    onClick={handleSaveMetadataChanges}
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Lore Context</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Master Cast & Internal Arcs */}
          {subTab === 'cast' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Cast List */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-cyan-400 uppercase font-mono tracking-widest font-bold">Cast Retention</h3>
                    <h4 className="text-md font-bold text-slate-100">Master Cast Directory</h4>
                  </div>
                  <button
                    onClick={handleAddMasterCastMember}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Add Master Character</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeBible.cast.map(char => (
                    <div 
                      key={char.id}
                      className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h5 className="text-xs font-bold text-slate-100 font-mono">{char.name}</h5>
                            <span className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 rounded-full uppercase">
                              {char.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-mono mt-1">LoRA Locked: {char.loraEmbedding}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed min-h-12 bg-slate-950 p-2.5 rounded border border-slate-900">
                        {char.visualSummary}
                      </p>

                      <div className="flex justify-between items-center pt-2 text-[10px] font-mono">
                        <span className="text-slate-500">Voice: {char.voicePersona} ({char.voicePitch > 0 ? `+${char.voicePitch}` : char.voicePitch})</span>
                        <button
                          onClick={() => handleSyncCharacterToScreenplay(char)}
                          className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-bold bg-cyan-950/40 hover:bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-900 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3 animate-pulse" />
                          <span>Sync to Active Screenplay</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Characters Internal Emotional / Psychological Arcs */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-widest font-bold">Emotional &amp; Developmental Ledger</h3>
                  <h4 className="text-md font-bold text-slate-100">Character Psychological Internal Arcs</h4>
                  <p className="text-xs text-slate-400">Define motivations, developmental trajectories, and relationship matrices to align story consistency.</p>
                </div>

                <div className="space-y-6">
                  {activeBible.characterArcs.map((arc, arcIdx) => (
                    <div 
                      key={arc.characterId || arcIdx}
                      className="bg-slate-950 border border-slate-850 p-5 rounded-xl space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 text-rose-400" />
                          {arc.characterName} Psychology Map
                        </span>
                        <div>
                          <label className="text-[9px] font-mono text-slate-500 uppercase mr-2">Trajectory:</label>
                          <select
                            value={arc.emotionalTrajectory}
                            onChange={(e) => handleUpdateCharArc(arcIdx, { emotionalTrajectory: e.target.value as any })}
                            className="bg-slate-900 border border-slate-800 text-xs font-mono text-amber-400 rounded px-2 py-0.5 focus:outline-none focus:border-amber-500"
                          >
                            {['Flat', 'Positive Growth', 'Tragic Descent', 'Corruption', 'Redemption'].map(traj => (
                              <option key={traj} value={traj} className="bg-slate-950 text-slate-300">{traj}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Starting State / Core Persona</label>
                          <textarea
                            value={arc.startingState}
                            onChange={(e) => handleUpdateCharArc(arcIdx, { startingState: e.target.value })}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 font-sans focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Trauma, Fears &amp; Core Motivation</label>
                          <textarea
                            value={arc.keyTraumaOrMotivation}
                            onChange={(e) => handleUpdateCharArc(arcIdx, { keyTraumaOrMotivation: e.target.value })}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 font-sans focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Midseason Climax / Turning Point</label>
                          <textarea
                            value={arc.midseasonTurningPoint}
                            onChange={(e) => handleUpdateCharArc(arcIdx, { midseasonTurningPoint: e.target.value })}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 font-sans focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Target Resolution State</label>
                          <textarea
                            value={arc.targetResolutionState}
                            onChange={(e) => handleUpdateCharArc(arcIdx, { targetResolutionState: e.target.value })}
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-slate-300 font-sans focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Relationship Matrices */}
                      {arc.relationshipMatrices && arc.relationshipMatrices.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[9px] font-bold text-slate-500 font-mono block uppercase mb-1.5">RELATIONSHIP TENSION MATRIX</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                            {arc.relationshipMatrices.map((matrix, mIdx) => (
                              <div key={mIdx} className="bg-slate-900 p-2 rounded flex items-center justify-between border border-slate-850">
                                <div>
                                  <span className="text-slate-400 font-bold">{matrix.targetCharacterName}</span>
                                  <span className="text-[10px] text-slate-500 block">{matrix.relationshipType}</span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <span className="text-[10px] text-slate-500">Tension:</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    matrix.tensionLevel >= 8 ? 'bg-rose-950 text-rose-400 border border-rose-900' :
                                    matrix.tensionLevel >= 5 ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                                    'bg-indigo-950 text-indigo-400 border border-indigo-900'
                                  }`}>{matrix.tensionLevel}/10</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 3: Arcs & Plot Lines */}
          {subTab === 'arcs' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Season Arc */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase font-mono tracking-widest font-bold">Seasonal Macro Layout</h3>
                  <h4 className="text-md font-bold text-slate-100">Season 1 Core Arc Settings</h4>
                </div>

                {activeBible.seasonArcs.map((arc, arcIdx) => (
                  <div key={arcIdx} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Season Number</label>
                        <input
                          type="number"
                          value={arc.seasonNumber}
                          onChange={(e) => handleUpdateSeasonArc(arcIdx, { seasonNumber: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Episodes Planned</label>
                        <input
                          type="number"
                          value={arc.episodesPlanned}
                          onChange={(e) => handleUpdateSeasonArc(arcIdx, { episodesPlanned: parseInt(e.target.value) || 12 })}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Theme Beats</label>
                        <input
                          type="text"
                          value={arc.themeBeats?.join(', ') || ''}
                          onChange={(e) => handleUpdateSeasonArc(arcIdx, { themeBeats: e.target.value.split(',').map(v=>v.trim()).filter(Boolean) })}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-slate-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Season logline &amp; setup</label>
                      <textarea
                        value={arc.premiseAndLogline}
                        onChange={(e) => handleUpdateSeasonArc(arcIdx, { premiseAndLogline: e.target.value })}
                        rows={2}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-300 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Central Conflict Grid</label>
                        <textarea
                          value={arc.centralConflict}
                          onChange={(e) => handleUpdateSeasonArc(arcIdx, { centralConflict: e.target.value })}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">Climax Event &amp; Resolution State</label>
                        <textarea
                          value={arc.climaxEvent}
                          onChange={(e) => handleUpdateSeasonArc(arcIdx, { climaxEvent: e.target.value })}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Story Arcs and plots */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-amber-400 uppercase font-mono tracking-widest font-bold">Subplots &amp; Threads</h3>
                    <h4 className="text-md font-bold text-slate-100">Multi-Episode Story Arcs</h4>
                  </div>
                  <button
                    onClick={handleAddStoryArc}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>Add Story Arc Thread</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {activeBible.storyArcs.map((arc, arcIdx) => (
                    <div key={arc.id || arcIdx} className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                        <span className="text-slate-200 font-bold font-mono text-xs uppercase tracking-wider">{arc.title}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-amber-400 font-mono font-bold uppercase">{arc.type}</span>
                          <select
                            value={arc.status}
                            onChange={(e) => handleUpdateStoryArc(arcIdx, { status: e.target.value as any })}
                            className="bg-slate-900 text-[10px] font-mono text-slate-300 rounded px-1.5 py-0.5 border border-slate-800"
                          >
                            {['Drafting', 'Outline', 'Scripted', 'Rendered'].map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <p className="text-slate-300 leading-relaxed font-sans">{arc.description}</p>

                      <div className="flex justify-between text-[10px] font-mono text-slate-500 border-t border-slate-900/60 pt-2">
                        <span>Active Across: {arc.episodesActive?.join(', ') || 'N/A'}</span>
                        <span>Climax Trigger: <strong className="text-indigo-400">{arc.climaxEpisode}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 4: Settings & Lore */}
          {subTab === 'settings' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-cyan-400 uppercase font-mono tracking-widest font-bold">World Settings &amp; Codex</h3>
                  <h4 className="text-md font-bold text-slate-100">Lore Settings, Technology &amp; Factions</h4>
                </div>
                <button
                  onClick={handleAddSetting}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Add Lore Anchor</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeBible.settings.map((set, setIdx) => (
                  <div key={set.id || setIdx} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                      <span className="text-xs font-bold text-slate-100 font-mono">{set.name}</span>
                      <span className="text-[9px] bg-slate-900 text-cyan-400 border border-cyan-950 px-2 rounded font-mono font-bold uppercase">{set.type}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed min-h-12">{set.description}</p>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 font-mono uppercase block mb-1">Visual Generation Prompt Assist:</label>
                      <input
                        type="text"
                        value={set.visualStylePrompt}
                        onChange={(e) => handleUpdateSetting(setIdx, { visualStylePrompt: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-850 p-1.5 rounded font-mono text-[10px] text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ))}

                {activeBible.settings.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-xs text-slate-500 font-mono">
                    0 world lore anchors registered. Add floating platforms, magical swords, or historical empires!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 5: Narrative Alignment Agent Panel */}
          {subTab === 'agent' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
              
              {/* Agent Greeting Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                      Narrative Alignment &amp; Memory Consensus Agent
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cross-references the active screenplay with Show Bible memory to prevent continuity drift and character breaks.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bot Persona Chat Block */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center shrink-0 text-indigo-400 shadow-lg">
                  <Cpu className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-indigo-400 font-mono">AI Showrunner Advisor</span>
                    <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1.5 rounded font-mono font-bold">READY</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    "Awaiting instructions! I have mapped the multidimensional memory layers of <strong className="text-cyan-400">{activeBible.title}</strong>, including {activeBible.cast.length} cast members, season arcs, and developmental emotional paths. Tap 'Audit Active Screenplay' and I will evaluate dialogue consistency and world setting parameters."
                  </p>
                </div>
              </div>

              {/* Action Board */}
              <div className="flex flex-wrap items-center justify-center gap-3 py-3 border-t border-b border-slate-850/60">
                <button
                  onClick={handleVerifyNarrativeAlignment}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-950 text-xs font-bold font-mono transition-all shadow cursor-pointer"
                >
                  <Activity className="w-4 h-4 text-slate-950" />
                  <span>Audit Active Screenplay Integrity</span>
                </button>

                <button
                  onClick={handleInjectBibleContext}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold font-mono transition-all shadow cursor-pointer"
                >
                  <Workflow className="w-4 h-4 text-indigo-400" />
                  <span>Inject Bible to LLM Memory</span>
                </button>
              </div>

              {/* Loading Scan State */}
              {verificationState === 'verifying' && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      Scanning dialogue sequences &amp; thematic arcs...
                    </span>
                    <span className="text-indigo-400 font-bold">{verificationProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Audit logs */}
              {verificationLogs.length > 0 && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850 max-h-80 overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-500 font-mono uppercase block border-b border-slate-900 pb-1.5">COHERENCE AUDIT CONSOLE REPORT</span>
                  
                  <div className="space-y-2 text-xs font-mono">
                    {verificationLogs.map((log, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-2.5 leading-relaxed">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase shrink-0 font-bold ${
                          log.type === 'critical' ? 'bg-rose-950 text-rose-400 border border-rose-900' :
                          log.type === 'warn' ? 'bg-amber-950 text-amber-400 border border-amber-900' :
                          log.type === 'success' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                          'bg-slate-900 text-slate-400 border border-slate-850'
                        }`}>
                          {log.agent}
                        </span>
                        <p className={`text-slate-300 ${log.type === 'warn' ? 'border-l border-amber-500 pl-2' : ''}`}>{log.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Audit Rating Score HUD */}
                  {verificationState === 'completed' && verificationRating !== null && (
                    <div className="mt-4 pt-4 border-t border-slate-900 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center font-mono text-center">
                          <div>
                            <span className="text-[10px] text-slate-500 block">COHERENCE</span>
                            <span className={`text-lg font-bold ${verificationRating >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{verificationRating}%</span>
                          </div>
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <span className="font-bold text-slate-200">Thematic Alignment Evaluated</span>
                          <p className="text-slate-400">
                            {verificationRating >= 80 
                              ? 'Screenplay aligns with master premise, setting locks, and character emotional paths.' 
                              : 'Discrepancy warnings detected. Synchronize script with quick repair.'}
                          </p>
                        </div>
                      </div>

                      {verificationRating < 100 && (
                        <button
                          onClick={handleApplyQuickAlignmentHeal}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg transition-all shadow cursor-pointer font-mono"
                        >
                          Quick Synchronize
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Sub-Tab 6: Archived Series Vault */}
          {subTab === 'archive' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-amber-300 uppercase font-mono tracking-widest">
                      Archived Series Vault
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-[10px] font-mono text-amber-300 font-bold">
                      IN THE BOOKS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Historical record vault for completed anime &amp; cartoon productions. Kept in master books for rerun syndication, lore continuity, or sequel spin-offs.
                  </p>
                </div>

                <button
                  onClick={() => {
                    alert(`"${activeBible.title}" has been safely archived in the master books!`);
                    registerRealTimeHeal('Series Bible', `Archived active series "${activeBible.title}" into master books vault.`, 'Series archived.', 'heal');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-700/80 text-amber-300 text-xs font-bold font-mono flex items-center space-x-2 cursor-pointer transition-all shadow-lg"
                >
                  <Archive className="w-4 h-4 text-amber-400" />
                  <span>Archive Current Series ("{activeBible.title}")</span>
                </button>
              </div>

              {/* Archived Shows Collection Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Archived Production Records:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Archived Show Card 1 */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-amber-700/60 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 uppercase">
                          Completed • Season 1 (12 Ep)
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-100 mt-1.5">{activeBible.title} (Archived Master)</h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">2025-2026</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {activeBible.premise}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-900 font-mono text-[10px] text-slate-400">
                      <div>Cast: <strong className="text-amber-300">{activeBible.cast.length}</strong></div>
                      <div>Arcs: <strong className="text-cyan-400">{activeBible.storyArcs.length}</strong></div>
                      <div>Lore: <strong className="text-purple-400">{activeBible.settings.length}</strong></div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeBible, null, 2));
                          const downloadAnchor = document.createElement('a');
                          downloadAnchor.setAttribute("href", dataStr);
                          downloadAnchor.setAttribute("download", `${activeBible.title.toLowerCase().replace(/\s+/g, '_')}_archived_bible.json`);
                          document.body.appendChild(downloadAnchor);
                          downloadAnchor.click();
                          downloadAnchor.remove();
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold font-mono flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-cyan-400" />
                        <span>Export Bible JSON</span>
                      </button>

                      <button
                        onClick={() => {
                          alert(`Restored "${activeBible.title}" to active production pipeline!`);
                          setSubTab('meta');
                        }}
                        className="py-1.5 px-3 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-[10px] font-bold font-mono cursor-pointer"
                      >
                        Restore to Active
                      </button>
                    </div>
                  </div>

                  {/* Archived Show Card 2 (Historical Legacy Show) */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 opacity-80 hover:opacity-100 transition-all">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 uppercase">
                          Legacy Archive • 26 Episodes
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-100 mt-1.5">CYBER SAKUGA: REBIRTH 2099</h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">2024</span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      In the submerged lower levels of Neo-Saitama, a rogue netrunner hacks into a sentient AI satellite to broadcast illegal Sakuga animation.
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-900 font-mono text-[10px] text-slate-400">
                      <div>Cast: <strong className="text-amber-300">14</strong></div>
                      <div>Arcs: <strong className="text-cyan-400">8</strong></div>
                      <div>Lore: <strong className="text-purple-400">12</strong></div>
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => alert("Downloading legacy show archive...")}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold font-mono flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3 text-cyan-400" />
                        <span>Export Bible JSON</span>
                      </button>

                      <button
                        onClick={() => alert("Restored legacy show into current workspace universe!")}
                        className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold font-mono cursor-pointer"
                      >
                        View Vault Record
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Toast Notification Banner */}
      {ingestionToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border border-emerald-500/80 text-emerald-200 p-4 rounded-2xl shadow-2xl flex items-start space-x-3 animate-slideUp">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-mono text-emerald-300 uppercase">ALL TABS CLEARED &amp; RE-SEEDED</h4>
            <p className="text-xs leading-relaxed text-slate-200">{ingestionToast}</p>
          </div>
          <button onClick={() => setIngestionToast(null)} className="text-slate-400 hover:text-slate-100 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fresh Series Ingestion & Mass Document Upload Modal */}
      {showFreshIngestionModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-6 my-8 animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400">
                  <Zap className="w-6 h-6 fill-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-2">
                    START FRESH SERIES &amp; MASS DOCUMENT INGESTION
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload documents or paste lore notes. This will <span className="text-amber-400 font-bold">clear out all tabs</span> (Script, Cast, Storyboard, Dubbing, Video Generator, Export) to start fresh.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowFreshIngestionModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Optional Series Title Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase font-mono block">
                Fresh Series Title <span className="text-slate-500 font-normal">(Optional - auto-inferred if blank)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CYBER SAKUGA: REBIRTH 2099"
                value={freshSeriesTitle}
                onChange={(e) => setFreshSeriesTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono uppercase tracking-wider"
              />
            </div>

            {/* Drag & Drop File Uploader Zone */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-300 uppercase font-mono flex items-center justify-between">
                <span>Upload Documents &amp; Lore Files</span>
                <span className="text-purple-400 text-[10px]">(.txt, .md, .json, .fountain, .script, .csv, .docx, .pdf)</span>
              </label>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileUpload(e.dataTransfer.files);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragOver 
                    ? 'border-purple-500 bg-purple-950/20 scale-[1.01]' 
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.json,.fountain,.script,.csv,.docx,.pdf,.png,.jpg"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files);
                    }
                  }}
                  className="hidden"
                  id="bulk-doc-file-input"
                />

                <label htmlFor="bulk-doc-file-input" className="cursor-pointer space-y-2 block">
                  <div className="w-12 h-12 mx-auto rounded-full bg-purple-950/50 border border-purple-800 flex items-center justify-center text-purple-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">
                      Drag &amp; drop files here, or <span className="text-purple-400 underline">browse computer</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Upload multiple script notes, character bibles, world lore, or episode outlines
                    </p>
                  </div>
                </label>
              </div>

              {/* Uploaded Files Badges */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Uploaded Documents ({uploadedFiles.length}):</span>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200">
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        <span className="truncate max-w-[180px]">{file.name}</span>
                        <span className="text-[9px] text-slate-500">({Math.round(file.size / 1024)} KB)</span>
                        <button
                          onClick={() => handleRemoveUploadedFile(idx)}
                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pasted Content Textarea */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase font-mono block">
                Or Paste Raw Outlines / Lore / Screenplay Text
              </label>
              <textarea
                rows={4}
                placeholder="Paste character lists, world rules, episode outlines, dialogue drafts, or lore descriptions here..."
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 leading-relaxed font-sans"
              />
            </div>

            {/* Warning Banner about Clearing All Tabs */}
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 flex items-start space-x-3 text-amber-200 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold uppercase font-mono text-amber-300 block">Tab State Reset Notice</span>
                <p className="text-[11px] leading-relaxed text-amber-200/90">
                  Launching a fresh series will clear all previous script scenes, storyboard keyframe shots, dubbing audio tracks, and video render queues across <strong>all workspace tabs</strong> to begin cleanly on this new production.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowFreshIngestionModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer font-mono"
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteFreshSeriesIngestion}
                disabled={isParsingDocuments}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:brightness-110 text-white text-xs font-bold transition-all shadow-xl shadow-purple-500/20 cursor-pointer font-mono disabled:opacity-50"
              >
                {isParsingDocuments ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Parsing &amp; Resetting Tabs...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>Clear All Tabs &amp; Launch Fresh Series</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
