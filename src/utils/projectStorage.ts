import { EpisodeProject, ProjectStyle } from '../types';
import { PRESET_STYLES } from '../data/sampleProjects';

export interface ProjectMetadata {
  id: string;
  title: string;
  seriesTitle: string;
  episodeNumber: number;
  targetDurationMin: number;
  styleName: string;
  updatedAt: string;
  lastSavedAt?: string;
  sceneCount: number;
  shotCount: number;
  castCount: number;
  dubbingCount: number;
  autoSaveEnabled?: boolean;
}

export type AutoSaveStatus = 'saved' | 'saving' | 'unsaved' | 'disabled';

const REGISTRY_STORAGE_KEY = 'anime_suite_projects_registry';
const ACTIVE_PROJECT_ID_KEY = 'anime_suite_active_project_id';
const AUTOSAVE_ENABLED_KEY = 'anime_suite_autosave_enabled';
const AUTOSAVE_INTERVAL_KEY = 'anime_suite_autosave_interval_sec';
const LEGACY_STORAGE_KEY = 'anime_suite_project';

/**
 * Creates a brand new, clean anime project with zero example clutter.
 */
export const createBlankProject = (
  title = 'Untitled Anime Episode',
  seriesTitle = 'Original Anime Series',
  episodeNumber = 1,
  style?: ProjectStyle
): EpisodeProject => {
  const chosenStyle = style || PRESET_STYLES[0];
  const newId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: newId,
    title,
    seriesTitle,
    episodeNumber,
    targetDurationMin: 24,
    style: chosenStyle,
    cast: [],
    scenes: [],
    shots: [],
    dubbingTracks: [],
    voiceVaultSamples: [],
    isBlankProject: true,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Clears out all example scenes, cast, shots, and dubbing tracks from an existing project.
 */
export const clearProjectExamples = (project: EpisodeProject): EpisodeProject => {
  return {
    ...project,
    cast: [],
    scenes: [],
    shots: [],
    dubbingTracks: [],
    voiceVaultSamples: [],
    isBlankProject: true,
    updatedAt: new Date().toISOString()
  };
};

/**
 * Extracts metadata summary from a project object.
 */
export const extractProjectMetadata = (project: EpisodeProject, lastSavedAt?: string): ProjectMetadata => {
  return {
    id: project.id,
    title: project.title || 'Untitled Anime Episode',
    seriesTitle: project.seriesTitle || 'Original Series',
    episodeNumber: project.episodeNumber || 1,
    targetDurationMin: project.targetDurationMin || 24,
    styleName: project.style?.name || 'Standard Sakuga',
    updatedAt: project.updatedAt || new Date().toISOString(),
    lastSavedAt: lastSavedAt || new Date().toISOString(),
    sceneCount: Array.isArray(project.scenes) ? project.scenes.length : 0,
    shotCount: Array.isArray(project.shots) ? project.shots.length : 0,
    castCount: Array.isArray(project.cast) ? project.cast.length : 0,
    dubbingCount: Array.isArray(project.dubbingTracks) ? project.dubbingTracks.length : 0,
    autoSaveEnabled: true
  };
};

/**
 * Retrieves the registry of all saved projects.
 */
export const getProjectsRegistry = (): ProjectMetadata[] => {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read project registry:', e);
  }
  return [];
};

/**
 * Saves or updates project metadata in the registry.
 */
export const updateRegistryWithProject = (project: EpisodeProject, lastSavedAt?: string): ProjectMetadata[] => {
  const currentRegistry = getProjectsRegistry();
  const meta = extractProjectMetadata(project, lastSavedAt);
  const existingIndex = currentRegistry.findIndex(p => p.id === project.id);

  let updatedRegistry: ProjectMetadata[];
  if (existingIndex >= 0) {
    updatedRegistry = [...currentRegistry];
    updatedRegistry[existingIndex] = meta;
  } else {
    updatedRegistry = [meta, ...currentRegistry];
  }

  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(updatedRegistry));
  } catch (e) {
    console.error('Failed to save project registry:', e);
  }

  return updatedRegistry;
};

/**
 * Gets the active project ID.
 */
