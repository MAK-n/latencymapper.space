# Task 1.2: Add Ground Stations to 3D Globe
**Estimated Time:** 2-3 hours  
**Priority:** P1 (Required for satellite tracking)  
**Owner:** 3D/Graphics Dev / Integration Dev

## Overview
Add ground station visualization to the existing 3D Earth globe. Ground stations will be represented as small red dots positioned at specific geographic coordinates. Users can interact with stations to view details.

## Success Criteria
- [ ] Ground stations render as visible red dots on the globe surface
- [ ] Stations positioned accurately using lat/lon coordinates
- [ ] Stations scale appropriately with globe zoom level
- [ ] Click interaction shows station details (name, coordinates, type)
- [ ] Hover effect highlights stations
- [ ] Performance: 60fps with 100+ ground stations
- [ ] Station data loaded from JSON format

---

## Resources Required

### Data Format
Ground station data will be in JSON format:
```json
{
  "stations": [
    {
      "id": "gs_001",
      "name": "San Francisco Amateur Radio",
      "lat": 37.7749,
      "lon": -122.4194,
      "elevation": 50,
      "type": "amateur"
    },
    {
      "id": "gs_002",
      "name": "London Research Station",
      "lat": 51.5074,
      "lon": -0.1278,
      "elevation": 35,
      "type": "research"
    }
  ]
}
```

### Dependencies
- [x] Three.js (already installed)
- [x] **Raycaster** (for click detection) - Built into Three.js ✓
- [x] Ground station data source (JSON file or API) - Will be created in Task 1.2.1

### Mathematical Requirements
- [x] **Lat/Lon to 3D Coordinates Conversion** ✓ Implemented in Task 1.2.2
  - Formula: Convert spherical coordinates (lat, lon) to Cartesian (x, y, z)
  - Required for positioning dots on sphere surface

### Development Tools
- [x] Browser DevTools for debugging
- [x] JSON validator for station data - Will use browser console
- [x] Geographic coordinate reference for testing - Will use known locations

### Documentation References
- [ ] Three.js Raycaster: https://threejs.org/docs/#api/en/core/Raycaster
- [ ] Three.js InstancedMesh: https://threejs.org/docs/#api/en/objects/InstancedMesh
- [ ] Geographic coordinate systems: https://en.wikipedia.org/wiki/Geographic_coordinate_system

---

## Task Breakdown

### Task 1.2.1: Create Ground Station Data Structure (15 minutes)

- [x] Create ground station data file
  - [x] Create `data/ground-stations.json` file
  - [x] Add sample ground station data (10-20 stations for testing)
  - [x] Include diverse geographic locations (various continents)
  - [x] Include different station types (amateur, research, commercial)

- [x] Validate data format
  - [x] Ensure all required fields present (id, name, lat, lon, elevation, type)
  - [x] Verify latitude range: -90 to 90
  - [x] Verify longitude range: -180 to 180
  - [x] Test JSON parsing

**Sample Data Structure:**
```json
{
  "stations": [
    {
      "id": "gs_001",
      "name": "San Francisco Station",
      "lat": 37.7749,
      "lon": -122.4194,
      "elevation": 50,
      "type": "amateur"
    },
    {
      "id": "gs_002",
      "name": "Tokyo Station",
      "lat": 35.6762,
      "lon": 139.6503,
      "elevation": 40,
      "type": "commercial"
    },
    {
      "id": "gs_003",
      "name": "London Station",
      "lat": 51.5074,
      "lon": -0.1278,
      "elevation": 35,
      "type": "research"
    }
  ]
}
```

---

### Task 1.2.2: Implement Coordinate Conversion Function (20 minutes)

- [x] Create latLonToVector3 function
  - [x] Convert latitude/longitude to radians
  - [x] Calculate x, y, z coordinates on sphere surface
  - [x] Account for Earth radius (matching globe radius = 1)
  - [x] Add small offset to place dots above surface

- [x] Test coordinate conversion
  - [x] Verify known locations (e.g., equator, poles)
  - [x] Check coordinate accuracy visually
  - [x] Test edge cases (180/-180 longitude boundary)

<!-- **Code Structure:**
```javascript
// Convert lat/lon to 3D position on sphere
function latLonToVector3(lat, lon, radius, height) {
    // Convert to radians
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    // Calculate position on sphere surface
    const x = -((radius + height) * Math.sin(phi) * Math.cos(theta));
    const y = (radius + height) * Math.cos(phi);
    const z = (radius + height) * Math.sin(phi) * Math.sin(theta);
    
    return new THREE.Vector3(x, y, z);
}
``` -->

---

### Task 1.2.3: Create Ground Station Geometry and Material (25 minutes)

