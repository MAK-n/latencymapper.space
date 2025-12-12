// Three.js scene variables
let scene, camera, renderer, controls;
let earthMesh;

// Ground station variables
let groundStations = [];
let stationMeshes = [];

// Satellite variables (Task 1.3)
let satellites = [];
let satelliteMeshes = [];
let satelliteRecords = [];

// Real-time update variables (Task 1.3.6)
let lastSatelliteUpdate = 0;
const satelliteUpdateInterval = 2000; // Update every 2 seconds
let satelliteTargetPositions = []; // Target positions for smooth interpolation
let satelliteCurrentPositions = []; // Current interpolated positions
const interpolationSpeed = 0.05; // Smooth interpolation factor

// Raycaster for station interaction (Task 1.2.6)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredStation = null;
let selectedStation = null;

// Track mouse movement to distinguish click from drag
let mouseDownPos = { x: 0, y: 0 };
let mouseUpPos = { x: 0, y: 0 };
const clickThreshold = 5; // pixels

// Satellite interaction variables (Task 1.3.7)
let hoveredSatellite = null;
let selectedSatellite = null;
let currentOrbitLine = null; // Currently displayed orbital path
let orbitPathCache = new Map(); // Cache calculated orbital paths

// Initialize the scene
async function init() {
    // Scene - Space Operations Theme
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070D); // Dark space background
    
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
    
    // Load satellite data (Task 1.3.1 & 1.3.2)
    console.log('Loading satellite data...');
    const satelliteData = await loadSatelliteData();
    if (satelliteData.length > 0) {
        satellites = satelliteData;
        console.log(`✓ Satellite data ready: ${satellites.length} satellites`);
        
        // Initialize satellites and propagate positions (Task 1.3.3)
        await initializeSatellites();
        
        // Render satellites on globe (Task 1.3.4 & 1.3.5)
        if (satelliteRecords.length > 0) {
            renderSatellites();
            
            // Setup satellite interaction (Task 1.3.7.1)
            setupSatelliteInteraction();
            setupSatelliteInfoPanelHandlers();
            
            console.log('✓ Satellite interaction and orbital path system ready');
        }
    } else {
        console.warn('No satellite data loaded');
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
        color: 0xFFB039,        // Orange ground station color (Space Operations Theme)
        emissive: 0xFFB039,     // Self-illuminated (not affected by lighting)
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
            color: 0xFFB039,        // Orange ground station color (Space Operations Theme)
            emissive: 0xFFB039,
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
    
    // Check satellites first (Task 1.3.7.1)
    const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes);
    
    if (satelliteIntersects.length > 0) {
        // Satellite was clicked - handle it
        console.log('Satellite clicked, handling...');
        onSatelliteClick(event);
        return;
    }
    
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
                   selectedStation.material.color.setHex(0xFFB039);  // Orange
                   selectedStation.material.emissive.setHex(0xFFB039);
                   selectedStation.material.emissiveIntensity = 0.8;
                   selectedStation.scale.set(1, 1, 1);
               }
               
               // If clicking the same station, deselect it
               if (selectedStation === clickedMesh) {
                   console.log('Deselecting current station');
                   selectedStation.material.color.setHex(0xFFB039);  // Orange
                   selectedStation.material.emissive.setHex(0xFFB039);
                   selectedStation.material.emissiveIntensity = 0.8;
                   selectedStation.scale.set(1, 1, 1);
                   selectedStation = null;
                   
                   // Hide station info panel (Task 1.2.7)
                   hideStationInfo();
               } else {
                   // Select the new station with cyan selection color (theme)
                   console.log('Selecting new station');
                   selectedStation = clickedMesh;
                   selectedStation.material.color.setHex(0x00E5FF);  // Cyan selection
                   selectedStation.material.emissive.setHex(0x00E5FF);
                   selectedStation.material.emissiveIntensity = 1.2;
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
                   selectedStation.material.color.setHex(0xFFB039);  // Orange
                   selectedStation.material.emissive.setHex(0xFFB039);
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
                selectedStation.material.color.setHex(0xFFB039);  // Orange (Space Operations Theme)
                selectedStation.material.emissive.setHex(0xFFB039);
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
    
    // Update controls
    if (controls) {
        controls.update(); // Required if damping is enabled
    }
    
    // Update satellite positions in real-time (Task 1.3.6)
    if (satelliteMeshes.length > 0) {
        updateSatellitePositions();
    }
    
    renderer.render(scene, camera);
}

