import { EpisodeProject, ShotItem, ScriptScene, CharacterAnchor, DubbingTrack } from '../types';
import { PRESET_STYLES, INITIAL_CAST } from '../data/sampleProjects';

export interface HealingResult {
  healedProject: EpisodeProject;
  healLogs: Array<{
    category: 'Schema' | 'Shots' | 'Cast' | 'Dubbing' | 'Styles';
    message: string;
    actionTaken: string;
    timestamp: string;
  }>;
  fixedIssuesCount: number;
  healthScore: number; // 0 to 100
}

/**
 * Dispatches a custom event indicating a real-time self-healing or error bypass action was taken.
 */
export function registerRealTimeHeal(
  category: string,
  message: string,
  actionTaken: string,
  type: 'heal' | 'workaround' | 'fix' = 'heal'
) {
  const timestamp = new Date().toLocaleTimeString();
  const event = new CustomEvent('ai-self-heal-log', {
    detail: { category, message, actionTaken, timestamp, type }
  });
  window.dispatchEvent(event);
  console.log(`[AI Self-Healing Engine] [${category}] ${message} -> ${actionTaken}`);
}

/**
 * Self-Healing & Self-Correcting Engine
 * Audits project data structures for inconsistencies, broken links, 
 * malformed parameters, and unaligned timecodes, then auto-corrects them seamlessly.
 */
