# Task 1.3: Satellite Rendering and Real-Time Tracking
**Estimated Time:** 5-6 hours  
**Priority:** P1 (Core Feature)  
**Owner:** 3D/Graphics Dev / Backend Dev

## Overview
Implement real-time satellite tracking visualization on the 3D globe. Fetch Two-Line Element (TLE) data from CelesTrak, propagate satellite orbits using SGP4, and render satellites as color-coded points that update in real-time.

## Success Criteria
- [ ] Fetch TLE data from CelesTrak for 50-100 satellites
- [ ] Successfully propagate satellite orbits using SGP4
- [ ] Render satellites as visible colored spheres on globe
- [ ] Color-code by orbit type (LEO=blue, MEO=green, GEO=red)
- [ ] Update satellite positions in real-time (every 1-2 seconds)
- [ ] Click interaction to select satellites
- [ ] Display satellite info panel (name, altitude, velocity, orbit)
- [ ] Maintain 60fps performance
- [ ] Smooth satellite movement animation

---

## Resources Required

### External APIs & Data Sources

#### CelesTrak TLE Data
CelesTrak provides free TLE (Two-Line Element) data for satellites:

**Primary Endpoints:**
- Active Satellites: `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle`
<!-- - Starlink: `https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle`
- GPS Operational: `https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle`
- Iridium: `https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium&FORMAT=tle`
- Weather Satellites: `https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle`
- Space Stations: `https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle` -->

**Alternative Format (JSON):**
<!-- - `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json` -->

**TLE Format Example:**
```
ISS (ZARYA)
1 25544U 98067A   23365.52624769  .00012654  00000+0  22539-3 0  9992
2 25544  51.6416 286.5007 0001191  89.5245  24.4458 15.50066021432123
```

### JavaScript Libraries

#### satellite.js
- **Purpose:** SGP4 orbit propagation in JavaScript
- **GitHub:** https://github.com/shashwatak/satellite-js
- **Installation:** `npm install satellite.js`
- **Features:**
  - TLE parsing
  - SGP4/SDP4 propagation
  - Coordinate conversions (ECI → ECEF → Geodetic)
  - Doppler calculations

**Example Usage:**
```javascript
import * as satellite from 'satellite.js';

// Parse TLE
const tleLine1 = '1 25544U 98067A   23365.52624769  .00012654  00000+0  22539-3 0  9992';
const tleLine2 = '2 25544  51.6416 286.5007 0001191  89.5245  24.4458 15.50066021432123';
const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

// Propagate to current time
const date = new Date();
const positionAndVelocity = satellite.propagate(satrec, date);

// Convert to geodetic coordinates (lat, lon, alt)
const gmst = satellite.gstime(date);
const positionGd = satellite.eciToGeodetic(positionAndVelocity.position, gmst);
```

### Dependencies
- [x] Three.js (already installed)
- [ ] satellite.js - For SGP4 orbit propagation
- [ ] TLE data from CelesTrak
- [ ] Performance: InstancedMesh for efficient rendering

### Mathematical Concepts
- **TLE (Two-Line Element Set):** Standard format for satellite orbital elements
- **SGP4:** Simplified General Perturbations model for orbit propagation
- **Coordinate Systems:**
  - ECI (Earth-Centered Inertial)
  - ECEF (Earth-Centered Earth-Fixed)
  - Geodetic (Latitude, Longitude, Altitude)
- **Orbit Types:**
  - LEO (Low Earth Orbit): < 2,000 km altitude
  - MEO (Medium Earth Orbit): 2,000 - 35,786 km altitude
  - GEO (Geostationary Orbit): ~35,786 km altitude

### Development Tools
- [x] Browser DevTools for debugging
- [ ] CelesTrak API testing
- [ ] Performance profiler

### Documentation References
- [ ] CelesTrak: https://celestrak.org/
- [ ] satellite.js GitHub: https://github.com/shashwatak/satellite-js
- [ ] SGP4 documentation: https://en.wikipedia.org/wiki/Simplified_perturbations_models
- [ ] TLE format: https://en.wikipedia.org/wiki/Two-line_element_set

---

## Task Breakdown

### Task 1.3.1: Install and Setup satellite.js Library (15 minutes)