export const getActiveProjectId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
  } catch (e) {
    return null;
  }
};

/**
 * Sets the active project ID.
 */
export const setActiveProjectId = (id: string): void => {
  try {
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  } catch (e) {
    console.error('Failed to set active project ID:', e);
  }
};

/**
 * Loads a project by ID from localStorage.
 */
export const loadProjectFromStorage = (projectId: string): EpisodeProject | null => {
  try {
    const projectRaw = localStorage.getItem(`anime_suite_project_${projectId}`);
    if (projectRaw) {
      return JSON.parse(projectRaw);
    }

    // Fallback to legacy key if ID matches
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (legacy.id === projectId) {
        return legacy;
      }
    }
  } catch (e) {
    console.error(`Failed to load project ${projectId}:`, e);
  }
  return null;
};

/**
 * Persists a project to localStorage and updates registry.
 */
export const saveProjectToStorage = (project: EpisodeProject, isAutoSave = false): ProjectMetadata => {
  const now = new Date().toISOString();
  const projectToSave: EpisodeProject = {
    ...project,
    updatedAt: now
  };

  const projectJson = JSON.stringify(projectToSave);

  try {
    // Save to dedicated key for this specific project
    localStorage.setItem(`anime_suite_project_${project.id}`, projectJson);
    
    // Also keep legacy key updated as active project
    localStorage.setItem(LEGACY_STORAGE_KEY, projectJson);
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, project.id);
  } catch (e) {
    console.error('Storage write error:', e);
  }

  const meta = extractProjectMetadata(projectToSave, now);
  updateRegistryWithProject(projectToSave, now);

  // Dispatch global event for listeners (HUDs, modals, tabs)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('project_saved', {
        detail: {
          projectId: project.id,
          projectTitle: project.title,
          isAutoSave,
          timestamp: now
        }
      })
    );
  }

  return meta;
};

/**
 * Deletes a project from storage and registry.
 */
export const deleteProjectFromStorage = (projectId: string): { remaining: ProjectMetadata[]; nextProjectId: string | null } => {
  try {
    localStorage.removeItem(`anime_suite_project_${projectId}`);
  } catch (e) {
    console.warn('Error removing project data:', e);
  }

  const currentRegistry = getProjectsRegistry();
  const remaining = currentRegistry.filter(p => p.id !== projectId);

  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(remaining));
  } catch (e) {
    console.error('Failed to update registry after deletion:', e);
  }

  let nextProjectId: string | null = null;
  if (remaining.length > 0) {
    nextProjectId = remaining[0].id;
    setActiveProjectId(nextProjectId);
  }

  return { remaining, nextProjectId };
};

/**
 * Duplicates an existing project.
 */
export const duplicateProjectInStorage = (sourceProject: EpisodeProject): EpisodeProject => {
  const newId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const cloned: EpisodeProject = {
    ...JSON.parse(JSON.stringify(sourceProject)),
    id: newId,
    title: `${sourceProject.title} (Copy)`,
    updatedAt: new Date().toISOString()
  };

  saveProjectToStorage(cloned, false);
  return cloned;
};

/**
 * Autosave Configuration getters and setters
 */
export const getAutoSaveEnabled = (): boolean => {
  try {
    const val = localStorage.getItem(AUTOSAVE_ENABLED_KEY);
    return val !== 'false'; // Defaults to true
  } catch (e) {
    return true;
  }
};

export const setAutoSaveEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(AUTOSAVE_ENABLED_KEY, enabled ? 'true' : 'false');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('autosave_setting_changed', { detail: { enabled } }));
    }
  } catch (e) {
    console.error('Failed to set autosave enabled:', e);
  }
};

export const getAutoSaveIntervalSec = (): number => {
  try {
    const val = localStorage.getItem(AUTOSAVE_INTERVAL_KEY);
    if (val) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {
    // fallback
  }
  return 15; // default 15s
};

export const setAutoSaveIntervalSec = (seconds: number): void => {
  try {
    localStorage.setItem(AUTOSAVE_INTERVAL_KEY, seconds.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('autosave_interval_changed', { detail: { seconds } }));
    }
  } catch (e) {
    console.error('Failed to set autosave interval:', e);
  }
};
