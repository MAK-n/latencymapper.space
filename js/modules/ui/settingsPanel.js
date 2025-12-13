// ============================================
// SETTINGS PANEL - Application Settings
// Panel for configuring display and performance settings
// ============================================

import { setSetting, getSetting, getAllSettings, resetState } from './uiState.js';
import { getControls } from '../controls.js';
import { getSatelliteMeshes } from '../satelliteRenderer.js';
import { clearSatelliteMeshes, renderSatellites } from '../satelliteRenderer.js';
import { getStationMeshes } from '../groundStationRenderer.js';
import { CONFIG } from '../constants.js';
import { showOrbitPath, removeOrbitLine } from '../orbitalPath.js';
import { getSelectedSatellite } from '../satelliteInteraction.js';
import { reloadSatellitesWithLimit, initializeSatelliteRecord, setSatelliteRecords, getSatelliteRecords } from '../satelliteData.js';
import { initializeSatellites, resetSimulationTime } from '../satelliteUpdater.js';

let panelElement = null;
let autoRotateAnimationId = null;
let isAutoRotateActive = false;

/**
 * Initialize Settings panel structure
 */
export function initSettingsPanel() {
  if (panelElement) {
    console.warn("Settings panel already initialized");
    return panelElement;
  }

  // Create panel
  const panel = document.createElement("div");
  panel.className = "panel panel-right hidden";
  panel.id = "panel-settings";

  // Panel Header
  const header = document.createElement("header");
  header.className = "panel-header";
  header.innerHTML = `
        <h2>Settings</h2>
        <button class="close-btn" aria-label="Close panel">&times;</button>
    `;

  // Panel Content
  const content = document.createElement("div");
  content.className = "panel-content";
  content.innerHTML = `
        <!-- Display Settings -->
        <section class="panel-section">
            <h3>Display Settings</h3>
            
            <label class="toggle-switch">
                <span>Draw Orbits on Hover</span>
                <input type="checkbox" id="setting-orbit-hover" checked>
            </label>
            
            <label class="toggle-switch">
                <span>Draw Orbits on Select</span>
                <input type="checkbox" id="setting-orbit-select" checked>
            </label>
            
            <label class="toggle-switch">
                <span>Auto-rotate Globe</span>
                <input type="checkbox" id="setting-auto-rotate">
            </label>
            
            <label class="toggle-switch">
                <span>Show Satellite Labels</span>
                <input type="checkbox" id="setting-labels">
            </label>
        </section>
        
        <!-- Visibility Settings -->
        <section class="panel-section">
            <h3>Visibility</h3>
            
            <label class="toggle-switch">
                <span>Show All Satellites</span>
                <input type="checkbox" id="setting-show-satellites" checked>
            </label>
            
            <label class="toggle-switch">
                <span>Show Ground Stations</span>
                <input type="checkbox" id="setting-show-stations" checked>
            </label>
            
            <label class="toggle-switch">
                <span>Show Info Panels</span>
                <input type="checkbox" id="setting-show-info" checked>
            </label>
        </section>
        
        <!-- Performance Settings -->
        <section class="panel-section">
            <h3>Performance</h3>
            
            <div class="slider-control">
                <label>
                    <span>Update Rate</span>
                    <span id="update-rate-value">2.0s</span>
                </label>
                <input type="range" id="setting-update-rate" min="0.5" max="5" step="0.5" value="2">
                <span class="form-hint">How often satellite positions update</span>
            </div>
            
            <div class="slider-control">
                <label>
                    <span>Simulation Speed</span>
                    <span id="simulation-speed-value">1.0x</span>
                </label>
                <input type="range" id="setting-simulation-speed" min="0.1" max="10" step="0.1" value="1.0">
                <span class="form-hint">Speed of satellite movement along orbits (0.1x - 10x)</span>
            </div>
            
            <div class="slider-control">
                <label>
                    <span>Max Satellites</span>
                    <span id="max-sats-value">50</span>
                </label>
                <input type="range" id="setting-max-satellites" min="10" max="500" step="10" value="50">
                <span class="form-hint">Maximum number of satellites to render</span>
            </div>
            
            <label class="toggle-switch">
                <span>Enable Throttling</span>
                <input type="checkbox" id="setting-throttling" checked>
            </label>
        </section>
        
        <!-- Color Legend -->
        <section class="panel-section">
            <h3>Color Legend</h3>
            <div id="legend-container">
                <!-- Legend will be inserted here -->
            </div>
        </section>
        
        <!-- Actions -->
        <div class="panel-footer" style="border-top: 1px solid var(--ui-border); padding-top: var(--space-4); margin-top: var(--space-4);">
            <button id="btn-reset-settings" class="btn btn-secondary btn-sm">Reset to Defaults</button>
            <button id="btn-export-settings" class="btn btn-secondary btn-sm">Export Settings</button>
        </div>
    `;

  // Assemble panel
  panel.appendChild(header);
  panel.appendChild(content);

  // Append to body
  document.body.appendChild(panel);

  // Setup event listeners
  setupEventListeners(panel);

  // Load saved settings
  loadSettings(panel);

  panelElement = panel;
  console.log("✓ Settings panel structure initialized");

  return panel;
}

