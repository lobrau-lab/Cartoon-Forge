import { EpisodeProject, ProjectStyle, CharacterAnchor, ShotItem } from '../types';

export interface StyleDimensionScore {
  name: string;
  key: 'lora' | 'lighting' | 'palette' | 'characters' | 'quality' | 'guardrails';
  score: number; // 0 to 100 (100 = perfect match)
  delta: number; // 0 to 100 (0 = perfect match, 100 = extreme drift)
  status: 'aligned' | 'warning' | 'critical';
  description: string;
  recommendation: string;
}

export interface ShotStyleDelta {
  shotId: string;
  shotNumber: number;
  sceneNumber: number;
  actionPrompt: string;
  renderingPreset?: string;
  overallDelta: number; // 0 to 100
  overallConformity: number; // 100 - overallDelta (0 to 100%)
  status: 'aligned' | 'moderate-drift' | 'critical-deviation';
  dimensions: StyleDimensionScore[];
  deviationReasons: string[];
  suggestedPrompt: string;
  promptDiff: {
    added: string[];
    removed: string[];
    preserved: string;
  };
  applicableAdjustments: {
    id: string;
    label: string;
    description: string;
    category: 'lora' | 'lighting' | 'palette' | 'character' | 'quality' | 'guardrails';
    patch: Partial<ShotItem>;
  }[];
}

export interface SceneStyleDeltaSummary {
  sceneNumber: number;
  totalShots: number;
  alignedShotsCount: number;
  moderateDriftCount: number;
  criticalDeviationCount: number;
  flaggedShotsCount: number;
  averageDelta: number;
  averageConformity: number;
  worstShot?: ShotStyleDelta;
  dimensionAverages: {
    lora: number;
    lighting: number;
    palette: number;
    characters: number;
    quality: number;
    guardrails: number;
  };
}

export interface ProjectStyleDeltaSummary {
  projectStyle: ProjectStyle;
  totalShots: number;
  flaggedShotsCount: number;
  averageDelta: number;
  averageConformity: number;
  sceneSummaries: SceneStyleDeltaSummary[];
  shotDeltas: ShotStyleDelta[];
  criticalShots: ShotStyleDelta[];
  globalRecommendations: string[];
}

// Preset style lighting keywords mapping
const STYLE_LIGHTING_KEYWORDS: Record<string, string[]> = {
  'cyber-sakuga': ['neon', 'glow', 'rim lighting', 'lens flare', 'volumetric', 'cyberpunk', 'atmospheric', 'reflections', 'hologram'],
  'retro-90s-cel': ['analog', 'grain', 'soft lighting', 'gouache', 'vhs', 'diffuse', 'warm highlight', 'chromatic'],
  'painterly-ghibli': ['watercolor', 'sunlight', 'gentle', 'natural light', 'soft shadows', 'warm glow', 'lush', 'golden hour'],
  'dark-mecha-gothic': ['chiaroscuro', 'dramatic', 'heavy shadows', 'volumetric fog', 'metallic sheen', 'gloomy', 'rain reflections'],
  'western-toon-chase': ['bold lighting', 'high key', 'vibrant', 'flat shading', 'graphic shadows', 'bright highlights']
};

// Preset style color mood keywords mapping
const STYLE_COLOR_KEYWORDS: Record<string, string[]> = {
  'cyber-sakuga': ['cyan', 'magenta', 'neon blue', 'purple', 'amber', 'vivid', 'high saturation'],
  'retro-90s-cel': ['indigo', 'crimson', 'vintage gold', 'teal', 'muted pastel', 'retro palette'],
  'painterly-ghibli': ['emerald green', 'forest', 'sky blue', 'sunflower yellow', 'warm earth', 'organic'],
  'dark-mecha-gothic': ['crimson red', 'charcoal', 'obsidian', 'steel gray', 'amber warning', 'noir'],
  'western-toon-chase': ['primary red', 'electric blue', 'canary yellow', 'vibrant green', 'bold contrast']
};

