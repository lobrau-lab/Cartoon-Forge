import { EpisodeProject, ProjectStyle, CharacterAnchor } from '../types';

export const PRESET_STYLES: ProjectStyle[] = [
  {
    id: 'cyber-sakuga',
    name: 'Cyber-Sakuga 2099',
    loraTag: '<lora:shonen_sakuga_v24:0.85>, dynamic keyframe, futuristic neo-tokyo, high action anime render, crisp linework',
    description: 'High frame-rate modern Japanese action anime with vivid glow effects, dynamic perspective lines, and sharp cel shading.',
    negativePrompt: 'blurry, 3d render, low quality, photorealistic, bad anatomy, deformed limbs',
    colorPalette: ['#0f172a', '#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b'],
    aspectRatio: '16:9',
    frameRate: 24,
  },
  {
    id: 'retro-90s-cel',
    name: '90s Retro Cel Anime',
    loraTag: '<lora:retro_cel_anime_1995:0.90>, hand-drawn grain, analog television aesthetic, soft chromatic aberration, VHS texture',
    description: 'Nostalgic golden-era space opera look with analog film grain, vibrant gouache backgrounds, and expressive character designs.',
    negativePrompt: 'hyper-digital glow, vector clean, modern flat, 3d cgi',
    colorPalette: ['#1e1b4b', '#9333ea', '#f43f5e', '#fbbf24', '#06b6d4'],
    aspectRatio: '16:9',
    frameRate: 24,
  },
  {
    id: 'painterly-ghibli',
    name: 'Spirited Meadow',
    loraTag: '<lora:painterly_ghibli_style:0.80>, watercolor background, studio ghibli aesthetic, lush nature, gentle lighting',
    description: 'Soft painterly aesthetic with hand-painted watercolor backgrounds, expressive whimsical animation, and rich natural light.',
    negativePrompt: 'sharp cyberpunk neon, harsh dark lines, gritty, dystopian',
    colorPalette: ['#065f46', '#10b981', '#fef08a', '#38bdf8', '#fb923c'],
    aspectRatio: '16:9',
    frameRate: 24,
  },
  {
    id: 'dark-mecha-gothic',
    name: 'Dark Fantasy Mecha',
    loraTag: '<lora:dark_mecha_gothic:0.88>, heavy shadows, volumetric fog, high contrast chiaroscuro, mechanical detail',
    description: 'Intense gothic mech aesthetic featuring metallic sheen, dramatic side lighting, and atmospheric rain/smoke effects.',
    negativePrompt: 'bright pastel, cheery, simple toon, oversaturated pink',
    colorPalette: ['#09090b', '#dc2626', '#475569', '#facc15', '#1e293b'],
    aspectRatio: '16:9',
    frameRate: 24,
  },
  {
    id: 'western-toon-chase',
    name: 'Toon-Overdrive (Western)',
    loraTag: '<lora:modern_cartoon_toon:0.85>, bold black outlines, vibrant flat colors, rubberhose dynamics, exaggerated expressions',
    description: 'Expressive western animation with snappy timing, stretch-and-squash dynamics, and bold graphic shapes.',
    negativePrompt: 'anime shading, detailed realistic textures, realistic faces',
    colorPalette: ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#1e1b4b'],
    aspectRatio: '16:9',
    frameRate: 30,
  }
];

