// ============================================
// GROUND STATION INTERACTION
// ============================================

import { CONFIG, COLORS } from './constants.js';
import { updateMousePosition } from './coordinates.js';

let selectedStation = null;
let mouseDownPos = { x: 0, y: 0 };
let mouseUpPos = { x: 0, y: 0 };

/**
 * Handle mouse down event
 */
function onMouseDown(event) {
    mouseDownPos.x = event.clientX;
    mouseDownPos.y = event.clientY;
}

/**
 * Handle station click
 */
function onStationClick(event, mouse, raycaster, camera, stationMeshes, satelliteMeshes, onSatelliteClick) {
    event.stopPropagation();
    
    mouseUpPos.x = event.clientX;
    mouseUpPos.y = event.clientY;
    
    // Check for drag
    const dx = mouseUpPos.x - mouseDownPos.x;
    const dy = mouseUpPos.y - mouseDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > CONFIG.CLICK_THRESHOLD) {
        console.log('Drag detected, ignoring click');
        return;
    }
    
    // Update mouse position
    updateMousePosition(event, mouse, event.target);
    
    // Cast ray from camera through mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Check satellites first (Task 1.3.7.1)
    const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes);
    
    if (satelliteIntersects.length > 0) {
        // Satellite was clicked - handle it
        console.log('Satellite clicked, handling...');
        onSatelliteClick(event);
        return;
    }
    
    // Check for intersections with station meshes
    const intersects = raycaster.intersectObjects(stationMeshes);
    
    console.log('Click detected, intersects:', intersects.length);
    
    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const stationData = clickedMesh.userData;
        
        console.log('Station clicked:', stationData.stationName);
        
        // Reset previous selection completely
        if (selectedStation && selectedStation !== clickedMesh) {
            console.log('Resetting previous selection');
            selectedStation.material.color.setHex(COLORS.STATION_DEFAULT);
            selectedStation.material.emissive.setHex(COLORS.STATION_EMISSIVE);
            selectedStation.material.emissiveIntensity = 0.8;
            selectedStation.scale.set(1, 1, 1);
        }
        
        // Toggle selection
        if (selectedStation === clickedMesh) {
            // Deselect
            console.log('Deselecting current station');
            selectedStation.material.color.setHex(COLORS.STATION_DEFAULT);
            selectedStation.material.emissive.setHex(COLORS.STATION_EMISSIVE);
            selectedStation.material.emissiveIntensity = 0.8;
            selectedStation.scale.set(1, 1, 1);
            selectedStation = null;
            hideStationInfo();
        } else {
            // Select new station
            console.log('Selecting new station');
            selectedStation = clickedMesh;
            
            // Apply selection style
            selectedStation.material.color.setHex(COLORS.STATION_SELECTED);
            selectedStation.material.emissive.setHex(COLORS.STATION_SELECTED);
            selectedStation.material.emissiveIntensity = 1.2;
            selectedStation.scale.set(1.5, 1.5, 1.5);
            
            console.log(`Selected: ${stationData.stationName} (${stationData.latitude}°, ${stationData.longitude}°)`);
            
            // Display info panel
            console.log('Calling displayStationInfo...');
            displayStationInfo(stationData);
        }
    } else {
        // Clicked empty space
        console.log('Clicked empty space');
        if (selectedStation) {
            console.log('Deselecting station');
            selectedStation.material.color.setHex(COLORS.STATION_DEFAULT);
            selectedStation.material.emissive.setHex(COLORS.STATION_EMISSIVE);
            selectedStation.material.emissiveIntensity = 0.8;
            selectedStation.scale.set(1, 1, 1);
            selectedStation = null;
            hideStationInfo();
        }
    }
}

/**
 * Handle station hover
 */
function onStationHover(event, mouse, raycaster, camera, stationMeshes, renderer) {
    updateMousePosition(event, mouse, event.target);
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(stationMeshes);
    
    if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
    } else {
        renderer.domElement.style.cursor = 'default';
    }
}

/**
 * Display station information panel
 */
function displayStationInfo(stationData) {
    const panel = document.getElementById('station-info');
    if (!panel) {
        console.error('Station info panel not found');
        return;
    }
    
    console.log('displayStationInfo called with:', stationData);
    console.log('Panel element found:', panel);
    
    // Update panel content
    document.getElementById('station-name').textContent = stationData.stationName;
    document.getElementById('station-latitude').textContent = stationData.latitude.toFixed(2) + '°';
    document.getElementById('station-longitude').textContent = stationData.longitude.toFixed(2) + '°';
    document.getElementById('station-elevation').textContent = stationData.elevation + ' m';
    document.getElementById('station-type').textContent = stationData.type;
    
    // Show panel
    panel.classList.remove('hidden');
    panel.style.display = 'block';
    
    console.log('✓ Station info panel should now be visible');
    console.log('Panel classes:', panel.className);
    console.log('Panel display style:', panel.style.display);
}

/**
 * Hide station information panel
 */
function hideStationInfo() {
    const panel = document.getElementById('station-info');
    if (panel) {
        panel.classList.add('hidden');
        panel.style.display = 'none';
    }
    console.log('✓ Station info hidden');
}

/**
 * Setup station interaction event listeners
 */
export function setupStationInteraction(renderer, mouse, raycaster, camera, stationMeshes, satelliteMeshes, onSatelliteClick) {
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    
    renderer.domElement.addEventListener('click', (event) => {
        onStationClick(event, mouse, raycaster, camera, stationMeshes, satelliteMeshes, onSatelliteClick);
    });
    
    renderer.domElement.addEventListener('mousemove', (event) => {
        onStationHover(event, mouse, raycaster, camera, stationMeshes, renderer);
    });
    
    console.log('✓ Station interaction enabled');
}

/**
 * Setup info panel close button handler
 */
export function setupInfoPanelHandlers() {
    const closeBtn = document.getElementById('close-station-info');
    if (closeBtn) {
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            hideStationInfo();
            
            if (selectedStation) {
                selectedStation.material.color.setHex(COLORS.STATION_DEFAULT);
                selectedStation.material.emissive.setHex(COLORS.STATION_EMISSIVE);
                selectedStation.material.emissiveIntensity = 0.8;
                selectedStation.scale.set(1, 1, 1);
                selectedStation = null;
            }
        });
        console.log('✓ Info panel close button initialized');
    }
}

/**
 * Get selected station
 */
export function getSelectedStation() {
    return selectedStation;
}

