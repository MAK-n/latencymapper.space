// ============================================
// GRAPHICS PANEL - Graphics & Quality Settings
// Panel for environmental effects and quality settings
// ============================================

let panelElement = null;

/**
 * Initialize Graphics panel structure
 */
export function initGraphicsPanel() {
  if (panelElement) {
    console.warn("Graphics panel already initialized");
    return panelElement;
  }

  // Create panel
  const panel = document.createElement("div");
  panel.className = "panel panel-right hidden";
  panel.id = "panel-graphics";

  // Panel Header
  const header = document.createElement("header");
  header.className = "panel-header";
  header.innerHTML = `
        <h2>Graphics</h2>
        <button class="close-btn" aria-label="Close panel">&times;</button>
    `;

  // Panel Content
  const content = document.createElement("div");
  content.className = "panel-content";
  content.innerHTML = `
        <!-- Environmental Effects -->
        <section class="panel-section">
            <h3>Environmental Effects</h3>
            
            <label class="toggle-switch">
                <span>Show Sun</span>
                <input type="checkbox" id="graphics-sun">
            </label>
            
            <label class="toggle-switch">
                <span>Show Milky Way</span>
                <input type="checkbox" id="graphics-milkyway">
            </label>
            
            <div class="slider-control hidden" id="sun-controls">
                <label>
                    <span>Sun Size</span>
                    <span id="sun-size-value">1.0x</span>
                </label>
                <input type="range" id="graphics-sun-size" min="0.5" max="2" step="0.1" value="1">
            </div>
            
            <div class="slider-control hidden" id="milkyway-controls">
                <label>
                    <span>Star Density</span>
                    <span id="star-density-value">Medium</span>
                </label>
                <input type="range" id="graphics-star-density" min="1" max="3" step="1" value="2">
                <span class="form-hint">1 = Low, 2 = Medium, 3 = High</span>
            </div>
        </section>
        
        <!-- Earth Quality -->
        <section class="panel-section">
            <h3>Earth Quality</h3>
            
            <div class="radio-group">
                <label class="radio-option">
                    <input type="radio" name="quality" value="potato" id="quality-potato">
                    <div>
                        <span>🥔 Potato Quality</span>
                        <small>512x256 - Fast loading, low detail</small>
                    </div>
                </label>
                
                <label class="radio-option">
                    <input type="radio" name="quality" value="medium" id="quality-medium" checked>
                    <div>
                        <span>📦 Medium Quality</span>
                        <small>2048x1024 - Balanced (Current)</small>
                    </div>
                </label>
                
                <label class="radio-option">
                    <input type="radio" name="quality" value="high" id="quality-high">
                    <div>
                        <span>💎 High Quality</span>
                        <small>8192x4096 - Maximum detail, slow loading</small>
                    </div>
                </label>
            </div>
            
            <div style="margin-top: var(--space-4);">
                <button id="btn-apply-quality" class="btn btn-primary btn-block" disabled>Apply Quality Change</button>
                <span class="form-hint">Requires texture reload</span>
            </div>
        </section>
        
        <!-- Performance Info -->
        <section class="panel-section">
            <h3>Performance Info</h3>
            
            <div class="perf-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
                <div style="padding: var(--space-3); background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">FPS</div>
                    <div style="font-size: var(--font-size-2xl); color: var(--accent-success); font-weight: var(--font-weight-bold);" id="perf-fps">--</div>
                </div>
                
                <div style="padding: var(--space-3); background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">Objects</div>
                    <div style="font-size: var(--font-size-2xl); color: var(--accent-satellite); font-weight: var(--font-weight-bold);" id="perf-objects">--</div>
                </div>
            </div>
        </section>
    `;

  // Assemble panel
  panel.appendChild(header);
  panel.appendChild(content);

  // Append to body
  document.body.appendChild(panel);

  panelElement = panel;
  console.log("✓ Graphics panel structure initialized");

  return panel;
}

/**
 * Show the panel
 */
export function showGraphicsPanel() {
  if (panelElement) {
    panelElement.classList.remove("hidden");
  }
}

/**
 * Hide the panel
 */
export function hideGraphicsPanel() {
  if (panelElement) {
    panelElement.classList.add("hidden");
  }
}

/**
 * Get panel element
 */
export function getGraphicsPanel() {
  return panelElement;
}