export function auditAndHealProject(project: EpisodeProject): HealingResult {
  const healLogs: HealingResult['healLogs'] = [];
  let fixedIssuesCount = 0;
  const now = new Date().toLocaleTimeString();

  // Clone project for immutable repair
  const healed: EpisodeProject = JSON.parse(JSON.stringify(project));

  // 1. HEAL BASIC PROJECT METADATA
  if (!healed.id) {
    healed.id = `proj-${Date.now()}`;
    fixedIssuesCount++;
    healLogs.push({
      category: 'Schema',
      message: 'Missing root project ID detected.',
      actionTaken: `Generated unique identifier: ${healed.id}`,
      timestamp: now
    });
  }

  if (!healed.title || healed.title.trim() === '') {
    healed.title = 'Untitled Anime Episode';
    fixedIssuesCount++;
    healLogs.push({
      category: 'Schema',
      message: 'Empty project title.',
      actionTaken: 'Restored default title: "Untitled Anime Episode"',
      timestamp: now
    });
  }

  if (!healed.targetDurationMin || healed.targetDurationMin <= 0) {
    healed.targetDurationMin = 24;
    fixedIssuesCount++;
    healLogs.push({
      category: 'Schema',
      message: 'Invalid target duration setting.',
      actionTaken: 'Auto-corrected target duration to standard 24 minutes',
      timestamp: now
    });
  }

  // 2. HEAL CAST ANCHORS & RETENTION LOCKS
  if (!healed.cast || !Array.isArray(healed.cast) || healed.cast.length === 0) {
    healed.cast = JSON.parse(JSON.stringify(INITIAL_CAST));
    fixedIssuesCount++;
    healLogs.push({
      category: 'Cast',
      message: 'Empty or corrupt character cast array.',
      actionTaken: 'Restored initial character anchor profiles & LoRA weights',
      timestamp: now
    });
  } else {
    // Audit each character anchor
    const validCastNames = new Set<string>();
    healed.cast = healed.cast.map((c, idx) => {
      let charFixed = false;
      const copy: CharacterAnchor = { ...c };
      if (!copy.id) {
        copy.id = `char-${Date.now()}-${idx}`;
        charFixed = true;
      }
      if (!copy.name) {
        copy.name = `Character #${idx + 1}`;
        charFixed = true;
      }
      if (!copy.loraEmbedding) {
        copy.loraEmbedding = `<lora:${copy.name.toLowerCase().replace(/\s+/g, '_')}_v1:0.85>`;
        charFixed = true;
      }
      if (charFixed) {
        fixedIssuesCount++;
        healLogs.push({
          category: 'Cast',
          message: `Incomplete character profile for "${copy.name}".`,
          actionTaken: `Repaired ID and LoRA embedding tag: ${copy.loraEmbedding}`,
          timestamp: now
        });
      }
      validCastNames.add(copy.name);
      return copy;
    });
  }

  // 3. HEAL SCENES & SCENE NUMBERS
  if (!healed.scenes || !Array.isArray(healed.scenes)) {
    healed.scenes = [];
  }

  if (healed.scenes.length === 0) {
    healed.scenes.push({
      sceneNumber: 1,
      heading: 'EXT. ANIME CITY - DAY',
      location: 'Anime City',
      timeOfDay: 'DAY',
      action: 'Opening establishing shot introduces the vibrant anime cityscape under bright daylight.',
      dialogue: [],
      timingEstMin: 1.5,
      styleNotes: 'High contrast cel shading'
    });
    fixedIssuesCount++;
    healLogs.push({
      category: 'Schema',
      message: 'No scenes found in project hierarchy.',
      actionTaken: 'Auto-created primary Scene #1 placeholder',
      timestamp: now
    });
  } else {
    // Normalize scene numbers
    healed.scenes = healed.scenes.map((sc, index) => {
      const copy: ScriptScene = { ...sc };
      if (copy.sceneNumber !== index + 1) {
        fixedIssuesCount++;
        healLogs.push({
          category: 'Schema',
          message: `Out of sequence scene number (${copy.sceneNumber}).`,
          actionTaken: `Re-indexed scene number to #${index + 1}`,
          timestamp: now
        });
        copy.sceneNumber = index + 1;
      }
      return copy;
    });
  }

  // 4. HEAL SHOT SEQUENCE & TIME CODES
  if (!healed.shots || !Array.isArray(healed.shots) || healed.shots.length === 0) {
    healed.shots = [
      {
        id: `shot-${Date.now()}-1`,
        sceneNumber: 1,
        shotNumber: 1,
        shotType: 'Wide',
        cameraMovement: 'Static',
        durationSec: 4.0,
        charactersInShot: [healed.cast[0]?.name].filter(Boolean),
        actionPrompt: 'Wide establishing shot of modern Tokyo skyline in vibrant anime art style, cinematic lighting, high detail',
        dialogueLine: 'The story begins here under the summer sky.',
        status: 'pending'
      }
    ];
    fixedIssuesCount++;
    healLogs.push({
      category: 'Shots',
      message: 'Shot list was empty or corrupt.',
      actionTaken: 'Auto-generated baseline shot #1 with default prompt & duration',
      timestamp: now
    });
  } else {
    // Re-index shots & repair missing parameters
    let expectedShotNum = 1;
    const existingCastNames = new Set(healed.cast.map(c => c.name));

    healed.shots = healed.shots.map((shot, idx) => {
      const copy: ShotItem = { ...shot };
      let shotRepaired = false;

      if (!copy.id) {
        copy.id = `shot-${Date.now()}-${idx + 1}`;
        shotRepaired = true;
      }

      if (copy.shotNumber !== expectedShotNum) {
        copy.shotNumber = expectedShotNum;
        shotRepaired = true;
      }

      if (!copy.durationSec || copy.durationSec <= 0 || copy.durationSec > 60) {
        copy.durationSec = 4.0;
        shotRepaired = true;
      }

      if (!copy.actionPrompt || copy.actionPrompt.trim() === '') {
        copy.actionPrompt = `Cinematic anime shot #${copy.shotNumber}, cel-shaded style, detailed background`;
        shotRepaired = true;
      }

      if (!copy.cameraMovement) {
        copy.cameraMovement = 'Pan Right';
        shotRepaired = true;
      }

      if (!copy.status) {
        copy.status = 'pending';
        shotRepaired = true;
      }

      // Repair unlinked character references
      if (!copy.charactersInShot || !Array.isArray(copy.charactersInShot)) {
        copy.charactersInShot = [];
      } else {
        const repairedCharNames = copy.charactersInShot.filter(cname => existingCastNames.has(cname));
        if (repairedCharNames.length !== copy.charactersInShot.length) {
          copy.charactersInShot = repairedCharNames;
          shotRepaired = true;
        }
      }

      if (shotRepaired) {
        fixedIssuesCount++;
        healLogs.push({
          category: 'Shots',
          message: `Inconsistencies detected in Shot #${copy.shotNumber}.`,
          actionTaken: `Corrected sequence number, duration (${copy.durationSec}s), and character links`,
          timestamp: now
        });
      }

      expectedShotNum++;
      return copy;
    });
  }

  // 5. HEAL DUBBING TRACKS ALIGNMENT WITH SHOT DIALOGUE
  if (!healed.dubbingTracks || !Array.isArray(healed.dubbingTracks)) {
    healed.dubbingTracks = [];
  }

  const shotDialogueItems = healed.shots.filter(s => s.dialogueLine && s.dialogueLine.trim() !== '');

  // Synchronize or repair dubbing tracks
  const updatedDubbingTracks: DubbingTrack[] = [];
  
  shotDialogueItems.forEach((shot) => {
    const existingTrack = healed.dubbingTracks.find(t => t.shotId === shot.id);

    if (existingTrack) {
      let trackFixed = false;
      const trackCopy: DubbingTrack = { ...existingTrack };
      if (!trackCopy.text || trackCopy.text !== shot.dialogueLine) {
        trackCopy.text = shot.dialogueLine || '';
        trackFixed = true;
      }
      if (trackFixed) {
        fixedIssuesCount++;
        healLogs.push({
          category: 'Dubbing',
          message: `Updated audio script line for Shot #${shot.shotNumber}.`,
          actionTaken: `Resynced dubbing track text`,
          timestamp: now
        });
      }
      updatedDubbingTracks.push(trackCopy);
    } else {
      // Auto-generate missing dubbing track
      const newTrack: DubbingTrack = {
        id: `dub-${shot.id}`,
        shotId: shot.id,
        character: shot.charactersInShot[0] || 'Narrator',
        language: 'JA',
        text: shot.dialogueLine || '',
        emotion: 'Neutral',
        visemeSequence: [
          { time: 0.1, viseme: 'A' },
          { time: 0.3, viseme: 'O' },
          { time: 0.6, viseme: 'E' }
        ]
      };
      updatedDubbingTracks.push(newTrack);
      fixedIssuesCount++;
      healLogs.push({
        category: 'Dubbing',
        message: `Missing dubbing audio track for Shot #${shot.shotNumber}.`,
        actionTaken: `Auto-created synced Japanese/English dubbing track`,
        timestamp: now
      });
    }
  });

  healed.dubbingTracks = updatedDubbingTracks;

  // 6. HEAL STYLE PRESET
  if (!healed.style || !PRESET_STYLES.find(s => s.id === healed.style.id)) {
    healed.style = PRESET_STYLES[0];
    fixedIssuesCount++;
    healLogs.push({
      category: 'Styles',
      message: 'Invalid or missing visual style preset.',
      actionTaken: 'Restored default "Cyber-Sakuga 2099" style preset',
      timestamp: now
    });
  }

  // Update timestamps
  healed.updatedAt = new Date().toISOString();

  // Calculate health score (100 minus penalty per issue, min 85 after repair)
  const healthScore = Math.max(85, 100 - Math.min(fixedIssuesCount * 2, 15));

  return {
    healedProject: healed,
    healLogs,
    fixedIssuesCount,
    healthScore
  };
}