/**
 * Show the panel
 */
export function showSettingsPanel() {
  if (panelElement) {
    panelElement.classList.remove("hidden");
  }
}

/**
 * Hide the panel
 */
export function hideSettingsPanel() {
  if (panelElement) {
    panelElement.classList.add("hidden");
  }
}

/**
 * Get panel element
 */
export function getSettingsPanel() {
  return panelElement;
}

/**
 * Setup event listeners for all settings controls
 */
function setupEventListeners(panel) {
  // Close button
  const closeBtn = panel.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      hideSettingsPanel();
    });
  }

  // Display Settings
  const orbitHoverToggle = panel.querySelector('#setting-orbit-hover');
  if (orbitHoverToggle) {
    orbitHoverToggle.addEventListener('change', (e) => {
      setSetting('orbitHover', e.target.checked);
      console.log('[Settings] Orbit on hover:', e.target.checked);
    });
  }

  const orbitSelectToggle = panel.querySelector('#setting-orbit-select');
  if (orbitSelectToggle) {
    orbitSelectToggle.addEventListener('change', (e) => {
      setSetting('orbitSelect', e.target.checked);
      console.log('[Settings] Orbit on select:', e.target.checked);
      // If disabled and orbit is currently shown, remove it
      if (!e.target.checked) {
        const selectedSatellite = getSelectedSatellite();
        if (selectedSatellite) {
          removeOrbitLine();
        }
      }
    });
  }

  const autoRotateToggle = panel.querySelector('#setting-auto-rotate');
  if (autoRotateToggle) {
    autoRotateToggle.addEventListener('change', (e) => {
      setSetting('autoRotate', e.target.checked);
      if (e.target.checked) {
        startAutoRotate();
      } else {
        stopAutoRotate();
      }
    });
  }

  const labelsToggle = panel.querySelector('#setting-labels');
  if (labelsToggle) {
    labelsToggle.addEventListener('change', (e) => {
      setSetting('labels', e.target.checked);
      toggleSatelliteLabels(e.target.checked);
      console.log('[Settings] Satellite labels:', e.target.checked);
    });
  }

  // Visibility Settings
  const showSatellitesToggle = panel.querySelector('#setting-show-satellites');
  if (showSatellitesToggle) {
    showSatellitesToggle.addEventListener('change', (e) => {
      setSetting('showSatellites', e.target.checked);
      toggleSatellitesVisibility(e.target.checked);
      console.log('[Settings] Show satellites:', e.target.checked);
    });
  }

  const showStationsToggle = panel.querySelector('#setting-show-stations');
  if (showStationsToggle) {
    showStationsToggle.addEventListener('change', (e) => {
      setSetting('showStations', e.target.checked);
      toggleStationsVisibility(e.target.checked);
      console.log('[Settings] Show stations:', e.target.checked);
    });
  }

  const showInfoToggle = panel.querySelector('#setting-show-info');
  if (showInfoToggle) {
    showInfoToggle.addEventListener('change', (e) => {
      setSetting('showInfo', e.target.checked);
      toggleInfoPanelsVisibility(e.target.checked);
      console.log('[Settings] Show info panels:', e.target.checked);
    });
  }

  // Performance Settings
  const updateRateSlider = panel.querySelector('#setting-update-rate');
  const updateRateValue = panel.querySelector('#update-rate-value');
  if (updateRateSlider && updateRateValue) {
    updateRateSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      updateRateValue.textContent = `${value.toFixed(1)}s`;
      setSetting('updateRate', value);
      updateSatelliteUpdateRate(value);
      console.log('[Settings] Update rate:', value, 's');
    });
  }

  const simulationSpeedSlider = panel.querySelector('#setting-simulation-speed');
  const simulationSpeedValue = panel.querySelector('#simulation-speed-value');
  if (simulationSpeedSlider && simulationSpeedValue) {
    simulationSpeedSlider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      simulationSpeedValue.textContent = `${value.toFixed(1)}x`;
      setSetting('simulationSpeed', value);
      updateSimulationSpeed(value);
      console.log('[Settings] Simulation speed:', value, 'x');
    });
  }

  const maxSatellitesSlider = panel.querySelector('#setting-max-satellites');
  const maxSatellitesValue = panel.querySelector('#max-sats-value');
  if (maxSatellitesSlider && maxSatellitesValue) {
    maxSatellitesSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      maxSatellitesValue.textContent = value;
      setSetting('maxSatellites', value);
      updateMaxSatellites(value);
      console.log('[Settings] Max satellites:', value);
    });
  }

  const throttlingToggle = panel.querySelector('#setting-throttling');
  if (throttlingToggle) {
    throttlingToggle.addEventListener('change', (e) => {
      setSetting('throttling', e.target.checked);
      console.log('[Settings] Throttling:', e.target.checked);
      // Note: Throttling implementation would need to be added to animation loop
    });
  }

  // Action Buttons
  const resetBtn = panel.querySelector('#btn-reset-settings');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetToDefaults(panel);
    });
  }

  const exportBtn = panel.querySelector('#btn-export-settings');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportSettings();
    });
  }

  // ESC key to close
  const escHandler = (e) => {
    if (e.key === 'Escape' && panel && !panel.classList.contains('hidden')) {
      hideSettingsPanel();
    }
  };
  window.addEventListener('keydown', escHandler);
}

