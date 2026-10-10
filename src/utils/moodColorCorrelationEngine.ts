/**
 * Mood-Based Color Palette & Visual Theme Correlation Engine
 * 
 * Correlates dialogue 'Emotion' fields with cinematic anime color palettes,
 * visual lighting notes, atmospheric LUT profiles, and diffusion prompt anchors.
 */

export interface ColorSwatch {
  name: string;
  hex: string;
  role: 'primary' | 'secondary' | 'shadow' | 'highlight' | 'accent';
  psychology: string;
}

export interface MoodPaletteProfile {
  id: string;
  name: string;
  dominantMood: string;
  emotionalTag: string;
  description: string;
  swatches: ColorSwatch[];
  lightingProfile: {
    kelvin: string;
    contrastRatio: string;
    keyType: string;
    shadowTone: string;
    description: string;
  };
  lutProfile: string;
  diffusionTags: {
    positive: string;
    negative: string;
  };
  visualThemeNoteTemplate: string;
}

export interface SceneMoodAnalysis {
  dominantEmotion: string;
  emotionalBreakdown: {
    emotion: string;
    count: number;
    percentage: number;
    dialogueSnippets: { character: string; line: string }[];
  }[];
  isEmotionalClash: boolean;
  clashPair?: [string, string];
  suggestedProfiles: {
    resonant: MoodPaletteProfile;
    dramaticClash: MoodPaletteProfile;
    cinematicAtmosphere: MoodPaletteProfile;
    retroCelVhs: MoodPaletteProfile;
  };
  gradientStops: string[];
}