- [x] Install satellite.js via npm
  - [x] Run `npm install satellite.js`
  - [x] Verify installation in package.json
  - [x] Test import in JavaScript

- [x] Create satellite module structure
  - [x] Added satellite variables to globe.js
  - [x] Set up satellite arrays for data storage
  - [x] Ready for satellite.js integration

- [x] Add satellite.js to HTML
  - [x] Added to importmap as ES module via CDN
  - [x] Proper loading order ensured


### Task 1.3.2: Fetch TLE Data from CelesTrak (30 minutes)

- [x] Create TLE fetching function
  - [x] Use fetch API to get TLE data
  - [x] Handle CORS if necessary (using direct fetch)
  - [x] Parse TLE text format
  - [x] Store satellite data array

- [x] Parse TLE format
  - [x] Extract satellite name (line 0)
  - [x] Extract TLE line 1 (starts with "1 ")
  - [x] Extract TLE line 2 (starts with "2 ")
  - [x] Group into satellite objects with validation

- [x] Select satellite groups
  - [x] Using "active" satellites group from CelesTrak
  - [x] Limited to 50 satellites for initial testing
  - [x] Can expand to more groups later

- [x] Implement caching
  - [x] Cache TLE data in localStorage
  - [x] Set cache expiry (6 hours)
  - [x] Refresh on expiry with fallback to expired cache on error

**Code Structure:**
```javascript
// Fetch TLE data from CelesTrak
async function fetchTLEData(group = 'stations') {
    try {
        const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        return parseTLE(text);
    } catch (error) {
        console.error('Error fetching TLE data:', error);
        return [];
    }
}

// Parse TLE text format
function parseTLE(tleText) {
    const lines = tleText.trim().split('\n');
    const satellites = [];
    
    for (let i = 0; i < lines.length; i += 3) {
        if (i + 2 < lines.length) {
            satellites.push({
                name: lines[i].trim(),
                tleLine1: lines[i + 1].trim(),
                tleLine2: lines[i + 2].trim()
            });
        }
    }
    
    console.log(`Parsed ${satellites.length} satellites from TLE data`);
    return satellites;
}

// Load multiple satellite groups
async function loadSatellites() {
    const groups = ['stations', 'starlink', 'gps-ops', 'weather'];
    const allSatellites = [];
    
    for (const group of groups) {
        const sats = await fetchTLEData(group);
        allSatellites.push(...sats.slice(0, 25)); // 25 per group = 100 total
    }
    
    return allSatellites;
}
```

---

### Task 1.3.3: Implement SGP4 Orbit Propagation (45 minutes)

- [x] Create satellite record from TLE
  - [x] Use satellite.twoline2satrec()
  - [x] Store satrec for each satellite
  - [x] Handle parsing errors with validation

- [x] Propagate satellite position
  - [x] Use satellite.propagate() with current time
  - [x] Get position and velocity in ECI coordinates
  - [x] Handle propagation errors and invalid positions

- [x] Convert coordinates
  - [x] ECI to Geodetic using GMST
  - [x] Convert to lat, lon, alt format
  - [x] Convert radians to degrees

- [x] Calculate orbit parameters
  - [x] Determine orbit type (LEO/MEO/GEO) based on altitude
  - [x] Calculate altitude from Earth's surface
  - [x] Calculate velocity magnitude in km/s

