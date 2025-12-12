// ============================================
// SATELLITE INTERACTION
// ============================================

import { updateMousePosition } from './coordinates.js';
import { showOrbitPath, removeOrbitLine } from './orbitalPath.js';

let selectedSatellite = null;
let hoveredSatellite = null;

/**
 * Reset satellite appearance to default
 */
function resetSatelliteAppearance(satelliteMesh) {
    if (satelliteMesh) {
        satelliteMesh.scale.set(1, 1, 1);
        satelliteMesh.material.emissiveIntensity = 0.9;
    }
}

/**
 * Highlight satellite (for selection)
 */
function highlightSatellite(satelliteMesh) {
    if (satelliteMesh) {
        satelliteMesh.scale.set(1.5, 1.5, 1.5);
        satelliteMesh.material.emissiveIntensity = 1.4;
    }
}

/**
 * Handle satellite click
 */
export function onSatelliteClick(event, mouse, raycaster, camera, satelliteMeshes) {
    // Note: Drag detection already done in onStationClick
    // This function is called from onStationClick when a satellite is detected
    
    updateMousePosition(event, mouse, event.target);
    raycaster.setFromCamera(mouse, camera);
    
    // Check satellites
    const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes);
    
    if (satelliteIntersects.length > 0) {
        const clickedMesh = satelliteIntersects[0].object;
        
        console.log('Satellite selected:', clickedMesh.userData.satelliteName);
        
        // Reset previous selection
        if (selectedSatellite && selectedSatellite !== clickedMesh) {
            resetSatelliteAppearance(selectedSatellite);
        }
        
        // Toggle selection
        if (selectedSatellite === clickedMesh) {
            // Deselect
            console.log('Deselecting satellite');
            resetSatelliteAppearance(selectedSatellite);
            selectedSatellite = null;
            removeOrbitLine();
            hideSatelliteInfo();
        } else {
            // Select new satellite
            console.log('Selecting new satellite');
            selectedSatellite = clickedMesh;
            highlightSatellite(selectedSatellite);
            
            // Show orbital path (brighter color for selected)
            console.log('Showing orbital path for:', clickedMesh.userData.satelliteName);
            showOrbitPath(selectedSatellite, true);
            
            // Display satellite info
            displaySatelliteInfo(selectedSatellite.userData);
        }
    }
}

/**
 * Handle satellite hover
 */
export function onSatelliteHover(event, mouse, raycaster, camera, satelliteMeshes, renderer) {
    updateMousePosition(event, mouse, event.target);
    raycaster.setFromCamera(mouse, camera);
    
    const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes);
    
    // Reset previous hover if different satellite
    if (hoveredSatellite && (satelliteIntersects.length === 0 || satelliteIntersects[0].object !== hoveredSatellite)) {
        // Only reset if not selected
        if (hoveredSatellite !== selectedSatellite) {
            resetSatelliteAppearance(hoveredSatellite);
            removeOrbitLine();
        }
        hoveredSatellite = null;
    }
    
    if (satelliteIntersects.length > 0) {
        const mesh = satelliteIntersects[0].object;
        
        // Don't apply hover effect to selected satellite
        if (mesh !== selectedSatellite) {
            renderer.domElement.style.cursor = 'pointer';
            
            // Scale up and brighten
            mesh.scale.set(1.3, 1.3, 1.3);
            mesh.material.emissiveIntensity = 1.2;
            
            // Show orbital path (gray)
            if (mesh !== hoveredSatellite) {
                showOrbitPath(mesh, false);
            }
            
            hoveredSatellite = mesh;
        } else {
            renderer.domElement.style.cursor = 'pointer';
        }
    } else {
        // Not hovering over any satellite
        if (!selectedSatellite) {
            renderer.domElement.style.cursor = 'default';
        }
    }
}

/**
 * Display satellite information panel
 */
function displaySatelliteInfo(satelliteData) {
    const panel = document.getElementById('satellite-info');
    if (!panel) {
        console.error('Satellite info panel not found');
        return;
    }
    
    // Update panel content
    document.getElementById('sat-name').textContent = satelliteData.satelliteName;
    document.getElementById('sat-orbit-type').textContent = satelliteData.orbitType;
    document.getElementById('sat-altitude').textContent = satelliteData.altitude.toFixed(2) + ' km';
    document.getElementById('sat-velocity').textContent = satelliteData.velocity.toFixed(2) + ' km/s';
    document.getElementById('sat-latitude').textContent = satelliteData.latitude.toFixed(4) + '°';
    document.getElementById('sat-longitude').textContent = satelliteData.longitude.toFixed(4) + '°';
    
    // Show panel
    panel.classList.remove('hidden');
    panel.style.display = 'block';
    
    console.log('✓ Displaying satellite info for:', satelliteData.satelliteName);
}

/**
 * Hide satellite information panel
 */
function hideSatelliteInfo() {
    const panel = document.getElementById('satellite-info');
    if (panel) {
        panel.classList.add('hidden');
        panel.style.display = 'none';
    }
}

/**
 * Setup satellite interaction event listeners
 */
export function setupSatelliteInteraction(renderer, mouse, raycaster, camera, satelliteMeshes) {
    // Add satellite-specific hover handler
    renderer.domElement.addEventListener('mousemove', (event) => {
        onSatelliteHover(event, mouse, raycaster, camera, satelliteMeshes, renderer);
    });
    
    // Click handler is integrated into onStationClick function
    // which checks satellites first before stations
    
    console.log('✓ Satellite interaction enabled');
}

/**
 * Setup satellite info panel close button handler
 */
export function setupSatelliteInfoPanelHandlers() {
    const closeBtn = document.getElementById('close-satellite-info');
    if (closeBtn) {
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            hideSatelliteInfo();
            
            // Deselect satellite
            if (selectedSatellite) {
                resetSatelliteAppearance(selectedSatellite);
                selectedSatellite = null;
                removeOrbitLine();
            }
        });
        console.log('✓ Satellite info panel close button initialized');
    }
}

/**
 * Get selected satellite
 */
export function getSelectedSatellite() {
    return selectedSatellite;
}

/**
 * Get hovered satellite
 */
export function getHoveredSatellite() {
    return hoveredSatellite;
}