export const MOOD_PALETTE_DATABASE: Record<string, MoodPaletteProfile> = {
  urgent: {
    id: 'urgent',
    name: 'Redline Emergency / Crimson Alert',
    dominantMood: 'Urgent',
    emotionalTag: 'Urgent / Desperate / Panic',
    description: 'High-adrenaline pulse with stark warning ambers and deep carbon shadows.',
    swatches: [
      { name: 'Crimson Pulse', hex: '#E11D48', role: 'primary', psychology: 'Heightened danger, adrenaline surge, crisis point' },
      { name: 'Hazard Amber', hex: '#F59E0B', role: 'secondary', psychology: 'Urgent countdown, telemetry warnings, heat friction' },
      { name: 'Carbon Void', hex: '#18181B', role: 'shadow', psychology: 'Impending doom, absolute obstruction, sharp shadows' },
      { name: 'Strobe Flare', hex: '#FFFFFF', role: 'highlight', psychology: 'Sudden impact spikes, intense emergency light burst' },
      { name: 'Tungsten Rust', hex: '#EA580C', role: 'accent', psychology: 'Overheating reactor, visceral alarm glow' }
    ],
    lightingProfile: {
      kelvin: '2800K Tungsten Warning with 6500K Xenon Strobes',
      contrastRatio: '4:1 High Contrast',
      keyType: 'Hard Directional Strobe',
      shadowTone: 'Crushed obsidian with crimson spill',
      description: 'Rapidly alternating emergency strobe illumination casting sharp angular shadows.'
    },
    lutProfile: 'Cyberpunk Redline Emergency (Heavy Red/Amber Bleed)',
    diffusionTags: {
      positive: 'emergency strobe lights, crimson rim lighting, hazard amber glare, stark high-contrast sakuga shadows, volumetric smoke',
      negative: 'flat lighting, pastel colors, washed out, peaceful atmosphere'
    },
    visualThemeNoteTemplate: 'High-urgency emergency atmosphere: dominated by pulsing Crimson (#E11D48) and Hazard Amber (#F59E0B) strobes. Harsh 4:1 directional shadows reinforce existential stakes.'
  },

  fierce: {
    id: 'fierce',
    name: 'Solar Flare / Sakuga Combat Overdrive',
    dominantMood: 'Fierce',
    emotionalTag: 'Fierce / Battle Cry / Wrath / Intense',
    description: 'Unrelenting kinetic heat, blazing embers, and blinding backlit rim illumination.',
    swatches: [
      { name: 'Vermilion Wrath', hex: '#DC2626', role: 'primary', psychology: 'Unyielding offensive power, battle resolve, fury' },
      { name: 'Solar Flare Gold', hex: '#F59E0B', role: 'secondary', psychology: 'Aura manifest, kinetic discharge, triumph over pain' },
      { name: 'Volcanic Ash', hex: '#27272A', role: 'shadow', psychology: 'Grounding contrast, smoke and scorched earth' },
      { name: 'Corona Flash', hex: '#FEF08A', role: 'highlight', psychology: 'Sword flash, energy collision, sakuga impact frame' },
      { name: 'Plasma Cyan Accent', hex: '#06B6D4', role: 'accent', psychology: 'Opposing combat element, lightning spark' }
    ],
    lightingProfile: {
      kelvin: '3200K Fiery Key with 7000K Arc Discharge Rim',
      contrastRatio: '5:1 Chiaroscuro Overdrive',
      keyType: 'Low-Angle Up-Light (Heroic / Demon)',
      shadowTone: 'Deep scorched soot with warm orange bounce',
      description: 'Blazing backlighting with airborne embers illuminating intense facial strain and kinetic combat motion.'
    },
    lutProfile: 'Sakuga Kodachrome Combustion',
    diffusionTags: {
      positive: 'blazing vermilion lighting, fiery aura glow, solar flare backlighting, flying molten embers, dynamic chiaroscuro shadows',
      negative: 'soft focus, muted desaturated colors, calm environment'
    },
    visualThemeNoteTemplate: 'High-intensity combat fervor: Vermilion Wrath (#DC2626) and Solar Gold (#F59E0B) clash against scorched ash shadows. Dramatic low-angle rim lights celebrate sakuga dynamism.'
  },

  melancholic: {
    id: 'melancholic',
    name: 'Twilight Rain / Lyrical Sorrow',
    dominantMood: 'Melancholic',
    emotionalTag: 'Melancholic / Tearful / Sorrow / Grief',
    description: 'Cool overcast atmosphere, reflective wet surfaces, and poetic desaturated depths.',
    swatches: [
      { name: 'Cobalt Twilight', hex: '#1E40AF', role: 'primary', psychology: 'Emotional weight, isolation, lingering memory' },
      { name: 'Raindrop Azure', hex: '#3B82F6', role: 'secondary', psychology: 'Tear reflections, cool melancholy breeze' },
      { name: 'Midnight Trench', hex: '#0F172A', role: 'shadow', psychology: 'Unspoken grief, heavy psychological burden' },
      { name: 'Pale Wisteria', hex: '#C084FC', role: 'highlight', psychology: 'Fragile hope, bittersweet reverie, soft bokeh' },
      { name: 'Overcast Slate', hex: '#64748B', role: 'accent', psychology: 'Emotional fatigue, muted atmospheric haze' }
    ],
    lightingProfile: {
      kelvin: '7200K Cool Overcast Dusk',
      contrastRatio: '2:1 Soft Low Contrast',
      keyType: 'Diffused Volumetric Ambient',
      shadowTone: 'Soft deep indigo with gentle specular water bounce',
      description: 'Subtle cool blue volumetric fog with soft bokeh reflections on tear-streaked skin and raindrops.'
    },
    lutProfile: 'Makoto Shinkai Rainy Dusk (Cool Blues & Violet Highlights)',
    diffusionTags: {
      positive: 'soft rain reflections, cool cobalt ambient light, poetic wisteria bokeh, diffused overcast shadows, cinematic anime tear glow',
      negative: 'harsh neon, oversaturated reds, aggressive lighting'
    },
    visualThemeNoteTemplate: 'Poetic sorrow & emotional depth: anchored in Cobalt Twilight (#1E40AF) and soft Wisteria (#C084FC) reflections. Diffused 7200K overcast light creates a delicate Shinkai-esque atmosphere.'
  },

  cold: {
    id: 'cold',
    name: 'Sub-Zero Logic / Glacial Monolith',
    dominantMood: 'Cold',
    emotionalTag: 'Cold / Stoic / Calculating / Detached',
    description: 'Sterile surgical precision, icy cyan edge-lighting, and razor-sharp shadow cuts.',
    swatches: [
      { name: 'Glacial Cyan', hex: '#06B6D4', role: 'primary', psychology: 'Unyielding intellect, emotional detachment, chilling calm' },
      { name: 'Arctic Fluorite', hex: '#0EA5E9', role: 'secondary', psychology: 'Holographic interfaces, hyper-focused gaze' },
      { name: 'Deep Space Navy', hex: '#020617', role: 'shadow', psychology: 'Ruthless determination, impenetrable persona' },
      { name: 'Polar Frost White', hex: '#F8FAFC', role: 'highlight', psychology: 'Sharp razor rim lines, sterile clean reflections' },
      { name: 'Gunmetal Titanium', hex: '#64748B', role: 'accent', psychology: 'Armor plates, metallic neutral discipline' }
    ],
    lightingProfile: {
      kelvin: '8500K Clinical Fluorescent Frost',
      contrastRatio: '3.5:1 Clean Directional',
      keyType: 'Razor-Edge Top-Down / Lateral Rim',
      shadowTone: 'Inky abyssal blue with clean geometric edges',
      description: 'Sterile cyan rim lighting with sharp specular cutoffs highlighting cold analytical precision.'
    },
    lutProfile: 'Ghost in the Shell Cyberspace Teal',
    diffusionTags: {
      positive: 'glacial cyan edge lighting, sterile cool color temperature, razor sharp shadows, metallic gunmetal tones, calculating aura',
      negative: 'warm amber glow, cozy atmosphere, sepia tone, messy lighting'
    },
    visualThemeNoteTemplate: 'Sub-zero analytical detachment: sharp Glacial Cyan (#06B6D4) rim lighting against deep space navy shadows (#020617). Razor-edge geometric cel shading reflects calculating stoicism.'
  },

  tender: {
    id: 'tender',
    name: 'Sakura Golden Hour / Intimate Warmth',
    dominantMood: 'Tender',
    emotionalTag: 'Tender / Warm / Gentle / Loving / Nostalgic',
    description: 'Luminous halation bloom, gentle golden sunlight, and soft peach skin tones.',
    swatches: [
      { name: 'Sakura Coral', hex: '#F43F5E', role: 'primary', psychology: 'Vulnerable affection, heart flutter, blooming bond' },
      { name: 'Honey Peach', hex: '#FDBA74', role: 'secondary', psychology: 'Comfort, shared laughter, cozy companionship' },
      { name: 'Umber Dusk', hex: '#451A03', role: 'shadow', psychology: 'Safe sanctuary, warm grounded contrast' },
      { name: 'Golden Hour Flare', hex: '#FDE047', role: 'highlight', psychology: 'Sunlit hair rim, optimistic horizon, soft glow' },
      { name: 'Petal Cream', hex: '#FFF1F2', role: 'accent', psychology: 'Gentle touch, delicate softness, spring breeze' }
    ],
    lightingProfile: {
      kelvin: '3000K Golden Hour Sunbeams',
      contrastRatio: '1.8:1 Soft Natural Wrap',
      keyType: 'Diffused 45-Degree Golden Backlight',
      shadowTone: 'Warm terracotta umber with gentle ambient bounce',
      description: 'Soft afternoon sunlight wrapping around characters with luminous hair highlights and blooming warmth.'
    },
    lutProfile: 'Kyoto Animation Afternoon Glow',
    diffusionTags: {
      positive: 'golden hour sunbeams, soft sakura bloom halation, warm honey peach lighting, gentle anime romantic glow, delicate cel shading',
      negative: 'cold blue tones, harsh dark shadows, sterile lighting, ominous atmosphere'
    },
    visualThemeNoteTemplate: 'Intimate emotional resonance: bathed in Sakura Coral (#F43F5E) and Golden Hour Sunlight (#FDE047). Gentle 3000K wrap illumination with soft halation bloom captures tender vulnerability.'
  },

  whisper: {
    id: 'whisper',
    name: 'Nocturnal Secret / Violet Intrigue',
    dominantMood: 'Whisper',
    emotionalTag: 'Whisper / Secretive / Suspense / Espionage',
    description: 'Deep midnight chiaroscuro with venomous emerald slivers and velvet shadows.',
    swatches: [
      { name: 'Phantom Violet', hex: '#581C87', role: 'primary', psychology: 'Covert motive, supernatural whisper, concealed truth' },
      { name: 'Toxic Emerald', hex: '#10B981', role: 'secondary', psychology: 'Hidden poison, surveillance green, electric suspicion' },
      { name: 'Velvet Void', hex: '#09090B', role: 'shadow', psychology: 'Dense obscurity, unseen eavesdroppers' },
      { name: 'Pale Phosphor', hex: '#A7F3D0', role: 'highlight', psychology: 'Sliver of keyhole light, watchful eyes' },
      { name: 'Deep Amethyst', hex: '#3B0764', role: 'accent', psychology: 'Subtle regal treason, velvet cloak' }
    ],
    lightingProfile: {
      kelvin: '4500K Mixed Moonlight & Slit Illumination',
      contrastRatio: '5:1 Noir Chiaroscuro',
      keyType: 'Narrow Slat / Crevice Slit Light',
      shadowTone: 'Deep velvety purple with zero ambient fill',
      description: 'Single sliver of neon green and moonlight cutting across character eyes in a pitch-black corridor.'
    },
    lutProfile: 'Neo-Noir Tokyo Midnight',
    diffusionTags: {
      positive: 'low-key noir shadows, toxic emerald rim sliver, deep phantom violet chiaroscuro, cinematic Venetian blind shadow slits, suspenseful mystery',
      negative: 'bright daytime, flat lighting, saturated primary colors'
    },
    visualThemeNoteTemplate: 'Suspense & covert espionage: Phantom Violet (#581C87) shadows sliced by narrow Toxic Emerald (#10B981) light slivers. Deep noir chiaroscuro veils character motives in secrecy.'
  },

  hopeful: {
    id: 'hopeful',
    name: 'Celestial Dawn / Triumphant Horizon',
    dominantMood: 'Hopeful',
    emotionalTag: 'Hopeful / Triumphant / Euphoric / Inspiring',
    description: 'Radiant azure heavens, inspiring dawn gold, and prismatic lens dispersal.',
    swatches: [
      { name: 'Dawn Aureolin', hex: '#FACC15', role: 'primary', psychology: 'Breakthrough, renewed vow, victorious sunrise' },
      { name: 'Sky Radiance', hex: '#38BDF8', role: 'secondary', psychology: 'Boundless freedom, clear skies, forward momentum' },
      { name: 'Abyssal Transition', hex: '#1E1B4B', role: 'shadow', psychology: 'Leftover night fading away, vanquished trial' },
      { name: 'Prismatic White', hex: '#FFFFFF', role: 'highlight', psychology: 'Crepuscular god rays, blinding revelation' },
      { name: 'Orchid Bloom', hex: '#E879F9', role: 'accent', psychology: 'Miraculous magic, spiritual awakening' }
    ],
    lightingProfile: {
      kelvin: '5500K Clean Morning Daylight',
      contrastRatio: '2:1 High-Key Radiance',
      keyType: 'Majestic Overhead God Rays (Crepuscular Beams)',
      shadowTone: 'Luminous deep indigo transitioning into golden ambient',
      description: 'Triumphant crepuscular rays breaking through clouds, bathing characters in radiant golden-cyan backlight.'
    },
    lutProfile: 'Ufotable Divine Dawn Radiance',
    diffusionTags: {
      positive: 'crepuscular god rays, radiant celestial dawn light, triumphant golden lens flare, clear azure skies, inspiring uplifting anime visual',
      negative: 'grimy textures, depressing gloom, desaturated monotone'
    },
    visualThemeNoteTemplate: 'Triumphant dawn breakthrough: luminous Dawn Aureolin (#FACC15) paired with crisp Sky Radiance (#38BDF8). Majestic god rays disperse shadows, signaling victorious resolve.'
  },

  desperate: {
    id: 'desperate',
    name: 'Toxic Dissonance / Psychological Vertigo',
    dominantMood: 'Desperate',
    emotionalTag: 'Desperate / Terrified / Anxious / Cornered',
    description: 'Sickly sulfur greens, feverish rust ambers, and destabilizing psychological contrast.',
    swatches: [
      { name: 'Sulfur Acid', hex: '#84CC16', role: 'primary', psychology: 'Sickly adrenaline, mental claustrophobia, nausea' },
      { name: 'Rust Ochre', hex: '#D97706', role: 'secondary', psychology: 'Deterioration, crumbling defenses, scorched clock' },
      { name: 'Corrosive Ink', hex: '#111827', role: 'shadow', psychology: 'Claustrophobic walls closing in, dread' },
      { name: 'Fever Pulse', hex: '#F87171', role: 'highlight', psychology: 'Pounding heartbeat, red-out visual glitch' },
      { name: 'Ash Smog', hex: '#52525B', role: 'accent', psychology: 'Suffocation, ungrounded disorientation' }
    ],
    lightingProfile: {
      kelvin: '4200K Sickly Fluorescent & Under-Light',
      contrastRatio: '4.5:1 Distorted Asymmetry',
      keyType: 'Unsettling Up-Light / Dutch-Angle Spill',
      shadowTone: 'Murky sulfur green with jittery chromatic fringe',
      description: 'Disturbing under-lighting with unnatural yellow-green tint casting monstrous inverted shadows.'
    },
    lutProfile: 'Neon Genesis Psychological Distress Bleach',
    diffusionTags: {
      positive: 'sickly sulfur green under-lighting, corrosive rust shadow tints, psychological chromatic aberration, dutch angle shadows, claustrophobic dread',
      negative: 'harmonious pastel colors, gentle peaceful ambient, symmetrical lighting'
    },
    visualThemeNoteTemplate: 'Psychological panic & desperate struggle: Sulfur Acid (#84CC16) under-lighting clashes with Rust Ochre (#D97706) and corrosive darks. Destabilizing shadows evoke trapped claustrophobia.'
  },

  sinister: {
    id: 'sinister',
    name: 'Void Eclipse / Malicious Intent',
    dominantMood: 'Sinister',
    emotionalTag: 'Sinister / Vengeful / Malice / Menacing',
    description: 'Obsidian void, venomous viridian glows, and blood-curdling magenta highlights.',
    swatches: [
      { name: 'Venom Viridian', hex: '#15803D', role: 'primary', psychology: 'Calculated malice, dark sorcery, ruthless scheme' },
      { name: 'Eclipse Magenta', hex: '#BE185D', role: 'secondary', psychology: 'Cruel amusement, sadistic triumph, bloody intent' },
      { name: 'Obsidian Abyss', hex: '#020617', role: 'shadow', psychology: 'Consuming darkness, monstrous entity' },
      { name: 'Ghost Phosphor', hex: '#86EFAC', role: 'highlight', psychology: 'Glowing predatory eyes, curse incantation' },
      { name: 'Charred Crimson', hex: '#881337', role: 'accent', psychology: 'Spilled vengeance, irreversible pact' }
    ],
    lightingProfile: {
      kelvin: '5000K Cold Uncanny Rim',
      contrastRatio: '6:1 Extreme Chiaroscuro',
      keyType: 'Severe Backlit Rim with Glowing Eye Accent',
      shadowTone: 'Pure void black swallowing character silhouettes',
      description: 'Eerie silhouette backlighting with radioactive green rim glow illuminating predatory eye reflections.'
    },
    lutProfile: 'Dark Shonen Villain Awakening',
    diffusionTags: {
      positive: 'venomous green rim aura, obsidian silhouette chiaroscuro, glowing predatory eyes, eclipse magenta lighting, sinister anime villain aura',
      negative: 'bright happy lighting, daylight, soft romantic look'
    },
    visualThemeNoteTemplate: 'Sinister malevolence: engulfed in Obsidian Abyss (#020617) illuminated by venomous Viridian (#15803D) and Eclipse Magenta (#BE185D) rim glows. Severe chiaroscuro shrouds predatory intent.'
  },

  solemn: {
    id: 'solemn',
    name: 'Imperial Cathedral / Heavy Oath',
    dominantMood: 'Solemn',
    emotionalTag: 'Solemn / Regal / Noble / Honor / Vow',
    description: 'Dignified imperial violet, antique bronze, and cathedral light beams.',
    swatches: [
      { name: 'Imperial Violet', hex: '#6D28D9', role: 'primary', psychology: 'Sacred duty, royal lineage, irreversible sacrifice' },
      { name: 'Antique Bronze', hex: '#B45309', role: 'secondary', psychology: 'Ancient relics, enduring armor, sworn oath' },
      { name: 'Monumental Slate', hex: '#1E293B', role: 'shadow', psychology: 'Weight of history, heavy stone cathedral walls' },
      { name: 'Incense Aureole', hex: '#FDE68A', role: 'highlight', psychology: 'Sacred beam of light through stained glass' },
      { name: 'Velvet Burgundy', hex: '#831843', role: 'accent', psychology: 'Royal heraldry, bloodline loyalty' }
    ],
    lightingProfile: {
      kelvin: '3800K Cathedral Stained-Glass Beam',
      contrastRatio: '3:1 Dignified Classical',
      keyType: 'High-Angle Volumetric Shaft',
      shadowTone: 'Rich velvet slate with warm bronze ambient fill',
      description: 'Majestic diagonal sunlight shafts cutting through stone halls, casting dignified classical Rembrandt lighting.'
    },
    lutProfile: 'Baroque Anime Renaissance',
    diffusionTags: {
      positive: 'cathedral volumetric light shafts, regal imperial violet accents, polished antique bronze rim light, solemn monumental composition, sacred atmosphere',
      negative: 'casual modern lighting, high saturation neon, flat cartoon shading'
    },
    visualThemeNoteTemplate: 'Solemn reverence & noble oath: Imperial Violet (#6D28D9) and Antique Bronze (#B45309) balanced under dramatic cathedral light shafts. Monumental Rembrandt lighting cements the sacred vow.'
  }
};