- [x] Design ground station visual appearance
  - [x] Choose dot size (recommend 0.01-0.02 radius for visibility) - using 0.015
  - [x] Create red emissive material for visibility
  - [x] Consider using SphereGeometry for dots
  - [x] Test visibility at various zoom levels

- [x] Create station dot geometry
  - [x] Use `THREE.SphereGeometry` for individual dots
  - [x] OR use `THREE.InstancedMesh` for better performance (100+ stations)
  - [x] Set appropriate segment count (8-16 for balance) - using 8 segments

- [x] Create station material
  - [x] Red color (#ff0000 or similar)
  - [x] Emissive property for visibility without lighting
  - [x] Consider slight glow effect

<!-- **Code Structure:**
```javascript
// Create geometry for ground station dots
function createStationGeometry() {
    const radius = 0.015; // Dot size
    const segments = 8;
    return new THREE.SphereGeometry(radius, segments, segments);
}

// Create material for ground stations
function createStationMaterial() {
    return new THREE.MeshBasicMaterial({
        color: 0xff0000,        // Red
        emissive: 0xff0000,     // Self-illuminated
        emissiveIntensity: 0.8
    });
}

// Store ground station data
let groundStations = [];
let stationMeshes = [];
``` -->

---

### Task 1.2.4: Load and Parse Ground Station Data (20 minutes)

- [x] Create data loading function
  - [x] Use `fetch()` API to load JSON
  - [x] Parse JSON data
  - [x] Validate data structure
  - [x] Handle loading errors gracefully

- [x] Store station data
  - [x] Create array to hold station objects
  - [x] Store both data and mesh references
  - [x] Map station ID to mesh for later interaction

- [x] Handle loading states
  - [x] Show loading indicator (optional)
  - [x] Log successful load to console
  - [x] Display error message on failure

<!-- **Code Structure:**
```javascript
// Load ground station data from JSON file
async function loadGroundStations() {
    try {
        const response = await fetch('data/ground-stations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Loaded ${data.stations.length} ground stations`);
        return data.stations;
    } catch (error) {
        console.error('Error loading ground stations:', error);
        return [];
    }
}
``` -->

---

### Task 1.2.5: Render Ground Stations on Globe (30 minutes)

- [x] Create rendering function
  - [x] Loop through station data
  - [x] Convert each lat/lon to 3D position
  - [x] Create mesh for each station
  - [x] Add to scene
  - [x] Store reference for interaction

- [ ] Implement instanced rendering (for performance)
  - [ ] Use `THREE.InstancedMesh` for 100+ stations (optional optimization)
  - [ ] Set matrix for each instance position
  - [ ] Single draw call for all stations

- [x] Add stations to scene
  - [x] Ensure stations render above Earth surface (0.01 height offset)
  - [x] Verify visibility at various angles
  - [x] Test z-fighting issues (dots sinking into globe)

<!-- **Code Structure:**
```javascript
// Render ground stations on the globe
function renderGroundStations(stations) {
    const geometry = createStationGeometry();
    const material = createStationMaterial();
    
    stations.forEach(station => {
        // Convert lat/lon to 3D position
        const position = latLonToVector3(
            station.lat, 
            station.lon, 
            1.0,    // Earth radius
            0.005   // Height above surface
        );
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material.clone());
        mesh.position.copy(position);
        
        // Store station data in mesh for interaction
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
    });
    
    console.log(`Rendered ${stationMeshes.length} ground stations`);
}

// Alternative: Instanced rendering for better performance
function renderGroundStationsInstanced(stations) {
    const geometry = createStationGeometry();
    const material = createStationMaterial();
    
    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(
        geometry,
        material,
        stations.length
    );
    
    // Set position for each instance
    const matrix = new THREE.Matrix4();
    stations.forEach((station, index) => {
        const position = latLonToVector3(station.lat, station.lon, 1.0, 0.005);
        matrix.setPosition(position);
        instancedMesh.setMatrixAt(index, matrix);
        
        // Store station data (requires custom solution for userData)
        // For now, keep separate array mapping index to station data
        groundStations.push(station);
    });
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);
    
    return instancedMesh;
}
``` -->

---

### Task 1.2.6: Implement Station Interaction (Raycasting) (35 minutes)

- [x] Set up raycaster
  - [x] Create `THREE.Raycaster` instance
  - [x] Create mouse vector for screen coordinates
  - [x] Convert mouse position to normalized device coordinates

- [x] Implement click detection
  - [x] Add click event listener to canvas
  - [x] Cast ray from camera through mouse position
  - [x] Check intersections with station meshes
  - [x] Retrieve station data from clicked mesh

- [x] Implement hover effect
  - [x] Add mousemove event listener
  - [x] Detect station under cursor
  - [x] Change cursor to pointer on hover
  - [x] Highlight hovered station (scale to 1.3x with brightness increase)
  - [x] Highlight selected station (change colour to soft blue #4da6ff, scale to 1.5x)

- [x] Handle interaction states
  - [x] Track currently selected station
  - [x] Track currently hovered station
  - [x] Reset previous states on new interaction

<!-- **Code Structure:**
```javascript
// Raycaster for detecting clicks on stations
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredStation = null;
let selectedStation = null;