// Contradictory token rules based on style
const CONTRADICTORY_TOKENS: Record<string, { regex: RegExp; label: string }[]> = {
  'cyber-sakuga': [
    { regex: /\b(3d cgi|photorealistic|low-poly|chibi soft watercolor|sepia vintage)\b/i, label: 'Non-anime 3D/Photorealistic or conflicting watercolor tokens' }
  ],
  'retro-90s-cel': [
    { regex: /\b(hyper-digital|vector flat|3d cgi|unreal engine|clean modern 4k)\b/i, label: 'Modern vector or 3D digital tokens that break 90s cel aesthetic' }
  ],
  'painterly-ghibli': [
    { regex: /\b(cyberpunk neon|harsh dark gritty|dystopian chrome|heavy mech)\b/i, label: 'Gritty/Cyberpunk terms conflicting with gentle Ghibli watercolor' }
  ],
  'dark-mecha-gothic': [
    { regex: /\b(pastel pink|chibi cute|kawaii candy|cheery cartoon)\b/i, label: 'Bright pastel/kawaii terms conflicting with gothic mecha tone' }
  ],
  'western-toon-chase': [
    { regex: /\b(realistic anime cel|heavy chiaroscuro|gloomy noir|shonen grit)\b/i, label: 'Photorealistic or gritty anime shading conflicting with flat western toon' }
  ]
};

/**
 * Analyzes a single shot against the active Style Matrix and Cast Anchors
 */