/**
 * Normalizes any freeform emotion text from dialogue into one of the canonical mood profiles.
 */
export function normalizeEmotionToMood(rawEmotion: string): string {
  if (!rawEmotion) return 'tender';
  const clean = rawEmotion.trim().toLowerCase();

  if (/urgent|rush|hurry|alarm|hazard|critical|emergency|code red|focused/.test(clean)) return 'urgent';
  if (/fierce|angry|wrath|rage|furious|battle|scream|shout|fight|aggressive|combat|heroic|climactic/.test(clean)) return 'fierce';
  if (/melanchol|sad|sorrow|tear|cry|grief|weep|mourn|regret|depress|heartbreak/.test(clean)) return 'melancholic';
  if (/cold|stoic|calm|calculat|neutral|monotone|robotic|chill|unemotional|detached|dominant|monologue/.test(clean)) return 'cold';
  if (/tender|warm|gentle|love|affection|soft|comfort|kind|sweet|reassur/.test(clean)) return 'tender';
  if (/whisper|secret|suspense|quiet|covert|hush|stealth|myster|conspir/.test(clean)) return 'whisper';
  if (/hope|triumph|proud|inspire|joy|happy|smile|elated|euphor|excite/.test(clean)) return 'hopeful';
  if (/desperat|panic|terror|scared|fear|anxious|cornered|dread|horror/.test(clean)) return 'desperate';
  if (/sinister|evil|malice|wicked|venge|threat|cruel|menac|dark/.test(clean)) return 'sinister';
  if (/solemn|noble|honor|regal|grave|sacred|vow|oath|dignified/.test(clean)) return 'solemn';

  // Default fallback
  return 'urgent';
}

