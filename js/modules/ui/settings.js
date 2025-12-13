// ============================================
// SETTINGS PANEL - Application Settings
// Panel for configuring satellite size, colors, and camera modes
// ============================================

import { getSatelliteMeshes } from '../satelliteRenderer.js';
import { getStationMeshes } from '../groundStationRenderer.js';
import { COLORS } from '../constants.js';
import { getControls } from '../controls.js';

let panelElement = null;
let autoPanAnimationId = null;
let isAutoPanActive = false;
let autoPanAngle = 0;

// Settings state
const settings = {
    satelliteSize: 1.0,
    stationColor: COLORS.STATION_DEFAULT,
    satelliteColor: COLORS.STATELLITE_LEO
};

/**
 * Update satellite sizes
 */
function updateSatelliteSizes(size) {
    const satelliteMeshes = getSatelliteMeshes();
    satelliteMeshes.forEach(mesh => {
        mesh.scale.set(size, size, size);
    });
    settings.satelliteSize = size;
    console.log(`[Settings] Updated satellite size to ${size}`);
}

/**
 * Update ground station colors
 */
function updateStationColors(colorHex) {
    const stationMeshes = getStationMeshes();
    const color = parseInt(colorHex.replace('#', ''), 16);
    
    stationMeshes.forEach(mesh => {
        // Don't change color if station is selected (has different color)
        const isSelected = mesh.material.color.getHex() === COLORS.STATION_SELECTED;
        if (!isSelected) {
            mesh.material.color.setHex(color);
            mesh.material.emissive.setHex(color);
        }
    });
    
    settings.stationColor = color;
    COLORS.STATION_DEFAULT = color;
    COLORS.STATION_EMISSIVE = color;
    console.log(`[Settings] Updated station color to #${colorHex}`);
}

/**
 * Update satellite colors
 */
function updateSatelliteColors(colorHex) {
    const satelliteMeshes = getSatelliteMeshes();
    const color = parseInt(colorHex.replace('#', ''), 16);
    
    satelliteMeshes.forEach(mesh => {
        // Don't change color if it's a custom satellite (red)
        const isCustom = mesh.material.color.getHex() === 0xff0000;
        if (!isCustom) {
            mesh.material.color.setHex(color);
            mesh.material.emissive.setHex(color);
        }
    });
    
    settings.satelliteColor = color;
    // Update COLORS constants so new satellites use the new color
    COLORS.SATELLITE_LEO = color;
    COLORS.SATELLITE_MEO = color;
    COLORS.SATELLITE_GEO = color;
    console.log(`[Settings] Updated satellite color to #${colorHex}`);
}

/**
 * Convert hex color to hex string
 */
function hexToHexString(hex) {
    return '#' + hex.toString(16).padStart(6, '0');
}

/**
 * Auto-pan camera animation
 */
function autoPanCamera() {
    if (!isAutoPanActive || !window.camera) return;
    
    const radius = 4.5;
    const speed = 0.002;
    
    autoPanAngle += speed;
    
    // Circular orbit around the globe with smooth vertical variation
    const x = radius * Math.sin(autoPanAngle);
    const z = radius * Math.cos(autoPanAngle);
    const y = 1.5 + Math.sin(autoPanAngle * 0.5) * 0.5; // Slight vertical variation
    
    window.camera.position.set(x, y, z);
    window.camera.lookAt(0, 0, 0);
    
    // Update controls if they exist (but keep them disabled)
    const controls = getControls();
    if (controls) {
        controls.target.set(0, 0, 0);
        // Don't call controls.update() as it might interfere with manual positioning
    }
    
    autoPanAnimationId = requestAnimationFrame(autoPanCamera);
}

/**
 * Start auto-pan mode
 */
function startAutoPan() {
    if (isAutoPanActive) return;
    
    isAutoPanActive = true;
    autoPanAngle = 0;
    
    // Disable manual controls
    const controls = getControls();
    if (controls) {
        controls.enabled = false;
    }
    
    autoPanCamera();
    console.log('[Settings] Auto-pan mode started');
}

/**
 * Stop auto-pan mode
 */
