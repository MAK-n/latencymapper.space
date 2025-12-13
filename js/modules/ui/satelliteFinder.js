// ============================================
// UNIFIED SEARCH - Search Satellites & Ground Stations
// Panel for finding and selecting satellites and ground stations
// ============================================

import { getSatelliteRecords } from '../satelliteData.js';
import { getSatelliteMeshes } from '../satelliteRenderer.js';
import { getGroundStations } from '../groundStations.js';
import { getStationMeshes } from '../groundStationRenderer.js';
import { displaySatelliteInfo } from '../satelliteInteraction.js';
import { displayStationInfo } from '../groundStationInteraction.js';
import { showOrbitPath, removeOrbitLine } from '../orbitalPath.js';
import { COLORS } from '../constants.js';

let panelElement = null;
let searchTimeout = null;

/**
 * Search satellites and ground stations
 */
function searchItems(query) {
    if (!query || query.trim().length === 0) {
        return { satellites: [], stations: [] };
    }

    const searchTerm = query.toLowerCase().trim();
    const results = {
        satellites: [],
        stations: []
    };

    // Search satellites
    const satelliteRecords = getSatelliteRecords();
    const satelliteMeshes = getSatelliteMeshes();
    
    satelliteRecords.forEach((record, index) => {
        const name = record.name.toLowerCase();
        if (name.includes(searchTerm)) {
            const mesh = satelliteMeshes[index];
            if (mesh) {
                results.satellites.push({
                    type: 'satellite',
                    name: record.name,
                    mesh: mesh,
                    record: record,
                    userData: mesh.userData
                });
            }
        }
    });

    // Search ground stations
    const groundStations = getGroundStations();
    const stationMeshes = getStationMeshes();
    
    groundStations.forEach((station, index) => {
        const name = station.name.toLowerCase();
        const id = (station.id || '').toLowerCase();
        const type = (station.type || '').toLowerCase();
        
        if (name.includes(searchTerm) || id.includes(searchTerm) || type.includes(searchTerm)) {
            const mesh = stationMeshes.find(m => m.userData.stationId === station.id);
            if (mesh) {
                results.stations.push({
                    type: 'station',
                    name: station.name,
                    mesh: mesh,
                    station: station,
                    userData: mesh.userData
                });
            }
        }
    });

    return results;
}

/**
 * Render search results
 */
function renderSearchResults(results) {
    const resultsContainer = panelElement.querySelector('#search-results');
    const resultsList = panelElement.querySelector('#search-results-list');
    const resultsCount = panelElement.querySelector('#results-count');
    
    if (!resultsContainer || !resultsList || !resultsCount) return;

    // Clear previous results
    resultsList.innerHTML = '';

    const totalCount = results.satellites.length + results.stations.length;
    resultsCount.textContent = totalCount;

    if (totalCount === 0) {
        resultsContainer.classList.add('hidden');
        return;
    }

    resultsContainer.classList.remove('hidden');

    // Render satellites
    results.satellites.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'search-result-item';
        li.innerHTML = `
            <div class="search-result-content">
                <div class="search-result-icon">🛰️</div>
                <div class="search-result-info">
                    <div class="search-result-name">${item.name}</div>
                    <div class="search-result-type">Satellite • ${item.userData.orbitType || 'Unknown'}</div>
                </div>
            </div>
        `;
        li.addEventListener('click', () => selectSatellite(item));
        resultsList.appendChild(li);
    });

    // Render ground stations
    results.stations.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'search-result-item';
        li.innerHTML = `
            <div class="search-result-content">
                <div class="search-result-icon">📡</div>
                <div class="search-result-info">
                    <div class="search-result-name">${item.name}</div>
                    <div class="search-result-type">Ground Station • ${item.userData.type || 'Unknown'}</div>
                </div>
            </div>
        `;
        li.addEventListener('click', () => selectStation(item));
        resultsList.appendChild(li);
    });
}

/**
 * Select a satellite and show its info
 */
function selectSatellite(item) {
    console.log('[Search] Selecting satellite:', item.name);
    
    // Hide search panel
    hideSatelliteFinderPanel();
    
    // Get satellite mesh
    const mesh = item.mesh;
    if (!mesh) {
        console.error('[Search] Satellite mesh not found');
        return;
    }

    // Reset all satellites first
    const satelliteMeshes = getSatelliteMeshes();
    satelliteMeshes.forEach(m => {
        m.scale.set(1, 1, 1);
        m.material.emissiveIntensity = 0.9;
    });

    // Reset all stations (in case one was selected)
    const stationMeshes = getStationMeshes();
    stationMeshes.forEach(m => {
        m.material.color.setHex(COLORS.STATION_DEFAULT);
        m.material.emissive.setHex(COLORS.STATION_EMISSIVE);
        m.material.emissiveIntensity = 0.8;
        m.scale.set(1, 1, 1);
    });

    // Remove any existing orbit lines
    removeOrbitLine();

    // Hide station info if it was showing
    const stationInfoPanel = document.getElementById('station-info');
    if (stationInfoPanel) {
        stationInfoPanel.classList.add('hidden');
        stationInfoPanel.style.display = 'none';
    }

    // Highlight selected satellite
    mesh.scale.set(1.5, 1.5, 1.5);
    mesh.material.emissiveIntensity = 1.4;

    // Show orbital path
    showOrbitPath(mesh, true);

    // Display satellite info
    displaySatelliteInfo(mesh.userData);

    console.log('[Search] Satellite selected and info displayed');
}

/**
 * Select a ground station and show its info
 */