/**
 * Analyzes the dialogue lines in a scene, tabulates emotional weights,
 * detects emotional clashes (e.g. heated arguments between opposing characters),
 * and generates 4 tailored palette interpretations for the scene's visual theme notes.
 */
export function analyzeSceneMood(dialogueLines: { character: string; line: string; emotion: string }[]): SceneMoodAnalysis {
  if (!dialogueLines || dialogueLines.length === 0) {
    const defaultProfile = MOOD_PALETTE_DATABASE['urgent'];
    return {
      dominantEmotion: 'Urgent',
      emotionalBreakdown: [{
        emotion: 'Urgent (Default)',
        count: 1,
        percentage: 100,
        dialogueSnippets: [{ character: 'NARRATOR', line: 'Ambient scene tension' }]
      }],
      isEmotionalClash: false,
      suggestedProfiles: {
        resonant: defaultProfile,
        dramaticClash: MOOD_PALETTE_DATABASE['fierce'],
        cinematicAtmosphere: MOOD_PALETTE_DATABASE['cold'],
        retroCelVhs: MOOD_PALETTE_DATABASE['solemn']
      },
      gradientStops: defaultProfile.swatches.map(s => s.hex)
    };
  }

  // Count occurrences of normalized moods
  const emotionMap: Record<string, { count: number; rawEmotions: Set<string>; snippets: { character: string; line: string }[] }> = {};
  
  dialogueLines.forEach(dlg => {
    const key = normalizeEmotionToMood(dlg.emotion);
    if (!emotionMap[key]) {
      emotionMap[key] = { count: 0, rawEmotions: new Set(), snippets: [] };
    }
    emotionMap[key].count += 1;
    emotionMap[key].rawEmotions.add(dlg.emotion || key);
    emotionMap[key].snippets.push({ character: dlg.character, line: dlg.line });
  });

  // Sort by count descending
  const sortedEntries = Object.entries(emotionMap).sort((a, b) => b[1].count - a[1].count);
  const primaryMoodKey = sortedEntries[0][0];
  const primaryProfile = MOOD_PALETTE_DATABASE[primaryMoodKey] || MOOD_PALETTE_DATABASE['urgent'];

  const totalLines = dialogueLines.length;
  const breakdown = sortedEntries.map(([key, data]) => {
    const rawNames = Array.from(data.rawEmotions).join(', ');
    return {
      emotion: rawNames || key.toUpperCase(),
      count: data.count,
      percentage: Math.round((data.count / totalLines) * 100),
      dialogueSnippets: data.snippets.slice(0, 3)
    };
  });

  // Detect emotional clash (e.g. 2 different moods present with significant dialogue)
  let isClash = false;
  let clashPair: [string, string] | undefined = undefined;
  if (sortedEntries.length >= 2 && sortedEntries[1][1].count >= 1) {
    isClash = true;
    clashPair = [sortedEntries[0][0], sortedEntries[1][0]];
  }

  // Secondary mood for clash interpretation
  const secondaryMoodKey = isClash && clashPair ? clashPair[1] : (primaryMoodKey === 'fierce' ? 'cold' : 'fierce');
  const secondaryProfile = MOOD_PALETTE_DATABASE[secondaryMoodKey] || MOOD_PALETTE_DATABASE['cold'];

  // Construct a tailored dramatic clash profile
  const dramaticClashProfile: MoodPaletteProfile = {
    id: `clash-${primaryProfile.id}-${secondaryProfile.id}`,
    name: `Dramatic Contrast Clash: ${primaryProfile.dominantMood} vs ${secondaryProfile.dominantMood}`,
    dominantMood: `${primaryProfile.dominantMood} / ${secondaryProfile.dominantMood}`,
    emotionalTag: `Clash (${primaryProfile.dominantMood} vs ${secondaryProfile.dominantMood})`,
    description: `High-tension chromatic clash splitting scene lighting between opposing emotional forces.`,
    swatches: [
      primaryProfile.swatches[0], // Primary hero color
      secondaryProfile.swatches[0], // Opposing character color
      { name: 'Clash Friction Gold', hex: '#F59E0B', role: 'accent', psychology: 'Sparks of psychological friction' },
      primaryProfile.swatches[2], // Shadow anchor
      secondaryProfile.swatches[3] // Highlight spark
    ],
    lightingProfile: {
      kelvin: 'Bi-Color Dual Split (3200K Warm Key vs 7500K Cold Rim)',
      contrastRatio: '5:1 Dramatic Bipolar Contrast',
      keyType: 'Dual Opposing Lateral Cross-Light',
      shadowTone: 'Deep split shadows creating psychological division',
      description: `Opposing character lighting: key side reflects ${primaryProfile.dominantMood} tones while rim edge pierces with ${secondaryProfile.dominantMood} accents.`
    },
    lutProfile: `Bipolar Dual-Tone Clash (${primaryProfile.dominantMood} / ${secondaryProfile.dominantMood})`,
    diffusionTags: {
      positive: `${primaryProfile.diffusionTags.positive.split(',')[0]}, ${secondaryProfile.diffusionTags.positive.split(',')[0]}, bi-color split lighting, high tension anime confrontation`,
      negative: 'monochromatic, flat lighting, relaxed'
    },
    visualThemeNoteTemplate: `Dynamic emotional clash: Dual lighting polarity pitting ${primaryProfile.swatches[0].name} (${primaryProfile.swatches[0].hex}) against ${secondaryProfile.swatches[0].name} (${secondaryProfile.swatches[0].hex}). Cross-light setups visually emphasize opposing character stances.`
  };

  // Construct a subtle atmospheric cinematic profile
  const cinematicAtmosphereProfile: MoodPaletteProfile = {
    id: `cinematic-${primaryProfile.id}`,
    name: `Painterly Film Atmosphere: ${primaryProfile.dominantMood}`,
    dominantMood: primaryProfile.dominantMood,
    emotionalTag: `Atmospheric Film`,
    description: `Soft cinematic gradation with tone-mapped anime watercolor shadows and gentle halation.`,
    swatches: [
      primaryProfile.swatches[0],
      primaryProfile.swatches[1],
      { name: 'Atmospheric Mist', hex: '#64748B', role: 'accent', psychology: 'Volumetric depth and spatial breathing room' },
      primaryProfile.swatches[2],
      primaryProfile.swatches[3]
    ],
    lightingProfile: {
      kelvin: primaryProfile.lightingProfile.kelvin,
      contrastRatio: '2.5:1 Film Balanced',
      keyType: 'Soft Volumetric Wrap',
      shadowTone: 'Rich tone-mapped cel shadow with soft ambient diffusion',
      description: 'Lyrical cinematic lighting balancing deep mood with rich background detail.'
    },
    lutProfile: 'Makoto Shinkai Tone-Mapped Radiance',
    diffusionTags: {
      positive: `cinematic anime lighting, ${primaryProfile.swatches[0].name} atmospheric haze, soft cel graduation, intricate background rendering, 8k anime screencap`,
      negative: 'harsh digital artifacts, muddy colors, flat'
    },
    visualThemeNoteTemplate: `Cinematic atmospheric grading: Tone-mapped ${primaryProfile.swatches[0].name} (#${primaryProfile.swatches[0].hex.replace('#','')}) paired with soft volumetric mist. Subtle contrast preserves rich background worldbuilding.`
  };

  // Construct a retro 90s Cel VHS profile
  const retroCelVhsProfile: MoodPaletteProfile = {
    id: `retro-${primaryProfile.id}`,
    name: `90s Golden Cel VHS: ${primaryProfile.dominantMood}`,
    dominantMood: primaryProfile.dominantMood,
    emotionalTag: `Vintage 90s Cel`,
    description: `Hand-painted cel warmth, authentic halation, and rich analog ink linework.`,
    swatches: [
      { name: 'Vintage Cel Crimson', hex: '#B91C1C', role: 'primary', psychology: 'Nostalgic 90s hand-painted cel warmth' },
      { name: 'Retro Amber Glow', hex: '#D97706', role: 'secondary', psychology: 'Tungsten bulb halation' },
      { name: 'Deep Indigo Cel Shadow', hex: '#1E1B4B', role: 'shadow', psychology: 'Traditional anime hand-inked shadows' },
      { name: 'Warm Parchment Cream', hex: '#FEF3C7', role: 'highlight', psychology: 'Analog film bloom' },
      primaryProfile.swatches[0]
    ],
    lightingProfile: {
      kelvin: '3400K Warm Retro Analog',
      contrastRatio: '3:1 Classic Cel Shading',
      keyType: 'Traditional 2-Tone Cel Shadow Break',
      shadowTone: 'Deep indigo cel ink with warm CRT bloom',
      description: 'Authentic 1990s anime cel aesthetic with distinct shadow break lines and warm analog halation.'
    },
    lutProfile: '1990s Evangelion / Cowboy Bebop 35mm Cel Scan',
    diffusionTags: {
      positive: 'vintage 90s anime cel style, hand painted cel aesthetic, retro color grading, warm analog film halation, crisp ink linework, classic mecha anime atmosphere',
      negative: 'modern 3d cgi render, sterile digital lighting, hyper smooth vector'
    },
    visualThemeNoteTemplate: `Retro 90s Cel styling: Hand-painted cel warm halation with deep Indigo ink shadows (#1E1B4B) and crisp cel demarcation lines, anchoring ${primaryProfile.dominantMood} intensity in timeless anime heritage.`
  };

  // Chronological dialogue emotion gradient across the scene
  const gradientStops = dialogueLines.map(dlg => {
    const moodKey = normalizeEmotionToMood(dlg.emotion);
    const p = MOOD_PALETTE_DATABASE[moodKey] || primaryProfile;
    return p.swatches[0].hex;
  });

  return {
    dominantEmotion: primaryProfile.dominantMood,
    emotionalBreakdown: breakdown,
    isEmotionalClash: isClash,
    clashPair: clashPair,
    suggestedProfiles: {
      resonant: primaryProfile,
      dramaticClash: dramaticClashProfile,
      cinematicAtmosphere: cinematicAtmosphereProfile,
      retroCelVhs: retroCelVhsProfile
    },
    gradientStops: gradientStops.length > 1 ? gradientStops : primaryProfile.swatches.map(s => s.hex)
  };
}

