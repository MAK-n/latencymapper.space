// Three.js scene variables
let scene, camera, renderer, controls;
let earthMesh;

// Ground station variables
let groundStations = [];
let stationMeshes = [];

// Raycaster for station interaction (Task 1.2.6)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredStation = null;
let selectedStation = null;

// Track mouse movement to distinguish click from drag
let mouseDownPos = { x: 0, y: 0 };
let mouseUpPos = { x: 0, y: 0 };
const clickThreshold = 5; // pixels

// Initialize the scene
async function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x001122);
    
    // Camera
    const fov = 50;
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 2000);
    camera.position.set(0, 0, 5);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Disable tone mapping to prevent color/brightness adjustments
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Setup lighting (required to see the Earth)
    setupLighting();
    
    // Create Earth sphere
    createEarth();
    
    // Setup camera controls
    setupControls();
    
    // Load and render ground stations (Task 1.2.4 & 1.2.5)
    const stations = await loadGroundStations();
    if (stations.length > 0) {
        renderGroundStations(stations);
        // Setup station interaction after rendering (Task 1.2.6)
        setupStationInteraction();
        // Setup info panel handlers (Task 1.2.7)
        setupInfoPanelHandlers();
    }
    
    // Resize handler
    window.addEventListener('resize', onWindowResize);
}

// Setup lighting
function setupLighting() {
    // Balanced ambient light to reduce shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    // Moderate directional light for realistic appearance without washout
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
}

// Create Earth sphere
function createEarth() {
    // Create sphere geometry
    const radius = 1;
    const widthSegments = 64;
    const heightSegments = 64;
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    
    // Load Earth texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
        'texture/nasa-blue-marble-1.png',
        function(loadedTexture) {
            console.log('Earth texture loaded successfully');
        },
        undefined,
        function(error) {
            console.error('Error loading texture:', error);
        }
    );
    
    // Configure texture properties
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 16;
    
    // Set proper color space for accurate color representation
    texture.colorSpace = THREE.SRGBColorSpace;
    
    // Create material with texture - reduced emissive to prevent washout
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 5,
        // Very subtle emissive to maintain color depth without adding brightness
        emissive: 0x000000,  // No emissive color (was 0x111111)
        emissiveIntensity: 0.0  // No emissive intensity (was 0.2)
    });
    
    // Create mesh and add to scene
    earthMesh = new THREE.Mesh(geometry, material);
    scene.add(earthMesh);
}

// ============================================
// GROUND STATION FUNCTIONS
// ============================================

// Task 1.2.2: Convert lat/lon to 3D position on sphere
function latLonToVector3(lat, lon, radius, height) {
    // Convert latitude and longitude to radians
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    // Calculate position on sphere surface using spherical to Cartesian conversion
    const x = -((radius + height) * Math.sin(phi) * Math.cos(theta));
    const y = (radius + height) * Math.cos(phi);
    const z = (radius + height) * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
}

// Task 1.2.3: Create geometry for ground station dots
function createStationGeometry() {
    const radius = 0.015; // Dot size - visible but not overwhelming
    const segments = 8;    // Balance between quality and performance
    return new THREE.SphereGeometry(radius, segments, segments);
}

// Task 1.2.3: Create material for ground stations
function createStationMaterial() {
    return new THREE.MeshStandardMaterial({
        color: 0xff0000,        // Red color
        emissive: 0xff0000,     // Self-illuminated (not affected by lighting)
        emissiveIntensity: 0.8, // Bright enough to see clearly
        metalness: 0.0,         // Not metallic
        roughness: 1.0          // Fully rough (matte)
    });
}

// Task 1.2.4: Load ground station data from JSON file
async function loadGroundStations() {
    try {
        const response = await fetch('data/ground-stations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Validate data structure
        if (!data.stations || !Array.isArray(data.stations)) {
            throw new Error('Invalid data format: expected stations array');
        }
        
        // Validate each station has required fields
        data.stations.forEach((station, index) => {
            const requiredFields = ['id', 'name', 'lat', 'lon', 'elevation', 'type'];
            requiredFields.forEach(field => {
                if (station[field] === undefined) {
                    throw new Error(`Station ${index} missing required field: ${field}`);
                }
            });
            
            // Validate coordinate ranges
            if (station.lat < -90 || station.lat > 90) {
                throw new Error(`Station ${station.id} has invalid latitude: ${station.lat}`);
            }
            if (station.lon < -180 || station.lon > 180) {
                throw new Error(`Station ${station.id} has invalid longitude: ${station.lon}`);
            }
        });
        
        console.log(`✓ Loaded ${data.stations.length} ground stations`);
        return data.stations;
    } catch (error) {
        console.error('Error loading ground stations:', error);
        return [];
    }
}

// Task 1.2.5: Render ground stations on the globe
function renderGroundStations(stations) {
    if (!stations || stations.length === 0) {
        console.warn('No ground stations to render');
        return;
    }
    
    const geometry = createStationGeometry();
    
    stations.forEach(station => {
        // Convert lat/lon to 3D position
        const position = latLonToVector3(
            station.lat, 
            station.lon, 
            1.0,    // Earth radius (matches globe radius)
            0.01    // Height above surface to prevent z-fighting
        );
        
        // Create individual material for each station using MeshStandardMaterial
        // (MeshBasicMaterial doesn't support emissive properties)
        const material = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.8,
            metalness: 0.0,
            roughness: 1.0
        });
        
        // Create mesh for this station
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        // Store station data in mesh for interaction (Task 1.2.6)
        mesh.userData = {
            stationId: station.id,
            stationName: station.name,
            lat: station.lat,
            lon: station.lon,
            elevation: station.elevation,
            type: station.type
        };
        
        // Add to scene and tracking array
        scene.add(mesh);
        stationMeshes.push(mesh);
        groundStations.push(station);
    });
    
    console.log(`✓ Rendered ${stationMeshes.length} ground stations on globe`);
}