<!-- **Code Structure:** -->
<!-- ```javascript
// Initialize satellite from TLE
function initializeSatellite(satData) {
    const satrec = satellite.twoline2satrec(
        satData.tleLine1,
        satData.tleLine2
    );
    
    if (satrec.error) {
        console.error('TLE parsing error for', satData.name);
        return null;
    }
    
    return {
        name: satData.name,
        satrec: satrec,
        tleLine1: satData.tleLine1,
        tleLine2: satData.tleLine2
    };
}

// Propagate satellite position at given time
function propagateSatellite(sat, date) {
    const positionAndVelocity = satellite.propagate(sat.satrec, date);
    
    if (positionAndVelocity.error) {
        console.error('Propagation error for', sat.name);
        return null;
    }
    
    const positionEci = positionAndVelocity.position;
    const velocityEci = positionAndVelocity.velocity;
    
    // Convert ECI to Geodetic
    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);
    
    // Convert to degrees and kilometers
    const latitude = satellite.degreesLat(positionGd.latitude);
    const longitude = satellite.degreesLong(positionGd.longitude);
    const altitude = positionGd.height; // km above Earth's surface
    
    // Calculate velocity magnitude
    const velocity = Math.sqrt(
        velocityEci.x * velocityEci.x +
        velocityEci.y * velocityEci.y +
        velocityEci.z * velocityEci.z
    );
    
    return {
        latitude,
        longitude,
        altitude,
        velocity,
        timestamp: date
    };
}

// Determine orbit type based on altitude
function getOrbitType(altitude) {
    if (altitude < 2000) return 'LEO'; // Low Earth Orbit
    if (altitude < 35786) return 'MEO'; // Medium Earth Orbit
    return 'GEO'; // Geostationary Orbit
}

// Get color based on orbit type
function getOrbitColor(orbitType) {
    switch (orbitType) {
        case 'LEO': return 0x4da6ff; // Blue
        case 'MEO': return 0x00ff00; // Green
        case 'GEO': return 0xff0000; // Red
        default: return 0xffffff; // White
    }
}
``` -->

---

### Task 1.3.4: Create Satellite Geometry and Material (30 minutes)

- [x] Design satellite visual appearance
  - [x] Choose size (0.01 radius - smaller than ground stations)
  - [x] Create sphere geometry (8 segments for performance)
  - [x] Test visibility at various altitudes

