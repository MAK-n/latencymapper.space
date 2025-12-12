// ============================================
// COORDINATE CONVERSION UTILITIES
// ============================================

import { CONFIG } from './constants.js';

/**
 * Convert latitude/longitude coordinates to 3D position on sphere
 * @param {number} lat - Latitude in degrees
 * @param {number} lon - Longitude in degrees
 * @param {number} radius - Sphere radius (default: EARTH_RADIUS)
 * @returns {THREE.Vector3} 3D position
 */
export function latLonToVector3(lat, lon, radius = CONFIG.EARTH_RADIUS) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
}

/**
 * Convert satellite geodetic position (lat/lon/alt) to 3D position on globe
 * @param {number} latitude - Latitude in degrees
 * @param {number} longitude - Longitude in degrees
 * @param {number} altitude - Altitude in kilometers
 * @returns {THREE.Vector3} 3D position scaled to globe
 */
export function satellitePositionToVector3(latitude, longitude, altitude) {
    // Convert altitude to globe scale
    // Scale factor: altitude relative to Earth radius
    const altitudeScale = altitude / CONFIG.EARTH_RADIUS_KM;
    const radius = CONFIG.EARTH_RADIUS * (1 + altitudeScale);
    
    // Convert to 3D coordinates
    return latLonToVector3(latitude, longitude, radius);
}

/**
 * Update mouse position from event
 * @param {MouseEvent} event - Mouse event
 * @param {THREE.Vector2} mouse - Mouse vector to update
 * @param {HTMLCanvasElement} canvas - Canvas element
 */
export function updateMousePosition(event, mouse, canvas) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