// ============================================
// GROUND STATION INTERACTION (RAYCASTING)
// ============================================

// Task 1.2.6: Convert mouse position to normalized device coordinates
function updateMousePosition(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

// Task 1.2.6: Track mouse down position
function onMouseDown(event) {
    mouseDownPos.x = event.clientX;
    mouseDownPos.y = event.clientY;
}

// Task 1.2.6: Handle click on ground stations (only if not dragging)
function onStationClick(event) {
    mouseUpPos.x = event.clientX;
    mouseUpPos.y = event.clientY;
    
    // Calculate distance moved
    const dx = mouseUpPos.x - mouseDownPos.x;
    const dy = mouseUpPos.y - mouseDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // If mouse moved more than threshold, it's a drag, not a click
    if (distance > clickThreshold) {
        console.log('Drag detected, ignoring click');
        return;
    }
    
    updateMousePosition(event);
    
    // Cast ray from camera through mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with station meshes
    const intersects = raycaster.intersectObjects(stationMeshes);
    
    console.log('Click detected, intersects:', intersects.length);
    
    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const stationData = clickedMesh.userData;
        
        console.log('Station clicked:', stationData.stationName);
        
        // Reset previous selection completely
        if (selectedStation && selectedStation !== clickedMesh) {
            console.log('Resetting previous selection');
            selectedStation.material.color.setHex(0xff0000);
            selectedStation.material.emissive.setHex(0xff0000);
            selectedStation.material.emissiveIntensity = 0.8;
            selectedStation.scale.set(1, 1, 1);
        }
        
        // If clicking the same station, deselect it
        if (selectedStation === clickedMesh) {
            console.log('Deselecting current station');
            selectedStation.material.color.setHex(0xff0000);
            selectedStation.material.emissive.setHex(0xff0000);
            selectedStation.material.emissiveIntensity = 0.8;
            selectedStation.scale.set(1, 1, 1);
            selectedStation = null;
            
            // Hide station info panel (Task 1.2.7)
            hideStationInfo();
        } else {
            // Select the new station with soft blue color
            console.log('Selecting new station');
            selectedStation = clickedMesh;
            selectedStation.material.color.setHex(0x4da6ff);
            selectedStation.material.emissive.setHex(0x4da6ff);
            selectedStation.material.emissiveIntensity = 1.0;
            selectedStation.scale.set(1.5, 1.5, 1.5);
            
            console.log(`Selected: ${stationData.stationName} (${stationData.lat.toFixed(2)}°, ${stationData.lon.toFixed(2)}°)`);
            
            // Display station info panel (Task 1.2.7)
            console.log('Calling displayStationInfo...');
            displayStationInfo(stationData);
        }
    } else {
        // Clicked on empty space - deselect
        console.log('Clicked empty space');
        if (selectedStation) {
            console.log('Deselecting station');
            selectedStation.material.color.setHex(0xff0000);
            selectedStation.material.emissive.setHex(0xff0000);
            selectedStation.material.emissiveIntensity = 0.8;
            selectedStation.scale.set(1, 1, 1);
            selectedStation = null;
            
            // Hide station info panel (Task 1.2.7)
            hideStationInfo();
        }
    }
}

// Task 1.2.6: Handle hover effect on ground stations
function onStationHover(event) {
    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(stationMeshes);
    
    // Reset previous hover state (only if not selected)
    if (hoveredStation && hoveredStation !== selectedStation) {
        hoveredStation.material.emissiveIntensity = 0.8;
        hoveredStation.scale.set(1, 1, 1);
        hoveredStation = null;
    }
    
    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        
        // Don't apply hover effect to selected station
        if (mesh !== selectedStation) {
            // Change cursor to pointer
            renderer.domElement.style.cursor = 'pointer';
            
            // Only apply hover if this is a new hover target
            if (mesh !== hoveredStation) {
                // Highlight station with scale increase and brightness
                mesh.material.emissiveIntensity = 1.2;
                mesh.scale.set(1.3, 1.3, 1.3);
                hoveredStation = mesh;
            }
        } else {
            // Still show pointer cursor for selected station, but clear hover
            renderer.domElement.style.cursor = 'pointer';
            hoveredStation = null;
        }
    } else {
        // Reset cursor when not over any station
        renderer.domElement.style.cursor = 'default';
        hoveredStation = null;
    }
}