/**
 * Load saved settings from uiState and update UI
 */
function loadSettings(panel) {
  // Display Settings
  const orbitHoverToggle = panel.querySelector('#setting-orbit-hover');
  if (orbitHoverToggle) {
    orbitHoverToggle.checked = getSetting('orbitHover') ?? true;
  }

  const orbitSelectToggle = panel.querySelector('#setting-orbit-select');
  if (orbitSelectToggle) {
    orbitSelectToggle.checked = getSetting('orbitSelect') ?? true;
  }

  const autoRotateToggle = panel.querySelector('#setting-auto-rotate');
  if (autoRotateToggle) {
    const autoRotate = getSetting('autoRotate') ?? false;
    autoRotateToggle.checked = autoRotate;
    if (autoRotate) {
      startAutoRotate();
    }
  }

  const labelsToggle = panel.querySelector('#setting-labels');
  if (labelsToggle) {
    labelsToggle.checked = getSetting('labels') ?? false;
    toggleSatelliteLabels(labelsToggle.checked);
  }

  // Visibility Settings
  const showSatellitesToggle = panel.querySelector('#setting-show-satellites');
  if (showSatellitesToggle) {
    showSatellitesToggle.checked = getSetting('showSatellites') ?? true;
    toggleSatellitesVisibility(showSatellitesToggle.checked);
  }

  const showStationsToggle = panel.querySelector('#setting-show-stations');
  if (showStationsToggle) {
    showStationsToggle.checked = getSetting('showStations') ?? true;
    toggleStationsVisibility(showStationsToggle.checked);
  }

  const showInfoToggle = panel.querySelector('#setting-show-info');
  if (showInfoToggle) {
    showInfoToggle.checked = getSetting('showInfo') ?? true;
    toggleInfoPanelsVisibility(showInfoToggle.checked);
  }

  // Performance Settings
  const updateRate = getSetting('updateRate') ?? 2.0;
  // Sync CONFIG with loaded setting
  CONFIG.SATELLITE_UPDATE_INTERVAL = updateRate * 1000;
  const updateRateSlider = panel.querySelector('#setting-update-rate');
  const updateRateValue = panel.querySelector('#update-rate-value');
  if (updateRateSlider && updateRateValue) {
    updateRateSlider.value = updateRate;
    updateRateValue.textContent = `${updateRate.toFixed(1)}s`;
  }

  const simulationSpeed = getSetting('simulationSpeed') ?? 1.0;
  // Sync CONFIG with loaded setting
  CONFIG.TIME_ACCELERATION = simulationSpeed;
  const simulationSpeedSlider = panel.querySelector('#setting-simulation-speed');
  const simulationSpeedValue = panel.querySelector('#simulation-speed-value');
  if (simulationSpeedSlider && simulationSpeedValue) {
    simulationSpeedSlider.value = simulationSpeed;
    simulationSpeedValue.textContent = `${simulationSpeed.toFixed(1)}x`;
  }

  const maxSatellites = getSetting('maxSatellites') ?? 50;
  // Sync CONFIG.MAX_SATELLITES with loaded setting
  CONFIG.MAX_SATELLITES = maxSatellites;
  const maxSatellitesSlider = panel.querySelector('#setting-max-satellites');
  const maxSatellitesValue = panel.querySelector('#max-sats-value');
  if (maxSatellitesSlider && maxSatellitesValue) {
    maxSatellitesSlider.value = maxSatellites;
    maxSatellitesValue.textContent = maxSatellites;
  }

  const throttlingToggle = panel.querySelector('#setting-throttling');
  if (throttlingToggle) {
    throttlingToggle.checked = getSetting('throttling') ?? true;
  }
}