function stopAutoPan() {
    if (!isAutoPanActive) return;
    
    isAutoPanActive = false;
    
    if (autoPanAnimationId) {
        cancelAnimationFrame(autoPanAnimationId);
        autoPanAnimationId = null;
    }
    
    // Re-enable manual controls
    const controls = getControls();
    if (controls) {
        controls.enabled = true;
        controls.update(); // Update to sync camera position
    }
    
    console.log('[Settings] Auto-pan mode stopped');
}

/**
 * Initialize Settings panel structure
 */
export function initSettingsPanel() {
    if (panelElement) {
        console.warn('Settings panel already initialized');
        return panelElement;
    }
    
    // Create panel
    const panel = document.createElement('div');
    panel.className = 'panel panel-right hidden';
    panel.id = 'panel-settings';
    
    // Panel Header
    const header = document.createElement('header');
    header.className = 'panel-header';
    header.innerHTML = `
        <h2>Settings</h2>
        <button class="close-btn" aria-label="Close panel">&times;</button>
    `;
    
    // Panel Content
    const content = document.createElement('div');
    content.className = 'panel-content';
    content.innerHTML = `
        <!-- Satellite Size Section -->
        <div class="panel-section">
            <h3 class="panel-section-title">Satellite Size</h3>
            <div class="slider-control">
                <label for="satellite-size-slider">
                    <span>Size</span>
                    <span id="satellite-size-value">100%</span>
                </label>
                <input 
                    type="range" 
                    id="satellite-size-slider" 
                    min="0.5" 
                    max="3.0" 
                    step="0.1" 
                    value="1.0"
                    aria-label="Satellite size">
                <div style="display: flex; justify-content: space-between; font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: var(--space-1);">
                    <span>50%</span>
                    <span>300%</span>
                </div>
            </div>
        </div>
        
        <!-- Colors Section -->
        <div class="panel-section">
            <h3 class="panel-section-title">Colors</h3>
            
            <!-- Ground Station Color -->
            <div class="form-group" style="margin-bottom: var(--space-4);">
                <label class="form-label" for="station-color-picker">Ground Station Color</label>
                <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <input 
                        type="color" 
                        id="station-color-picker" 
                        value="${hexToHexString(COLORS.STATION_DEFAULT)}"
                        style="width: 60px; height: 40px; border: 1px solid var(--ui-border); border-radius: var(--radius-md); cursor: pointer;"
                        aria-label="Ground station color">
                    <input 
                        type="text" 
                        id="station-color-text" 
                        value="${hexToHexString(COLORS.STATION_DEFAULT)}"
                        class="form-input" 
                        style="flex: 1; font-family: monospace;"
                        placeholder="#FFB039"
                        maxlength="7"
                        aria-label="Ground station color hex">
                </div>
            </div>
            
            <!-- Satellite Color -->
            <div class="form-group">
                <label class="form-label" for="satellite-color-picker">Satellite Color</label>
                <div style="display: flex; align-items: center; gap: var(--space-3);">
                    <input 
                        type="color" 
                        id="satellite-color-picker" 
                        value="${hexToHexString(COLORS.SATELLITE_LEO)}"
                        style="width: 60px; height: 40px; border: 1px solid var(--ui-border); border-radius: var(--radius-md); cursor: pointer;"
                        aria-label="Satellite color">
                    <input 
                        type="text" 
                        id="satellite-color-text" 
                        value="${hexToHexString(COLORS.SATELLITE_LEO)}"
                        class="form-input" 
                        style="flex: 1; font-family: monospace;"
                        placeholder="#00E5FF"
                        maxlength="7"
                        aria-label="Satellite color hex">
                </div>
            </div>
        </div>
        
        <!-- Camera Section -->
        <div class="panel-section">
            <h3 class="panel-section-title">Camera</h3>
            <div class="toggle-switch">
                <span>Auto-Pan Mode</span>
                <input 
                    type="checkbox" 
                    id="auto-pan-toggle"
                    aria-label="Toggle auto-pan camera mode">
            </div>
            <p style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: var(--space-2);">
                Automatically rotate the camera around the globe
            </p>
        </div>
    `;
    
    // Panel Footer
    const footer = document.createElement('footer');
    footer.className = 'panel-footer';
    footer.innerHTML = `
        <button id="btn-reset-settings" class="btn btn-secondary btn-sm">Reset to Defaults</button>
    `;
    
    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(content);
    panel.appendChild(footer);
    
    // Append to body
    document.body.appendChild(panel);
    
    // Setup event listeners
    setupEventListeners(panel);
    
    panelElement = panel;
    console.log('✓ Settings panel structure initialized');
    
    return panel;
}

