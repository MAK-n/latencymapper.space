import * as THREE from "three";
// ============================================
// EARTH MODEL CREATION
// ============================================

import { CONFIG, URLS } from "./constants.js";

let earth;
let originalTexture = null;
let videoTexture = null;
let videoElement = null;

/**
 * Create Earth sphere with texture
 */
export function createEarth(scene) {
  return new Promise((resolve, reject) => {
    const geometry = new THREE.SphereGeometry(CONFIG.EARTH_RADIUS, 64, 64);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      URLS.EARTH_TEXTURE,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;

        const material = new THREE.MeshPhongMaterial({
          map: texture,
          emissive: 0x000000,
          emissiveIntensity: 0.0,
          shininess: 5,
        });

        earth = new THREE.Mesh(geometry, material);
        scene.add(earth);

        console.log("✓ Earth texture loaded successfully");
        resolve(earth);
      },
      undefined,
      (error) => {
        console.error("Error loading Earth texture:", error);
        reject(error);
      },
    );
  });
}

/**
 * Get Earth mesh
 */
export function getEarth() {
  return earth;
}

/**
 * Switch Earth texture to video
 */
export function switchToVideoTexture(videoPath) {
  if (!earth) {
    console.warn("[Earth] Cannot switch texture: Earth mesh not found");
    return;
  }

  // Store original texture if not already stored
  if (!originalTexture && earth.material && earth.material.map) {
    originalTexture = earth.material.map;
  }

  // Create video element
  if (!videoElement) {
    videoElement = document.createElement("video");
    videoElement.src = videoPath;
    videoElement.loop = true;
    videoElement.muted = true;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.crossOrigin = "anonymous";

    // Play video (required for autoplay in some browsers)
    videoElement.play().catch((err) => {
      console.warn("[Earth] Video autoplay failed:", err);
    });
  } else {
    videoElement.src = videoPath;
    videoElement.play().catch((err) => {
      console.warn("[Earth] Video play failed:", err);
    });
  }

  // Create video texture
  if (!videoTexture) {
    videoTexture = new THREE.VideoTexture(videoElement);
    videoTexture.wrapS = THREE.ClampToEdgeWrapping;
    videoTexture.wrapT = THREE.ClampToEdgeWrapping;

    // Stretch vertically to cover poles
    videoTexture.repeat.set(1, 1.35); // increase if black still visible
    videoTexture.offset.set(0, -0.175); // center it vertically

    // Optional: horizontal flip (remove if not needed)
    videoTexture.repeat.x = -1;
    videoTexture.offset.x = 1;

    // Quality
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.colorSpace = THREE.SRGBColorSpace;
  }

  // Apply video texture to material
  if (earth.material) {
    earth.material.map = videoTexture;
    earth.material.needsUpdate = true;
  }

  // Expose video texture globally for animation loop updates
  window.videoTexture = videoTexture;

  // Update video texture each frame
  if (videoTexture) {
    videoTexture.needsUpdate = true;
  }

  console.log("[Earth] Switched to video texture:", videoPath);
}

/**
 * Restore original Earth texture
 */
export function restoreOriginalTexture() {
  if (!earth || !originalTexture) {
    console.warn(
      "[Earth] Cannot restore texture: Earth mesh or original texture not found",
    );
    return;
  }

  // Stop and remove video
  if (videoElement) {
    videoElement.pause();
    videoElement.src = "";
  }

  // Remove global reference
  window.videoTexture = null;

  // Restore original texture
  if (earth.material) {
    earth.material.map = originalTexture;
    earth.material.needsUpdate = true;
  }

  console.log("[Earth] Restored original texture");
}