function selectStation(item) {
    console.log('[Search] Selecting ground station:', item.name);
    
    // Hide search panel
    hideSatelliteFinderPanel();
    
    // Get station mesh
    const mesh = item.mesh;
    if (!mesh) {
        console.error('[Search] Station mesh not found');
        return;
    }

    // Reset all stations first
    const stationMeshes = getStationMeshes();
    stationMeshes.forEach(m => {
        m.material.color.setHex(COLORS.STATION_DEFAULT);
        m.material.emissive.setHex(COLORS.STATION_EMISSIVE);
        m.material.emissiveIntensity = 0.8;
        m.scale.set(1, 1, 1);
    });

    // Reset all satellites (in case one was selected)
    const satelliteMeshes = getSatelliteMeshes();
    satelliteMeshes.forEach(m => {
        m.scale.set(1, 1, 1);
        m.material.emissiveIntensity = 0.9;
    });

    // Remove any orbit lines (in case a satellite was selected before)
    removeOrbitLine();

    // Hide satellite info if it was showing
    const satelliteInfoPanel = document.getElementById('satellite-info');
    if (satelliteInfoPanel) {
        satelliteInfoPanel.classList.add('hidden');
        satelliteInfoPanel.style.display = 'none';
    }

    // Highlight selected station
    mesh.material.color.setHex(COLORS.STATION_SELECTED);
    mesh.material.emissive.setHex(COLORS.STATION_SELECTED);
    mesh.material.emissiveIntensity = 1.2;
    mesh.scale.set(1.5, 1.5, 1.5);

    // Display station info
    displayStationInfo(mesh.userData);

    console.log('[Search] Station selected and info displayed');
}

/**
 * Initialize Search panel structure
 */
export function initSatelliteFinderPanel() {
    if (panelElement) {
        console.warn('Search panel already initialized');
        return panelElement;
    }
    
    // Create panel
    const panel = document.createElement('div');
    panel.className = 'panel panel-center hidden';
    panel.id = 'panel-satellite-finder';
    
    panel.innerHTML = `
        <div class="search-container" style="padding: var(--space-6);">
            <div class="form-group">
                <label class="form-label" for="unified-search-input">Search</label>
                <input 
                    type="search" 
                    id="unified-search-input" 
                    class="form-input" 
                    placeholder="Search satellites and ground stations..."
                    autocomplete="off"
                    aria-label="Search for satellites and ground stations">
                <span class="form-hint">Start typing to see results</span>
            </div>
            
            <!-- Search Results -->
            <div id="search-results" class="hidden" style="margin-top: var(--space-4);">
                <h4 style="margin: 0 0 var(--space-3); color: var(--text-secondary); font-size: var(--font-size-sm);">
                    Results (<span id="results-count">0</span>)
                </h4>
                <ul class="panel-list" id="search-results-list" style="max-height: 400px; overflow-y: auto;">
                    <!-- Results will be populated here -->
                </ul>
            </div>
            
            <!-- Empty State -->
            <div id="search-empty" style="margin-top: var(--space-6); text-align: center; padding: var(--space-8);">
                <p style="color: var(--text-secondary);">Start typing to search for satellites and ground stations</p>
            </div>
            
            <!-- Close Button -->
            <div style="margin-top: var(--space-6); text-align: center;">
                <button id="btn-close-finder" class="btn btn-secondary">Close</button>
            </div>
        </div>
    `;
    
    // Append to body
    document.body.appendChild(panel);
    
    // Setup search input handler
    const searchInput = panel.querySelector('#unified-search-input');
    const searchEmpty = panel.querySelector('#search-empty');
    const searchResults = panel.querySelector('#search-results');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Show/hide empty state
            if (query.trim().length === 0) {
                searchEmpty.classList.remove('hidden');
                searchResults.classList.add('hidden');
                return;
            }
            
            searchEmpty.classList.add('hidden');
            
            // Debounce search (update on every letter but with small delay)
            searchTimeout = setTimeout(() => {
                const results = searchItems(query);
                renderSearchResults(results);
            }, 50); // Very short delay for responsiveness
        });

        // Handle Enter key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value;
                if (query.trim().length > 0) {
                    const results = searchItems(query);
                    if (results.satellites.length > 0) {
                        selectSatellite(results.satellites[0]);
                    } else if (results.stations.length > 0) {
                        selectStation(results.stations[0]);
                    }
                }
            }
        });
    }
    
    // Close button
    const closeBtn = panel.querySelector('#btn-close-finder');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            hideSatelliteFinderPanel();
        });
    }
    
    // ESC key to close
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
            hideSatelliteFinderPanel();
        }
    });
    
    panelElement = panel;
    console.log('✓ Unified Search panel structure initialized');
    
    return panel;
}

/**
 * Show the panel
 */
export function showSatelliteFinderPanel() {
    if (panelElement) {
        panelElement.classList.remove('hidden');
        // Focus on search input
        const searchInput = panelElement.querySelector('#unified-search-input');
        if (searchInput) {
            setTimeout(() => {
                searchInput.focus();
                searchInput.select();
            }, 100);
        }
    }
}

/**
 * Hide the panel
 */
export function hideSatelliteFinderPanel() {
    if (panelElement) {
        panelElement.classList.add('hidden');
        // Clear search input
        const searchInput = panelElement.querySelector('#unified-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        // Hide results
        const searchResults = panelElement.querySelector('#search-results');
        if (searchResults) {
            searchResults.classList.add('hidden');
        }
        const searchEmpty = panelElement.querySelector('#search-empty');
        if (searchEmpty) {
            searchEmpty.classList.remove('hidden');
        }
    }
}

/**
 * Get panel element
 */
export function getSatelliteFinderPanel() {
    return panelElement;
}
