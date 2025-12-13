// ============================================
// SETTINGS PANEL - Application Settings
// Panel for configuring display and performance settings
// ============================================

let panelElement = null;

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
