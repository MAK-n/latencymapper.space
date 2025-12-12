// ============================================
// GROUND STATION INTERACTION (Rewritten Option C)
// ============================================

import { CONFIG, COLORS } from './constants.js';
import { updateMousePosition } from './coordinates.js';

let selectedStation = null;
let mouseDownPos = { x: 0, y: 0 };
let mouseUpPos = { x: 0, y: 0 };

/**
 * Mouse Down
 */
function onMouseDown(event) {
    mouseDownPos.x = event.clientX;
    mouseDownPos.y = event.clientY;
}

/**
 * Handle Click — using Option C:
 * Decide based on *nearest* intersected object (station or satellite)
 */
function onStationClick(
    event,
    mouse,
    raycaster,
    camera,
    stationMeshes,
    satelliteMeshes,
    onSatelliteClick
) {
    mouseUpPos.x = event.clientX;
    mouseUpPos.y = event.clientY;

    // Detect drag (threshold 15px)
    const dx = mouseUpPos.x - mouseDownPos.x;
    const dy = mouseUpPos.y - mouseDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 15) return;

    // Update mouse for raycasting
    updateMousePosition(event, mouse, event.target);
    raycaster.setFromCamera(mouse, camera);

    // Intersections
    const stationIntersects = raycaster.intersectObjects(stationMeshes, true);
    const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes, true);

    // Combine + sort by distance to camera
    const combined = [...stationIntersects, ...satelliteIntersects];
    if (combined.length === 0) {
        resetSelection();
        hideStationInfo();
        return;
    }

    const nearest = combined.sort((a, b) => a.distance - b.distance)[0];
    const clickedObj = nearest.object;

    // Determine type using mesh membership
    const isSatellite = satelliteMeshes.includes(clickedObj);
    const isStation = stationMeshes.includes(clickedObj);

    if (isSatellite) {
        onSatelliteClick(event);
        return;
    }

    if (isStation) {
        handleStationSelection(clickedObj);
        return;
    }

    // Fallback: clicked empty or helper object
    resetSelection();
    hideStationInfo();
}

/**
 * Select / Deselect Station Logic
 */
function handleStationSelection(clickedMesh) {
    const stationData = clickedMesh.userData;

    // Reset previously selected
    if (selectedStation && selectedStation !== clickedMesh) {
        resetStationVisuals(selectedStation);
    }

    // Toggle selection
    if (selectedStation === clickedMesh) {
        resetStationVisuals(selectedStation);
        hideStationInfo();
        selectedStation = null;
        return;
    }

    // Select new station
    selectedStation = clickedMesh;

    // Apply highlight
    clickedMesh.material.color.setHex(COLORS.STATION_SELECTED);
    clickedMesh.material.emissive.setHex(COLORS.STATION_SELECTED);
    clickedMesh.material.emissiveIntensity = 1.2;
    clickedMesh.scale.set(1.5, 1.5, 1.5);

    displayStationInfo(stationData);
}

/**
 * Reset visuals of a station
 */
function resetStationVisuals(mesh) {
    mesh.material.color.setHex(COLORS.STATION_DEFAULT);
    mesh.material.emissive.setHex(COLORS.STATION_EMISSIVE);
    mesh.material.emissiveIntensity = 0.8;
    mesh.scale.set(1, 1, 1);
}

/**
 * Reset current selection
 */
function resetSelection() {
    if (selectedStation) {
        resetStationVisuals(selectedStation);
        selectedStation = null;
    }
}

/**
 * Display Info Panel
 */
function displayStationInfo(stationData) {
    const panel = document.getElementById('station-info');
    if (!panel) return;

    // Update HTML fields
    const nameEl = document.getElementById('station-name');
    const latEl = document.getElementById('station-lat');
    const lonEl = document.getElementById('station-lon');
    const elevEl = document.getElementById('station-elevation');
    const typeEl = document.getElementById('station-type');

    if (nameEl) nameEl.textContent = stationData.stationName;
    if (latEl) latEl.textContent = stationData.latitude.toFixed(2) + '°';
    if (lonEl) lonEl.textContent = stationData.longitude.toFixed(2) + '°';
    if (elevEl) elevEl.textContent = stationData.elevation + ' m';
    if (typeEl) typeEl.textContent = stationData.type;

    panel.classList.remove('hidden');
    panel.style.display = 'block';
}

/**
 * Hide Info Panel
 */
function hideStationInfo() {
    const panel = document.getElementById('station-info');
    if (panel) {
        panel.classList.add('hidden');
        panel.style.display = 'none';
    }
}

// -------- Listener Guard --------
let listenersSetUp = false;

/**
 * Setup Interaction
 */
export function setupStationInteraction(
    renderer,
    mouse,
    raycaster,
    camera,
    stationMeshes,
    satelliteMeshes,
    onSatelliteClick,
    onCombinedHover,
    onSatelliteHover
) {
    if (listenersSetUp) return;

    renderer.domElement.addEventListener('mousedown', onMouseDown);

    renderer.domElement.addEventListener('click', (event) => {
        onStationClick(
            event,
            mouse,
            raycaster,
            camera,
            stationMeshes,
            satelliteMeshes,
            onSatelliteClick
        );
    });

    // Hover handler (using your unified function)
    if (onCombinedHover && onSatelliteHover) {
        renderer.domElement.addEventListener('mousemove', (event) => {
            onCombinedHover(
                event,
                mouse,
                raycaster,
                camera,
                stationMeshes,
                satelliteMeshes,
                renderer,
                onSatelliteHover,
                null
            );
        });
    }

    listenersSetUp = true;
}

/**
 * Info panel close button
 */
export function setupInfoPanelHandlers() {
    const closeBtn = document.getElementById('close-station-info');
    if (!closeBtn) return;

    closeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        hideStationInfo();
        resetSelection();
    });

    console.log('✓ Info panel close button initialized');
}

/**
 * Getter
 */
export function getSelectedStation() {
    return selectedStation;
}