// Task 1.2.6: Initialize station interaction event listeners
function setupStationInteraction() {
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('click', onStationClick);
    renderer.domElement.addEventListener('mousemove', onStationHover);
    console.log('✓ Station interaction enabled');
}

// ============================================
// STATION INFO DISPLAY (UI) - TASK 1.2.7
// ============================================

// Task 1.2.7: Display station information panel
function displayStationInfo(stationData) {
    console.log('displayStationInfo called with:', stationData);
    
    const panel = document.getElementById('station-info');
    if (!panel) {
        console.error('Station info panel not found!');
        return;
    }
    
    console.log('Panel element found:', panel);
    
    // Update panel content
    const nameEl = document.getElementById('station-name');
    const typeEl = document.getElementById('station-type');
    const latEl = document.getElementById('station-lat');
    const lonEl = document.getElementById('station-lon');
    const elevEl = document.getElementById('station-elevation');
    const idEl = document.getElementById('station-id');
    
    if (nameEl) nameEl.textContent = stationData.stationName;
    if (typeEl) typeEl.textContent = stationData.type.charAt(0).toUpperCase() + stationData.type.slice(1);
    if (latEl) latEl.textContent = stationData.lat.toFixed(4) + '°';
    if (lonEl) lonEl.textContent = stationData.lon.toFixed(4) + '°';
    if (elevEl) elevEl.textContent = stationData.elevation + 'm';
    if (idEl) idEl.textContent = stationData.stationId;
    
    // Show panel
    panel.classList.remove('hidden');
    panel.style.display = 'block'; // Force display
    
    console.log('✓ Station info panel should now be visible');
    console.log('Panel classes:', panel.className);
    console.log('Panel display style:', panel.style.display);
}

// Task 1.2.7: Hide station information panel
function hideStationInfo() {
    const panel = document.getElementById('station-info');
    if (panel) {
        panel.classList.add('hidden');
        panel.style.display = 'none'; // Force hide
        console.log('✓ Station info hidden');
    }
}

// Task 1.2.7: Setup close button handler
function setupInfoPanelHandlers() {
    const closeBtn = document.getElementById('close-info');
    if (closeBtn) {
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            hideStationInfo();
            
            // Also deselect the station
            if (selectedStation) {
                selectedStation.material.color.setHex(0xff0000);
                selectedStation.material.emissive.setHex(0xff0000);
                selectedStation.material.emissiveIntensity = 0.8;
                selectedStation.scale.set(1, 1, 1);
                selectedStation = null;
            }
        });
        console.log('✓ Info panel close button initialized');
    }
}

// Setup camera controls
function setupControls() {
    // Wait for OrbitControls to load if it's still loading
    if (typeof THREE === 'undefined' || (typeof THREE.OrbitControls === 'undefined' && typeof OrbitControls === 'undefined')) {
        // Wait for the module to load
        window.addEventListener('orbitcontrols-loaded', function() {
            initializeControls();
        });
        
        // Also try after a short delay as fallback
        setTimeout(function() {
            if (!controls) {
                initializeControls();
            }
        }, 100);
        return;
    }
    
    initializeControls();
}

function initializeControls() {
    // Check if OrbitControls is available (try different ways it might be exposed)
    let OrbitControlsClass = null;
    
    if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined') {
        OrbitControlsClass = THREE.OrbitControls;
    } else if (typeof OrbitControls !== 'undefined') {
        OrbitControlsClass = OrbitControls;
    } else {
        console.warn('OrbitControls not found. Camera controls disabled. The globe will still render but won\'t be interactive.');
        controls = null;
        return;
    }
    
    try {
        controls = new OrbitControlsClass(camera, renderer.domElement);
        console.log('OrbitControls initialized successfully');
    } catch (error) {
        console.error('Error initializing OrbitControls:', error);
        controls = null;
        return;
    }
    
    // Enable damping for smooth camera movement
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Zoom settings
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.minDistance = 1.5; // Don't go inside Earth
    controls.maxDistance = 10;  // Max zoom out
    
    // Rotation settings
    controls.enableRotate = true;
    controls.rotateSpeed = 0.5;
    
    // Disable pan to keep globe centered on axis
    controls.enablePan = false;
    
    // Target center of Earth - locked in place
    controls.target.set(0, 0, 0);
    
    // Prevent the camera from going below the equator for better viewing
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI;
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    if (controls) {
        controls.update(); // Required if damping is enabled
    }
    renderer.render(scene, camera);
}

// Start the application
console.log('Initializing Three.js globe...');
try {
    init();
    console.log('Initialization complete');
    animate();
    console.log('Animation loop started');
} catch (error) {
    console.error('Error during initialization:', error);
}