/**
 * Builds a formatted visual theme note block ready to be inserted into scene.styleNotes
 */
export function buildFormattedVisualThemeNote(
  profile: MoodPaletteProfile,
  existingStyleNotes?: string,
  mode: 'append' | 'replace' = 'append'
): string {
  const swatchList = profile.swatches.map(s => `${s.name} (${s.hex})`).join(', ');
  
  const generatedNote = `[VISUAL MOOD & COLOR THEME]
Palette: ${profile.name}
Dominant Mood: ${profile.dominantMood}
Swatches: ${swatchList}
Lighting: ${profile.lightingProfile.keyType} | ${profile.lightingProfile.contrastRatio} | ${profile.lightingProfile.kelvin}
LUT Profile: ${profile.lutProfile}
Cel-Shade Directive: ${profile.visualThemeNoteTemplate}
Diffusion Anchor: ${profile.diffusionTags.positive}`;

  if (mode === 'replace' || !existingStyleNotes || existingStyleNotes.trim().length === 0) {
    return generatedNote;
  }

  // If appending, check if there was already a [VISUAL MOOD & COLOR THEME] block and replace it cleanly
  if (existingStyleNotes.includes('[VISUAL MOOD & COLOR THEME]')) {
    const parts = existingStyleNotes.split('[VISUAL MOOD & COLOR THEME]');
    const prefix = parts[0].trim();
    return prefix ? `${prefix}\n\n${generatedNote}` : generatedNote;
  }

  return `${existingStyleNotes.trim()}\n\n${generatedNote}`;
}
