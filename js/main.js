// ============================================
// MAIN APPLICATION ENTRY POINT
// ============================================
import * as THREE from 'three';
import { initScene, setupLighting, onWindowResize } from './modules/scene.js';
import { createEarth } from './modules/earth.js';
import { setupControls, updateControls } from './modules/controls.js';
import { loadGroundStations } from './modules/groundStations.js';
import { renderGroundStations, getStationMeshes, clearStationMeshes } from './modules/groundStationRenderer.js';
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
} from './modules/satelliteUpdater.js';
import { 
    onSatelliteClick,
    onSatelliteHover,
    setupSatelliteInteraction,
    setupSatelliteInfoPanelHandlers 
} from './modules/satelliteInteraction.js';
import { initOrbitalPath } from './modules/orbitalPath.js';
import { onCombinedHover } from './modules/combinedInteraction.js';

// UI Control Panel Imports (Phase 1)
import { initControlPanel, initAllButtons } from './modules/ui/controlPanel.js';
import { initAddStationModal } from './modules/ui/virtualGroundStation.js';
import { initAddSatelliteModal } from './modules/ui/customSatellite.js';
import { initStationListPanel } from './modules/ui/stationList.js';
import { initSatelliteFinderPanel } from './modules/ui/satelliteFinder.js';
import { initFilterPanel } from './modules/ui/filterMenu.js';
import { initSettingsPanel } from './modules/ui/settingsPanel.js';
import { initGraphicsPanel } from './modules/ui/graphicsPanel.js';
import { initLegend } from './modules/ui/legend.js';
import { loadState } from './modules/ui/uiState.js';

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
        setupInfoPanelHandlers();
        // Don't setup station interaction yet - wait for satellites to load
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
            
            // Get satellite meshes and cache them
            cachedSatelliteMeshes = getSatelliteMeshes();
            cachedSatelliteRecords = getSatelliteRecords();
            
            // Setup satellite interaction (Task 1.3.7.1)
            setupSatelliteInteraction(renderer, mouse, raycaster, camera, cachedSatelliteMeshes);
            setupSatelliteInfoPanelHandlers();
            
            // Setup ALL interaction (stations + satellites) with combined hover
            const stationMeshes = getStationMeshes();
            setupStationInteraction(
                renderer,
                mouse,
                raycaster,
                camera,
                stationMeshes,
                cachedSatelliteMeshes,
                (event) => onSatelliteClick(event, mouse, raycaster, camera, cachedSatelliteMeshes),
                onCombinedHover,
                onSatelliteHover
            );
            console.log('✓ All interactions ready (stations + satellites)');
        }
    } else {
        console.warn('No satellite data loaded');
    }
    
    // Initialize UI Control Panel (Phase 1)
    console.log('Initializing UI Control Panel...');
    initControlPanel();
    initAllButtons();
    
    // Initialize all modals and panels
    initAddStationModal();
    initAddSatelliteModal();
    initStationListPanel();
    initSatelliteFinderPanel();
    initFilterPanel();
    initSettingsPanel();
    initGraphicsPanel();
    
    // Initialize legend in settings panel
    const legendContainer = document.getElementById('legend-container');
    if (legendContainer) {
        initLegend(legendContainer);
    }
    
    // Load saved UI state
    loadState();
    
    console.log('✓ UI Control Panel initialized');
    
    // Resize handler
    window.addEventListener('resize', () => onWindowResize(camera, renderer));
    
    console.log('✓ Initialization complete');
}

// Listen for globe click mode activation and call the handler with correct references
import { activateGlobeClickMode } from './modules/groundStationInteraction.js';

window.addEventListener('activate-globe-click-mode', () => {
    // Use the locally scoped scene, camera, renderer from init()
    if (typeof camera !== 'undefined' && typeof renderer !== 'undefined') {
        // Find the globe mesh (Earth) from the scene
        let globe = null;
        if (scene && scene.children) {
            globe = scene.children.find(obj => obj.name === 'Earth' || obj.userData.isEarth);
        }
        if (globe && camera && renderer) {
            activateGlobeClickMode(globe, camera, renderer);
            console.log('[Main] Globe click mode activated');
        } else {
            console.warn('[Main] Globe, camera, or renderer not found');
        }
    }
});

/**
 * Animation loop
 */
// Cache meshes and records to avoid function calls every frame
let cachedSatelliteMeshes = [];
let cachedSatelliteRecords = [];

function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    updateControls();
    
    // Update satellite positions (using cached arrays)
    if (cachedSatelliteMeshes.length > 0 && cachedSatelliteRecords.length > 0) {
        updateSatellitePositions(cachedSatelliteMeshes, cachedSatelliteRecords);
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

// Listen for new ground station additions and update the globe
window.addEventListener('add-ground-station', async (e) => {
    const newStation = e.detail;
    // Add to ground-stations.json via backend or local update (for demo, update in-memory and re-render)
    // Here, we assume groundStations is managed in memory for the session
    if (!window._groundStations) {
        window._groundStations = await loadGroundStations();
    }
    window._groundStations.push(newStation);
    // Remove old station meshes
    clearStationMeshes(scene);
    // Re-render all stations
    renderGroundStations(scene, window._groundStations);
    console.log('[Main] Added and rendered new ground station:', newStation);
});