- [x] Create color-coded materials
  - [x] LEO satellites: Blue (#4da6ff)
  - [x] MEO satellites: Green (#00ff00)
  - [x] GEO satellites: Red (#ff0000)
  - [x] Emissive for visibility (0.9 intensity)

- [x] Implement rendering
  - [x] Individual materials per satellite to avoid sharing issues
  - [x] Simple geometry for performance
  - [x] Store satellite data in mesh.userData

<!-- **Code Structure:**
```javascript
// Create geometry for satellites
function createSatelliteGeometry() {
    const radius = 0.01; // Satellite size
    const segments = 8;   // Lower segments for performance
    return new THREE.SphereGeometry(radius, segments, segments);
}

// Create material for satellite based on orbit type
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

// Store satellite meshes and data
let satelliteMeshes = [];
let satelliteData = [];
let satelliteRecords = [];
``` -->

---

### Task 1.3.5: Render Satellites on Globe (40 minutes)

- [x] Convert satellite position to globe coordinates
  - [x] Use latLonToVector3 function (from ground stations)
  - [x] Add altitude offset (scaled appropriately)
  - [x] Handle altitude scaling (altitude/earthRadius * globeRadius)

- [x] Create satellite meshes
  - [x] Create mesh for each satellite
  - [x] Position at correct location
  - [x] Store satellite metadata in mesh.userData

- [x] Rendering implementation
  - [x] Loop through all satellite records
  - [x] Apply correct material based on orbit type
  - [x] Position meshes at calculated coordinates

- [x] Add to scene
  - [x] Add all satellite meshes to scene
  - [x] Store in satelliteMeshes array
  - [x] Log render statistics by orbit type

<!-- **Code Structure:**
```javascript
// Convert satellite geodetic position to globe 3D coordinates
function satelliteToGlobePosition(lat, lon, altitudeKm) {
    // Earth radius in our model is 1
    // Scale altitude appropriately (e.g., 1 unit = 6371 km Earth radius)
    const earthRadius = 1.0;
    const altitudeScale = 0.0002; // Scale factor for altitude
    const height = altitudeKm * altitudeScale;
    
    return latLonToVector3(lat, lon, earthRadius, height);
}

// Render satellites on the globe
function renderSatellites(satellites) {
    const geometry = createSatelliteGeometry();
    const date = new Date();
    
    satellites.forEach(sat => {
        // Initialize satellite record
        const satRec = initializeSatellite(sat);
        if (!satRec) return;
        
        // Propagate position
        const position = propagateSatellite(satRec, date);
        if (!position) return;
        
        // Determine orbit type and color
        const orbitType = getOrbitType(position.altitude);
        const material = createSatelliteMaterial(orbitType);
        
        // Convert to globe coordinates
        const globePos = satelliteToGlobePosition(
            position.latitude,
            position.longitude,
            position.altitude
        );
        
        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(globePos);
        
        // Store metadata
        mesh.userData = {
            name: sat.name,
            latitude: position.latitude,
            longitude: position.longitude,
            altitude: position.altitude,
            velocity: position.velocity,
            orbitType: orbitType
        };
        
        // Add to scene and arrays
        scene.add(mesh);
        satelliteMeshes.push(mesh);
        satelliteRecords.push(satRec);
    });
    
    console.log(`✓ Rendered ${satelliteMeshes.length} satellites`);
}
``` -->

---

### Task 1.3.6: Implement Real-Time Position Updates (50 minutes)

- [x] Create update loop
  - [x] Update every 2 seconds (configurable)
  - [x] Propagate all satellites using SGP4
  - [x] Update mesh positions with targets

- [x] Implement smooth interpolation
  - [x] Store previous and next positions
  - [x] Interpolate between updates using lerp
  - [x] Update every animation frame (60 FPS)

- [x] Handle time management
  - [x] Use system time (Date.now())
  - [x] Handle time zone correctly (UTC)
  - [x] Update interval: 2000ms (2 seconds)

- [x] Optimize update performance
  - [x] Batch updates (all satellites at once)
  - [x] Smooth interpolation to avoid jitter
  - [x] Validation checks for null values

<!-- **Code Structure:**
```javascript
// Real-time satellite update system
let lastUpdateTime = 0;
const updateInterval = 2000; // 2 seconds
let satellitePositions = []; // Current positions
let targetPositions = [];    // Target positions for interpolation

// Main update function
function updateSatellitePositions() {
    const currentTime = Date.now();
    
    // Check if we need to propagate new positions
    if (currentTime - lastUpdateTime >= updateInterval) {
        propagateAllSatellites();
        lastUpdateTime = currentTime;
    }
    
    // Interpolate positions for smooth animation
    interpolateSatellitePositions();
}

// Propagate all satellite positions
function propagateAllSatellites() {
    const date = new Date();
    
    satelliteRecords.forEach((satRec, index) => {
        const position = propagateSatellite(satRec, date);
        
        if (position) {
            // Store current position as previous
            satellitePositions[index] = satelliteMeshes[index].position.clone();
            
            // Calculate new target position
            const globePos = satelliteToGlobePosition(
                position.latitude,
                position.longitude,
                position.altitude
            );
            targetPositions[index] = globePos;
            
            // Update userData
            satelliteMeshes[index].userData.latitude = position.latitude;
            satelliteMeshes[index].userData.longitude = position.longitude;
            satelliteMeshes[index].userData.altitude = position.altitude;
            satelliteMeshes[index].userData.velocity = position.velocity;
        }
    });
}

// Smooth interpolation between positions
function interpolateSatellitePositions() {
    const currentTime = Date.now();
    const timeSinceUpdate = currentTime - lastUpdateTime;
    const alpha = Math.min(timeSinceUpdate / updateInterval, 1.0);
    
    satelliteMeshes.forEach((mesh, index) => {
        if (satellitePositions[index] && targetPositions[index]) {
            // Linear interpolation (lerp)
            mesh.position.lerpVectors(
                satellitePositions[index],
                targetPositions[index],
                alpha
            );
        }
    });
}

// Add to animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update satellite positions
    updateSatellitePositions();
    
    // Update controls
    if (controls) {
        controls.update();
    }
    
    renderer.render(scene, camera);
}
``` -->

---

### Task 1.3.7: Add Satellite Interaction with Orbital Path Visualization (60 minutes)

**Goal:** Enable interactive satellite selection with real-time orbital path visualization

#### Subtask 1.3.7.1: Implement Satellite Raycasting (15 minutes)

- [x] **Setup raycaster for satellites:**
  - [x] Use existing raycaster (from ground stations)
  - [x] Add satelliteMeshes to raycast targets
  - [x] Detect mouse hover on satellites
  - [x] Detect mouse click on satellites
  - [x] Handle click/drag distinction (use existing clickThreshold)

#### Subtask 1.3.7.2: Calculate Orbital Path (20 minutes)

- [x] **Create orbital path calculation function:**
  - [x] Propagate satellite forward in time (1 full orbit period)
  - [x] Calculate position at regular intervals
  - [x] Store positions as array of Vector3 points
  - [x] Handle different orbit types (LEO: 90 min, MEO: 12 hrs, GEO: 24 hrs)

- [x] **Optimize path calculation:**
  - [x] Cache calculated paths for performance (Map-based cache)
  - [x] Use appropriate number of points based on orbit type:
    - LEO: 80 points (fast orbit)
    - MEO: 120 points (medium orbit)
    - GEO: 180 points (slow orbit, more detail)

#### Subtask 1.3.7.3: Render Orbital Path (15 minutes)

- [x] **Create orbital path visualization:**
  - [x] Use THREE.Line for orbit path
  - [x] Gray color for hover state: `#5E6A7A` (disabled text from theme)
  - [x] Brighter color for selected state: `#9BB3C9` (secondary text from theme)
  - [x] Make line slightly transparent (opacity: 0.6 hover, 0.8 selected)
  - [x] LineBasicMaterial with transparent property

- [x] **Path rendering logic:**
  - [x] Create line geometry from calculated points
  - [x] Add to scene only when satellite is hovered/selected
  - [x] Remove when hover ends (unless selected)
  - [x] Proper geometry/material disposal to prevent memory leaks

#### Subtask 1.3.7.4: Implement Hover Effects (10 minutes)

- [x] **On satellite hover:**
  - [x] Calculate and render orbital path (gray line)
  - [x] Scale up satellite mesh (1.3x)
  - [x] Increase emissive intensity (1.2x)
  - [x] Change cursor to pointer
  - [x] Prevent hover effect on selected satellite

- [x] **On hover end:**
  - [x] Remove orbital path (unless satellite is selected)
  - [x] Reset satellite scale
  - [x] Reset emissive intensity
  - [x] Reset cursor

#### Subtask 1.3.7.5: Implement Click/Selection (15 minutes)

- [x] **On satellite click:**
  - [x] Deselect previous satellite (if any)
  - [x] Select clicked satellite
  - [x] Keep orbital path visible (change color to brighter)
  - [x] Scale satellite more (1.5x)
  - [x] Increase emissive intensity (1.4x)
  - [x] Display satellite info panel with:
    - Satellite name
    - Orbit type (LEO/MEO/GEO)
    - Altitude (km)
    - Velocity (km/s)
    - Current latitude
    - Current longitude

- [x] **On deselect (click empty space or close panel):**
  - [x] Remove orbital path
  - [x] Reset satellite scale and effects
  - [x] Hide info panel
  - [x] Toggle selection (click same satellite to deselect)

#### Subtask 1.3.7.6: Create Satellite Info Panel (15 minutes)

- [x] **Add new HTML info panel for satellites:**
  - [x] Similar to ground station panel
  - [x] Space Operations Theme styling
  - [x] Show satellite-specific data (name, orbit, altitude, velocity, lat/lon)
  - [x] Add close button
  - [x] Position: top-left (ground station panel is top-right)

- [x] **Update CSS:**
  - [x] Satellite panel with cyan accent (#00E5FF)
  - [x] Match Space Operations Theme
  - [x] Smooth transitions
  - [x] Proper z-index and backdrop blur

- [x] **JavaScript functions:**
  - [x] `displaySatelliteInfo(satelliteData)`
  - [x] `hideSatelliteInfo()`
  - [x] `setupSatelliteInfoPanelHandlers()`
  - [x] Update panel content dynamically

<!-- **Code Structure:**
```javascript
// Track selected satellite
let selectedSatellite = null;
let hoveredSatellite = null;

// Handle click on satellites or stations
function onObjectClick(event) {
    mouseUpPos.x = event.clientX;
    mouseUpPos.y = event.clientY;
    
    // Check for drag
    const dx = mouseUpPos.x - mouseDownPos.x;
    const dy = mouseUpPos.y - mouseDownPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > clickThreshold) {
        return; // It's a drag, not a click
    }
    
    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    
    // Check satellites first, then stations
    const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes);
    const stationIntersects = raycaster.intersectObjects(stationMeshes);
    
    if (satelliteIntersects.length > 0) {
        handleSatelliteClick(satelliteIntersects[0].object);
    } else if (stationIntersects.length > 0) {
        handleStationClick(stationIntersects[0].object);
    } else {
        // Clicked empty space
        deselectAll();
    }
}

// Handle satellite selection
function handleSatelliteClick(mesh) {
    // Reset previous selection
    if (selectedSatellite && selectedSatellite !== mesh) {
        resetSatelliteAppearance(selectedSatellite);
    }
    
    // Deselect if clicking same satellite
    if (selectedSatellite === mesh) {
        resetSatelliteAppearance(mesh);
        selectedSatellite = null;
        hideSatelliteInfo();
    } else {
        // Select new satellite
        selectedSatellite = mesh;
        highlightSatellite(mesh);
        displaySatelliteInfo(mesh.userData);
    }
}

// Highlight selected satellite
function highlightSatellite(mesh) {
    mesh.scale.set(2.0, 2.0, 2.0);
    mesh.material.emissiveIntensity = 1.5;
}

// Reset satellite appearance
function resetSatelliteAppearance(mesh) {
    mesh.scale.set(1, 1, 1);
    mesh.material.emissiveIntensity = 0.9;
}

// Hover effect for satellites
function onObjectHover(event) {
    updateMousePosition(event);
    raycaster.setFromCamera(mouse, camera);
    
    const satelliteIntersects = raycaster.intersectObjects(satelliteMeshes);
    const stationIntersects = raycaster.intersectObjects(stationMeshes);
    
    // Reset previous hover
    if (hoveredSatellite && hoveredSatellite !== selectedSatellite) {
        resetSatelliteAppearance(hoveredSatellite);
        hoveredSatellite = null;
    }
    
    if (satelliteIntersects.length > 0) {
        const mesh = satelliteIntersects[0].object;
        
        if (mesh !== selectedSatellite) {
            renderer.domElement.style.cursor = 'pointer';
            mesh.scale.set(1.5, 1.5, 1.5);
            mesh.material.emissiveIntensity = 1.2;
            hoveredSatellite = mesh;
            
            // Show tooltip
            showSatelliteTooltip(mesh.userData.name, event);
        }
    } else if (stationIntersects.length > 0) {
        // Handle station hover (existing code)
        renderer.domElement.style.cursor = 'pointer';
    } else {
        renderer.domElement.style.cursor = 'default';
        hideTooltip();
    }
}
``` -->

---

### Task 1.3.8: Optimize Orbital Path Rendering (30 minutes)

**Goal:** Ensure smooth performance with orbital path visualization

- [ ] **Performance optimizations:**
  - [ ] Cache calculated orbital paths (recalculate only when needed)
  - [ ] Use object pooling for line geometries
  - [ ] Dispose of unused geometries properly
  - [ ] Limit to one visible path at a time (hover or selection)

- [ ] **Visual enhancements:**
  - [ ] Add fade-in/fade-out animations for orbital paths
  - [ ] Use dashed line for future orbital path
  - [ ] Add markers for specific points (e.g., apogee, perigee)
  - [ ] Optional: Show time markers along orbit

- [ ] **Update rate optimization:**
  - [ ] Recalculate orbital path only when satellite is selected
  - [ ] Update path visualization every 10-30 seconds (not every frame)
  - [ ] Use requestIdleCallback for non-critical updates

**HTML Structure:**
```html
<!-- Add to index.html -->
<div id="satellite-info" class="info-panel hidden" style="top: 20px; left: 20px;">
    <button id="close-satellite-info" class="close-btn">&times;</button>
    <h3 id="satellite-name">Satellite Name</h3>
    <div class="info-row">
        <span class="label">Orbit Type:</span>
        <span class="value" id="satellite-orbit-type">-</span>
    </div>
    <div class="info-row">
        <span class="label">Altitude:</span>
        <span class="value" id="satellite-altitude">-</span>
    </div>
    <div class="info-row">
        <span class="label">Velocity:</span>
        <span class="value" id="satellite-velocity">-</span>
    </div>
    <div class="info-row">
        <span class="label">Latitude:</span>
        <span class="value" id="satellite-lat">-</span>
    </div>
    <div class="info-row">
        <span class="label">Longitude:</span>
        <span class="value" id="satellite-lon">-</span>
    </div>
</div>
```

**JavaScript Functions:**
```javascript
// Display satellite information panel
function displaySatelliteInfo(satData) {
    const panel = document.getElementById('satellite-info');
    if (!panel) return;
    
    document.getElementById('satellite-name').textContent = satData.name;
    document.getElementById('satellite-orbit-type').textContent = satData.orbitType;
    document.getElementById('satellite-altitude').textContent = satData.altitude.toFixed(1) + ' km';
    document.getElementById('satellite-velocity').textContent = (satData.velocity).toFixed(2) + ' km/s';
    document.getElementById('satellite-lat').textContent = satData.latitude.toFixed(4) + '°';
    document.getElementById('satellite-lon').textContent = satData.longitude.toFixed(4) + '°';
    
    panel.classList.remove('hidden');
    panel.style.display = 'block';
}

// Hide satellite information panel
function hideSatelliteInfo() {
    const panel = document.getElementById('satellite-info');
    if (panel) {
        panel.classList.add('hidden');
        panel.style.display = 'none';
    }
}

// Setup close button
document.getElementById('close-satellite-info')?.addEventListener('click', () => {
    hideSatelliteInfo();
    if (selectedSatellite) {
        resetSatelliteAppearance(selectedSatellite);
        selectedSatellite = null;
    }
});
```

---

### Task 1.3.9: Polish and Testing (30 minutes)

**Goal:** Final refinements and comprehensive testing

- [ ] **Visual polish:**
  - [ ] Ensure smooth transitions for all effects
  - [ ] Verify colors match Space Operations Theme
  - [ ] Test visibility of orbital paths against background
  - [ ] Adjust line thickness/opacity if needed

- [ ] **Interaction testing:**
  - [ ] Test hover on all satellite types (LEO/MEO/GEO)
  - [ ] Test click selection and deselection
  - [ ] Test switching between satellites
  - [ ] Test interaction with ground stations (no conflicts)
  - [ ] Test info panel display and closing

- [ ] **Performance testing:**
  - [ ] Monitor FPS with orbital path visible
  - [ ] Test with multiple rapid hovers
  - [ ] Check memory leaks (geometry disposal)
  - [ ] Verify smooth animation at 60 FPS

- [ ] **Edge case handling:**
  - [ ] Handle clicking same satellite twice
  - [ ] Handle rapid switching between satellites
  - [ ] Handle clicking ground station while satellite selected
  - [ ] Handle window resize with panels open

<!-- **HTML Structure:**
```html
<!-- Add to index.html -->
<!-- <div id="satellite-tooltip" class="tooltip hidden">
    <span id="tooltip-text"></span>
</div> --> -->
```

**CSS:**
```css
.tooltip {
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    pointer-events: none;
    z-index: 2000;
    white-space: nowrap;
}

.tooltip.hidden {
    display: none;
}
```

**JavaScript:**
```javascript
// Show tooltip
function showSatelliteTooltip(text, event) {
    const tooltip = document.getElementById('satellite-tooltip');
    const tooltipText = document.getElementById('tooltip-text');
    
    if (tooltip && tooltipText) {
        tooltipText.textContent = text;
        tooltip.classList.remove('hidden');
        
        // Position near mouse
        tooltip.style.left = (event.clientX + 15) + 'px';
        tooltip.style.top = (event.clientY + 15) + 'px';
    }
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.getElementById('satellite-tooltip');
    if (tooltip) {
        tooltip.classList.add('hidden');
    }
}
```

---

### Task 1.3.10: Integration and Testing (40 minutes)

- [ ] Integrate all components
  - [ ] Load satellites on init
  - [ ] Start update loop
  - [ ] Set up event listeners
  - [ ] Test interaction

- [ ] Test TLE fetching
  - [ ] Verify CelesTrak API works
  - [ ] Handle network errors
  - [ ] Test with different satellite groups

- [ ] Test orbit propagation
  - [ ] Verify positions are accurate
  - [ ] Check altitude ranges
  - [ ] Test over time

- [ ] Test rendering
  - [ ] Verify all satellites visible
  - [ ] Check color coding
  - [ ] Test performance

- [ ] Test interaction
  - [ ] Click detection
  - [ ] Hover effects
  - [ ] Info panel display

- [ ] Performance testing
  - [ ] Check FPS with 100 satellites
  - [ ] Profile update loop
  - [ ] Optimize if needed

**Integration Code:**
<!-- ```javascript
// Updated init function with satellites
async function init() {
    // ... existing globe and ground station setup ...
    
    // Load and render satellites
    console.log('Loading satellites from CelesTrak...');
    const satellites = await loadSatellites();
    
    if (satellites.length > 0) {
        renderSatellites(satellites);
        console.log(`✓ Loaded ${satellites.length} satellites`);
        
        // Start real-time updates
        lastUpdateTime = Date.now();
        propagateAllSatellites();
    } else {
        console.warn('No satellites loaded');
    }
    
    // Setup event listeners (update existing handlers)
    setupInteractionHandlers();
}

// Setup unified interaction handlers
function setupInteractionHandlers() {
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('click', onObjectClick);
    renderer.domElement.addEventListener('mousemove', onObjectHover);
}
``` -->

---

## File Structure

```
latency-map/
├── index.html (updated with satellite info panel and tooltip)
├── js/
│   ├── globe.js (updated with satellite integration)
│   └── satellites.js (new: satellite-specific functions)
├── data/
│   ├── ground-stations.json
│   └── satellites-cache.json (optional: cached TLE data)
├── texture/
│   └── nasa-blue-marble-1.png
└── package.json (updated with satellite.js)
```

---

## Common Issues and Solutions

### Issue: CORS errors when fetching from CelesTrak
- **Solution:** Use a CORS proxy or set up a backend endpoint to fetch TLE data

### Issue: Satellite positions are inaccurate
- **Solution:** Verify TLE data is recent (< 7 days old), check coordinate conversion, ensure correct GMST calculation

### Issue: Satellites moving too fast/slow
- **Solution:** Adjust update interval, check interpolation alpha calculation, verify time zone handling

### Issue: Performance drops with many satellites
- **Solution:** Use InstancedMesh, reduce update frequency, implement level-of-detail, cull off-screen satellites

### Issue: Satellites appear at wrong altitude
- **Solution:** Check altitude scaling factor, verify Earth radius in model, adjust height offset in latLonToVector3

### Issue: Cannot distinguish satellites from ground stations
- **Solution:** Use different sizes, colors, or shapes; implement filtering; add legend

---

## Performance Targets

- **Rendering:** 60 FPS with 100 satellites + 20 ground stations
- **Update Loop:** < 50ms for position propagation of all satellites
- **TLE Fetch:** < 2 seconds for initial load
- **Memory:** < 100MB total for satellite data and meshes
- **Interaction:** Click/hover response < 16ms

---

## Testing Checklist

- [ ] Visual Testing
  - [ ] All satellites visible on globe
  - [ ] Colors correct for orbit types
  - [ ] Smooth movement
  - [ ] Proper scaling at different zoom levels

- [ ] Functional Testing
  - [ ] TLE data fetches successfully
  - [ ] SGP4 propagation works correctly
  - [ ] Real-time updates working
  - [ ] Click selection works
  - [ ] Hover tooltips show
  - [ ] Info panel displays correct data

- [ ] Performance Testing
  - [ ] 60 FPS maintained
  - [ ] Update loop efficient
  - [ ] No memory leaks
  - [ ] Smooth interaction

- [ ] Edge Cases
  - [ ] Network failure handling
  - [ ] Invalid TLE data
  - [ ] Satellite propagation errors
  - [ ] Time zone issues

---

## Next Steps (Post-Completion)

After completing Task 1.3, proceed to:
- **Task 1.4:** Implement satellite-to-ground station line-of-sight visualization
- **Task 1.5:** Calculate and display latency for satellite-ground station links
- **Task 1.6:** Add orbit path visualization

---

## Completion Checklist

- [ ] satellite.js installed and configured
- [ ] TLE data successfully fetched from CelesTrak
- [ ] SGP4 orbit propagation working
- [ ] Satellites rendered on globe
- [ ] Color-coded by orbit type
- [ ] Real-time position updates working
- [ ] Smooth animation with interpolation
- [ ] Click interaction implemented
- [ ] Hover tooltips working
- [ ] Satellite info panel functional
- [ ] Performance meets 60fps target
- [ ] Code documented and commented
- [ ] No console errors
- [ ] Testing completed