// ============================================
// SATELLITE FUNCTIONS (TASK 1.3)
// ============================================

// Task 1.3.2: Fetch TLE data from CelesTrak
async function fetchTLEData() {
    const cacheKey = 'satellite_tle_cache';
    const cacheTimeKey = 'satellite_tle_cache_time';
    const cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
    
    // Check cache first
    const cachedTime = localStorage.getItem(cacheTimeKey);
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedTime && cachedData) {
        const age = Date.now() - parseInt(cachedTime);
        if (age < cacheExpiry) {
            console.log('✓ Using cached TLE data (age: ' + Math.round(age / 1000 / 60) + ' minutes)');
            return JSON.parse(cachedData);
        }
    }
    
    // Fetch fresh data
    console.log('Fetching TLE data from CelesTrak...');
    try {
        const url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        const parsedSatellites = parseTLEText(text);
        
        // Cache the data
        localStorage.setItem(cacheKey, JSON.stringify(parsedSatellites));
        localStorage.setItem(cacheTimeKey, Date.now().toString());
        
        console.log(`✓ Fetched and cached ${parsedSatellites.length} satellites from CelesTrak`);
        return parsedSatellites;
        
    } catch (error) {
        console.error('Error fetching TLE data:', error);
        
        // Try to use cached data even if expired
        if (cachedData) {
            console.warn('Using expired cache due to fetch error');
            return JSON.parse(cachedData);
        }
        
        return [];
    }
}

// Task 1.3.2: Parse TLE text format
function parseTLEText(tleText) {
    const lines = tleText.trim().split('\n');
    const parsedSatellites = [];
    
    // TLE format: 3 lines per satellite (name, line1, line2)
    for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 < lines.length) {
            const name = lines[i].trim();
            const line1 = lines[i + 1].trim();
            const line2 = lines[i + 2].trim();
            
            // Basic validation
            if (line1.startsWith('1 ') && line2.startsWith('2 ')) {
                parsedSatellites.push({
                    name: name,
                    tleLine1: line1,
                    tleLine2: line2
                });
            }
        }
    }
    
    console.log(`✓ Parsed ${parsedSatellites.length} satellites from TLE data`);
    return parsedSatellites;
}

// Task 1.3.2: Load satellites (limit to first 50 for testing)
async function loadSatelliteData() {
    try {
        const allSatellites = await fetchTLEData();
        
        // Limit to 50 satellites for initial testing
        const limitedSatellites = allSatellites.slice(0, 50);
        
        console.log(`✓ Loaded ${limitedSatellites.length} satellites (limited from ${allSatellites.length} total)`);
        return limitedSatellites;
        
    } catch (error) {
        console.error('Error loading satellite data:', error);
        return [];
    }
}

// ============================================
// SATELLITE ORBIT PROPAGATION (TASK 1.3.3)
// ============================================

// Task 1.3.3: Initialize satellite record from TLE
function initializeSatelliteRecord(satData) {
    if (!window.satellite) {
        console.error('satellite.js not loaded yet');
        return null;
    }
    
    try {
        const satrec = window.satellite.twoline2satrec(
            satData.tleLine1,
            satData.tleLine2
        );
        
        if (satrec.error) {
            console.error('TLE parsing error for', satData.name, ':', satrec.error);
            return null;
        }
        
        return {
            name: satData.name,
            satrec: satrec,
            tleLine1: satData.tleLine1,
            tleLine2: satData.tleLine2
        };
    } catch (error) {
        console.error('Error initializing satellite record for', satData.name, ':', error);
        return null;
    }
}

