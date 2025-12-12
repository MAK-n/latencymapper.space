
// ============================================
// GROUND STATION RENDERING
// ============================================
import * as THREE from 'three';
import { CONFIG, COLORS } from './constants.js';
import { latLonToVector3 } from './coordinates.js';

let stationMeshes = [];

/**
 * Create geometry for ground station marker
 */
function createStationGeometry() {
    return new THREE.SphereGeometry(0.015, 16, 16);
}

/**
 * Create material for ground station marker
 */
function createStationMaterial() {
    return new THREE.MeshStandardMaterial({
        color: COLORS.STATION_DEFAULT,
        emissive: COLORS.STATION_EMISSIVE,
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.7
    });
}

function createNewStationMaterial() {
    return new THREE.MeshStandardMaterial({
        color: 0x00ff00, // bright green for new station
        emissive: 0x00ff00,
        emissiveIntensity: 0.9,
        metalness: 0.5,
        roughness: 0.4
    });
}

/**
 * Render ground stations on the globe
 */
export function renderGroundStations(scene, groundStations) {
    const geometry = createStationGeometry();

    let renderedCount = 0;

    groundStations.forEach(station => {
        // Distinct color for new stations (id pattern: 'gs_' + timestamp)
        let material;
        if (typeof station.id === 'string' && /^gs_\d{13,}$/.test(station.id)) {
            material = createNewStationMaterial();
        } else {
            material = createStationMaterial();
        }

        const mesh = new THREE.Mesh(geometry, material);

        // Position on globe
        const position = latLonToVector3(station.lat, station.lon);
        mesh.position.copy(position);

        // Store station data
        mesh.userData = {
            stationId: station.id,
            stationName: station.name,
            latitude: station.lat,
            longitude: station.lon,
            elevation: station.elevation || 0,
            type: station.type || 'Unknown'
        };

        scene.add(mesh);
        stationMeshes.push(mesh);
        renderedCount++;
    });

    console.log(`✓ Rendered ${renderedCount} ground stations on globe`);
    return stationMeshes;
}

/**
 * Get all station meshes
 */
export function getStationMeshes() {
    return stationMeshes;
}

/**
 * Clear all station meshes
 */
export function clearStationMeshes(scene) {
    stationMeshes.forEach(mesh => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
    stationMeshes = [];
}