/**
 * Setup event listeners for the panel
 */
function setupEventListeners(panel) {
    // Close button
    const closeBtn = panel.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideSettingsPanel();
        });
    }
    
    // Satellite size slider
    const sizeSlider = panel.querySelector('#satellite-size-slider');
    const sizeValue = panel.querySelector('#satellite-size-value');
    if (sizeSlider && sizeValue) {
        sizeSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            const percentage = Math.round(value * 100);
            sizeValue.textContent = `${percentage}%`;
            updateSatelliteSizes(value);
        });
    }
    
    // Station color picker
    const stationColorPicker = panel.querySelector('#station-color-picker');
    const stationColorText = panel.querySelector('#station-color-text');
    if (stationColorPicker && stationColorText) {
        stationColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            stationColorText.value = color;
            updateStationColors(color);
        });
        
        stationColorText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                stationColorPicker.value = color;
                updateStationColors(color);
            }
        });
    }
    
    // Satellite color picker
    const satelliteColorPicker = panel.querySelector('#satellite-color-picker');
    const satelliteColorText = panel.querySelector('#satellite-color-text');
    if (satelliteColorPicker && satelliteColorText) {
        satelliteColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            satelliteColorText.value = color;
            updateSatelliteColors(color);
        });
        
        satelliteColorText.addEventListener('input', (e) => {
            const color = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                satelliteColorPicker.value = color;
                updateSatelliteColors(color);
            }
        });
    }
    
    // Auto-pan toggle
    const autoPanToggle = panel.querySelector('#auto-pan-toggle');
    if (autoPanToggle) {
        autoPanToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                startAutoPan();
            } else {
                stopAutoPan();
            }
        });
    }
    
    // Reset button
    const resetBtn = panel.querySelector('#btn-reset-settings');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetToDefaults(panel);
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
 * Reset settings to defaults
 */
function resetToDefaults(panel) {
    // Reset satellite size
    const sizeSlider = panel.querySelector('#satellite-size-slider');
    const sizeValue = panel.querySelector('#satellite-size-value');
    if (sizeSlider && sizeValue) {
        sizeSlider.value = '1.0';
        sizeValue.textContent = '100%';
        updateSatelliteSizes(1.0);
    }
    
    // Reset station color
    const stationColorPicker = panel.querySelector('#station-color-picker');
    const stationColorText = panel.querySelector('#station-color-text');
    const defaultStationColor = hexToHexString(0xFFB039);
    if (stationColorPicker && stationColorText) {
        stationColorPicker.value = defaultStationColor;
        stationColorText.value = defaultStationColor;
        updateStationColors(defaultStationColor);
    }
    
    // Reset satellite color
    const satelliteColorPicker = panel.querySelector('#satellite-color-picker');
    const satelliteColorText = panel.querySelector('#satellite-color-text');
    const defaultSatelliteColor = hexToHexString(0x00E5FF);
    if (satelliteColorPicker && satelliteColorText) {
        satelliteColorPicker.value = defaultSatelliteColor;
        satelliteColorText.value = defaultSatelliteColor;
        updateSatelliteColors(defaultSatelliteColor);
    }
    
    // Reset auto-pan
    const autoPanToggle = panel.querySelector('#auto-pan-toggle');
    if (autoPanToggle && autoPanToggle.checked) {
        autoPanToggle.checked = false;
        stopAutoPan();
    }
    
    console.log('[Settings] Reset to defaults');
}

/**
 * Show the panel
 */
export function showSettingsPanel() {
    if (panelElement) {
        panelElement.classList.remove('hidden');
    }
}

/**
 * Hide the panel
 */
export function hideSettingsPanel() {
    if (panelElement) {
        panelElement.classList.add('hidden');
        // Stop auto-pan when panel is closed
        stopAutoPan();
        const autoPanToggle = panelElement.querySelector('#auto-pan-toggle');
        if (autoPanToggle) {
            autoPanToggle.checked = false;
        }
    }
}

/**
 * Get panel element
 */
export function getSettingsPanel() {
    return panelElement;
}

