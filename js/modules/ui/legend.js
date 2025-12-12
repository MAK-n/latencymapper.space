// ============================================
// LEGEND COMPONENT - Color Legend
// Displays color meanings for satellites and stations
// ============================================

/**
 * Initialize Legend component
 * @param {HTMLElement} container - Container element to insert legend into
 */
export function initLegend(container) {
    if (!container) {
        console.error('Legend container not provided');
        return null;
    }
    
    const legend = document.createElement('div');
    legend.className = 'legend-component';
    legend.innerHTML = `
        <div class="legend-items" style="display: flex; flex-direction: column; gap: var(--space-2);">
            <!-- Satellites -->
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-3);">
                <span class="legend-color" style="width: 16px; height: 16px; background: var(--satellite-leo); border-radius: 50%; flex-shrink: 0;"></span>
                <span style="font-size: var(--font-size-sm); color: var(--text-primary);">LEO (&lt;2000 km)</span>
            </div>
            
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-3);">
                <span class="legend-color" style="width: 16px; height: 16px; background: var(--satellite-meo); border-radius: 50%; flex-shrink: 0;"></span>
                <span style="font-size: var(--font-size-sm); color: var(--text-primary);">MEO (2000-35786 km)</span>
            </div>
            
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-3);">
                <span class="legend-color" style="width: 16px; height: 16px; background: var(--satellite-geo); border-radius: 50%; flex-shrink: 0;"></span>
                <span style="font-size: var(--font-size-sm); color: var(--text-primary);">GEO (35786 km)</span>
            </div>
            
            <!-- Ground Stations -->
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-2);">
                <span class="legend-color" style="width: 16px; height: 16px; background: var(--station-default); border-radius: 50%; flex-shrink: 0;"></span>
                <span style="font-size: var(--font-size-sm); color: var(--text-primary);">Ground Stations</span>
            </div>
            
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-3);">
                <span class="legend-color" style="width: 16px; height: 16px; background: var(--station-selected); border-radius: 50%; flex-shrink: 0;"></span>
                <span style="font-size: var(--font-size-sm); color: var(--text-primary);">Selected Station</span>
            </div>
            
            <!-- Orbital Paths -->
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-3); margin-top: var(--space-2);">
                <span class="legend-color" style="width: 16px; height: 3px; background: var(--orbit-hover); flex-shrink: 0;"></span>
                <span style="font-size: var(--font-size-sm); color: var(--text-primary);">Orbit Path (Hover)</span>
            </div>
            
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-3);">
                <span class="legend-color" style="width: 16px; height: 3px; background: var(--orbit-selected); flex-shrink: 0;"></span>
                <span style="font-size: var(--font-size-sm); color: var(--text-primary);">Orbit Path (Selected)</span>
            </div>
        </div>
    `;
    
    container.appendChild(legend);
    console.log('✓ Legend component initialized');
    
    return legend;
}

/**
 * Update legend (if colors change dynamically)
 */
export function updateLegend() {
    // Placeholder for dynamic legend updates
    console.log('Legend update requested');
}