// Convert mouse position to normalized device coordinates
function updateMousePosition(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

// Handle click on ground stations
function onStationClick(event) {
    updateMousePosition(event);
    
    // Cast ray from camera through mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Check for intersections with station meshes
    const intersects = raycaster.intersectObjects(stationMeshes);
    
    if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const stationData = clickedMesh.userData;
        
        console.log('Station clicked:', stationData);
        selectedStation = clickedMesh;
        
        // Show station details (implement in Task 1.2.7)
        displayStationInfo(stationData);
    } else {
        // Clicked on empty space
        selectedStation = null;
        hideStationInfo();
    }
}

// Handle hover effect
function onStationHover(event) {
    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(stationMeshes);
    
    // Reset previous hover state
    if (hoveredStation && hoveredStation !== selectedStation) {
        hoveredStation.material.emissiveIntensity = 0.8;
        hoveredStation.scale.set(1, 1, 1);
    }
    
    if (intersects.length > 0) {
        const mesh = intersects[0].object;
        
        // Change cursor
        renderer.domElement.style.cursor = 'pointer';
        
        // Highlight station
        mesh.material.emissiveIntensity = 1.2;
        mesh.scale.set(1.5, 1.5, 1.5);
        hoveredStation = mesh;
    } else {
        // Reset cursor
        renderer.domElement.style.cursor = 'default';
        hoveredStation = null;
    }
}

// Add event listeners
renderer.domElement.addEventListener('click', onStationClick);
renderer.domElement.addEventListener('mousemove', onStationHover);
``` -->

---

### Task 1.2.7: Create Station Info Display (UI) (25 minutes)

- [x] Design info panel HTML/CSS
  - [x] Create overlay div for station details
  - [x] Style with modern, readable design, use dark colours according to the space theme, adequate padding
  - [x] Position appropriately (floating at the right side)
  - [x] Add close button

- [x] Implement show/hide functionality
  - [x] Display panel when station clicked
  - [x] Hide panel when clicking elsewhere or close button
  - [x] Smooth transition/animation with CSS transitions

- [x] Display station information
  - [x] Station name (title)
  - [x] Coordinates (lat/lon)
  - [x] Elevation
  - [x] Station type
  - [x] Station ID

<!-- **HTML Structure:**
```html
<!-- Add to index.html body -->
<div id="station-info" class="info-panel" style="display: none;">
    <button id="close-info" class="close-btn">&times;</button>
    <h3 id="station-name">Station Name</h3>
    <div class="info-row">
        <span class="label">Type:</span>
        <span id="station-type">-</span>
    </div>
    <div class="info-row">
        <span class="label">Latitude:</span>
        <span id="station-lat">-</span>
    </div>
    <div class="info-row">
        <span class="label">Longitude:</span>
        <span id="station-lon">-</span>
    </div>
    <div class="info-row">
        <span class="label">Elevation:</span>
        <span id="station-elevation">-</span>
    </div>
</div>
```

**CSS Structure:**
```css
.info-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 17, 34, 0.95);
    border: 2px solid #00ffff;
    border-radius: 8px;
    padding: 20px;
    min-width: 250px;
    color: #ffffff;
    font-family: 'Courier New', monospace;
    z-index: 1000;
}

.info-panel h3 {
    margin: 0 0 15px 0;
    color: #00ffff;
    font-size: 18px;
}

.info-row {
    margin: 8px 0;
    display: flex;
    justify-content: space-between;
}

.info-row .label {
    color: #888;
    margin-right: 10px;
}

.close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: #fff;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    line-height: 30px;
}

.close-btn:hover {
    color: #ff0000;
}
```

**JavaScript Functions:**
```javascript
// Display station information panel
function displayStationInfo(stationData) {
    const panel = document.getElementById('station-info');
    
    document.getElementById('station-name').textContent = stationData.stationName;
    document.getElementById('station-type').textContent = stationData.type;
    document.getElementById('station-lat').textContent = stationData.lat.toFixed(4) + '°';
    document.getElementById('station-lon').textContent = stationData.lon.toFixed(4) + '°';
    document.getElementById('station-elevation').textContent = stationData.elevation + 'm';
    
    panel.style.display = 'block';
}

// Hide station information panel
function hideStationInfo() {
    document.getElementById('station-info').style.display = 'none';
}

