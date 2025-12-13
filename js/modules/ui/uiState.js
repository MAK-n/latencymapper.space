// ============================================
// UI STATE MANAGEMENT
// Centralized state for all UI components
// ============================================

// State object
const uiState = {
  activePanel: null, // 'stations', 'satellites', 'finder', 'filters', 'settings', 'graphics'
  selectedGroundStation: null,
  selectedSatellite: null,

  filters: {
    leo: true,
    meo: true,
    geo: true,
    custom: true,
    stations: true,
    orbits: false,
  },

  settings: {
    orbitHover: true,
    orbitSelect: true,
    autoRotate: false,
    labels: false,
    showSatellites: true,
    showStations: true,
    showInfo: true,
    updateRate: 2.0,
    maxSatellites: 50,
    throttling: true,
  },

  graphics: {
    sun: false,
    milkyWay: false,
    sunSize: 1.0,
    starDensity: 2, // 1=low, 2=medium, 3=high
    quality: "medium", // 'potato', 'medium', 'high'
  },
};

// Event listeners
const eventListeners = new Map();

/**
 * Subscribe to state changes
 * @param {string} event - Event name (e.g., 'filterChange', 'settingChange')
 * @param {Function} callback - Callback function
 */
export function on(event, callback) {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }
  eventListeners.get(event).push(callback);
}

/**
 * Unsubscribe from state changes
 * @param {string} event - Event name
 * @param {Function} callback - Callback function to remove
 */
export function off(event, callback) {
  if (!eventListeners.has(event)) return;

  const listeners = eventListeners.get(event);
  const index = listeners.indexOf(callback);
  if (index > -1) {
    listeners.splice(index, 1);
  }
}

/**
 * Emit state change event
 * @param {string} event - Event name
 * @param {*} data - Event data
 */
function emit(event, data) {
  if (!eventListeners.has(event)) return;

  const listeners = eventListeners.get(event);
  listeners.forEach((callback) => callback(data));
}

/**
 * Get current UI state
 */
export function getState() {
  return { ...uiState };
}

/**
 * Set active panel
 * @param {string|null} panelName - Panel name or null to close all
 */
export function setActivePanel(panelName) {
  const oldPanel = uiState.activePanel;
  uiState.activePanel = panelName;
  emit("panelChange", { old: oldPanel, new: panelName });
  saveState();
}

/**
 * Get active panel
 */
export function getActivePanel() {
  return uiState.activePanel;
}

/**
 * Set filter state
 * @param {string} type - Filter type ('leo', 'meo', 'geo', 'custom', 'stations', 'orbits')
 * @param {boolean} visible - Visibility state
 */
export function setFilter(type, visible) {
  if (uiState.filters.hasOwnProperty(type)) {
    uiState.filters[type] = visible;
    emit("filterChange", { type, visible });
    saveState();
  }
}

/**
 * Get filter state
 * @param {string} type - Filter type
 */
export function getFilter(type) {
  return uiState.filters[type];
}

/**
 * Get all filters
 */
export function getAllFilters() {
  return { ...uiState.filters };
}

/**
 * Set setting value
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 */
export function setSetting(key, value) {
  if (uiState.settings.hasOwnProperty(key)) {
    uiState.settings[key] = value;
    emit("settingChange", { key, value });
    saveState();
  }
}

/**
 * Get setting value
 * @param {string} key - Setting key
 */
export function getSetting(key) {
  return uiState.settings[key];
}

/**
 * Get all settings
 */
export function getAllSettings() {
  return { ...uiState.settings };
}

/**
 * Set graphics option
 * @param {string} key - Graphics key
 * @param {*} value - Graphics value
 */
export function setGraphics(key, value) {
  if (uiState.graphics.hasOwnProperty(key)) {
    uiState.graphics[key] = value;
    emit("graphicsChange", { key, value });
    saveState();
  }
}

/**
 * Get graphics option
 * @param {string} key - Graphics key
 */
export function getGraphics(key) {
  return uiState.graphics[key];
}

/**
 * Get all graphics settings
 */
export function getAllGraphics() {
  return { ...uiState.graphics };
}

/**
 * Save state to localStorage
 */
export function saveState() {
  try {
    localStorage.setItem("uiState", JSON.stringify(uiState));
  } catch (error) {
    console.error("Failed to save UI state:", error);
  }
}

/**
 * Load state from localStorage
 */
export function loadState() {
  try {
    const saved = localStorage.getItem("uiState");
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(uiState, parsed);
      console.log("✓ UI state loaded from localStorage");
      return true;
    }
  } catch (error) {
    console.error("Failed to load UI state:", error);
  }
  return false;
}

/**
 * Reset state to defaults
 */
export function resetState() {
  uiState.activePanel = null;
  uiState.selectedGroundStation = null;
  uiState.selectedSatellite = null;

  uiState.filters = {
    leo: true,
    meo: true,
    geo: true,
    custom: true,
    stations: true,
    orbits: false,
  };

  uiState.settings = {
    orbitHover: true,
    orbitSelect: true,
    autoRotate: false,
    labels: false,
    showSatellites: true,
    showStations: true,
    showInfo: true,
    updateRate: 2.0,
    maxSatellites: 50,
    throttling: true,
  };

  uiState.graphics = {
    sun: false,
    milkyWay: false,
    sunSize: 1.0,
    starDensity: 2,
    quality: "medium",
  };

  emit("stateReset", null);
  saveState();
  console.log("✓ UI state reset to defaults");
}
