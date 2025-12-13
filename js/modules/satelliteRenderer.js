// ============================================
// SATELLITE RENDERING
// ============================================

import * as THREE from "three";
import { COLORS } from "./constants.js";
import { satellitePositionToVector3 } from "./coordinates.js";
import { getOrbitType, getOrbitColor } from "./satelliteData.js";

let satelliteMeshes = [];

/**
 * Create geometry for satellite marker
 */
function createSatelliteGeometry() {
  // Make satellites slightly larger for better visibility
  return new THREE.SphereGeometry(0.015, 12, 12);
}

/**
 * Create material for satellite marker
 */
function createSatelliteMaterial(orbitType, isCustom = false) {
  // Custom satellites are red
  const color = isCustom ? 0xff0000 : getOrbitColor(orbitType);

  return new THREE.MeshStandardMaterial({
    color: color,
    emissive: color,
    emissiveIntensity: 0.9,
    metalness: 0.5,
    roughness: 0.5,
  });
}

/**
 * Render satellites on the globe
 */
export function renderSatellites(
  scene,
  satelliteRecords,
  satelliteTargetPositions,
) {
  console.log("[SatelliteRenderer] renderSatellites called");
  console.log("[SatelliteRenderer] Inputs:", {
    scene: !!scene,
    recordsCount: satelliteRecords?.length || 0,
    positionsCount: satelliteTargetPositions?.length || 0,
  });

  if (!satelliteRecords || satelliteRecords.length === 0) {
    console.warn("[SatelliteRenderer] No satellite records to render");
    return [];
  }

  if (!scene) {
    console.error("[SatelliteRenderer] ERROR: Scene is null or undefined!");
    return [];
  }

  console.log("[SatelliteRenderer] Rendering satellites on globe...");

  let orbitCounts = { LEO: 0, MEO: 0, GEO: 0 };
  let renderedCount = 0;

  satelliteRecords.forEach((satRecord, index) => {
    console.log(
      `[SatelliteRenderer] Processing satellite ${index}:`,
      satRecord.name,
    );

    const position = satelliteTargetPositions[index];
    if (!position) {
      console.warn(
        `[SatelliteRenderer] No position for satellite ${index}:`,
        satRecord.name,
      );
      return;
    }

    console.log(
      `[SatelliteRenderer] Position for ${satRecord.name}:`,
      position,
    );

    // Calculate orbit type from altitude (same as existing satellites)
    const orbitType = getOrbitType(position.altitude);
    orbitCounts[orbitType]++;
    console.log(
      `[SatelliteRenderer] Orbit type for ${satRecord.name}:`,
      orbitType,
    );

    // Check if this is a custom satellite
    const isCustom = satRecord.isCustom === true;
    console.log(
      `[SatelliteRenderer] Is custom satellite for ${satRecord.name}:`,
      isCustom,
    );

    // Create geometry and material
    const geometry = createSatelliteGeometry();
    const material = createSatelliteMaterial(orbitType, isCustom);
    console.log(
      `[SatelliteRenderer] Created geometry and material for ${satRecord.name}, color:`,
      isCustom ? "RED" : orbitType,
    );

    const mesh = new THREE.Mesh(geometry, material);
    console.log(`[SatelliteRenderer] Created mesh for ${satRecord.name}`);

    // Position on globe
    const position3D = satellitePositionToVector3(
      position.latitude,
      position.longitude,
      position.altitude,
    );
    console.log(
      `[SatelliteRenderer] 3D position for ${satRecord.name}:`,
      position3D,
    );
    mesh.position.copy(position3D);

    // Store satellite data (use user-specified orbit type if available)
    mesh.userData = {
      satelliteName: satRecord.name,
      orbitType: orbitType, // This will be the user-specified type if available
      latitude: position.latitude,
      longitude: position.longitude,
      altitude: position.altitude,
      velocity: position.velocity,
    };
    console.log(
      `[SatelliteRenderer] Mesh userData for ${satRecord.name}:`,
      mesh.userData,
    );

    scene.add(mesh);
    console.log(
      `[SatelliteRenderer] Added mesh to scene for ${satRecord.name}, scene children count:`,
      scene.children.length,
    );

    satelliteMeshes.push(mesh);
    renderedCount++;
    console.log(
      `[SatelliteRenderer] ✓ Rendered ${satRecord.name}, total meshes:`,
      satelliteMeshes.length,
    );
  });

  console.log(
    `[SatelliteRenderer] ✓ Rendered ${renderedCount} new satellites, total ${satelliteMeshes.length} satellites on globe`,
  );
  console.log(`[SatelliteRenderer]   - LEO (cyan): ${orbitCounts.LEO}`);
  console.log(`[SatelliteRenderer]   - MEO (teal): ${orbitCounts.MEO}`);
  console.log(`[SatelliteRenderer]   - GEO (green): ${orbitCounts.GEO}`);

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
  satelliteMeshes.forEach((mesh) => {
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  satelliteMeshes = [];
}