// Close button handler
document.getElementById('close-info').addEventListener('click', hideStationInfo);
``` -->

---

### Task 1.2.8: Integrate with Main Globe Application (20 minutes)

- [ ] Update initialization sequence
  - [ ] Call ground station loading after Earth creation
  - [ ] Ensure proper async/await handling
  - [ ] Initialize raycaster and interaction handlers

- [ ] Update animation loop (if needed)
  - [ ] Check if station animations required
  - [ ] Update hover effects smoothly

- [ ] Test integration
  - [ ] Verify stations render correctly
  - [ ] Test interaction doesn't interfere with orbit controls
  - [ ] Ensure performance remains at 60fps

**Updated init() function:**
```javascript
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
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Setup lighting
    setupLighting();
    
    // Create Earth sphere
    createEarth();
    
    // Setup camera controls
    setupControls();
    
    // Load and render ground stations
    const stations = await loadGroundStations();
    if (stations.length > 0) {
        renderGroundStations(stations);
        console.log('Ground stations initialized');
    }
    
    // Resize handler
    window.addEventListener('resize', onWindowResize);
}
```

---

### Task 1.2.9: Testing and Optimization (25 minutes)

- [ ] Visual testing
  - [ ] Verify all stations visible
  - [ ] Check dot size appropriate at various zoom levels
  - [ ] Confirm red color visible against Earth texture
  - [ ] Test on different screen sizes

- [ ] Interaction testing
  - [ ] Click on multiple stations
  - [ ] Verify correct data displayed
  - [ ] Test hover effect
  - [ ] Ensure orbit controls still work properly

- [ ] Performance testing
  - [ ] Check FPS with 10, 50, 100+ stations
  - [ ] Profile rendering performance
  - [ ] Optimize if needed (switch to instanced rendering)

- [ ] Edge case testing
  - [ ] Stations at poles
  - [ ] Stations at 180/-180 longitude boundary
  - [ ] Stations on opposite side of globe (occlusion)
  - [ ] Missing or invalid data

- [ ] Browser compatibility
  - [ ] Test in Chrome
  - [ ] Test in Firefox
  - [ ] Test in Edge/Safari if available

---

## File Structure

```
latency-map/
├── index.html (updated with info panel)
├── js/
│   ├── globe.js (updated with ground stations)
│   └── ground-stations.js (optional: separate module)
├── data/
│   └── ground-stations.json (station data)
├── textures/
│   └── earth_texture.jpg
└── css/
    └── styles.css (optional: station info panel styles)
```

---

## Common Issues and Solutions

### Issue: Stations not visible
- **Solution:** Increase dot size, check emissive material properties, verify height offset above surface

### Issue: Stations appear in wrong locations
- **Solution:** Verify lat/lon to Vector3 conversion formula, check coordinate system orientation, test with known locations

### Issue: Click detection not working
- **Solution:** Ensure raycaster mouse coordinates are normalized correctly, verify stationMeshes array populated, check z-index conflicts

### Issue: Performance drops with many stations
- **Solution:** Switch to InstancedMesh rendering, reduce dot geometry segments, implement level-of-detail (LOD)

### Issue: Stations sink into globe
- **Solution:** Increase height offset in latLonToVector3, adjust rendering order, check z-fighting

### Issue: Hover effect interferes with orbit controls
- **Solution:** Check event propagation, ensure OrbitControls damping is enabled, test event listener order

---

## Performance Targets

- **Rendering:** 60 FPS with 100+ ground stations
- **Interaction:** Click detection < 16ms response time
- **Loading:** Station data load < 500ms
- **Memory:** < 50MB additional memory for 100 stations

---

## Next Steps (Post-Completion)

After completing Task 1.2, proceed to:
- **Task 1.3:** Add satellite tracking and line-of-sight visualization
- **Task 1.4:** Implement latency calculation and heatmap display

---

## Completion Checklist

- [ ] All subtasks completed
- [ ] Ground stations visible on globe
- [ ] Click interaction working
- [ ] Info panel displaying correct data
- [ ] Performance meets 60fps target
- [ ] Code documented and commented
- [ ] No console errors
- [ ] Browser compatibility verified
- [ ] Changes committed to repository

---

## Known Issues (To Fix Later)

### Issue: Station Selection Not Persisting
**Description:** After selecting one station and deselecting it, other stations cannot be selected. The selection state appears to get stuck.

**Symptoms:**
- First station selection works correctly (turns blue)
- After deselection, clicking other stations doesn't trigger selection
- Station may revert to red after a short time

**Potential Causes:**
- Material sharing between stations causing state conflicts
- Event propagation interfering with raycaster
- Hover effect resetting selection state

**Priority:** Medium
**Status:** To be fixed after Task 1.2.7 completion

