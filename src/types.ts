export interface ProjectStyle {
  id: string;
  name: string;
  loraTag: string;
  description: string;
  negativePrompt: string;
  colorPalette: string[];
  aspectRatio: string;
  frameRate: number;
}

export interface CharacterAnchor {
  id: string;
  name: string;
  role: 'Protagonist' | 'Deuteragonist' | 'Antagonist' | 'Supporting' | 'Mascot';
  visualSummary: string;
  loraEmbedding: string;
  hairStyle: string;
  eyeColor: string;
  outfit: string;
  seed: number;
  voicePersona: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr';
  voicePitch: number; // -10 to +10
  turnaroundUrl?: string;
  avatarUrl?: string;
  turnaroundAngles?: { angle: 'Front' | 'ThreeQuarter' | 'Side' | 'Back'; url?: string; prompt?: string; caption?: string }[];
  expressions: { name: string; url?: string; caption?: string }[];
  loraTrainingConfig?: {
    triggerWord: string;
    networkDim: number;
    networkAlpha: number;
    learningRate: string;
    optimizer: string;
    baseModel: string;
    resolution: string;
    epochs: number;
    batchSize: number;
    mixedPrecision: string;
  };
  colorPaletteColors?: string[];
  colorTemperatureK?: number;
  lightingStyle?: string;
  lightingContrast?: 'Low' | 'Medium' | 'High' | 'Dramatic';
  voiceFingerprint?: {
    fingerprintId: string;
    timbreDescription: string;
    pitchStability: number;
    formantFrequencies: number[];
    speedCadence: number;
    resonanceCoefficient: number;
    breathiness: number;
    loraModelName: string;
    energyDistribution: number[];
    isTrained: boolean;
  };
}

export interface DialogueLine {
  id: string;
  character: string;
  line: string;
  emotion: string;
  durationEst: number;
}

export interface ScriptScene {
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  action: string;
  dialogue: DialogueLine[];
  timingEstMin: number;
  styleNotes: string;
  transition?: 'Cut' | 'Fade In' | 'Dissolve' | 'Fade Out' | 'Wipe' | string;
  parentSceneNumber?: number;
  branchId?: string;
  branchTitle?: string;
  visualThemeNotes?: string;
  colorPalette?: string[];
  dominantEmotion?: string;
  plotPoint?: string;
}

export interface ShotItem {
  id: string;
  sceneNumber: number;
  shotNumber: number;
  shotType: 'Extreme Wide' | 'Wide' | 'Medium' | 'Close-Up' | 'Extreme Close-Up' | 'Dutch Angle' | 'Sakuga Impact';
  cameraMovement: 'Static' | 'Pan Left' | 'Pan Right' | 'Tilt Up' | 'Zoom In' | 'Tracking' | 'Orbit';
  durationSec: number;
  charactersInShot: string[];
  actionPrompt: string;
  dialogueLine?: string;
  soundEffect?: string;
  keyframeUrl?: string;
  transition?: 'Cut' | 'Dissolve' | 'Fade';
  directorNotes?: string;
  lightingCondition?: string;
  renderingPreset?: string;
  renderedVideoUrl?: string;
  videoRenderStatus?: 'idle' | 'rendering' | 'completed' | 'failed';
  videoRenderProgress?: number;
  status: 'pending' | 'generating' | 'ready';
  cameraPath?: CameraPathConfig;
}

export interface CameraKeyframe {
  id: string;
  timePct: number; // 0 to 100
  pan: number;     // degrees, -90 to 90
  tilt: number;    // degrees, -45 to 45
  dolly: number;   // units, 0 to 10
  roll: number;    // degrees, -180 to 180
  easeOut: { x: number; y: number }; // control point 1 (x, y)
  easeIn: { x: number; y: number };  // control point 2 (x, y)
}

export interface CameraPathConfig {
  keyframes: CameraKeyframe[];
  motionBlur: boolean;
  shutterSpeed: string;
  focalLengthMm: number;
}

export interface DubbingTrack {
  id: string;
  shotId: string;
  character: string;
  language: 'JA' | 'EN';
  text: string;
  audioBase64?: string;
  emotion: string;
  visemeSequence: { time: number; viseme: string }[];
  vaultSampleId?: string;
}

