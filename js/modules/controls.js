// ============================================
// ORBIT CONTROLS SETUP
// ============================================

let controls;

/**
 * Setup OrbitControls for camera
 */
export function setupControls(camera, renderer) {
    return new Promise((resolve) => {
        // Delay to ensure OrbitControls is loaded
        setTimeout(() => {
            if (typeof THREE.OrbitControls === 'undefined') {
                console.error('OrbitControls not found. Camera controls disabled.');
                resolve(null);
                return;
            }

            controls = new THREE.OrbitControls(camera, renderer.domElement);
            
            // Configure controls
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.screenSpacePanning = false;
            controls.enablePan = false;
            controls.minDistance = 3;
            controls.maxDistance = 10;
            controls.minPolarAngle = Math.PI / 6;
            controls.maxPolarAngle = (5 * Math.PI) / 6;

            console.log('✓ OrbitControls initialized successfully');
            resolve(controls);
        }, 50);
    });
}

/**
 * Update controls (call in animation loop)
 */
export function updateControls() {
    if (controls) {
        controls.update();
    }
}

/**
 * Get controls instance
 */
export function getControls() {
    return controls;
}

