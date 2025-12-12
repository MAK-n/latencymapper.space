// ============================================
// COMBINED INTERACTION HANDLER
// Optimized single-pass raycasting for both stations and satellites
// ============================================

import { updateMousePosition } from './coordinates.js';

let lastMouseMoveTime = 0;
const THROTTLE_MS = 16; // ~60fps, only raycast every 16ms

/**
 * Combined hover handler for both stations and satellites
 * Uses single raycasting pass for performance
 */
export function onCombinedHover(event, mouse, raycaster, camera, stationMeshes, satelliteMeshes, renderer, onSatelliteHoverCallback, onStationHoverCallback) {
    // Throttle mousemove events for performance
    const now = Date.now();
    if (now - lastMouseMoveTime < THROTTLE_MS) {
        return;
    }
    lastMouseMoveTime = now;
    
    updateMousePosition(event, mouse, event.target);
    raycaster.setFromCamera(mouse, camera);
    
    // Single raycasting pass - check both satellites and stations
    const allMeshes = [...satelliteMeshes, ...stationMeshes];
    const intersects = raycaster.intersectObjects(allMeshes);
    
    if (intersects.length > 0) {
        const hoveredMesh = intersects[0].object;
        
        // Check if it's a satellite or station based on userData
        if (hoveredMesh.userData && hoveredMesh.userData.satelliteName) {
            // It's a satellite
            if (onSatelliteHoverCallback) {
                onSatelliteHoverCallback(hoveredMesh);
            }
            renderer.domElement.style.cursor = 'pointer';
        } else if (hoveredMesh.userData && hoveredMesh.userData.stationName) {
            // It's a station
            if (onStationHoverCallback) {
                onStationHoverCallback(hoveredMesh);
            }
            renderer.domElement.style.cursor = 'pointer';
        } else {
            renderer.domElement.style.cursor = 'default';
        }
    } else {
        renderer.domElement.style.cursor = 'default';
        
        // Clear hover states (pass null to clear)
        if (onSatelliteHoverCallback) {
            onSatelliteHoverCallback(null);
        }
        if (onStationHoverCallback) {
            onStationHoverCallback(null);
        }
    }
}