export function calculateShotStyleDelta(
  shot: ShotItem,
  projectStyle: ProjectStyle,
  cast: CharacterAnchor[] = []
): ShotStyleDelta {
  const prompt = shot.actionPrompt || '';
  const promptLower = prompt.toLowerCase();
  const styleId = projectStyle.id || 'cyber-sakuga';
  const loraTag = projectStyle.loraTag || '';
  
  const deviationReasons: string[] = [];
  const addedTokens: string[] = [];
  const removedTokens: string[] = [];

  // ==========================================
  // 1. Dimension: LoRA & Core Style Anchor
  // ==========================================
  let loraScore = 100;
  let loraDesc = 'Primary LoRA anchor is fully integrated.';
  let loraRec = '';

  const hasExactLora = loraTag ? prompt.includes(loraTag.split(',')[0].trim()) : false;
  const hasStyleIdOrName = promptLower.includes(projectStyle.name.toLowerCase()) || promptLower.includes(styleId);

  // Check for style keyword presence
  const styleKeywords = projectStyle.name.toLowerCase().split(/\s+/);
  const matchedKeywords = styleKeywords.filter(kw => kw.length > 2 && promptLower.includes(kw));

  if (hasExactLora) {
    loraScore = 100;
  } else if (hasStyleIdOrName || matchedKeywords.length >= 2) {
    loraScore = 65;
    loraDesc = 'Partial style keywords found, but missing exact Master LoRA tag weight.';
    loraRec = `Prefix prompt with "${loraTag.split(',')[0].trim()}"`;
    deviationReasons.push(`Missing exact LoRA tag for "${projectStyle.name}"`);
  } else {
    loraScore = 20;
    loraDesc = 'Missing Master Style LoRA tag and core aesthetic anchors.';
    loraRec = `Incorporate LoRA: "${loraTag}"`;
    deviationReasons.push(`Prompt lacks "${projectStyle.name}" LoRA tag: ${loraTag.split(',')[0] || ''}`);
  }

  // Check for contradictory tokens
  const styleContradictions = CONTRADICTORY_TOKENS[styleId] || [];
  for (const item of styleContradictions) {
    if (item.regex.test(prompt)) {
      loraScore = Math.max(0, loraScore - 30);
      loraDesc += ` Conflicting aesthetic tokens detected (${item.label}).`;
      deviationReasons.push(`Conflicting style descriptor: ${item.label}`);
    }
  }

  const loraDimension: StyleDimensionScore = {
    name: 'Style LoRA & Aesthetic Anchor',
    key: 'lora',
    score: loraScore,
    delta: 100 - loraScore,
    status: loraScore >= 80 ? 'aligned' : loraScore >= 50 ? 'warning' : 'critical',
    description: loraDesc,
    recommendation: loraRec
  };

  // ==========================================
  // 2. Dimension: Lighting & Atmospheric Consistency
  // ==========================================
  let lightingScore = 100;
  let lightingDesc = 'Atmospheric lighting aligns with Style Matrix standard.';
  let lightingRec = '';

  const expectedLighting = STYLE_LIGHTING_KEYWORDS[styleId] || ['cinematic lighting', 'rim light', 'atmospheric glow'];
  const matchedLightingTokens = expectedLighting.filter(term => promptLower.includes(term.toLowerCase()));

  if (matchedLightingTokens.length >= 2 || (shot.lightingCondition && shot.lightingCondition.length > 3)) {
    lightingScore = 95;
    lightingDesc = `Atmospheric lighting cues matched (${matchedLightingTokens.join(', ') || shot.lightingCondition}).`;
  } else if (matchedLightingTokens.length === 1) {
    lightingScore = 70;
    lightingDesc = `Minimal lighting descriptor detected (${matchedLightingTokens[0]}).`;
    lightingRec = `Enrich with volumetric lighting (e.g. "${expectedLighting.slice(0, 2).join(', ')}")`;
  } else {
    lightingScore = 35;
    lightingDesc = 'No style-specific lighting or volumetric atmosphere specified.';
    lightingRec = `Add style lighting modifier: "${expectedLighting.slice(0, 3).join(', ')}"`;
    deviationReasons.push(`No lighting condition anchor matching ${projectStyle.name} matrix`);
  }

  const lightingDimension: StyleDimensionScore = {
    name: 'Lighting & Volumetric Atmosphere',
    key: 'lighting',
    score: lightingScore,
    delta: 100 - lightingScore,
    status: lightingScore >= 80 ? 'aligned' : lightingScore >= 55 ? 'warning' : 'critical',
    description: lightingDesc,
    recommendation: lightingRec
  };

  // ==========================================
  // 3. Dimension: Color Palette & Swatch Harmony
  // ==========================================
  let paletteScore = 100;
  let paletteDesc = 'Chromatic tones align with the project color palette.';
  let paletteRec = '';

  const expectedColorMood = STYLE_COLOR_KEYWORDS[styleId] || ['vibrant', 'contrasting'];
  const matchedColorMood = expectedColorMood.filter(term => promptLower.includes(term.toLowerCase()));

  if (matchedColorMood.length >= 1) {
    paletteScore = 95;
    paletteDesc = `Chromatic palette cues present (${matchedColorMood.join(', ')}).`;
  } else {
    paletteScore = 50;
    paletteDesc = 'Prompt lacks explicit chromatic palette anchors.';
    paletteRec = `Suggest adding color swatch anchors: "${expectedColorMood.slice(0, 2).join(', ')}"`;
  }

  const paletteDimension: StyleDimensionScore = {
    name: 'Color Palette & Harmony',
    key: 'palette',
    score: paletteScore,
    delta: 100 - paletteScore,
    status: paletteScore >= 80 ? 'aligned' : paletteScore >= 50 ? 'warning' : 'critical',
    description: paletteDesc,
    recommendation: paletteRec
  };

  // ==========================================
  // 4. Dimension: Character Anchor Embedding
  // ==========================================
  let charScore = 100;
  let charDesc = 'Characters in shot are well-anchored or environment only.';
  let charRec = '';

  const charsInShot = shot.charactersInShot || [];
  if (charsInShot.length > 0) {
    const unanchoredChars: string[] = [];
    charsInShot.forEach(charName => {
      const charObj = cast.find(c => c.name.toLowerCase() === charName.toLowerCase() || c.id === charName);
      if (charObj) {
        const hasCharName = promptLower.includes(charObj.name.toLowerCase());
        const hasHair = charObj.hairStyle ? promptLower.includes(charObj.hairStyle.toLowerCase().split(' ')[0]) : true;
        const hasOutfit = charObj.outfit ? promptLower.includes(charObj.outfit.toLowerCase().split(' ')[0]) : true;
        const hasEmbedding = charObj.loraEmbedding ? prompt.includes(charObj.loraEmbedding) : false;

        if (!hasCharName && !hasEmbedding) {
          unanchoredChars.push(charObj.name);
        } else if (!hasHair && !hasOutfit && !hasEmbedding) {
          charScore = Math.max(40, charScore - 25);
        }
      }
    });

    if (unanchoredChars.length > 0) {
      charScore = Math.max(20, 100 - (unanchoredChars.length * 40));
      charDesc = `Characters tagged in shot missing from visual prompt description: ${unanchoredChars.join(', ')}.`;
      charRec = `Inject character anchor visual tags for ${unanchoredChars.join(', ')}`;
      deviationReasons.push(`Unanchored cast characters: ${unanchoredChars.join(', ')}`);
    } else if (charScore < 100) {
      charDesc = 'Character mentioned, but distinctive hairstyle/outfit details are sparse.';
      charRec = 'Add signature hair and outfit anchors.';
    }
  }

  const charDimension: StyleDimensionScore = {
    name: 'Cast & Character Continuity',
    key: 'characters',
    score: charScore,
    delta: 100 - charScore,
    status: charScore >= 80 ? 'aligned' : charScore >= 50 ? 'warning' : 'critical',
    description: charDesc,
    recommendation: charRec
  };

  // ==========================================
  // 5. Dimension: Quality & Shot Framing Integrity
  // ==========================================
  let qualityScore = 100;
  let qualityDesc = 'High quality framing and keyframe render modifiers present.';
  let qualityRec = '';

  const qualityKeywords = ['masterpiece', 'crisp lineart', 'highly detailed', 'anime keyframe', 'sakuga', 'cel shading', 'dynamic'];
  const matchedQuality = qualityKeywords.filter(k => promptLower.includes(k));

  if (matchedQuality.length >= 2) {
    qualityScore = 100;
  } else if (matchedQuality.length === 1) {
    qualityScore = 75;
    qualityDesc = 'Standard prompt quality; could benefit from enhanced keyframe modifiers.';
    qualityRec = 'Add "masterpiece, highest quality anime keyframe render"';
  } else {
    qualityScore = 40;
    qualityDesc = 'Missing anime render quality modifiers.';
    qualityRec = 'Append "masterpiece, sharp linework, high quality anime render"';
    deviationReasons.push('Lacks high-fidelity keyframe quality modifiers');
  }

  const qualityDimension: StyleDimensionScore = {
    name: 'Keyframe Quality & Composition',
    key: 'quality',
    score: qualityScore,
    delta: 100 - qualityScore,
    status: qualityScore >= 80 ? 'aligned' : qualityScore >= 55 ? 'warning' : 'critical',
    description: qualityDesc,
    recommendation: qualityRec
  };

  // ==========================================
  // 6. Dimension: Rendering Preset & Negative Guardrails
  // ==========================================
  let guardrailsScore = 100;
  let guardrailsDesc = 'Rendering preset aligns with Project Style Matrix.';
  let guardrailsRec = '';

  if (shot.renderingPreset && shot.renderingPreset !== projectStyle.name) {
    guardrailsScore = 60;
    guardrailsDesc = `Rendering preset "${shot.renderingPreset}" differs from active style "${projectStyle.name}".`;
    guardrailsRec = `Sync rendering preset to "${projectStyle.name}"`;
    deviationReasons.push(`Preset mismatch: "${shot.renderingPreset}" vs active "${projectStyle.name}"`);
  }

  const guardrailsDimension: StyleDimensionScore = {
    name: 'Preset Lock & Guardrails',
    key: 'guardrails',
    score: guardrailsScore,
    delta: 100 - guardrailsScore,
    status: guardrailsScore >= 80 ? 'aligned' : guardrailsScore >= 50 ? 'warning' : 'critical',
    description: guardrailsDesc,
    recommendation: guardrailsRec
  };

  const dimensions = [
    loraDimension,
    lightingDimension,
    paletteDimension,
    charDimension,
    qualityDimension,
    guardrailsDimension
  ];

  // Weighted Overall Conformity Score (LoRA 35%, Lighting 20%, Character 20%, Quality 10%, Palette 10%, Preset 5%)
  const weightedConformity = Math.round(
    (loraScore * 0.35) +
    (lightingScore * 0.20) +
    (charScore * 0.20) +
    (qualityScore * 0.10) +
    (paletteScore * 0.10) +
    (guardrailsScore * 0.05)
  );

  const overallDelta = Math.max(0, Math.min(100, 100 - weightedConformity));
  const overallConformity = weightedConformity;

  const status: 'aligned' | 'moderate-drift' | 'critical-deviation' = 
    overallDelta <= 18 ? 'aligned' : overallDelta <= 40 ? 'moderate-drift' : 'critical-deviation';

  // ==========================================
  // Construct Suggested Auto-Adjusted Prompt & Diff
  // ==========================================
  let cleanAction = prompt;
  
  // Remove conflicting tokens
  for (const item of styleContradictions) {
    if (item.regex.test(cleanAction)) {
      cleanAction = cleanAction.replace(item.regex, '').replace(/,\s*,/g, ',').trim();
      removedTokens.push(item.label);
    }
  }

  // Check if primary LoRA is present
  const promptParts: string[] = [];
  
  // 1. LoRA tag
  if (!cleanAction.includes(loraTag.split(',')[0].trim()) && loraTag) {
    promptParts.push(loraTag);
    addedTokens.push(loraTag.split(',')[0].trim());
  }

  // 2. Character anchors
  if (charsInShot.length > 0) {
    charsInShot.forEach(cName => {
      const cObj = cast.find(c => c.name.toLowerCase() === cName.toLowerCase() || c.id === cName);
      if (cObj) {
        if (!cleanAction.toLowerCase().includes(cObj.name.toLowerCase())) {
          const charAnchorStr = cObj.loraEmbedding 
            ? `${cObj.loraEmbedding}, ${cObj.name} (${cObj.hairStyle || ''}, ${cObj.eyeColor || ''} eyes, wearing ${cObj.outfit || ''})`
            : `${cObj.name} (${cObj.hairStyle || ''}, ${cObj.eyeColor || ''} eyes, wearing ${cObj.outfit || ''})`;
          promptParts.push(charAnchorStr);
          addedTokens.push(`${cObj.name} visual anchor`);
        }
      }
    });
  }

  // 3. Framing & Action
  const shotTypeStr = shot.shotType ? `${shot.shotType} of` : '';
  if (shotTypeStr && !cleanAction.toLowerCase().includes(shot.shotType.toLowerCase())) {
    promptParts.push(`${shotTypeStr} the scene`);
    addedTokens.push(shot.shotType);
  }

  promptParts.push(cleanAction);

  // 4. Lighting & Atmosphere
  if (matchedLightingTokens.length === 0) {
    const lightingAddition = expectedLighting.slice(0, 2).join(', ');
    promptParts.push(lightingAddition);
    addedTokens.push(lightingAddition);
  }

  // 5. Quality
  if (matchedQuality.length === 0) {
    promptParts.push(`masterpiece, highest quality anime keyframe, aspect ratio ${projectStyle.aspectRatio}`);
    addedTokens.push('masterpiece quality modifiers');
  }

  // Clean up deduplicated prompt
  const suggestedPrompt = Array.from(new Set(
    promptParts
      .join(', ')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )).join(', ');

  // Discrete Adjustments list for granular UI toggle
  const applicableAdjustments: ShotStyleDelta['applicableAdjustments'] = [];

  if (loraDimension.status !== 'aligned') {
    applicableAdjustments.push({
      id: 'inject-lora',
      label: `Inject "${projectStyle.name}" Master LoRA Tag`,
      description: `Prepends "${loraTag.split(',')[0]}" to lock weights.`,
      category: 'lora',
      patch: {
        actionPrompt: `${loraTag.split(',')[0]}, ${prompt}`,
        renderingPreset: projectStyle.name
      }
    });
  }

  if (lightingDimension.status !== 'aligned') {
    const defaultLighting = expectedLighting.slice(0, 2).join(', ');
    applicableAdjustments.push({
      id: 'inject-lighting',
      label: `Align Lighting to Matrix (${defaultLighting})`,
      description: 'Adds volumetric rim lighting and shadow contrast cues.',
      category: 'lighting',
      patch: {
        actionPrompt: `${prompt}, ${defaultLighting}`,
        lightingCondition: defaultLighting
      }
    });
  }

  if (charDimension.status !== 'aligned' && charsInShot.length > 0) {
    const charNames = charsInShot.join(' and ');
    applicableAdjustments.push({
      id: 'anchor-characters',
      label: `Anchor Cast Continuity (${charNames})`,
      description: 'Injects hairstyle, eyes, and outfit details for tagged characters.',
      category: 'character',
      patch: {
        actionPrompt: `${prompt}, featuring ${charNames} in signature attire`
      }
    });
  }

  if (guardrailsDimension.status !== 'aligned') {
    applicableAdjustments.push({
      id: 'sync-preset',
      label: `Lock Rendering Preset to "${projectStyle.name}"`,
      description: 'Ensures render pipeline routes through matching neural checkpoint.',
      category: 'guardrails',
      patch: {
        renderingPreset: projectStyle.name
      }
    });
  }

  // Full master auto-adjust
  applicableAdjustments.unshift({
    id: 'master-auto-adjust',
    label: '✨ Full Master Style Harmonization',
    description: 'Applies all calculated LoRA, lighting, character, and quality adjustments simultaneously.',
    category: 'quality',
    patch: {
      actionPrompt: suggestedPrompt,
      renderingPreset: projectStyle.name,
      lightingCondition: expectedLighting[0] || 'Studio Key'
    }
  });

  return {
    shotId: shot.id,
    shotNumber: shot.shotNumber,
    sceneNumber: shot.sceneNumber,
    actionPrompt: prompt,
    renderingPreset: shot.renderingPreset,
    overallDelta,
    overallConformity,
    status,
    dimensions,
    deviationReasons,
    suggestedPrompt,
    promptDiff: {
      added: addedTokens,
      removed: removedTokens,
      preserved: prompt
    },
    applicableAdjustments
  };
}