// Task 1.3.3: Propagate satellite to get current position
function propagateSatellitePosition(satRecord, date) {
    if (!window.satellite || !satRecord || !satRecord.satrec) {
        return null;
    }
    
    try {
        // Propagate satellite to given date/time
        const positionAndVelocity = window.satellite.propagate(satRecord.satrec, date);
        
        if (!positionAndVelocity || !positionAndVelocity.position) {
            console.warn('Propagation failed for', satRecord.name);
            return null;
        }
        
        const positionEci = positionAndVelocity.position;
        const velocityEci = positionAndVelocity.velocity;
        
        // Check for invalid positions
        if (typeof positionEci.x !== 'number' || isNaN(positionEci.x)) {
            console.warn('Invalid position for', satRecord.name);
            return null;
        }
        
        // Convert ECI coordinates to Geodetic (lat, lon, alt)
        const gmst = window.satellite.gstime(date);
        const positionGd = window.satellite.eciToGeodetic(positionEci, gmst);
        
        // Convert to degrees
        const latitude = window.satellite.degreesLat(positionGd.latitude);
        const longitude = window.satellite.degreesLong(positionGd.longitude);
        const altitude = positionGd.height; // km above Earth's surface
        
        // Calculate velocity magnitude (km/s)
        const velocity = Math.sqrt(
            velocityEci.x * velocityEci.x +
            velocityEci.y * velocityEci.y +
            velocityEci.z * velocityEci.z
        );
        
        return {
            latitude: latitude,
            longitude: longitude,
            altitude: altitude,
            velocity: velocity,
            timestamp: date
        };
        
    } catch (error) {
        console.error('Error propagating satellite', satRecord.name, ':', error);
        return null;
    }
}

// Task 1.3.3: Determine orbit type based on altitude
function getOrbitType(altitude) {
    if (altitude < 2000) return 'LEO';      // Low Earth Orbit
    if (altitude < 35786) return 'MEO';     // Medium Earth Orbit
    return 'GEO';                           // Geostationary Orbit
}

// Task 1.3.3: Get color for orbit type - Space Operations Theme
function getOrbitColor(orbitType) {
    switch (orbitType) {
        case 'LEO': return 0x00E5FF;  // Cyan satellite color from theme
        case 'MEO': return 0x37F0C6;  // Teal orbit line color from theme
        case 'GEO': return 0x52E38F;  // Success green from theme
        default: return 0xffffff;     // White
    }
}

// Task 1.3.3: Initialize all satellites and propagate initial positions
async function initializeSatellites() {
    if (!window.satellite) {
        console.error('satellite.js not loaded. Waiting...');
        
        // Wait for satellite.js to load
        return new Promise((resolve) => {
            window.addEventListener('satellitejs-loaded', () => {
                console.log('satellite.js loaded, initializing satellites...');
                resolve(initializeSatellitesInternal());
            }, { once: true });
        });
    }
    
    return initializeSatellitesInternal();
}

async function initializeSatellitesInternal() {
    if (satellites.length === 0) {
        console.warn('No satellite data to initialize');
        return;
    }
    
    console.log('Initializing satellite records and propagating positions...');
    const date = new Date();
    let successCount = 0;
    
    for (const satData of satellites) {
        // Initialize satellite record from TLE
        const satRecord = initializeSatelliteRecord(satData);
        if (!satRecord) {
            continue;
        }
        
        // Propagate to get current position
        const position = propagateSatellitePosition(satRecord, date);
        if (!position) {
            continue;
        }
        
        // Calculate orbit type
        const orbitType = getOrbitType(position.altitude);
        
        // Store complete satellite record with position
        satelliteRecords.push({
            ...satRecord,
            position: position,
            orbitType: orbitType
        });
        
        successCount++;
    }
    
    console.log(`✓ Successfully initialized ${successCount} out of ${satellites.length} satellites`);
    console.log('Satellite orbit types:', 
        satelliteRecords.filter(s => s.orbitType === 'LEO').length + ' LEO, ',
        satelliteRecords.filter(s => s.orbitType === 'MEO').length + ' MEO, ',
        satelliteRecords.filter(s => s.orbitType === 'GEO').length + ' GEO'
    );
}

