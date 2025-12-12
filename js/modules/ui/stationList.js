// ============================================
// STATION LIST - Ground Station List Panel
// Sliding panel for viewing all ground stations
// ============================================

let panelElement = null;

/**
 * Initialize Station List panel structure
 */
export function initStationListPanel() {
    if (panelElement) {
        console.warn('Station List panel already initialized');
        return panelElement;
    }
    
    // Create panel
    const panel = document.createElement('div');
    panel.className = 'panel panel-left hidden';
    panel.id = 'panel-station-list';
    
    // Panel Header
    const header = document.createElement('header');
    header.className = 'panel-header';
    header.innerHTML = `
        <h2>Ground Stations</h2>
        <button class="close-btn" aria-label="Close panel">&times;</button>
    `;
    
    // Panel Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'panel-toolbar';
    toolbar.innerHTML = `
        <input type="search" id="station-search" placeholder="Search stations..." aria-label="Search ground stations">
        <select id="station-sort" class="form-select" style="width: auto; min-width: 120px;">
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="type">By Type</option>
            <option value="lat">By Latitude</option>
        </select>
    `;
    
    // Panel Content
    const content = document.createElement('div');
    content.className = 'panel-content';
    content.innerHTML = `
        <div class="station-count" id="station-count">0 stations</div>
        <ul class="panel-list" id="station-list">
            <!-- Station list items will be populated here -->
        </ul>
        <div class="panel-empty hidden" id="station-list-empty">
            <div class="panel-empty-icon">📡</div>
            <p class="panel-empty-text">No ground stations found</p>
        </div>
    `;
    
    // Panel Footer
    const footer = document.createElement('footer');
    footer.className = 'panel-footer';
    footer.innerHTML = `
        <button id="btn-export-stations" class="btn btn-secondary btn-sm">Export List</button>
    `;
    
    // Assemble panel
    panel.appendChild(header);
    panel.appendChild(toolbar);
    panel.appendChild(content);
    panel.appendChild(footer);
    
    // Append to body
    document.body.appendChild(panel);
    
    panelElement = panel;
    console.log('✓ Station List panel structure initialized');
    
    return panel;
}

/**
 * Show the panel
 */
export function showStationListPanel() {
    if (panelElement) {
        panelElement.classList.remove('hidden');
    }
}

/**
 * Hide the panel
 */
export function hideStationListPanel() {
    if (panelElement) {
        panelElement.classList.add('hidden');
    }
}

/**
 * Get panel element
 */
export function getStationListPanel() {
    return panelElement;
}

