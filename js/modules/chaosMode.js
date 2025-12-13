// ============================================
// CHAOS MODE - Fun Animation Mode
// Makes everything go crazy!
// ============================================

import { getEarth, switchToVideoTexture, restoreOriginalTexture } from './earth.js';
import { getStationMeshes } from './groundStationRenderer.js';
import { getSatelliteMeshes } from './satelliteRenderer.js';
import { calculateOrbitPath, createOrbitLine } from './orbitalPath.js';
import { getSatelliteRecords } from './satelliteData.js';

let isChaosModeActive = false;
let animationFrameId = null;
let chaosStartTime = 0;
let lastTeleportTime = 0;
const TELEPORT_INTERVAL = 2000; // Teleport every 2 seconds

// Store original states for restoration
const originalButtonStates = new Map();
const originalSatellitePositions = new Map();
const originalStationRotations = new Map();
const originalCameraPosition = { x: 0, y: 0, z: 0 };
const originalEarthRotation = { x: 0, y: 0, z: 0 };
const chaosOrbitLines = []; // Store all orbit lines for chaos mode
const satelliteOrbitPaths = new Map(); // Store orbit paths for each satellite

/**
 * Get all control panel buttons except the chaos button
 */
function getAllButtonsExceptChaos() {
    const controlPanel = document.getElementById('control-panel');
    if (!controlPanel) {
        console.warn('[ChaosMode] Control panel not found');
        return [];
    }
    
    // Get all buttons from all sections
    const leftSection = document.getElementById('control-panel-left');
    const centerSection = document.getElementById('control-panel-center');
    const rightSection = document.getElementById('control-panel-right');
    
    let buttons = [];
    
    if (leftSection) {
        buttons = buttons.concat(Array.from(leftSection.querySelectorAll('.control-btn')));
    }
    if (centerSection) {
        buttons = buttons.concat(Array.from(centerSection.querySelectorAll('.control-btn')));
    }
    if (rightSection) {
        buttons = buttons.concat(Array.from(rightSection.querySelectorAll('.control-btn')));
    }
    
    // Also try direct query on control panel as fallback
    if (buttons.length === 0) {
        buttons = Array.from(controlPanel.querySelectorAll('.control-btn'));
    }
    
    // Exclude the chaos mode button
    const filtered = buttons.filter(btn => btn && btn.id !== 'btn-chaos-mode');
    
    console.log(`[ChaosMode] Found ${filtered.length} buttons to animate`);
    return filtered;
}

/**
 * Store original button positions and sizes
 */
function storeOriginalButtonStates() {
    const buttons = getAllButtonsExceptChaos();
    buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        originalButtonStates.set(button, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            transform: button.style.transform || '',
            position: button.style.position || '',
            zIndex: button.style.zIndex || ''
        });
    });
}

/**
 * Store original satellite positions and calculate orbit paths
 */
function storeOriginalSatellitePositions() {
    const satelliteMeshes = getSatelliteMeshes();
    satelliteMeshes.forEach((mesh, index) => {
        originalSatellitePositions.set(mesh, {
            position: mesh.position.clone(),
            scale: mesh.scale.clone()
        });
        
        // Calculate and store orbit path for oscillation
        const orbitPath = calculateOrbitPath(mesh);
        if (orbitPath && orbitPath.length > 0) {
            satelliteOrbitPaths.set(mesh, orbitPath);
        }
    });
}

/**
 * Store original station rotations
 */
function storeOriginalStationRotations() {
    const stationMeshes = getStationMeshes();
    stationMeshes.forEach(mesh => {
        originalStationRotations.set(mesh, {
            rotation: mesh.rotation.clone()
        });
    });
}

/**
 * Restore original button states
 */
function restoreButtonStates() {
    originalButtonStates.forEach((original, button) => {
        button.style.position = original.position;
        button.style.left = '';
        button.style.top = '';
        button.style.transform = original.transform;
        button.style.zIndex = original.zIndex;
    });
    originalButtonStates.clear();
}

/**
 * Restore original satellite positions
 */
function restoreSatellitePositions() {
    originalSatellitePositions.forEach((original, mesh) => {
        mesh.position.copy(original.position);
        mesh.scale.copy(original.scale);
    });
    originalSatellitePositions.clear();
    satelliteOrbitPaths.clear();
}

/**
 * Restore original station rotations
 */
function restoreStationRotations() {
    originalStationRotations.forEach((original, mesh) => {
        mesh.rotation.copy(original.rotation);
    });
    originalStationRotations.clear();
}

/**
 * Show all satellite orbits
 */