// ============================================
// SATELLITE RENDERING (TASK 1.3.4 & 1.3.5)
// ============================================

// Task 1.3.4: Create satellite geometry
function createSatelliteGeometry() {
    // Small sphere for satellite representation
    const radius = 0.01; // Smaller than ground stations (0.015)
    const segments = 8;  // Simple geometry for performance
    return new THREE.SphereGeometry(radius, segments, segments);
}

// Task 1.3.4: Create satellite material based on orbit type
function createSatelliteMaterial(orbitType) {
    const color = getOrbitColor(orbitType);
    
    return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.9,
        metalness: 0.0,
        roughness: 1.0
    });
}

// Task 1.3.5: Convert satellite geodetic position to 3D coordinates
function satellitePositionToVector3(latitude, longitude, altitude) {
    // Earth radius in km
    const earthRadiusKm = 6371;
    // Globe radius in Three.js units
    const globeRadius = 1.0;
    
    // Convert altitude from km to Three.js units
    // Scale altitude to match globe scale
    const scaledAltitude = (altitude / earthRadiusKm) * globeRadius;
    
    // Use existing latLonToVector3 function with scaled altitude
    return latLonToVector3(latitude, longitude, globeRadius, scaledAltitude);
}

// Task 1.3.5: Render all satellites on the globe
function renderSatellites() {
    if (satelliteRecords.length === 0) {
        console.warn('No satellite records to render');
        return;
    }
    
    console.log('Rendering satellites on globe...');
    
    const geometry = createSatelliteGeometry();
    let renderedCount = 0;
    
    satelliteRecords.forEach(satRecord => {
        if (!satRecord.position) {
            return;
        }
        
        const { latitude, longitude, altitude } = satRecord.position;
        
        // Convert position to 3D coordinates
        const position = satellitePositionToVector3(latitude, longitude, altitude);
        
        // Create individual material for each satellite (avoid sharing issues)
        const material = createSatelliteMaterial(satRecord.orbitType);
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        // Store satellite data in mesh for interaction (future task)
        mesh.userData = {
            satelliteName: satRecord.name,
            orbitType: satRecord.orbitType,
            latitude: latitude,
            longitude: longitude,
            altitude: altitude,
            velocity: satRecord.position.velocity,
            satrec: satRecord.satrec // For future position updates
        };
        
        // Add to scene and tracking array
        scene.add(mesh);
        satelliteMeshes.push(mesh);
        renderedCount++;
    });
    
    console.log(`✓ Rendered ${renderedCount} satellites on globe`);
    console.log('  - LEO (cyan):', satelliteMeshes.filter(m => m.userData.orbitType === 'LEO').length);
    console.log('  - MEO (teal):', satelliteMeshes.filter(m => m.userData.orbitType === 'MEO').length);
    console.log('  - GEO (green):', satelliteMeshes.filter(m => m.userData.orbitType === 'GEO').length);
    
    // Initialize position tracking for interpolation (Task 1.3.6)
    satelliteMeshes.forEach(mesh => {
        satelliteCurrentPositions.push(mesh.position.clone());
        satelliteTargetPositions.push(mesh.position.clone());
    });
}

// ============================================
// REAL-TIME SATELLITE UPDATES (TASK 1.3.6)
// ============================================