export const INITIAL_CAST: CharacterAnchor[] = [
  {
    id: 'char-ren',
    name: 'Ren Kusanagi',
    role: 'Protagonist',
    visualSummary: 'Young pilot with spiky electric blue hair, crimson eyepatch, black leather high-collar jacket with cyan luminescent trim.',
    loraEmbedding: '<lora:ren_kusanagi_anchor:1.0>, spiky electric blue hair, crimson eyepatch, cyber jacket',
    hairStyle: 'Electric Blue Spiky',
    eyeColor: 'Amber Gold',
    outfit: 'Black cyber leather jacket with cyan neon trim',
    seed: 849204,
    voicePersona: 'Kore',
    voicePitch: 2,
    turnaroundUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    expressions: [
      { name: 'Neutral', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80' },
      { name: 'Determined Shout', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80' },
      { name: 'Smirk', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80' },
      { name: 'Shocked', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'char-lyra',
    name: 'Lyra Vance',
    role: 'Deuteragonist',
    visualSummary: 'Brilliant engineer with silver-white ponytail, emerald visor headset, oversized mechanics coat over sleek jumpsuit.',
    loraEmbedding: '<lora:lyra_vance_anchor:1.0>, silver ponytail, green visor, mechanical suit',
    hairStyle: 'High Silver Ponytail',
    eyeColor: 'Emerald Green',
    outfit: 'Tech jumpsuit with white oversized coat and holographic visor',
    seed: 394812,
    voicePersona: 'Zephyr',
    voicePitch: -1,
    turnaroundUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    expressions: [
      { name: 'Analyzing', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80' },
      { name: 'Confident Smile', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80' },
      { name: 'Panic', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80' }
    ]
  },
  {
    id: 'char-malakor',
    name: 'General Malakor',
    role: 'Antagonist',
    visualSummary: 'Towering cybernetic commander with obsidian armor, glowing crimson visor optic, scarred jaw, and spiked shoulders.',
    loraEmbedding: '<lora:malakor_commander:1.0>, obsidian cyber armor, glowing red optic eye',
    hairStyle: 'Shaved / Cyber Plate',
    eyeColor: 'Crimson Optic Sensor',
    outfit: 'Heavy spiked obsidian power armor',
    seed: 918234,
    voicePersona: 'Fenrir',
    voicePitch: -6,
    turnaroundUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    expressions: [
      { name: 'Cold Stare', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&auto=format&fit=crop&q=80' },
      { name: 'Commanding Fury', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80' }
    ]
  }
];

export const MOCK_PROJECT: EpisodeProject = {
  id: 'proj-cyber-ep1',
  title: 'Episode 01: Awakening of the Quantum Blade',
  seriesTitle: 'AETHER SHIFT 2099',
  episodeNumber: 1,
  targetDurationMin: 24,
  style: PRESET_STYLES[0],
  cast: INITIAL_CAST,
  updatedAt: new Date().toISOString(),
  scenes: [
    {
      sceneNumber: 1,
      heading: 'EXT. NEO-TOKYO SKYLINE - NIGHT',
      location: 'Neo-Tokyo Rooftops',
      timeOfDay: 'NIGHT',
      action: 'Torrential neon rain falls across massive holographic skyscrapers. The camera sweeps low across a gleaming rooftop grid.',
      timingEstMin: 3.5,
      transition: 'Fade In',
      plotPoint: 'Inciting Incident (Barrier Breach)',
      styleNotes: 'Use heavy reflections, high-contrast cyan/magenta palette with speed lines.',
      dialogue: [
        {
          id: 'd-101',
          character: 'REN KUSANAGI',
          line: 'If the barrier drops below 12%, the core will critical burst. Lyra, talk to me!',
          emotion: 'Desperate / High Energy',
          durationEst: 4.2
        },
        {
          id: 'd-102',
          character: 'LYRA VANCE',
          line: 'I am rerouting power through the secondary bypass! Keep Malakor away from the mainframe for thirty seconds!',
          emotion: 'Urgent / Focused',
          durationEst: 5.1
        }
      ]
    },
    {
      sceneNumber: 2,
      heading: 'INT. QUANTUM CORE CHAMBER - CONTINUOUS',
      location: 'Quantum Core',
      timeOfDay: 'NIGHT',
      action: 'Malakor steps through the shattered reinforced door, his obsidian armor humming with unstable energy.',
      timingEstMin: 6.0,
      transition: 'Cut',
      plotPoint: 'Midpoint Reversal (Core Intrusion)',
      styleNotes: 'Sakuga impact frames on armor footsteps, volumetric red fog.',
      dialogue: [
        {
          id: 'd-201',
          character: 'GENERAL MALAKOR',
          line: 'Foolish children. You fight against the inevitable tide of human evolution.',
          emotion: 'Dominant / Monologue',
          durationEst: 6.0
        },
        {
          id: 'd-202',
          character: 'REN KUSANAGI',
          line: 'I do not care about evolution! I care about keeping my promises!',
          emotion: 'Heroic Shout',
          durationEst: 3.8
        }
      ]
    },
    {
      sceneNumber: 3,
      heading: 'EXT. HIGHWAY OVERPASS - NIGHT (CLIMAX BATTLE)',
      location: 'Neo Highway Overpass',
      timeOfDay: 'NIGHT',
      action: 'Ren ignites the Quantum Blade. A brilliant arc of turquoise plasma cuts through the darkness as he leaps forward.',
      timingEstMin: 14.5,
      transition: 'Dissolve',
      plotPoint: 'Climax Clashes (Quantum Overdrive)',
      styleNotes: 'Full sakuga keyframe sequences, rotational camera orbit around sword swing.',
      dialogue: [
        {
          id: 'd-301',
          character: 'REN KUSANAGI',
          line: 'QUANTUM BURST... MAXIMUM DRIVE!',
          emotion: 'Climactic Shout',
          durationEst: 4.0
        }
      ]
    }
  ],
  shots: [
    {
      id: 'shot-101',
      sceneNumber: 1,
      shotNumber: 1,
      shotType: 'Extreme Wide',
      cameraMovement: 'Pan Left',
      durationSec: 5,
      charactersInShot: [],
      actionPrompt: 'Cinematic wide shot of Neo-Tokyo futuristic skyline in torrential rain, towering holograms, cyan glowing highways',
      soundEffect: 'Thunder roll, distant sirens, heavy rain soundscape',
      keyframeUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      status: 'ready'
    },
    {
      id: 'shot-102',
      sceneNumber: 1,
      shotNumber: 2,
      shotType: 'Medium',
      cameraMovement: 'Tracking',
      durationSec: 4,
      charactersInShot: ['Ren Kusanagi'],
      actionPrompt: 'Ren Kusanagi standing on rain-soaked rooftop, spiky electric blue hair drenched in water, eyepatch glowing crimson',
      dialogueLine: 'If the barrier drops below 12%, the core will critical burst. Lyra, talk to me!',
      soundEffect: 'Rain splattering on cyber armor',
      keyframeUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
      status: 'ready'
    },
    {
      id: 'shot-103',
      sceneNumber: 1,
      shotNumber: 3,
      shotType: 'Close-Up',
      cameraMovement: 'Zoom In',
      durationSec: 6,
      charactersInShot: ['Lyra Vance'],
      actionPrompt: 'Lyra Vance adjusting holographic visor headset with green data streams reflecting in her emerald eyes, intense focus',
      dialogueLine: 'I am rerouting power through the secondary bypass! Keep Malakor away from the mainframe for thirty seconds!',
      soundEffect: 'Holographic typing beeps, electrical humming',
      keyframeUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
      status: 'ready'
    },
    {
      id: 'shot-201',
      sceneNumber: 2,
      shotNumber: 4,
      shotType: 'Dutch Angle',
      cameraMovement: 'Tilt Up',
      durationSec: 7,
      charactersInShot: ['General Malakor'],
      actionPrompt: 'Dutch angle low camera view of General Malakor stepping into doorway, obsidian power armor with glowing red sensors',
      dialogueLine: 'Foolish children. You fight against the inevitable tide of human evolution.',
      soundEffect: 'Heavy metallic footsteps, steam release valve',
      keyframeUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
      status: 'ready'
    },
    {
      id: 'shot-301',
      sceneNumber: 3,
      shotNumber: 5,
      shotType: 'Sakuga Impact',
      cameraMovement: 'Orbit',
      durationSec: 6,
      charactersInShot: ['Ren Kusanagi', 'General Malakor'],
      actionPrompt: 'High energy sakuga action frame, Ren igniting glowing turquoise plasma blade clashing against Malakor black energy shield, dynamic impact lines',
      dialogueLine: 'QUANTUM BURST... MAXIMUM DRIVE!',
      soundEffect: 'High voltage energy shockwave explosion, bass rumble',
      keyframeUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      status: 'ready'
    }
  ],
  dubbingTracks: [
    {
      id: 'dub-1',
      shotId: 'shot-102',
      character: 'Ren Kusanagi',
      language: 'JA',
      text: 'バリアが12%以下に落ちたらコアが臨界爆発する！ライラ、応答しろ！',
      emotion: 'Desperate',
      visemeSequence: [
        { time: 0.1, viseme: 'BA' },
        { time: 0.5, viseme: 'RI' },
        { time: 0.9, viseme: 'A' },
        { time: 1.4, viseme: 'KO' },
        { time: 2.1, viseme: 'RA' }
      ]
    },
    {
      id: 'dub-2',
      shotId: 'shot-102',
      character: 'Ren Kusanagi',
      language: 'EN',
      text: 'If the barrier drops below 12%, the core will critical burst. Lyra, talk to me!',
      emotion: 'Desperate',
      visemeSequence: [
        { time: 0.1, viseme: 'I' },
        { time: 0.4, viseme: 'BA' },
        { time: 1.1, viseme: 'DR' },
        { time: 2.2, viseme: 'CR' }
      ]
    },
    {
      id: 'dub-3',
      shotId: 'shot-103',
      character: 'Lyra Vance',
      language: 'EN',
      text: 'I am rerouting power through the secondary bypass! Keep Malakor away from the mainframe for thirty seconds!',
      emotion: 'Urgent',
      visemeSequence: [
        { time: 0.2, viseme: 'AI' },
        { time: 0.8, viseme: 'RE' },
        { time: 1.5, viseme: 'PO' },
        { time: 2.6, viseme: 'MA' }
      ]
    }
  ],
  voiceVaultSamples: [
    {
      id: 'vsample-ren-1',
      characterId: 'char-ren',
      characterName: 'Ren Kusanagi',
      sampleTitle: 'Ren - High-Energy Battle Shout (Alpha)',
      voicePersonaPreset: 'jm_kaito',
      language: 'JA',
      audioSource: 'synthesized',
      tags: ['Battle', 'Shonen', 'High Tension'],
      pitch: 2,
      speedCadence: 1.15,
      resonanceCoefficient: 1.1,
      timbreDescription: 'Gritty anime hero timbre with resonant high-mids and sharp articulation.',
      transcriptText: 'QUANTUM BURST... MAXIMUM DRIVE! Get out of our way, Malakor!',
      durationSec: 4.2,
      createdAt: new Date().toISOString(),
      isPrimaryForCharacter: true
    },
    {
      id: 'vsample-ren-2',
      characterId: 'char-ren',
      characterName: 'Ren Kusanagi',
      sampleTitle: 'Ren - Studio Mic Audition (Rain Rooftop)',
      voicePersonaPreset: 'Kore',
      language: 'EN',
      audioSource: 'recorded',
      tags: ['Dramatic', 'Atmospheric', 'Urgent'],
      pitch: 1,
      speedCadence: 1.0,
      resonanceCoefficient: 1.05,
      timbreDescription: 'Direct microphone capture with wet acoustics and breath accents.',
      transcriptText: 'If the barrier drops below 12%, the core will critical burst. Lyra, talk to me!',
      durationSec: 5.1,
      createdAt: new Date().toISOString(),
      isPrimaryForCharacter: false
    },
    {
      id: 'vsample-lyra-1',
      characterId: 'char-lyra',
      characterName: 'Lyra Vance',
      sampleTitle: 'Lyra - Tactical Analysis & Bypass Code',
      voicePersonaPreset: 'jf_alpha',
      language: 'JA',
      audioSource: 'synthesized',
      tags: ['Tactical', 'Calm', 'Sci-Fi'],
      pitch: -1,
      speedCadence: 1.05,
      resonanceCoefficient: 1.2,
      timbreDescription: 'Clear analytical female voice with subtle resonance and precise cadence.',
      transcriptText: 'I am rerouting power through the secondary bypass! Keep Malakor away for thirty seconds!',
      durationSec: 5.8,
      createdAt: new Date().toISOString(),
      isPrimaryForCharacter: true
    },
    {
      id: 'vsample-lyra-2',
      characterId: 'char-lyra',
      characterName: 'Lyra Vance',
      sampleTitle: 'Lyra - Overdrive Warning (Kokoro Heart)',
      voicePersonaPreset: 'af_heart',
      language: 'EN',
      audioSource: 'cloned',
      tags: ['Cloned', 'Expressive', 'High Pitch'],
      pitch: 1,
      speedCadence: 1.1,
      resonanceCoefficient: 1.15,
      timbreDescription: 'Zero-shot neural cloned persona tuned on Kokoro-82M Heart model.',
      transcriptText: 'Reactor core output stabilized at ninety-eight percent. Secondary shields online!',
      durationSec: 4.6,
      createdAt: new Date().toISOString(),
      isPrimaryForCharacter: false
    },
    {
      id: 'vsample-malakor-1',
      characterId: 'char-malakor',
      characterName: 'General Malakor',
      sampleTitle: 'Malakor - Obsidian Monologue (Deep Baritone)',
      voicePersonaPreset: 'Fenrir',
      language: 'EN',
      audioSource: 'cloned',
      tags: ['Villain', 'Baritone', 'Resonant'],
      pitch: -5,
      speedCadence: 0.9,
      resonanceCoefficient: 1.4,
      timbreDescription: 'Heavy low-frequency baritone with metallic robotic harmonics.',
      transcriptText: 'Foolish children. You fight against the inevitable tide of human evolution.',
      durationSec: 6.4,
      createdAt: new Date().toISOString(),
      isPrimaryForCharacter: true
    }
  ]
};

export const createBlankProject = (
  title = 'Untitled Anime Episode',
  seriesTitle = 'Original Anime Series',
  episodeNumber = 1
): EpisodeProject => ({
  id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  title,
  seriesTitle,
  episodeNumber,
  targetDurationMin: 24,
  style: PRESET_STYLES[0],
  cast: [],
  scenes: [],
  shots: [],
  dubbingTracks: [],
  voiceVaultSamples: [],
  isBlankProject: true,
  updatedAt: new Date().toISOString()
});

export const BLANK_PROJECT: EpisodeProject = createBlankProject();