function showAllOrbits() {
    if (!window.scene) return;
    
    // Clear existing chaos orbit lines
    chaosOrbitLines.forEach(line => {
        if (window.scene) {
            window.scene.remove(line);
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        }
    });
    chaosOrbitLines.length = 0;
    
    // Show orbit for each satellite
    const satelliteMeshes = getSatelliteMeshes();
    satelliteMeshes.forEach(mesh => {
        const orbitPath = satelliteOrbitPaths.get(mesh);
        if (orbitPath && orbitPath.length > 0) {
            const orbitLine = createOrbitLine(orbitPath, false);
            if (orbitLine && window.scene) {
                orbitLine.userData.isChaosOrbit = true;
                window.scene.add(orbitLine);
                chaosOrbitLines.push(orbitLine);
            }
        }
    });
}

/**
 * Remove all chaos orbit lines
 */
function removeAllOrbits() {
    if (!window.scene) return;
    
    chaosOrbitLines.forEach(line => {
        if (window.scene) {
            window.scene.remove(line);
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        }
    });
    chaosOrbitLines.length = 0;
}

/**
 * Teleport camera to random position
 */
function teleportCamera() {
    if (!window.camera) return;
    
    // Store original position on first teleport
    if (originalCameraPosition.x === 0 && originalCameraPosition.y === 0 && originalCameraPosition.z === 0) {
        originalCameraPosition.x = window.camera.position.x;
        originalCameraPosition.y = window.camera.position.y;
        originalCameraPosition.z = window.camera.position.z;
    }
    
    // Random spherical coordinates
    const radius = 3 + Math.random() * 4; // Distance from center (3-7)
    const theta = Math.random() * Math.PI * 2; // Azimuth (0 to 2π)
    const phi = Math.PI / 4 + Math.random() * Math.PI / 2; // Polar angle (π/4 to 3π/4)
    
    // Convert to Cartesian
    window.camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
    window.camera.position.y = radius * Math.cos(phi);
    window.camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
    
    // Look at center
    window.camera.lookAt(0, 0, 0);
    
    // Update controls if available
    if (window.controls) {
        window.controls.update();
    }
}

/**
 * Chaos mode animation loop
 */
function chaosAnimation() {
    if (!isChaosModeActive) return;
    
    const time = (Date.now() - chaosStartTime) / 1000; // Time in seconds
    
    // Earth rotation is stopped in chaos mode - video texture handles animation
    // The Earth is rotated to align the video properly when chaos mode starts
    // Update video texture to ensure it renders
    if (window.videoTexture) {
        window.videoTexture.needsUpdate = true;
    }
    
    // Rotate ground stations
    const stationMeshes = getStationMeshes();
    stationMeshes.forEach(mesh => {
        mesh.rotation.x += 0.15;
        mesh.rotation.y += 0.2;
        mesh.rotation.z += 0.1;
    });
    
    // Oscillate satellites along their entire orbital path (to and fro)
    const satelliteMeshes = getSatelliteMeshes();
    satelliteMeshes.forEach((mesh, index) => {
        const orbitPath = satelliteOrbitPaths.get(mesh);
        const original = originalSatellitePositions.get(mesh);
        
        if (orbitPath && orbitPath.length > 0 && original) {
            // Oscillate along the entire orbit path
            // Use sine wave to move forward and backward along the path
            const pathLength = orbitPath.length;
            const oscillation = Math.sin(time * 2 + index * 0.5); // -1 to 1
            const normalizedOscillation = (oscillation + 1) / 2; // 0 to 1
            
            // Map oscillation to path index (move along entire path)
            const pathIndex = Math.floor(normalizedOscillation * (pathLength - 1));
            const nextIndex = Math.min(pathIndex + 1, pathLength - 1);
            const t = (normalizedOscillation * (pathLength - 1)) % 1;
            
            // Interpolate between two path points
            const point1 = orbitPath[pathIndex];
            const nextPoint = orbitPath[nextIndex];
            if (point1 && nextPoint) {
                mesh.position.lerpVectors(point1, nextPoint, t);
            }
        } else if (original) {
            // Fallback: oscillate along radial direction
            const oscillation = Math.sin(time * 4 + index * 0.5) * 0.5; // Larger oscillation
            const direction = original.position.clone().normalize();
            mesh.position.copy(original.position);
            mesh.position.add(direction.multiplyScalar(oscillation));
        }
        
        // Also add some rotation
        mesh.rotation.x += 0.1;
        mesh.rotation.y += 0.15;
    });
    
    // Animate UI buttons - float around and resize
    const buttons = getAllButtonsExceptChaos();
    if (buttons.length > 0) {
        buttons.forEach((button, index) => {
            if (!button || !button.parentElement) return; // Skip if button was removed
            
            // Floating animation (circular motion)
            const floatRadius = 30 + Math.sin(time * 2 + index) * 10;
            const floatX = Math.cos(time * 1.5 + index * 0.5) * floatRadius;
            const floatY = Math.sin(time * 1.5 + index * 0.5) * floatRadius;
            
            // Size oscillation (50% variation)
            const sizeVariation = 0.5 + Math.sin(time * 3 + index * 0.3) * 0.25; // 0.5 to 0.75 (50% to 75%)
            const original = originalButtonStates.get(button);
            if (original) {
                // Ensure button is visible
                button.style.position = 'fixed';
                const newLeft = Math.max(0, Math.min(window.innerWidth - original.width, original.left + floatX));
                const newTop = Math.max(0, Math.min(window.innerHeight - original.height, original.top + floatY));
                button.style.left = newLeft + 'px';
                button.style.top = newTop + 'px';
                button.style.transform = `scale(${sizeVariation})`;
                button.style.zIndex = '99999'; // Very high z-index to ensure visibility
                button.style.visibility = 'visible';
                button.style.opacity = '1';
                button.style.pointerEvents = 'auto'; // Ensure buttons are clickable
            }
        });
    }
    
    // Teleport camera randomly
    const now = Date.now();
    if (now - lastTeleportTime > TELEPORT_INTERVAL) {
        teleportCamera();
        lastTeleportTime = now;
    }
    
    animationFrameId = requestAnimationFrame(chaosAnimation);
}