/**
 * Calculates Style Delta across all shots in a specific scene
 */
export function calculateSceneStyleDeltaSummary(
  sceneNumber: number,
  shots: ShotItem[],
  projectStyle: ProjectStyle,
  cast: CharacterAnchor[] = []
): SceneStyleDeltaSummary {
  const sceneShots = shots.filter(s => s.sceneNumber === sceneNumber);
  if (sceneShots.length === 0) {
    return {
      sceneNumber,
      totalShots: 0,
      alignedShotsCount: 0,
      moderateDriftCount: 0,
      criticalDeviationCount: 0,
      flaggedShotsCount: 0,
      averageDelta: 0,
      averageConformity: 100,
      dimensionAverages: { lora: 100, lighting: 100, palette: 100, characters: 100, quality: 100, guardrails: 100 }
    };
  }

  const shotDeltas = sceneShots.map(s => calculateShotStyleDelta(s, projectStyle, cast));
  
  const alignedShotsCount = shotDeltas.filter(d => d.status === 'aligned').length;
  const moderateDriftCount = shotDeltas.filter(d => d.status === 'moderate-drift').length;
  const criticalDeviationCount = shotDeltas.filter(d => d.status === 'critical-deviation').length;
  const flaggedShotsCount = moderateDriftCount + criticalDeviationCount;

  const totalDelta = shotDeltas.reduce((acc, d) => acc + d.overallDelta, 0);
  const averageDelta = Math.round((totalDelta / shotDeltas.length) * 10) / 10;
  const averageConformity = 100 - averageDelta;

  const worstShot = [...shotDeltas].sort((a, b) => b.overallDelta - a.overallDelta)[0];

  const dimAvg = (key: 'lora' | 'lighting' | 'palette' | 'characters' | 'quality' | 'guardrails') => {
    const sum = shotDeltas.reduce((acc, d) => {
      const dim = d.dimensions.find(dm => dm.key === key);
      return acc + (dim ? dim.score : 100);
    }, 0);
    return Math.round(sum / shotDeltas.length);
  };

  return {
    sceneNumber,
    totalShots: sceneShots.length,
    alignedShotsCount,
    moderateDriftCount,
    criticalDeviationCount,
    flaggedShotsCount,
    averageDelta,
    averageConformity,
    worstShot,
    dimensionAverages: {
      lora: dimAvg('lora'),
      lighting: dimAvg('lighting'),
      palette: dimAvg('palette'),
      characters: dimAvg('characters'),
      quality: dimAvg('quality'),
      guardrails: dimAvg('guardrails')
    }
  };
}