// Task 1.3.6: Propagate all satellite positions
function propagateAllSatellites() {
    const date = new Date();
    let updateCount = 0;
    
    satelliteRecords.forEach((satRecord, index) => {
        if (!satRecord || !satRecord.satrec) return;
        
        // Propagate to current time
        const position = propagateSatellitePosition(satRecord, date);
        
        if (position && satelliteMeshes[index]) {
            // Store current position as starting point for interpolation
            satelliteCurrentPositions[index] = satelliteMeshes[index].position.clone();
            
            // Calculate new target position
            const globePos = satellitePositionToVector3(
                position.latitude,
                position.longitude,
                position.altitude
            );
            
            // Store as target for interpolation
            satelliteTargetPositions[index] = globePos;
            
            // Update userData with latest position info
            satelliteMeshes[index].userData.latitude = position.latitude;
            satelliteMeshes[index].userData.longitude = position.longitude;
            satelliteMeshes[index].userData.altitude = position.altitude;
            satelliteMeshes[index].userData.velocity = position.velocity;
            
            updateCount++;
        }
    });
    
    return updateCount;
}

// Task 1.3.6: Smooth interpolation between satellite positions
function interpolateSatellitePositions() {
    satelliteMeshes.forEach((mesh, index) => {
        if (!satelliteTargetPositions[index] || !satelliteCurrentPositions[index]) return;
        
        const current = satelliteCurrentPositions[index];
        const target = satelliteTargetPositions[index];
        
        // Smooth interpolation using lerp
        mesh.position.x += (target.x - mesh.position.x) * interpolationSpeed;
        mesh.position.y += (target.y - mesh.position.y) * interpolationSpeed;
        mesh.position.z += (target.z - mesh.position.z) * interpolationSpeed;
        
        // Update current position for next frame
        satelliteCurrentPositions[index].copy(mesh.position);
    });
}

// Task 1.3.6: Update satellite positions in real-time
function updateSatellitePositions() {
    const currentTime = Date.now();
    
    // Check if we need to propagate new positions
    if (currentTime - lastSatelliteUpdate >= satelliteUpdateInterval) {
        const updateCount = propagateAllSatellites();
        lastSatelliteUpdate = currentTime;
        
        // Optional: Log update (commented out to avoid console spam)
        // console.log(`Updated ${updateCount} satellite positions`);
    }
    
    // Interpolate positions every frame for smooth animation
    interpolateSatellitePositions();
}

// ============================================
// SATELLITE INTERACTION & ORBITAL PATHS (TASK 1.3.7)
// ============================================

// Task 1.3.7.2: Calculate orbital path for a satellite
function calculateOrbitPath(satelliteMesh) {
    const satRecord = satelliteRecords.find(rec => rec.name === satelliteMesh.userData.satelliteName);
    if (!satRecord || !satRecord.satrec) {
        console.warn('Cannot calculate orbit: satellite record not found');
        return null;
    }
    
    // Check cache first
    const cacheKey = satelliteMesh.userData.satelliteName;
    if (orbitPathCache.has(cacheKey)) {
        return orbitPathCache.get(cacheKey);
    }
    
    const orbitType = satelliteMesh.userData.orbitType;
    const currentTime = new Date();
    
    // Determine orbit period and number of points based on orbit type
    let orbitPeriodMinutes, numPoints;
    switch (orbitType) {
        case 'LEO':
            orbitPeriodMinutes = 90;  // ~90 minute orbit
            numPoints = 80;
            break;
        case 'MEO':
            orbitPeriodMinutes = 720; // ~12 hour orbit
            numPoints = 120;
            break;
        case 'GEO':
            orbitPeriodMinutes = 1440; // ~24 hour orbit
            numPoints = 180;
            break;
        default:
            orbitPeriodMinutes = 90;
            numPoints = 80;
    }
    
    const timeStepMinutes = orbitPeriodMinutes / numPoints;
    const points = [];
    
    // Calculate positions along the orbit
    for (let i = 0; i <= numPoints; i++) {
        const timeOffset = i * timeStepMinutes * 60 * 1000; // Convert to milliseconds
        const futureTime = new Date(currentTime.getTime() + timeOffset);
        
        // Propagate satellite to this time
        const position = propagateSatellitePosition(satRecord, futureTime);
        
        if (position) {
            const point3D = satellitePositionToVector3(
                position.latitude,
                position.longitude,
                position.altitude
            );
            points.push(point3D);
        }
    }
    
    // Cache the calculated path
    if (points.length > 0) {
        orbitPathCache.set(cacheKey, points);
    }
    
    return points.length > 0 ? points : null;
}