export interface VoiceVaultSample {
  id: string;
  characterId: string;
  characterName: string;
  sampleTitle: string;
  voicePersonaPreset: string;
  language: 'JA' | 'EN';
  audioSource: 'synthesized' | 'uploaded' | 'recorded' | 'cloned';
  audioBase64?: string;
  tags: string[];
  pitch: number;
  speedCadence: number;
  resonanceCoefficient: number;
  timbreDescription?: string;
  transcriptText: string;
  durationSec: number;
  createdAt: string;
  isPrimaryForCharacter?: boolean;
}

export interface EpisodeProject {
  id: string;
  title: string;
  seriesTitle: string;
  episodeNumber: number;
  targetDurationMin: number;
  style: ProjectStyle;
  cast: CharacterAnchor[];
  scenes: ScriptScene[];
  shots: ShotItem[];
  dubbingTracks: DubbingTrack[];
  voiceVaultSamples?: VoiceVaultSample[];
  updatedAt: string;
}

export interface HubModelItem {
  id: string;
  name: string;
  repoId: string;
  provider: 'huggingface' | 'kaggle' | 'google_gemma' | 'civitai';
  type: 'video' | 'image' | 'tts' | 'llm' | 'lora';
  license: 'Apache 2.0' | 'OpenRAIL' | 'MIT' | 'Gemma Terms' | 'CreativeML';
  downloadSizeGb: number;
  minVramGb: number;
  description: string;
  tags: string[];
  isDownloaded: boolean;
  downloadProgress?: number;
  sampleImageUrl?: string;
  sampleVideoUrl?: string;
  directDownloadUrl: string;
}

export interface ModelCheckpointItem {
  id: string;
  name: string;
  category: 'video' | 'image' | 'tts' | 'vae' | 'clip';
  filename: string;
  localPath: string;
  fileSizeBytes: number;
  quantization: string;
  baseArchitecture: string;
  status: 'mounted' | 'downloading' | 'available' | 'missing';
  downloadProgress?: number;
  sourceUrl?: string;
  description: string;
  vramRequiredGb: number;
}

export interface LoraItem {
  id: string;
  name: string;
  category: 'style' | 'character' | 'action' | 'lighting';
  triggerWord: string;
  recommendedWeight: number;
  filename: string;
  localPath: string;
  fileSizeBytes: number;
  baseModel: string;
  thumbnailUrl?: string;
  status: 'mounted' | 'available' | 'missing';
  sourceUrl?: string;
  description: string;
}

export interface LocalModelConfig {
  videoModel: string;
  videoWeightsPath: string;
  vramGb: number;
  gpuDevice: string;
  quantization: 'fp16' | 'bf16' | 'int8' | 'gguf_q4_k_m';
  ttsEngine: 'kokoro' | 'chat_tts' | 'bark' | 'cosy_voice' | 'system_api';
  ttsWeightsPath: string;
  imageModel: string;
  loraFolderPath: string;
  isOfflineMode: boolean;
}

export interface ExportFormats {
  fountain: string;
  otioJson: string;
  finalCutXml: string;
  edl: string;
  storyboardManifest: string;
  fileManifest: string;
}

export interface CharacterInternalArc {
  characterId: string;
  characterName: string;
  startingState: string;
  keyTraumaOrMotivation: string;
  midseasonTurningPoint: string;
  targetResolutionState: string;
  emotionalTrajectory: 'Flat' | 'Positive Growth' | 'Tragic Descent' | 'Corruption' | 'Redemption';
  relationshipMatrices: { targetCharacterName: string; relationshipType: string; tensionLevel: number }[]; // tensionLevel 1-10
}

export interface SeasonArc {
  seasonNumber: number;
  episodesPlanned: number;
  premiseAndLogline: string;
  centralConflict: string;
  climaxEvent: string;
  themeBeats: string[];
}

export interface StoryArc {
  id: string;
  title: string;
  type: 'Main Plot' | 'Sub-Plot' | 'Character Arc Thread';
  description: string;
  episodesActive: string[]; // e.g. ["Episode 1", "Episode 2"]
  climaxEpisode: string;
  status: 'Drafting' | 'Outline' | 'Scripted' | 'Rendered';
}

