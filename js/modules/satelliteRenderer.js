// ============================================
// SATELLITE RENDERING
// ============================================

import * as THREE from 'three';
import { COLORS } from './constants.js';
import { satellitePositionToVector3 } from './coordinates.js';
import { getOrbitType, getOrbitColor } from './satelliteData.js';

let satelliteMeshes = [];

/**
 * Create geometry for satellite marker
 */
function createSatelliteGeometry() {
    return new THREE.SphereGeometry(0.01, 12, 12);
}

/**
 * Create material for satellite marker
 */
function createSatelliteMaterial(orbitType) {
    const color = getOrbitColor(orbitType);
    
    return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.9,
        metalness: 0.5,
        roughness: 0.5
    });
}

/**
 * Render satellites on the globe
 */
export function renderSatellites(scene, satelliteRecords, satelliteTargetPositions) {
    if (!satelliteRecords || satelliteRecords.length === 0) {
        console.warn('No satellite records to render');
        return [];
    }
    
    console.log('Rendering satellites on globe...');
    
    let orbitCounts = { LEO: 0, MEO: 0, GEO: 0 };
    
    satelliteRecords.forEach((satRecord, index) => {
        const position = satelliteTargetPositions[index];
        if (!position) return;
        
        const orbitType = getOrbitType(position.altitude);
        orbitCounts[orbitType]++;
        
        // Create geometry and material
        const geometry = createSatelliteGeometry();
        const material = createSatelliteMaterial(orbitType);
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position on globe
        const position3D = satellitePositionToVector3(
            position.latitude,
            position.longitude,
            position.altitude
        );
        mesh.position.copy(position3D);
        
        // Store satellite data
        mesh.userData = {
            satelliteName: satRecord.name,
            orbitType: orbitType,
            latitude: position.latitude,
            longitude: position.longitude,
            altitude: position.altitude,
            velocity: position.velocity
        };
        
        scene.add(mesh);
        satelliteMeshes.push(mesh);
    });
    
    console.log(`✓ Rendered ${satelliteMeshes.length} satellites on globe`);
    console.log(`  - LEO (cyan): ${orbitCounts.LEO}`);
    console.log(`  - MEO (teal): ${orbitCounts.MEO}`);
    console.log(`  - GEO (green): ${orbitCounts.GEO}`);
    
    return satelliteMeshes;
}

/**
 * Get all satellite meshes
 */
export function getSatelliteMeshes() {
    return satelliteMeshes;
}

/**
 * Clear all satellite meshes
 */
export function clearSatelliteMeshes(scene) {
    satelliteMeshes.forEach(mesh => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
    satelliteMeshes = [];
}