// Task 1.3.7.3: Create orbital path line
function createOrbitLine(points, isSelected = false) {
    if (!points || points.length < 2) return null;
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Use theme colors: gray for hover, brighter for selected
    const color = isSelected ? 0x9BB3C9 : 0x5E6A7A;
    const opacity = isSelected ? 0.8 : 0.6;
    
    const material = new THREE.LineBasicMaterial({
        color: color,
        opacity: opacity,
        transparent: true,
        linewidth: 2
    });
    
    const line = new THREE.Line(geometry, material);
    return line;
}

// Task 1.3.7.3: Remove current orbital path from scene
function removeOrbitLine() {
    if (currentOrbitLine) {
        scene.remove(currentOrbitLine);
        
        // Dispose geometry and material to free memory
        if (currentOrbitLine.geometry) {
            currentOrbitLine.geometry.dispose();
        }
        if (currentOrbitLine.material) {
            currentOrbitLine.material.dispose();
        }
        
        currentOrbitLine = null;
    }
}

// Task 1.3.7.3: Show orbital path for a satellite
function showOrbitPath(satelliteMesh, isSelected = false) {
    console.log('showOrbitPath called for:', satelliteMesh.userData.satelliteName, 'isSelected:', isSelected);
    
    // Remove existing path first
    removeOrbitLine();
    
    // Calculate orbital path
    const points = calculateOrbitPath(satelliteMesh);
    console.log('Calculated orbit points:', points ? points.length : 0);
    
    if (points) {
        // Create and add orbit line to scene
        currentOrbitLine = createOrbitLine(points, isSelected);
        if (currentOrbitLine) {
            currentOrbitLine.userData.isHover = !isSelected;
            scene.add(currentOrbitLine);
            console.log('✓ Orbital path added to scene');
        } else {
            console.warn('Failed to create orbit line');
        }
    } else {
        console.warn('No orbit points calculated');
    }
}

// Task 1.3.7.4 & 1.3.7.5: Handle satellite hover
function onSatelliteHover(event) {
    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    
    const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes);
    
    // Reset previous hover if different satellite
    if (hoveredSatellite && (satelliteIntersects.length === 0 || satelliteIntersects[0].object !== hoveredSatellite)) {
        // Only reset if not selected
        if (hoveredSatellite !== selectedSatellite) {
            hoveredSatellite.scale.set(1, 1, 1);
            hoveredSatellite.material.emissiveIntensity = 0.9;
            removeOrbitLine();
        }
        hoveredSatellite = null;
    }
    
    if (satelliteIntersects.length > 0) {
        const mesh = satelliteIntersects[0].object;
        
        // Don't apply hover effect to selected satellite
        if (mesh !== selectedSatellite) {
            renderer.domElement.style.cursor = 'pointer';
            
            // Scale up and brighten
            mesh.scale.set(1.3, 1.3, 1.3);
            mesh.material.emissiveIntensity = 1.2;
            
            // Show orbital path (gray)
            if (mesh !== hoveredSatellite) {
                showOrbitPath(mesh, false);
            }
            
            hoveredSatellite = mesh;
        } else {
            renderer.domElement.style.cursor = 'pointer';
        }
    } else {
        // Not hovering over any satellite
        if (!selectedSatellite) {
            renderer.domElement.style.cursor = 'default';
        }
    }
}

