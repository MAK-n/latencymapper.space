// ============================================
// MAIN APPLICATION ENTRY POINT
// ============================================

import { initScene, setupLighting, onWindowResize, getSceneObjects } from './modules/scene.js';
import { createEarth } from './modules/earth.js';
import { setupControls, updateControls } from './modules/controls.js';
import { loadGroundStations } from './modules/groundStations.js';
import { renderGroundStations, getStationMeshes } from './modules/groundStationRenderer.js';
import { setupStationInteraction, setupInfoPanelHandlers } from './modules/groundStationInteraction.js';
import { 
    loadSatelliteData, 
    initializeSatelliteRecord,
    getSatelliteRecords,
    setSatelliteRecords 
} from './modules/satelliteData.js';
import { renderSatellites, getSatelliteMeshes } from './modules/satelliteRenderer.js';
import { 
    initializeSatellites, 
    updateSatellitePositions,
    getSatelliteTargetPositions 
} from './modules/satelliteUpdater.js';
import { 
    onSatelliteClick,
    setupSatelliteInteraction,
    setupSatelliteInfoPanelHandlers 
} from './modules/satelliteInteraction.js';
import { initOrbitalPath } from './modules/orbitalPath.js';

// Global Three.js objects
let scene, camera, renderer;
let mouse, raycaster;

/**
 * Initialize the application
 */
async function init() {
    console.log('Initializing Three.js globe...');
    
    // Initialize scene, camera, renderer
    const sceneObjects = initScene();
    scene = sceneObjects.scene;
    camera = sceneObjects.camera;
    renderer = sceneObjects.renderer;
    
    // Initialize mouse and raycaster for interaction
    mouse = new THREE.Vector2();
    raycaster = new THREE.Raycaster();
    
    // Setup lighting
    setupLighting(scene);
    
    // Create Earth
    await createEarth(scene);
    
    // Setup controls
    await setupControls(camera, renderer);
    
    // Load and render ground stations
    const groundStations = await loadGroundStations();
    if (groundStations.length > 0) {
        renderGroundStations(scene, groundStations);
        
        // Setup ground station interaction (will be updated after satellites load)
        const stationMeshes = getStationMeshes();
        setupStationInteraction(
            renderer, 
            mouse, 
            raycaster, 
            camera, 
            stationMeshes, 
            [], // Satellite meshes will be added later
            null // Satellite click handler will be added later
        );
        setupInfoPanelHandlers();
    }
    
    // Load and initialize satellites
    console.log('Loading satellite data...');
    const satellites = await loadSatelliteData();
    
    if (satellites.length > 0) {
        console.log('✓ Satellite data ready:', satellites.length, 'satellites');
        
        // Initialize satellites (propagate initial positions)
        const { records, targetPositions } = await initializeSatellites(
            satellites, 
            initializeSatelliteRecord
        );
        
        // Store satellite records globally
        setSatelliteRecords(records);
        
        // Render satellites on globe (Task 1.3.4 & 1.3.5)
        if (records.length > 0) {
            renderSatellites(scene, records, targetPositions);
            
            // Initialize orbital path module with scene reference
            initOrbitalPath(scene);
            
            // Get satellite meshes
            const satelliteMeshes = getSatelliteMeshes();
            
            // Setup satellite interaction (Task 1.3.7.1)
            setupSatelliteInteraction(renderer, mouse, raycaster, camera, satelliteMeshes);
            setupSatelliteInfoPanelHandlers();
            
            // Update ground station interaction to include satellite click handler
            const stationMeshes = getStationMeshes();
            setupStationInteraction(
                renderer,
                mouse,
                raycaster,
                camera,
                stationMeshes,
                satelliteMeshes,
                (event) => onSatelliteClick(event, mouse, raycaster, camera, satelliteMeshes)
            );
            
            console.log('✓ Satellite interaction and orbital path system ready');
        }
    } else {
        console.warn('No satellite data loaded');
    }
    
    // Resize handler
    window.addEventListener('resize', () => onWindowResize(camera, renderer));
    
    console.log('✓ Initialization complete');
}

/**
 * Animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    updateControls();
    
    // Update satellite positions (Task 1.3.6)
    const satelliteMeshes = getSatelliteMeshes();
    const satelliteRecords = getSatelliteRecords();
    
    if (satelliteMeshes.length > 0 && satelliteRecords.length > 0) {
        updateSatellitePositions(satelliteMeshes, satelliteRecords);
    }
    
    // Render scene
    renderer.render(scene, camera);
}

/**
 * Start the application
 */
console.log('Starting Latency Map application...');
try {
    init().then(() => {
        console.log('✓ Application initialized');
        animate();
        console.log('✓ Animation loop started');
    });
} catch (error) {
    console.error('Error during initialization:', error);
}