export interface LoreSetting {
  id: string;
  name: string;
  type: 'Location' | 'Technology' | 'Artifact' | 'Faction';
  description: string;
  visualStylePrompt: string;
  culturalNotes?: string;
}

export interface ShowBible {
  id: string;
  title: string;
  premise: string;
  themes: string[];
  visualAesthetic: string;
  targetAudience: string;
  cast: CharacterAnchor[]; // master list of characters for this entire show
  characterArcs: CharacterInternalArc[];
  seasonArcs: SeasonArc[];
  storyArcs: StoryArc[];
  settings: LoreSetting[];
  episodesList: { episodeNumber: number; title: string; synopsis: string; status: 'Active' | 'Planned' | 'Archived' }[];
}

export type LipSyncPhoneme = 'A' | 'E' | 'I' | 'O' | 'U' | 'MBP' | 'Rest' | 'L' | 'FV';

export interface LipSyncVisemeFrame {
  id: string;
  timeSec: number;
  durationSec: number;
  viseme: LipSyncPhoneme;
  intensity: number; // 0 to 1
  characterName: string;
}

export interface WordEmotionKeyframe {
  id: string;
  word: string;
  startSec: number;
  durationSec: number;
  pitchShiftSemitones: number; // -12 to +12
  speedRate: number; // 0.5 to 2.0
  emotionIntensity: number; // 0 to 100%
  emotionTag: 'Neutral' | 'Whisper' | 'Shout' | 'Tremble' | 'Empathetic' | 'Monotone';
}

export interface FoleySoundEvent {
  id: string;
  name: string;
  category: 'Impact' | 'Ambience' | 'Footstep' | 'Combat' | 'Sci-Fi' | 'UI';
  timestampSec: number;
  durationSec: number;
  volume: number; // 0 to 1
  pan: number; // -1 to 1
}

export interface SceneAudioTimelineConfig {
  sceneNumber: number;
  masterVolume: number;
  dialogueVolume: number;
  bgmVolume: number;
  foleyVolume: number;
  isDialogueMuted: boolean;
  isBgmMuted: boolean;
  isFoleyMuted: boolean;
  isDialogueSolo?: boolean;
  isBgmSolo?: boolean;
  isFoleySolo?: boolean;
  bgmTrackName: string;
  foleyEvents: FoleySoundEvent[];
  wordEmotionKeyframes: Record<string, WordEmotionKeyframe[]>; // dialogueLineId -> word keyframes
  lipSyncData: Record<string, LipSyncVisemeFrame[]>; // dialogueLineId -> visemes
}

export type NleTool = 'select' | 'razor' | 'ripple' | 'slip' | 'slide' | 'hand' | 'zoom';

export interface NleEffectItem {
  id: string;
  name: string;
  category: 'video' | 'audio' | 'color';
  type: string;
  intensity: number;
}

export interface NleClip {
  id: string;
  trackId: string; // 'V3' | 'V2' | 'V1' | 'A1' | 'A2' | 'A3'
  name: string;
  type: 'video' | 'audio' | 'title' | 'effect' | 'image';
  startTimeSec: number;
  durationSec: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
  color?: string;
  opacity: number; // 0.0 to 1.0
  volume: number; // 0.0 to 1.0
  speed: number; // 0.25x to 8.0x
  positionX: number; // px offset
  positionY: number; // px offset
  scale: number; // 10% to 500%
  rotation: number; // -360 to +360 deg
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'add' | 'color-dodge';
  effects: NleEffectItem[];
  transitionIn?: { type: string; durationSec: number };
  transitionOut?: { type: string; durationSec: number };
  isMuted?: boolean;
  isLocked?: boolean;
  textOverlay?: string;
  fontStyle?: string;
}

export interface NleTrack {
  id: string;
  name: string;
  kind: 'video' | 'audio';
  visible: boolean;
  muted: boolean;
  locked: boolean;
  solo: boolean;
  volume: number;
}

export interface NleMarker {
  id: string;
  timeSec: number;
  label: string;
  color: string;
}