/**
 * Calculates Project-Wide Style Delta & Diagnostics
 */
export function calculateProjectStyleDeltaSummary(
  project: EpisodeProject
): ProjectStyleDeltaSummary {
  const currentStyle = project.style;
  const cast = project.cast || [];
  const shots = project.shots || [];

  const shotDeltas = shots.map(s => calculateShotStyleDelta(s, currentStyle, cast));
  const flaggedShots = shotDeltas.filter(d => d.status !== 'aligned');
  const criticalShots = shotDeltas.filter(d => d.status === 'critical-deviation');

  const totalDelta = shotDeltas.length > 0 ? shotDeltas.reduce((acc, d) => acc + d.overallDelta, 0) : 0;
  const averageDelta = shotDeltas.length > 0 ? Math.round((totalDelta / shotDeltas.length) * 10) / 10 : 0;
  const averageConformity = 100 - averageDelta;

  const sceneNumbers = Array.from(new Set(shots.map(s => s.sceneNumber))).sort((a, b) => a - b);
  const sceneSummaries = sceneNumbers.map(sNum => 
    calculateSceneStyleDeltaSummary(sNum, shots, currentStyle, cast)
  );

  const globalRecommendations: string[] = [];
  if (flaggedShots.length > 0) {
    globalRecommendations.push(`${flaggedShots.length} shots deviate from "${currentStyle.name}" matrix.`);
  }
  if (criticalShots.length > 0) {
    globalRecommendations.push(`${criticalShots.length} shots have severe aesthetic divergence (missing Master LoRA tag or character anchors).`);
  }
  if (flaggedShots.length === 0) {
    globalRecommendations.push(`All ${shots.length} shots in production perfectly conform to "${currentStyle.name}".`);
  }

  return {
    projectStyle: currentStyle,
    totalShots: shots.length,
    flaggedShotsCount: flaggedShots.length,
    averageDelta,
    averageConformity,
    sceneSummaries,
    shotDeltas,
    criticalShots,
    globalRecommendations
  };
}