/**
 * Toggle satellite visibility
 */
function toggleSatellitesVisibility(visible) {
  const satelliteMeshes = getSatelliteMeshes();
  satelliteMeshes.forEach(mesh => {
    mesh.visible = visible;
  });
}

/**
 * Toggle ground station visibility
 */
function toggleStationsVisibility(visible) {
  const stationMeshes = getStationMeshes();
  stationMeshes.forEach(mesh => {
    mesh.visible = visible;
  });
}

/**
 * Toggle info panels visibility
 */
function toggleInfoPanelsVisibility(visible) {
  const stationInfo = document.getElementById('station-info');
  const satelliteInfo = document.getElementById('satellite-info');
  
  if (stationInfo) {
    if (!visible && !stationInfo.classList.contains('hidden')) {
      stationInfo.classList.add('hidden');
    }
  }
  
  if (satelliteInfo) {
    if (!visible && !satelliteInfo.classList.contains('hidden')) {
      satelliteInfo.classList.add('hidden');
    }
  }
}

/**
 * Toggle satellite labels (if implemented)
 */
function toggleSatelliteLabels(show) {
  // Check if labels exist in the scene
  if (window.scene) {
    const labels = window.scene.children.filter(child => 
      child.userData && child.userData.isLabel
    );
    labels.forEach(label => {
      label.visible = show;
    });
  }
  // Note: If labels aren't implemented yet, this will do nothing
}

/**
 * Update satellite update rate (only controls update frequency, not speed)
 */
function updateSatelliteUpdateRate(rateSeconds) {
  CONFIG.SATELLITE_UPDATE_INTERVAL = rateSeconds * 1000; // Convert to milliseconds
  console.log(`[Settings] Update rate: ${rateSeconds}s`);
}

/**
 * Update simulation speed (controls how fast satellites move along orbits)
 */
