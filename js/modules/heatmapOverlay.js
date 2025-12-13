// ============================================
// HEATMAP OVERLAY SYSTEM (CORRECTED)
// ============================================

import * as THREE from "three";
import { CONFIG } from "./constants.js";
import { getEarth } from "./earth.js";

let heatmapMesh = null;
let currentFrameIndex = -1;
let frameTextures = new Map();
let scene = null;

/**
 * Initialize heatmap overlay system
 */
export function initHeatmapOverlay(sceneRef) {
  scene = sceneRef;
  window.syncHeatmapRotation = syncHeatmapRotation;
  console.log("[HeatmapOverlay] Initialized");
}

/**
 * Create heatmap overlay mesh
 */
function createHeatmapMesh() {
  if (heatmapMesh) return heatmapMesh;

  const earth = getEarth();
  if (!earth) {
    console.error("[HeatmapOverlay] Earth mesh not found");
    return null;
  }

  // Slightly larger radius to avoid z-fighting
  const geometry = new THREE.SphereGeometry(
    CONFIG.EARTH_RADIUS * 1.001,
    64,
    64,
  );

  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    depthTest: false, // 🔑 critical
    blending: THREE.NormalBlending,
    color: 0xffffff,
  });

  heatmapMesh = new THREE.Mesh(geometry, material);
  heatmapMesh.name = "HeatmapOverlay";
  heatmapMesh.renderOrder = 10; // render after Earth

  // Attach directly to Earth for perfect sync
  earth.add(heatmapMesh);
  heatmapMesh.rotation.set(0, 0, 0);

  console.log("[HeatmapOverlay] Heatmap mesh created");
  return heatmapMesh;
}

/**
 * Load frame texture safely
 */
function loadFrameTexture(framePath) {
  if (frameTextures.has(framePath)) {
    return Promise.resolve(frameTextures.get(framePath));
  }

  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      framePath,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.needsUpdate = true;
        frameTextures.set(framePath, texture);
        resolve(texture);
      },
      undefined,
      reject,
    );
  });
}

/**
 * Update heatmap with new frame
 */
export async function updateHeatmapFrame(framePath, frameIndex) {
  if (!scene) return false;

  if (!heatmapMesh) {
    createHeatmapMesh();
    if (!heatmapMesh) return false;
  }

  try {
    const texture = await loadFrameTexture(framePath);
    if (!texture) return false;

    // Apply texture (DO NOT dispose old one here)
    heatmapMesh.material.map = texture;
    heatmapMesh.material.needsUpdate = true;
    heatmapMesh.visible = true;

    currentFrameIndex = frameIndex;

    // Force render if available
    if (window.triggerRender) {
      window.triggerRender();
    }

    console.log(`[HeatmapOverlay] Frame ${frameIndex} applied`);
    return true; // Success
  } catch (err) {
    console.error("[HeatmapOverlay] Frame update failed:", err);
    return false; // Failure
  }
}

/**
 * Show heatmap overlay
 */
export function showHeatmapOverlay() {
  if (!heatmapMesh) createHeatmapMesh();
  if (heatmapMesh) heatmapMesh.visible = true;
}

/**
 * Hide heatmap overlay
 */
export function hideHeatmapOverlay() {
  if (heatmapMesh) heatmapMesh.visible = false;
}

/**
 * Clear heatmap overlay (SAFE cleanup)
 */
export function clearHeatmapOverlay() {
  if (heatmapMesh) {
    heatmapMesh.visible = false;

    if (heatmapMesh.material.map) {
      heatmapMesh.material.map.dispose();
      heatmapMesh.material.map = null;
    }
  }

  // Dispose all cached textures
  frameTextures.forEach((texture) => texture.dispose());
  frameTextures.clear();

  currentFrameIndex = -1;

  console.log("[HeatmapOverlay] Cleared completely");
}

/**
 * Sync rotation with Earth
 */
export function syncHeatmapRotation() {
  if (!heatmapMesh) return;
  const earth = getEarth();
  if (earth) {
    heatmapMesh.quaternion.copy(earth.quaternion);
  }
}

/**
 * Set heatmap opacity
 */
export function setHeatmapOpacity(opacity) {
  if (heatmapMesh && heatmapMesh.material) {
    heatmapMesh.material.opacity = Math.max(0, Math.min(1, opacity));
    heatmapMesh.material.needsUpdate = true;
  }
}

/**
 * Get current frame index
 */
export function getCurrentFrameIndex() {
  return currentFrameIndex;
}
