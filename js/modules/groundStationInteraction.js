import * as THREE from 'three';
// Listen for globe click mode activation from the UI/modal
if (typeof window !== 'undefined') {
    window.addEventListener('activate-globe-click-mode', () => {
        // You must provide references to your globe, camera, and renderer here
        // Example: activateGlobeClickMode(globe, camera, renderer);
        if (window.__globe && window.__camera && window.__renderer) {
            activateGlobeClickMode(window.__globe, window.__camera, window.__renderer);
            console.log('[GroundStation] Globe click mode started');
        } else {
            console.warn('[GroundStation] Globe, camera, or renderer not found on window');
        }
    });
}
import { toLatLon } from './coordinates.js';

// Activate globe click mode for selecting a ground station location
export function activateGlobeClickMode(globe, camera, renderer) {
    // Show tooltip or message
    const tooltip = document.createElement('div');
    tooltip.id = 'globe-click-tooltip';
    tooltip.textContent = 'Click on the globe to select a location.';
    tooltip.style.position = 'fixed';
    tooltip.style.top = '20px';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.background = 'rgba(0,0,0,0.8)';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '8px 16px';
    tooltip.style.borderRadius = '8px';
    tooltip.style.zIndex = 10000;
    document.body.appendChild(tooltip);

    function onGlobeClick(event) {
        // Only handle left click
        if (event.button !== 0) return;
        // Convert screen to normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        const mouse = {
            x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };
        // Raycast to globe
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(globe, true);
        if (intersects.length > 0) {
            const point = intersects[0].point;
            // Convert 3D point to lat/lon
            const { lat, lon } = toLatLon(point);
            // Dispatch event with lat/lon
            window.dispatchEvent(new CustomEvent('station-location-selected', { detail: { lat, lon } }));
            cleanup();
        }
    }
    function onEsc(event) {
        if (event.key === 'Escape') {
            cleanup();
        }
    }
    function cleanup() {
        renderer.domElement.removeEventListener('click', onGlobeClick);
        window.removeEventListener('keydown', onEsc);
        if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
    }
    renderer.domElement.addEventListener('click', onGlobeClick);
    window.addEventListener('keydown', onEsc);
}
// ============================================
// GROUND STATION INTERACTION (Rewritten Option C)
// ============================================

import { COLORS } from './constants.js';
import { updateMousePosition } from './coordinates.js';
import { getStationMeshes } from './groundStationRenderer.js';
import { getSatelliteMeshes } from './satelliteRenderer.js';

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
        // Get fresh meshes arrays to include newly added stations and satellites
        const currentStationMeshes = getStationMeshes();
        const currentSatelliteMeshes = getSatelliteMeshes();
        onStationClick(
            event,
            mouse,
            raycaster,
            camera,
            currentStationMeshes,
            currentSatelliteMeshes,
            onSatelliteClick
        );
    });

    // Hover handler (using your unified function)
    if (onCombinedHover && onSatelliteHover) {
        renderer.domElement.addEventListener('mousemove', (event) => {
            // Get fresh meshes arrays to include newly added stations and satellites
            const currentStationMeshes = getStationMeshes();
            const currentSatelliteMeshes = getSatelliteMeshes();
            onCombinedHover(
                event,
                mouse,
                raycaster,
                camera,
                currentStationMeshes,
                currentSatelliteMeshes,
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
