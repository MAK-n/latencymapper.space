// ============================================
// SATELLITE FINDER - Search & Camera Focus
// Panel for finding and focusing on satellites
// ============================================

let panelElement = null;

/**
 * Initialize Satellite Finder panel structure
 */
export function initSatelliteFinderPanel() {
    if (panelElement) {
        console.warn('Satellite Finder panel already initialized');
        return panelElement;
    }
    
    // Create panel
    const panel = document.createElement('div');
    panel.className = 'panel panel-center hidden';
    panel.id = 'panel-satellite-finder';
    
    panel.innerHTML = `
        <div class="search-container" style="padding: var(--space-6);">
            <div class="form-group">
                <label class="form-label" for="satellite-search-input">Find Satellite</label>
                <input 
                    type="search" 
                    id="satellite-search-input" 
                    class="form-input" 
                    placeholder="Search by name or NORAD ID..."
                    autocomplete="off"
                    aria-label="Search for satellite">
                <span class="form-hint">Start typing to see results</span>
            </div>
            
            <!-- Search Results -->
            <div id="search-results" class="hidden" style="margin-top: var(--space-4);">
                <h4 style="margin: 0 0 var(--space-3); color: var(--text-secondary); font-size: var(--font-size-sm);">
                    Results (<span id="results-count">0</span>)
                </h4>
                <ul class="panel-list" id="search-results-list">
                    <!-- Results will be populated here -->
                </ul>
            </div>
            
            <!-- Recent Searches -->
            <div id="recent-searches" style="margin-top: var(--space-6);">
                <h4 style="margin: 0 0 var(--space-3); color: var(--text-secondary); font-size: var(--font-size-sm);">
                    Recent Searches
                </h4>
                <ul class="panel-list" id="recent-searches-list">
                    <li class="panel-empty">
                        <p class="panel-empty-text" style="padding: var(--space-4);">No recent searches</p>
                    </li>
                </ul>
            </div>
            
            <!-- Close Button -->
            <div style="margin-top: var(--space-6); text-align: center;">
                <button id="btn-close-finder" class="btn btn-secondary">Close</button>
            </div>
        </div>
    `;
    
    // Append to body
    document.body.appendChild(panel);
    
    panelElement = panel;
    console.log('✓ Satellite Finder panel structure initialized');
    
    return panel;
}

/**
 * Show the panel
 */
export function showSatelliteFinderPanel() {
    if (panelElement) {
        panelElement.classList.remove('hidden');
        // Focus on search input
        const searchInput = panelElement.querySelector('#satellite-search-input');
        if (searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    }
}

/**
 * Hide the panel
 */
export function hideSatelliteFinderPanel() {
    if (panelElement) {
        panelElement.classList.add('hidden');
    }
}

/**
 * Get panel element
 */
export function getSatelliteFinderPanel() {
    return panelElement;
}

