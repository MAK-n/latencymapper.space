// ============================================
// SATELLITE INTERACTION
// ============================================

import * as THREE from "three";
import { updateMousePosition } from "./coordinates.js";
import { showOrbitPath, removeOrbitLine } from "./orbitalPath.js";

let selectedSatellite = null;
let hoveredSatellite = null;

/**
 * Reset satellite appearance to default
 */
function resetSatelliteAppearance(satelliteMesh) {
  if (satelliteMesh) {
    satelliteMesh.scale.set(1, 1, 1);
    satelliteMesh.material.emissiveIntensity = 0.9;
  }
}

/**
 * Highlight satellite (for selection)
 */
function highlightSatellite(satelliteMesh) {
  if (satelliteMesh) {
    satelliteMesh.scale.set(1.5, 1.5, 1.5);
    satelliteMesh.material.emissiveIntensity = 1.4;
  }
}

/**
 * Handle satellite click
 */
export function onSatelliteClick(
  event,
  mouse,
  raycaster,
  camera,
  satelliteMeshes,
) {
  // Note: Drag detection already done in onStationClick
  // This function is called from onStationClick when a satellite is detected

  updateMousePosition(event, mouse, event.target);
  raycaster.setFromCamera(mouse, camera);

  // Check satellites
  const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes);

  if (satelliteIntersects.length > 0) {
    const clickedMesh = satelliteIntersects[0].object;

    // Reset previous selection
    if (selectedSatellite && selectedSatellite !== clickedMesh) {
      resetSatelliteAppearance(selectedSatellite);
    }

    // Toggle selection
    if (selectedSatellite === clickedMesh) {
      // Deselect
      resetSatelliteAppearance(selectedSatellite);
      selectedSatellite = null;
      removeOrbitLine();
      hideSatelliteInfo();
    } else {
      // Select new satellite
      selectedSatellite = clickedMesh;
      highlightSatellite(selectedSatellite);

      // Show orbital path (brighter color for selected)
      showOrbitPath(selectedSatellite, true);

      // Display satellite info
      displaySatelliteInfo(selectedSatellite.userData);
    }
  }
}

/**
 * Handle satellite hover (optimized - called from combined handler)
 * @param {THREE.Mesh|null} hoveredMesh - The mesh being hovered over, or null if no hover
 */
export function onSatelliteHover(hoveredMesh) {
  if (hoveredMesh) {
    // Only update if hovering over a different satellite
    if (hoveredSatellite !== hoveredMesh) {
      // Remove previous hover orbit
      if (hoveredSatellite && hoveredSatellite !== selectedSatellite) {
        removeOrbitLine();
      }

      hoveredSatellite = hoveredMesh;

      // Show hover orbital path (only if not selected)
      if (selectedSatellite !== hoveredSatellite) {
        showOrbitPath(hoveredSatellite, false);
      }
    }
  } else {
    // Not hovering over any satellite
    if (hoveredSatellite && hoveredSatellite !== selectedSatellite) {
      removeOrbitLine();
      hoveredSatellite = null;
    }
  }
}

/**
 * Display satellite information panel
 */
export function displaySatelliteInfo(satelliteData) {
  const panel = document.getElementById("satellite-info");
  if (!panel) return;

  // Update panel content (with null checks)
  const nameEl = document.getElementById("sat-name");
  const orbitEl = document.getElementById("sat-orbit-type");
  const altEl = document.getElementById("sat-altitude");
  const velEl = document.getElementById("sat-velocity");
  const latEl = document.getElementById("sat-latitude");
  const lonEl = document.getElementById("sat-longitude");

  if (nameEl) nameEl.textContent = satelliteData.satelliteName;
  if (orbitEl) orbitEl.textContent = satelliteData.orbitType;
  if (altEl) altEl.textContent = satelliteData.altitude.toFixed(2) + " km";
  if (velEl) velEl.textContent = satelliteData.velocity.toFixed(2) + " km/s";
  if (latEl) latEl.textContent = satelliteData.latitude.toFixed(4) + "°";
  if (lonEl) lonEl.textContent = satelliteData.longitude.toFixed(4) + "°";

  // Show panel
  panel.classList.remove("hidden");
  panel.style.display = "block";
}

/**
 * Hide satellite information panel
 */
function hideSatelliteInfo() {
  const panel = document.getElementById("satellite-info");
  if (panel) {
    panel.classList.add("hidden");
    panel.style.display = "none";
  }
}

/**
 * Setup satellite interaction event listeners
 */
export function setupSatelliteInteraction(
  renderer,
  mouse,
  raycaster,
  camera,
  satelliteMeshes,
) {
  // NOTE: Hover handler now combined with station hover for performance
  // See combinedInteraction.js - single raycasting pass for both
  // Click handler is integrated into onStationClick function
  // which checks satellites first before stations
}

/**
 * Setup satellite info panel close button handler
 */
export function setupSatelliteInfoPanelHandlers() {
  const closeBtn = document.getElementById("close-satellite-info");
  if (closeBtn) {
    closeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      hideSatelliteInfo();

      // Deselect satellite
      if (selectedSatellite) {
        resetSatelliteAppearance(selectedSatellite);
        selectedSatellite = null;
        removeOrbitLine();
      }
    });
    console.log("✓ Satellite info panel close button initialized");
  }
}

/**
 * Get selected satellite
 */
export function getSelectedSatellite() {
  return selectedSatellite;
}

/**
 * Get hovered satellite
 */
export function getHoveredSatellite() {
  return hoveredSatellite;
}
