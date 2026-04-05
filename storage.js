const STORAGE_KEYS = {
  BABY_PROFILE: 'baby_profile',
  SETTINGS: 'settings',
  CUSTOM_MILESTONES: 'milestones_custom',
  REACHED_MILESTONES: 'milestones_reached'
};

const DEFAULTS = {
  babyProfile: {
    name: null,
    undecidedName: false,
    gender: 'unknown',
    birthDate: null,
    isExpectedDueDate: false
  },
  settings: {
    hidePrenatal: false
  },
  customMilestones: [],
  reachedMilestones: {}
};

function safeParse(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function loadItem(key, fallback) {
  const stored = localStorage.getItem(key);
  return stored === null ? fallback : safeParse(stored, fallback);
}

function saveItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getBabyProfile() {
  return loadItem(STORAGE_KEYS.BABY_PROFILE, DEFAULTS.babyProfile);
}

export function saveBabyProfile(profile) {
  saveItem(STORAGE_KEYS.BABY_PROFILE, profile);
}

export function getSettings() {
  return loadItem(STORAGE_KEYS.SETTINGS, DEFAULTS.settings);
}

export function saveSettings(settings) {
  saveItem(STORAGE_KEYS.SETTINGS, settings);
}

export function getCustomMilestones() {
  return loadItem(STORAGE_KEYS.CUSTOM_MILESTONES, DEFAULTS.customMilestones);
}

export function saveCustomMilestones(milestones) {
  saveItem(STORAGE_KEYS.CUSTOM_MILESTONES, milestones);
}

export function getReachedMilestones() {
  return loadItem(STORAGE_KEYS.REACHED_MILESTONES, DEFAULTS.reachedMilestones);
}

export function saveReachedMilestones(reachedMilestones) {
  saveItem(STORAGE_KEYS.REACHED_MILESTONES, reachedMilestones);
}

export function clearAllStorage() {
  localStorage.removeItem(STORAGE_KEYS.BABY_PROFILE);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_MILESTONES);
  localStorage.removeItem(STORAGE_KEYS.REACHED_MILESTONES);
}