// Task 1.3.7.5: Handle satellite click
function onSatelliteClick(event) {
    // Note: Drag detection already done in onStationClick
    // This function is called from onStationClick when a satellite is detected
    
    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    
    // Check satellites
    const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes);
    
    if (satelliteIntersects.length > 0) {
        const clickedMesh = satelliteIntersects[0].object;
        
        console.log('Satellite selected:', clickedMesh.userData.satelliteName);
        
        // Reset previous selection
        if (selectedSatellite && selectedSatellite !== clickedMesh) {
            selectedSatellite.scale.set(1, 1, 1);
            selectedSatellite.material.emissiveIntensity = 0.9;
        }
        
        // Toggle selection
        if (selectedSatellite === clickedMesh) {
            // Deselect
            console.log('Deselecting satellite');
            selectedSatellite.scale.set(1, 1, 1);
            selectedSatellite.material.emissiveIntensity = 0.9;
            selectedSatellite = null;
            removeOrbitLine();
            hideSatelliteInfo();
        } else {
            // Select new satellite
            console.log('Selecting new satellite');
            selectedSatellite = clickedMesh;
            selectedSatellite.scale.set(1.5, 1.5, 1.5);
            selectedSatellite.material.emissiveIntensity = 1.4;
            
            // Show orbital path (brighter color for selected)
            console.log('Showing orbital path for:', clickedMesh.userData.satelliteName);
            showOrbitPath(selectedSatellite, true);
            
            // Display satellite info
            displaySatelliteInfo(selectedSatellite.userData);
        }
    }
}

// Task 1.3.7.6: Display satellite information panel
function displaySatelliteInfo(satelliteData) {
    const panel = document.getElementById('satellite-info');
    if (!panel) {
        console.error('Satellite info panel not found');
        return;
    }
    
    // Update panel content
    document.getElementById('sat-name').textContent = satelliteData.satelliteName;
    document.getElementById('sat-orbit-type').textContent = satelliteData.orbitType;
    document.getElementById('sat-altitude').textContent = satelliteData.altitude.toFixed(2) + ' km';
    document.getElementById('sat-velocity').textContent = satelliteData.velocity.toFixed(2) + ' km/s';
    document.getElementById('sat-latitude').textContent = satelliteData.latitude.toFixed(4) + '°';
    document.getElementById('sat-longitude').textContent = satelliteData.longitude.toFixed(4) + '°';
    
    // Show panel
    panel.classList.remove('hidden');
    panel.style.display = 'block';
    
    console.log('✓ Displaying satellite info for:', satelliteData.satelliteName);
}

// Task 1.3.7.6: Hide satellite information panel
function hideSatelliteInfo() {
    const panel = document.getElementById('satellite-info');
    if (panel) {
        panel.classList.add('hidden');
        panel.style.display = 'none';
    }
}

// Task 1.3.7.6: Setup satellite info panel handlers
function setupSatelliteInfoPanelHandlers() {
    const closeBtn = document.getElementById('close-satellite-info');
    if (closeBtn) {
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            hideSatelliteInfo();
            
            // Deselect satellite
            if (selectedSatellite) {
                selectedSatellite.scale.set(1, 1, 1);
                selectedSatellite.material.emissiveIntensity = 0.9;
                selectedSatellite = null;
                removeOrbitLine();
            }
        });
        console.log('✓ Satellite info panel close button initialized');
    }
}

// Task 1.3.7.1: Setup satellite interaction event listeners
function setupSatelliteInteraction() {
    // Add satellite-specific hover handler
    renderer.domElement.addEventListener('mousemove', onSatelliteHover);
    
    // Click handler is integrated into onStationClick function
    // which checks satellites first before stations
    
    console.log('✓ Satellite interaction enabled');
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

