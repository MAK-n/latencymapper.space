// ============================================
// SATELLITE POSITION UPDATER
// ============================================

import { CONFIG } from './constants.js';
import { satellitePositionToVector3 } from './coordinates.js';
import { propagateSatellitePosition, getSatelliteRecords } from './satelliteData.js';

let lastSatelliteUpdate = 0;
let satelliteTargetPositions = [];
let satelliteCurrentPositions = [];

/**
 * Initialize satellite records and propagate initial positions
 */
export async function initializeSatellites(satellites, initializeSatelliteRecord) {
    // Wait for satellite.js to be loaded
    if (typeof window.satellite === 'undefined') {
        console.warn('satellite.js not loaded. Waiting...');
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (typeof window.satellite === 'undefined') {
            console.error('satellite.js failed to load');
            return { records: [], targetPositions: [], currentPositions: [] };
        }
    }
    
    console.log('satellite.js loaded, initializing satellites...');
    console.log('Initializing satellite records and propagating positions...');
    
    const records = [];
    const targetPositions = [];
    const currentPositions = [];
    const currentTime = new Date();
    
    let orbitCounts = { LEO: 0, MEO: 0, GEO: 0 };
    
    for (const satellite of satellites) {
        const satRecord = initializeSatelliteRecord(satellite);
        
        if (satRecord) {
            const position = propagateSatellitePosition(satRecord, currentTime);
            
            if (position) {
                records.push(satRecord);
                targetPositions.push(position);
                currentPositions.push({ ...position });
                
                const orbitType = position.altitude < 2000 ? 'LEO' : 
                                 position.altitude < 35786 ? 'MEO' : 'GEO';
                orbitCounts[orbitType]++;
            }
        }
    }
    
    console.log(`✓ Successfully initialized ${records.length} out of ${satellites.length} satellites`);
    console.log(`Satellite orbit types: ${orbitCounts.LEO} LEO,  ${orbitCounts.MEO} MEO,  ${orbitCounts.GEO} GEO`);
    
    satelliteTargetPositions = targetPositions;
    satelliteCurrentPositions = currentPositions;
    lastSatelliteUpdate = Date.now();
    
    return { records, targetPositions, currentPositions };
}

/**
 * Propagate all satellites to current time
 */
export function propagateAllSatellites(satelliteRecords) {
    const currentTime = new Date();
    let updateCount = 0;
    
    satelliteRecords.forEach((satRecord, index) => {
        const position = propagateSatellitePosition(satRecord, currentTime);
        
        if (position) {
            satelliteTargetPositions[index] = position;
            updateCount++;
        }
    });
    
    return updateCount;
}

/**
 * Interpolate satellite positions for smooth animation
 */
export function interpolateSatellitePositions(satelliteMeshes) {
    satelliteMeshes.forEach((mesh, index) => {
        const target = satelliteTargetPositions[index];
        const current = satelliteCurrentPositions[index];
        
        if (!target || !current) return;
        
        // Interpolate lat/lon/alt
        current.latitude += (target.latitude - current.latitude) * CONFIG.INTERPOLATION_SPEED;
        current.longitude += (target.longitude - current.longitude) * CONFIG.INTERPOLATION_SPEED;
        current.altitude += (target.altitude - current.altitude) * CONFIG.INTERPOLATION_SPEED;
        current.velocity = target.velocity;
        
        // Update mesh position
        const newPosition = satellitePositionToVector3(
            current.latitude,
            current.longitude,
            current.altitude
        );
        mesh.position.copy(newPosition);
        
        // Update userData
        mesh.userData.latitude = current.latitude;
        mesh.userData.longitude = current.longitude;
        mesh.userData.altitude = current.altitude;
        mesh.userData.velocity = current.velocity;
    });
}

/**
 * Update satellite positions (call in animation loop)
 */
export function updateSatellitePositions(satelliteMeshes, satelliteRecords) {
    const currentTime = Date.now();
    
    // Check if we need to propagate new positions
    if (currentTime - lastSatelliteUpdate >= CONFIG.SATELLITE_UPDATE_INTERVAL) {
        const updateCount = propagateAllSatellites(satelliteRecords);
        lastSatelliteUpdate = currentTime;
    }
    
    // Interpolate positions every frame for smooth animation
    interpolateSatellitePositions(satelliteMeshes);
}

/**
 * Get satellite target positions
 */
export function getSatelliteTargetPositions() {
    return satelliteTargetPositions;
}

/**
 * Get satellite current positions
 */
export function getSatelliteCurrentPositions() {
    return satelliteCurrentPositions;
}

