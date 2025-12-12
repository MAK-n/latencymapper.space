// ============================================
// FILTER MENU - Satellite Type Filters
// Panel for filtering satellites by type
// ============================================

let panelElement = null;

/**
 * Initialize Filter Menu panel structure
 */
export function initFilterPanel() {
    if (panelElement) {
        console.warn('Filter panel already initialized');
        return panelElement;
    }
    
    // Create panel
    const panel = document.createElement('div');
    panel.className = 'panel panel-top hidden';
    panel.id = 'panel-filters';
    
    // Panel Header
    const header = document.createElement('header');
    header.className = 'panel-header';
    header.innerHTML = `
        <h2>Filters</h2>
        <button class="close-btn" aria-label="Close panel">&times;</button>
    `;
    
    // Panel Content
    const content = document.createElement('div');
    content.className = 'panel-content';
    content.innerHTML = `
        <!-- Satellite Type Filters -->
        <section class="panel-section">
            <h3>Satellite Types</h3>
            
            <label class="toggle-switch">
                <span>LEO <span class="count" id="count-leo">(0)</span></span>
                <input type="checkbox" id="filter-leo" checked>
            </label>
            
            <label class="toggle-switch">
                <span>MEO <span class="count" id="count-meo">(0)</span></span>
                <input type="checkbox" id="filter-meo" checked>
            </label>
            
            <label class="toggle-switch">
                <span>GEO <span class="count" id="count-geo">(0)</span></span>
                <input type="checkbox" id="filter-geo" checked>
            </label>
            
            <label class="toggle-switch">
                <span>Custom Satellites <span class="count" id="count-custom">(0)</span></span>
                <input type="checkbox" id="filter-custom" checked>
            </label>
        </section>
        
        <!-- Other Filters -->
        <section class="panel-section">
            <h3>Visibility</h3>
            
            <label class="toggle-switch">
                <span>Ground Stations</span>
                <input type="checkbox" id="filter-stations" checked>
            </label>
            
            <label class="toggle-switch">
                <span>Orbital Paths</span>
                <input type="checkbox" id="filter-orbits">
            </label>
        </section>
        
        <!-- Preset Filters -->
        <section class="panel-section">
            <h3>Quick Filters</h3>
            <div style="display: flex; gap: var(--space-2); flex-wrap: wrap;">
                <button class="btn btn-sm btn-secondary" id="preset-gps">GPS Only</button>
                <button class="btn btn-sm btn-secondary" id="preset-leo">LEO Only</button>
                <button class="btn btn-sm btn-secondary" id="preset-geo">GEO Only</button>
                <button class="btn btn-sm btn-secondary" id="preset-all">Show All</button>
            </div>
        </section>
        
        <!-- Actions -->
        <div class="panel-footer" style="border-top: 1px solid var(--ui-border); padding-top: var(--space-4); margin-top: var(--space-4);">
            <button id="btn-reset-filters" class="btn btn-secondary btn-sm">Reset Filters</button>
        </div>
    `;
    
    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(content);
    
    // Append to body
    document.body.appendChild(panel);
    
    panelElement = panel;
    console.log('✓ Filter Menu panel structure initialized');
    
    return panel;
}

/**
 * Show the panel
 */
export function showFilterPanel() {
    if (panelElement) {
        panelElement.classList.remove('hidden');
    }
}

/**
 * Hide the panel
 */
export function hideFilterPanel() {
    if (panelElement) {
        panelElement.classList.add('hidden');
    }
}

/**
 * Get panel element
 */
export function getFilterPanel() {
    return panelElement;
}