function updateSimulationSpeed(speedMultiplier) {
  CONFIG.TIME_ACCELERATION = speedMultiplier;
  
  // Reset simulation start time when speed changes to avoid jumps
  resetSimulationTime();
  
  console.log(`[Settings] Simulation speed: ${speedMultiplier.toFixed(1)}x`);
}

/**
 * Start auto-rotate globe
 */
function startAutoRotate() {
  if (isAutoRotateActive) return;
  
  isAutoRotateActive = true;
  const controls = getControls();
  if (controls) {
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
  }
  console.log('[Settings] Auto-rotate started');
}

/**
 * Stop auto-rotate globe
 */
function stopAutoRotate() {
  if (!isAutoRotateActive) return;
  
  isAutoRotateActive = false;
  const controls = getControls();
  if (controls) {
    controls.autoRotate = false;
  }
  console.log('[Settings] Auto-rotate stopped');
}

/**
 * Reset settings to defaults
 */
async function resetToDefaults(panel) {
  // Reset state
  resetState();
  
  // Reset CONFIG.MAX_SATELLITES to default (50)
  CONFIG.MAX_SATELLITES = 50;
  
  // Reset update rate and simulation speed to defaults
  const defaultUpdateRate = 2.0;
  CONFIG.SATELLITE_UPDATE_INTERVAL = defaultUpdateRate * 1000;
  CONFIG.TIME_ACCELERATION = 1.0; // Normal speed (1.0x)
  
  // Reload settings to update UI
  loadSettings(panel);
  
  // Stop auto-rotate if active
  stopAutoRotate();
  
  // Re-render satellites with default limit
  await updateMaxSatellites(50);
  
  console.log('[Settings] Reset to defaults');
}

/**
 * Export settings to JSON
 */
function exportSettings() {
  const settings = getAllSettings();
  const dataStr = JSON.stringify(settings, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'satellite-map-settings.json';
  link.click();
  
  URL.revokeObjectURL(url);
  console.log('[Settings] Settings exported');
}

/**
 * Update max satellites and re-render
 */
async function updateMaxSatellites(newLimit) {
  if (!window.scene) {
    console.warn('[Settings] Scene not available for satellite re-render');
    return;
  }

  try {
    // Update CONFIG.MAX_SATELLITES
    CONFIG.MAX_SATELLITES = newLimit;
    
    // Reload satellites with new limit
    const limitedSatellites = reloadSatellitesWithLimit(newLimit);
    
    if (limitedSatellites.length === 0) {
      console.warn('[Settings] No satellites to render after limiting');
      return;
    }

    // Clear existing satellite meshes from scene
    const currentMeshes = getSatelliteMeshes();
    if (currentMeshes.length > 0) {
      clearSatelliteMeshes(window.scene);
    }

    // Initialize satellite records with new limit
    const { records, targetPositions } = await initializeSatellites(
      limitedSatellites,
      initializeSatelliteRecord
    );

    // Update satellite records
    setSatelliteRecords(records);

    // Re-render satellites
    if (records.length > 0) {
      const newMeshes = renderSatellites(window.scene, records, targetPositions);
      
      // Update cached arrays in main.js if they exist
      if (window.cachedSatelliteMeshes) {
        window.cachedSatelliteMeshes = newMeshes;
      }
      if (window.cachedSatelliteRecords) {
        window.cachedSatelliteRecords = records;
      }

      // Update satellite interaction with new meshes
      if (window.setupSatelliteInteraction) {
        // Re-setup interaction if needed
        console.log('[Settings] Satellite meshes updated, interaction should use getSatelliteMeshes()');
      }

      console.log(`[Settings] ✓ Re-rendered ${newMeshes.length} satellites with limit ${newLimit}`);
    }
  } catch (error) {
    console.error('[Settings] Error updating max satellites:', error);
  }
}

/**
 * Check if orbit should be shown on hover
 */
export function shouldShowOrbitOnHover() {
  return getSetting('orbitHover') ?? true;
}

/**
 * Check if orbit should be shown on select
 */
export function shouldShowOrbitOnSelect() {
  return getSetting('orbitSelect') ?? true;
}
