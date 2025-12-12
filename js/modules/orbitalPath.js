// ============================================
// ORBITAL PATH CALCULATION AND RENDERING
// ============================================

import { CONFIG, COLORS } from './constants.js';
import { satellitePositionToVector3 } from './coordinates.js';
import { propagateSatellitePosition, getSatelliteRecords } from './satelliteData.js';

let currentOrbitLine = null;
let orbitPathCache = new Map();
let scene = null;

/**
 * Initialize orbital path module with scene reference
 */
export function initOrbitalPath(sceneRef) {
    scene = sceneRef;
}

/**
 * Calculate orbital path for a satellite
 */
export function calculateOrbitPath(satelliteMesh) {
    const satelliteRecords = getSatelliteRecords();
    const satRecord = satelliteRecords.find(rec => rec.name === satelliteMesh.userData.satelliteName);
    
    if (!satRecord || !satRecord.satrec) {
        console.warn('Cannot calculate orbit: satellite record not found');
        return null;
    }
    
    // Check cache first
    const cacheKey = satelliteMesh.userData.satelliteName;
    if (orbitPathCache.has(cacheKey)) {
        return orbitPathCache.get(cacheKey);
    }
    
    const orbitType = satelliteMesh.userData.orbitType;
    const currentTime = new Date();
    
    // Determine orbit period and number of points based on orbit type
    const orbitPeriodMinutes = CONFIG.ORBIT_PERIODS[orbitType] || CONFIG.ORBIT_PERIODS.LEO;
    const numPoints = CONFIG.ORBIT_SAMPLES[orbitType] || CONFIG.ORBIT_SAMPLES.LEO;
    
    const timeStepMinutes = orbitPeriodMinutes / numPoints;
    const points = [];
    
    // Propagate satellite positions over the orbit period
    for (let i = 0; i <= numPoints; i++) {
        const timeOffset = i * timeStepMinutes * 60 * 1000; // Convert to milliseconds
        const sampleTime = new Date(currentTime.getTime() + timeOffset);
        
        // Propagate satellite position to get geodetic coordinates
        const position = propagateSatellitePosition(satRecord, sampleTime);
        
        if (position) {
            // Convert geodetic coordinates to 3D position on the globe
            const point3D = satellitePositionToVector3(
                position.latitude,
                position.longitude,
                position.altitude
            );
            points.push(point3D);
        }
    }
    
    // Cache the calculated path
    if (points.length > 0) {
        orbitPathCache.set(cacheKey, points);
        console.log(`Calculated orbit path: ${points.length} points for ${satelliteMesh.userData.satelliteName} (${orbitType})`);
    }
    
    return points.length > 0 ? points : null;
}

/**
 * Create orbital path line using BufferGeometry
 */
export function createOrbitLine(points, isSelected = false) {
    if (!points || points.length < 2) return null;
    
    // Pack ECF xyz triplets into Float32Array for efficient rendering
    const positions = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
        positions[i * 3] = points[i].x;
        positions[i * 3 + 1] = points[i].y;
        positions[i * 3 + 2] = points[i].z;
    }
    
    // Create BufferGeometry with BufferAttribute
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    
    // Use theme colors: gray for hover, brighter for selected
    const color = isSelected ? COLORS.ORBIT_SELECTED : COLORS.ORBIT_HOVER;
    const opacity = isSelected ? 0.85 : 0.65;
    
    // Create LineBasicMaterial
    const material = new THREE.LineBasicMaterial({
        color: color,
        opacity: opacity,
        transparent: true,
        linewidth: 2
    });
    
    // Create Line
    const line = new THREE.Line(geometry, material);
    
    // Store metadata for potential updates
    line.userData.isBufferGeometry = true;
    line.userData.pointCount = points.length;
    
    return line;
}

/**
 * Remove current orbital path from scene
 */
export function removeOrbitLine() {
    if (currentOrbitLine && scene) {
        scene.remove(currentOrbitLine);
        
        // Dispose geometry and material to free memory
        if (currentOrbitLine.geometry) {
            currentOrbitLine.geometry.dispose();
        }
        if (currentOrbitLine.material) {
            currentOrbitLine.material.dispose();
        }
        
        currentOrbitLine = null;
    }
}

/**
 * Show orbital path for a satellite
 */
export function showOrbitPath(satelliteMesh, isSelected = false) {
    if (!scene) {
        console.error('Scene not initialized for orbital path');
        return;
    }
    
    console.log('showOrbitPath called for:', satelliteMesh.userData.satelliteName, 'isSelected:', isSelected);
    
    // Remove existing path first
    removeOrbitLine();
    
    // Calculate orbital path
    const points = calculateOrbitPath(satelliteMesh);
    console.log('Calculated orbit points:', points ? points.length : 0);
    
    if (points) {
        // Create and add orbit line to scene
        currentOrbitLine = createOrbitLine(points, isSelected);
        if (currentOrbitLine) {
            currentOrbitLine.userData.isHover = !isSelected;
            scene.add(currentOrbitLine);
            console.log('✓ Orbital path added to scene');
        } else {
            console.warn('Failed to create orbit line');
        }
    } else {
        console.warn('No orbit points calculated');
    }
}

/**
 * Clear orbit path cache
 */
export function clearOrbitCache() {
    orbitPathCache.clear();
    console.log('✓ Orbit path cache cleared');
}

/**
 * Get current orbit line
 */
export function getCurrentOrbitLine() {
    return currentOrbitLine;
}