/**
 * Activate chaos mode
 */
export function activateChaosMode() {
    if (isChaosModeActive) {
        console.log('[ChaosMode] Already active');
        return;
    }
    
    console.log('[ChaosMode] Activating chaos mode!');
    isChaosModeActive = true;
    chaosStartTime = Date.now();
    lastTeleportTime = Date.now();
    
    // Store original states
    storeOriginalButtonStates();
    storeOriginalSatellitePositions();
    storeOriginalStationRotations();
    
    // Store original camera position
    if (window.camera) {
        originalCameraPosition.x = window.camera.position.x;
        originalCameraPosition.y = window.camera.position.y;
        originalCameraPosition.z = window.camera.position.z;
    }
    
    // Store original Earth rotation
    const earth = getEarth();
    if (earth) {
        originalEarthRotation.x = earth.rotation.x;
        originalEarthRotation.y = earth.rotation.y;
        originalEarthRotation.z = earth.rotation.z;
        
        // Rotate Earth to align video properly (rotate on Y axis to center video)
        // Adjust this value to align the video correctly
        earth.rotation.y = Math.PI; // 180 degrees rotation to align video
        earth.rotation.x = 0; // Keep X rotation at 0 for straight alignment
    }
    
    // Switch Earth texture to video
    switchToVideoTexture('./assets/rickroll.mp4');
    
    // Show all orbits
    showAllOrbits();
    
    // Start animation loop
    chaosAnimation();
}

/**
 * Deactivate chaos mode and restore everything
 */
export function deactivateChaosMode() {
    if (!isChaosModeActive) {
        console.log('[ChaosMode] Already inactive');
        return;
    }
    
    console.log('[ChaosMode] Deactivating chaos mode, restoring order...');
    isChaosModeActive = false;
    
    // Cancel animation loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    
    // Remove all orbit lines
    removeAllOrbits();
    
    // Restore Earth texture
    restoreOriginalTexture();
    
    // Restore everything
    restoreButtonStates();
    restoreSatellitePositions();
    restoreStationRotations();
    
    // Restore camera position
    if (window.camera && originalCameraPosition) {
        window.camera.position.x = originalCameraPosition.x;
        window.camera.position.y = originalCameraPosition.y;
        window.camera.position.z = originalCameraPosition.z;
        window.camera.lookAt(0, 0, 0);
        if (window.controls) {
            window.controls.update();
        }
    }
    
    // Restore Earth rotation
    const earth = getEarth();
    if (earth && originalEarthRotation) {
        earth.rotation.x = originalEarthRotation.x;
        earth.rotation.y = originalEarthRotation.y;
        earth.rotation.z = originalEarthRotation.z;
    }
    
    console.log('[ChaosMode] Order restored!');
}

/**
 * Toggle chaos mode
 */
export function toggleChaosMode() {
    if (isChaosModeActive) {
        deactivateChaosMode();
    } else {
        activateChaosMode();
    }
    return isChaosModeActive;
}

/**
 * Check if chaos mode is active
 */
export function getChaosModeState() {
    return isChaosModeActive;
}

