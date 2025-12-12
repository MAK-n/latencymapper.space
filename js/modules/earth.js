import * as THREE from 'three';
// ============================================
// EARTH MODEL CREATION
// ============================================

import { CONFIG, URLS } from './constants.js';

let earth;

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
                    shininess: 5
                });
                
                earth = new THREE.Mesh(geometry, material);
                scene.add(earth);
                
                console.log('✓ Earth texture loaded successfully');
                resolve(earth);
            },
            undefined,
            (error) => {
                console.error('Error loading Earth texture:', error);
                reject(error);
            }
        );
    });
}

/**
 * Get Earth mesh
 */
export function getEarth() {
    return earth;
}