/**
 * Auto-adjusts a single shot to align with the style matrix
 */
export function autoAdjustShot(
  shot: ShotItem,
  projectStyle: ProjectStyle,
  cast: CharacterAnchor[] = []
): ShotItem {
  const delta = calculateShotStyleDelta(shot, projectStyle, cast);
  return {
    ...shot,
    actionPrompt: delta.suggestedPrompt,
    renderingPreset: projectStyle.name,
    lightingCondition: shot.lightingCondition || STYLE_LIGHTING_KEYWORDS[projectStyle.id]?.[0] || 'Studio Cel'
  };
}

/**
 * Batch auto-adjusts all shots that exceed the deviation threshold
 */
export function batchAutoAdjustShots(
  shots: ShotItem[],
  projectStyle: ProjectStyle,
  cast: CharacterAnchor[] = [],
  thresholdDelta: number = 20,
  sceneNumberFilter?: number
): { updatedShots: ShotItem[]; adjustedCount: number } {
  let adjustedCount = 0;
  const updatedShots = shots.map(shot => {
    if (sceneNumberFilter !== undefined && shot.sceneNumber !== sceneNumberFilter) {
      return shot;
    }
    const delta = calculateShotStyleDelta(shot, projectStyle, cast);
    if (delta.overallDelta >= thresholdDelta) {
      adjustedCount++;
      return autoAdjustShot(shot, projectStyle, cast);
    }
    return shot;
  });

  return { updatedShots, adjustedCount };
}
