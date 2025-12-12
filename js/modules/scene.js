// ============================================
// THREE.JS SCENE SETUP
// ============================================

import { COLORS } from './constants.js';
import * as THREE from 'three';

let scene, camera, renderer;

/**
 * Initialize Three.js scene, camera, and renderer
 */
export function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070D);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 5;

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // Append to canvas container (or body as fallback)
    const container = document.getElementById('canvas-container') || document.body;
    container.appendChild(renderer.domElement);

    console.log('✓ Scene initialized');
    
    return { scene, camera, renderer };
}

/**
 * Setup lighting for the scene
 */
export function setupLighting(scene) {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(COLORS.AMBIENT_LIGHT, 0.4);
    scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(COLORS.DIRECTIONAL_LIGHT, 0.6);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    console.log('✓ Lighting configured');
}

/**
 * Handle window resize
 */
export function onWindowResize(camera, renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Get scene, camera, and renderer
 */
export function getSceneObjects() {
    return { scene, camera, renderer };
}

