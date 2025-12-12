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
- Starlink: `https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle`
- GPS Operational: `https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle`
- Iridium: `https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium&FORMAT=tle`
- Weather Satellites: `https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle`
- Space Stations: `https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle`

**Alternative Format (JSON):**
- `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json`

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

- [ ] Install satellite.js via npm
  - [ ] Run `npm install satellite.js`
  - [ ] Verify installation in package.json
  - [ ] Test import in JavaScript

- [ ] Create satellite module structure
  - [ ] Create `js/satellites.js` file
  - [ ] Set up module exports/imports
  - [ ] Test basic satellite.js functions

- [ ] Add satellite.js to HTML
  - [ ] Import as ES module or via CDN
  - [ ] Ensure proper loading order

**Installation Command:**
```bash
npm install satellite.js
```

**Test Code:**
```javascript
import * as satellite from 'satellite.js';
console.log('satellite.js loaded:', typeof satellite.twoline2satrec);
```

---

### Task 1.3.2: Fetch TLE Data from CelesTrak (30 minutes)

- [ ] Create TLE fetching function
  - [ ] Use fetch API to get TLE data
  - [ ] Handle CORS if necessary
  - [ ] Parse TLE text format
  - [ ] Store satellite data array

- [ ] Parse TLE format
  - [ ] Extract satellite name (line 0)
  - [ ] Extract TLE line 1
  - [ ] Extract TLE line 2
  - [ ] Group into satellite objects

- [ ] Select satellite groups
  - [ ] Choose 50-100 satellites for display
  - [ ] Options: ISS, Starlink, GPS, Iridium, Weather sats
  - [ ] Balance between orbit types

- [ ] Implement caching
  - [ ] Cache TLE data in localStorage
  - [ ] Set cache expiry (6 hours recommended)
  - [ ] Refresh on expiry

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

- [ ] Create satellite record from TLE
  - [ ] Use satellite.twoline2satrec()
  - [ ] Store satrec for each satellite
  - [ ] Handle parsing errors

- [ ] Propagate satellite position
  - [ ] Use satellite.propagate() with current time
  - [ ] Get position and velocity in ECI coordinates
  - [ ] Handle propagation errors

- [ ] Convert coordinates
  - [ ] ECI to ECEF using GMST
  - [ ] ECEF to Geodetic (lat, lon, alt)
  - [ ] Convert to globe coordinates

- [ ] Calculate orbit parameters
  - [ ] Determine orbit type (LEO/MEO/GEO)
  - [ ] Calculate altitude from Earth's surface
  - [ ] Calculate velocity magnitude

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

- [ ] Design satellite visual appearance
  - [ ] Choose size (recommend 0.008-0.012 radius)
  - [ ] Create sphere geometry
  - [ ] Test visibility at various altitudes

- [ ] Create color-coded materials
  - [ ] LEO satellites: Blue (#4da6ff)
  - [ ] MEO satellites: Green (#00ff00)
  - [ ] GEO satellites: Red (#ff0000)
  - [ ] Emissive for visibility

- [ ] Implement instanced rendering
  - [ ] Use THREE.InstancedMesh for performance
  - [ ] Group satellites by orbit type
  - [ ] Single draw call per orbit type

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

- [ ] Convert satellite position to globe coordinates
  - [ ] Use latLonToVector3 function (from ground stations)
  - [ ] Add altitude offset
  - [ ] Handle altitude scaling

- [ ] Create satellite meshes
  - [ ] Create mesh for each satellite
  - [ ] Position at correct location
  - [ ] Store satellite metadata

- [ ] Optimize rendering
  - [ ] Group by orbit type
  - [ ] Use instanced meshes
  - [ ] Minimize draw calls

- [ ] Add to scene
  - [ ] Add all satellite meshes
  - [ ] Ensure visibility
  - [ ] Test performance

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

- [ ] Create update loop
  - [ ] Update every 1-2 seconds
  - [ ] Propagate all satellites
  - [ ] Update mesh positions

- [ ] Implement smooth interpolation
  - [ ] Store previous and next positions
  - [ ] Interpolate between updates
  - [ ] Update every animation frame

- [ ] Handle time management
  - [ ] Use system time
  - [ ] Handle time zone correctly
  - [ ] Optional: Time acceleration control

- [ ] Optimize update performance
  - [ ] Only update visible satellites
  - [ ] Batch updates
  - [ ] Profile and optimize

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

### Task 1.3.7: Implement Satellite Interaction (40 minutes)

- [ ] Set up satellite raycasting
  - [ ] Use existing raycaster from ground stations
  - [ ] Add satellite meshes to intersection checks
  - [ ] Handle both stations and satellites

- [ ] Implement click detection
  - [ ] Detect clicks on satellites
  - [ ] Distinguish from ground stations
  - [ ] Handle selection state

- [ ] Implement hover effect
  - [ ] Show tooltip with satellite name
  - [ ] Highlight on hover
  - [ ] Scale or change color

- [ ] Handle selection states
  - [ ] Track selected satellite
  - [ ] Deselect previous selection
  - [ ] Visual feedback

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

### Task 1.3.8: Create Satellite Info Panel (35 minutes)

- [ ] Design satellite info panel HTML
  - [ ] Similar to ground station panel
  - [ ] Additional fields for satellites
  - [ ] Position to not overlap station panel

- [ ] Add satellite-specific fields
  - [ ] Satellite name
  - [ ] Orbit type (LEO/MEO/GEO)
  - [ ] Altitude (km)
  - [ ] Velocity (km/s)
  - [ ] Current coordinates

- [ ] Implement show/hide functionality
  - [ ] Display on satellite click
  - [ ] Hide on deselect
  - [ ] Close button

- [ ] Style the panel
  - [ ] Match app theme
  - [ ] Dark space-themed colors
  - [ ] Smooth animations

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

### Task 1.3.9: Add Tooltip for Satellite Hover (25 minutes)

- [ ] Create tooltip HTML element
  - [ ] Small floating div
  - [ ] Shows satellite name
  - [ ] Follows mouse cursor

- [ ] Implement tooltip positioning
  - [ ] Position near mouse
  - [ ] Offset to not block view
  - [ ] Keep within viewport

- [ ] Show/hide logic
  - [ ] Show on hover
  - [ ] Hide when mouse leaves
  - [ ] Update position on mouse move

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

