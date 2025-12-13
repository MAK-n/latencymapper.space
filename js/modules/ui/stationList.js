// ============================================
// STATION LIST - Ground Station List Panel
// Sliding panel for viewing all ground stations
// ============================================

import { getGroundStations } from '../groundStations.js';
import { getStationMeshes } from '../groundStationRenderer.js';
import { displayStationInfo } from '../groundStationInteraction.js';
import { COLORS } from '../constants.js';

let panelElement = null;
let searchTimeout = null;
let currentSearchQuery = '';
let currentSortOption = 'name-asc';
let selectedStationId = null;

/**
 * Format station type for display
 */
function formatStationType(type) {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

/**
 * Format coordinates for display
 */
function formatCoordinates(lat, lon) {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
}

/**
 * Search and filter stations
 */
function filterStations(stations, query) {
    if (!query || query.trim().length === 0) {
        return stations;
    }
    
    const searchTerm = query.toLowerCase().trim();
    return stations.filter(station => {
        const name = (station.name || '').toLowerCase();
        const id = (station.id || '').toLowerCase();
        const type = (station.type || '').toLowerCase();
        
        return name.includes(searchTerm) || 
               id.includes(searchTerm) || 
               type.includes(searchTerm);
    });
}

/**
 * Sort stations based on selected option
 */
function sortStations(stations, sortOption) {
    const sorted = [...stations];
    
    switch (sortOption) {
        case 'name-asc':
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'name-desc':
            sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            break;
        case 'type':
            sorted.sort((a, b) => {
                const typeA = (a.type || '').toLowerCase();
                const typeB = (b.type || '').toLowerCase();
                if (typeA !== typeB) {
                    return typeA.localeCompare(typeB);
                }
                return (a.name || '').localeCompare(b.name || '');
            });
            break;
        case 'lat':
            sorted.sort((a, b) => (b.lat || 0) - (a.lat || 0));
            break;
        default:
            break;
    }
    
    return sorted;
}

/**
 * Render station list items
 */
function renderStationList() {
    const listContainer = panelElement?.querySelector('#station-list');
    const emptyState = panelElement?.querySelector('#station-list-empty');
    const countElement = panelElement?.querySelector('#station-count');
    
    if (!listContainer || !emptyState || !countElement) return;
    
    // Get all stations
    const allStations = getGroundStations();
    
    // Filter and sort
    const filtered = filterStations(allStations, currentSearchQuery);
    const sorted = sortStations(filtered, currentSortOption);
    
    // Update count
    const count = sorted.length;
    countElement.textContent = `${count} station${count !== 1 ? 's' : ''}`;
    
    // Clear list
    listContainer.innerHTML = '';
    
    // Show/hide empty state
    if (count === 0) {
        emptyState.classList.remove('hidden');
        listContainer.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        listContainer.classList.remove('hidden');
        
        // Render each station
        sorted.forEach(station => {
            const li = document.createElement('li');
            li.className = 'panel-list-item';
            if (selectedStationId === station.id) {
                li.classList.add('active');
            }
            
            // Get station mesh if available
            const stationMeshes = getStationMeshes();
            const stationMesh = stationMeshes.find(m => m.userData.stationId === station.id);
            
            li.innerHTML = `
                <div class="panel-list-item-header">
                    <h3 class="panel-list-item-title">${station.name || 'Unnamed Station'}</h3>
                    <span class="panel-list-item-badge">${formatStationType(station.type)}</span>
                </div>
                <div class="panel-list-item-subtitle">
                    <div style="margin-bottom: var(--space-1);">📍 ${formatCoordinates(station.lat, station.lon)}</div>
                    <div>Elevation: ${station.elevation || 0} m</div>
                    <div style="margin-top: var(--space-2); font-size: var(--font-size-xs); color: var(--text-disabled);">ID: ${station.id}</div>
                </div>
            `;
            
            // Click handler to select station
            li.addEventListener('click', () => {
                selectStation(station, stationMesh);
            });
            
            listContainer.appendChild(li);
        });
    }
}

/**
 * Select a station and highlight it on the globe
 */
function selectStation(station, stationMesh) {
    // Update selected station ID
    selectedStationId = station.id;
    
    // Update list item active states
    const listItems = panelElement?.querySelectorAll('.panel-list-item');
    listItems?.forEach(item => {
        item.classList.remove('active');
    });
    
    const clickedItem = Array.from(listItems || []).find(item => {
        const title = item.querySelector('.panel-list-item-title');
        return title?.textContent === station.name;
    });
    if (clickedItem) {
        clickedItem.classList.add('active');
    }
    
    // Reset all station visuals first
    const stationMeshes = getStationMeshes();
    stationMeshes.forEach(mesh => {
        mesh.material.color.setHex(COLORS.STATION_DEFAULT);
        mesh.material.emissive.setHex(COLORS.STATION_EMISSIVE);
        mesh.material.emissiveIntensity = 0.8;
        mesh.scale.set(1, 1, 1);
    });
    
    // Highlight selected station if mesh exists
    if (stationMesh) {
        stationMesh.material.color.setHex(COLORS.STATION_SELECTED);
        stationMesh.material.emissive.setHex(COLORS.STATION_SELECTED);
        stationMesh.material.emissiveIntensity = 1.2;
        stationMesh.scale.set(1.5, 1.5, 1.5);
        
        // Display station info
        displayStationInfo(stationMesh.userData);
    } else {
        // If mesh doesn't exist yet, create a temporary userData object
        const tempUserData = {
            stationId: station.id,
            stationName: station.name,
            latitude: station.lat,
            longitude: station.lon,
            elevation: station.elevation || 0,
            type: station.type || 'Unknown'
        };
        displayStationInfo(tempUserData);
    }
    
    console.log('[Station List] Selected station:', station.name);
}

/**
 * Export stations list to JSON
 */
function exportStationsList() {
    const allStations = getGroundStations();
    const filtered = filterStations(allStations, currentSearchQuery);
    const sorted = sortStations(filtered, currentSortOption);
    
    const dataStr = JSON.stringify(sorted, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ground-stations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`[Station List] Exported ${sorted.length} stations`);
}

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
        <div style="margin-bottom: var(--space-4); padding: var(--space-2) var(--space-3); background: var(--bg-secondary); border-radius: var(--radius-md); font-size: var(--font-size-sm); color: var(--text-secondary);" id="station-count">0 stations</div>
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
    
    // Setup event listeners
    setupEventListeners(panel);
    
    panelElement = panel;
    console.log('✓ Station List panel structure initialized');
    
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
            hideStationListPanel();
        });
    }
    
    // Search input
    const searchInput = panel.querySelector('#station-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Debounce search
            searchTimeout = setTimeout(() => {
                renderStationList();
            }, 150);
        });
    }
    
    // Sort select
    const sortSelect = panel.querySelector('#station-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSortOption = e.target.value;
            renderStationList();
        });
    }
    
    // Export button
    const exportBtn = panel.querySelector('#btn-export-stations');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportStationsList();
        });
    }
    
    // ESC key to close
    const escHandler = (e) => {
        if (e.key === 'Escape' && panel && !panel.classList.contains('hidden')) {
            hideStationListPanel();
        }
    };
    window.addEventListener('keydown', escHandler);
    
    // Listen for new station additions to refresh the list
    const stationAddedHandler = () => {
        // Small delay to ensure station is added to the data store
        setTimeout(() => {
            refreshStationList();
        }, 100);
    };
    window.addEventListener('add-ground-station', stationAddedHandler);
}

/**
 * Show the panel
 */
export function showStationListPanel() {
    if (panelElement) {
        panelElement.classList.remove('hidden');
        // Refresh the list when showing
        renderStationList();
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

/**
 * Refresh the station list (useful when stations are added/removed)
 */
export function refreshStationList() {
    if (panelElement && !panelElement.classList.contains('hidden')) {
        renderStationList();
    }
}

