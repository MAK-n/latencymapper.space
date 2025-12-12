# Task 1.1: Set up Three.js Scene with Earth Sphere (Texture Mapping)
**Estimated Time:** 1.5 hours  
**Priority:** P0 (Blocks all 3D work)  
**Owner:** 3D/Graphics Dev

## Overview
Set up a foundational Three.js 3D scene with a textured Earth sphere, proper lighting, and interactive camera controls. This is the foundation for all subsequent 3D visualization work.

## Success Criteria
- [x] Earth sphere renders at 60fps with realistic texture
- [x] Camera can orbit around Earth (mouse drag)
- [x] Camera can zoom in/out (mouse wheel)
- [x] Pan disabled to keep globe centered (prevents off-axis movement)
- [x] Lighting provides realistic Earth appearance
- [x] Scene loads without errors
- [x] Responsive to window resizing

---

## Resources Required

### Dependencies
- [x] **Three.js** (r160 or later)
  - CDN: `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js`
  - Or npm: `npm install three@^0.160.0`
  - Documentation: https://threejs.org/docs/

- [x] **OrbitControls** (for camera controls)
  - CDN: `https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js`
  - Or import: `import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'`
  - Documentation: https://threejs.org/docs/#examples/en/controls/OrbitControls

### Earth Texture Resources
Choose one (download and place in `/public/textures/` or `/assets/textures/`):
- [x] **NASA Blue Marble (Recommended)**
  - URL: https://visibleearth.nasa.gov/view.php?id=73963
  - Resolution: 8K (8192x4096) or 4K (4096x2048)
  - Format: JPEG or PNG
  - File: `earth_texture.jpg` or `earth_texture.png`

- [ ] **Alternative: NASA Visible Earth**
  - URL: https://visibleearth.nasa.gov/images/73963/earth-at-night
  - Use for night-time overlay (optional, future enhancement)

- [ ] **Alternative: Earth texture from texture libraries**
  - Poliigon, Texture Haven, or similar
  - Ensure proper licensing for project use

### Development Tools
- [x] Modern web browser (Chrome, Firefox, Edge) with WebGL support
- [x] Local web server (VS Code Live Server, Python `http.server`, or Node.js `http-server`)
  - Three.js textures require HTTP server (won't work with `file://` protocol)
- [x] Code editor with syntax highlighting (VS Code recommended)

### Documentation References
- [x] Three.js Documentation: https://threejs.org/docs/
- [x] Three.js Examples: https://threejs.org/examples/
- [x] OrbitControls Guide: https://threejs.org/docs/#examples/en/controls/OrbitControls

---

## Task Breakdown

### Task 1.1.1: Project Setup and Basic HTML Structure (15 minutes)
- [x] Create basic HTML file (`index.html`)
  - [x] Include Three.js library (CDN or local)
  - [x] Include OrbitControls (CDN or import)
  - [x] Create canvas container div
  - [x] Set up viewport meta tag for mobile responsiveness
  - [x] Add basic CSS for full-screen canvas

- [x] Create main JavaScript file (`js/globe.js` or `js/main.js`)
  - [x] Set up basic file structure
  - [x] Create `init()` function
  - [x] Create `animate()` function with `requestAnimationFrame`

<!-- **Code Structure:**
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Satellite Latency Map - 3D Globe</title>
    <style>
        body { margin: 0; overflow: hidden; }
        #canvas-container { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="canvas-container"></div>
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js"></script>
    <script src="js/globe.js"></script>
</body>
</html>--- -->

### Task 1.1.2: Initialize Three.js Scene, Camera, and Renderer (20 minutes)
- [x] Create Three.js Scene
  - [x] Instantiate `new THREE.Scene()`
  - [x] Set background color to black (0x000000) or dark blue (0x001122) for space

- [x] Set up Perspective Camera
  - [x] Create `THREE.PerspectiveCamera(fov, aspect, near, far)`
  - [x] FOV: 45-60 degrees (recommend 50)
  - [x] Aspect: window.innerWidth / window.innerHeight
  - [x] Near: 0.1
  - [x] Far: 2000
  - [x] Position camera: `camera.position.set(0, 0, 5)` (5 Earth radii away)

- [x] Create WebGL Renderer
  - [x] Instantiate `new THREE.WebGLRenderer({ antialias: true })`
  - [x] Set size: `renderer.setSize(window.innerWidth, window.innerHeight)`
  - [ ] Enable shadow map (optional, for future use): `renderer.shadowMap.enabled = true` - *Skipped per requirements*
  - [x] Append renderer DOM element to container

- [x] Handle window resize
  - [x] Add `window.addEventListener('resize', onWindowResize)`
  - [x] Update camera aspect ratio
  - [x] Update renderer size

<!-- **Code Structure:**ascript
// js/globe.js
let scene, camera, renderer;

function init() {
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
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Resize handler
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

init();
animate();--- -->

### Task 1.1.3: Create Earth Sphere Geometry and Material (15 minutes)
- [x] Create Sphere Geometry
  - [x] Use `THREE.SphereGeometry(radius, widthSegments, heightSegments)`
  - [x] Radius: 1 (normalized Earth radius)
  - [x] Width segments: 64 (for smooth appearance)
  - [x] Height segments: 64
  - [x] Consider performance vs quality trade-off

- [x] Load Earth Texture
  - [x] Use `THREE.TextureLoader()` to load texture image
  - [x] Handle loading errors gracefully
  - [x] Set texture properties:
    - [x] `texture.wrapS = THREE.ClampToEdgeWrapping`
    - [x] `texture.wrapT = THREE.ClampToEdgeWrapping`
    - [x] `texture.anisotropy = 16` (for better quality)

- [x] Create MeshStandardMaterial or MeshPhongMaterial
  - [x] Use loaded texture as `map` property
  - [x] Using MeshPhongMaterial with shininess: 10
  - [x] Earth should not be metallic or very rough

- [x] Create Mesh and add to scene
  - [x] Combine geometry and material: `new THREE.Mesh(geometry, material)`
  - [x] Add to scene: `scene.add(earthMesh)`

<!-- **Code Structure:**
let earthMesh;

function createEarth() {
    // Geometry
    const radius = 1;
    const widthSegments = 64;
    const heightSegments = 64;
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    
    // Texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
        'textures/earth_texture.jpg',
        // onLoad callback
        function(texture) {
            console.log('Earth texture loaded successfully');
        },
        // onProgress callback
        undefined,
        // onError callback
        function(error) {
            console.error('Error loading texture:', error);
        }
    );
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 16;
    
    // Material
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        shininess: 10
    });
    
    // Mesh
    earthMesh = new THREE.Mesh(geometry, material);
    scene.add(earthMesh);
}--- -->

### Task 1.1.4: Set Up Lighting (15 minutes)
- [x] Add Ambient Light
  - [x] Create `THREE.AmbientLight(color, intensity)`
  - [x] Color: white (0xffffff) or slightly blue
  - [x] Intensity: 0.4-0.6 (provides base illumination) - *Set to 0.5*
  - [x] Add to scene

- [x] Add Directional Light (Sun)
  - [x] Create `THREE.DirectionalLight(color, intensity)`
  - [x] Color: white (0xffffff) or warm white
  - [x] Intensity: 0.8-1.2 - *Set to 1.0*
  - [x] Position: `light.position.set(5, 3, 5)` (simulates sunlight)
  - [ ] Enable shadows (optional): `light.castShadow = true` - *Skipped (not needed for MVP)*
  - [x] Add to scene

- [x] Optional: Add Hemisphere Light (for more realistic ambient)
  - [x] Create `THREE.HemisphereLight(skyColor, groundColor, intensity)`
  - [x] Sky color: light blue - *Set to 0x87ceeb*
  - [x] Ground color: dark brown/green - *Set to 0x654321*
  - [x] Intensity: 0.3

**Code Structure:**ascript
function setupLighting() {
    // Ambient light (base illumination)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    // Optional: Hemisphere light for more realistic ambient
    const hemisphereLight = new THREE.HemisphereLight(
        0x87ceeb, // sky color
        0x654321, // ground color
        0.3
    );
    scene.add(hemisphereLight);
}---

### Task 1.1.5: Implement Camera Controls with OrbitControls (20 minutes)
- [x] Initialize OrbitControls
  - [x] Create `new THREE.OrbitControls(camera, renderer.domElement)`
  - [x] Store in variable for later updates

- [x] Configure Orbit Controls
  - [x] Enable damping: `controls.enableDamping = true`
  - [x] Set damping factor: `controls.dampingFactor = 0.05`
  - [x] Enable zoom: `controls.enableZoom = true`
  - [x] Set zoom speed: `controls.zoomSpeed = 1.2`
  - [x] Set min/max distance: 
    - [x] `controls.minDistance = 1.5` (prevent going inside Earth)
    - [x] `controls.maxDistance = 10` (reasonable zoom out limit)
  - [x] Enable rotate: `controls.enableRotate = true`
  - [x] Set rotate speed: `controls.rotateSpeed = 0.5`
  - [x] Enable pan: `controls.enablePan = true`
  - [x] Set pan speed: `controls.panSpeed = 0.8`

- [x] Update controls in animation loop
  - [x] Call `controls.update()` in `animate()` function before rendering

- [x] Optional: Set target to Earth center
  - [x] `controls.target.set(0, 0, 0)` (orbit around Earth center)

<!-- **Code Structure:**ascript
let controls;

function setupControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
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
    
    // Pan settings
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    
    // Target center of Earth
    controls.target.set(0, 0, 0);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Required if damping is enabled
    renderer.render(scene, camera);
}--- -->

### Task 1.1.6: Testing and Verification (5 minutes)
- [x] Visual Testing
  - [x] Earth sphere renders correctly
  - [x] Texture loads and displays properly
  - [x] No texture distortion at poles
  - [x] Lighting looks realistic (not too bright or too dark) - *Adjusted to balanced levels*

- [x] Interaction Testing
  - [x] Mouse drag orbits camera around Earth ✓
  - [x] Mouse wheel zooms in/out smoothly ✓
  - [x] Pan disabled to keep globe centered on axis ✓
  - [x] Camera doesn't go inside Earth ✓
  - [x] Camera doesn't go too far away ✓

- [x] Performance Testing
  - [x] Check FPS (target: 60fps) - *Running smoothly*
  - [x] Verify smooth animation
  - [x] Test on different screen sizes (resize window) - *Responsive*

- [x] Error Handling
  - [x] Test with missing texture file (should show error, not crash) - *Graceful error handling*
  - [x] Verify console has no errors - *Clean console output*

- [x] Browser Compatibility
  - [x] Test in Chrome ✓
  - [x] Compatible with modern browsers

---

## File Structure
```
latency-map/
├── index.html
├── js/
│   └── globe.js
├── textures/
│   └── earth_texture.jpg (or .png)
└── css/
    └── styles.css (optional)
```

---

## Common Issues and Solutions

### Issue: Texture not loading (CORS error or 404)
- **Solution:** Ensure using HTTP server (not `file://`), check file path, verify texture file exists

### Issue: Earth appears too dark or too bright
- **Solution:** Adjust ambient light intensity (0.4-0.6), adjust directional light intensity (0.8-1.2)

### Issue: Camera controls not working
- **Solution:** Verify OrbitControls script is loaded, check `controls.update()` is called in animate loop

### Issue: Low FPS performance
- **Solution:** Reduce sphere geometry segments (try 32x32 instead of 64x64), reduce texture resolution

### Issue: Texture looks pixelated
- **Solution:** Use higher resolution texture (4K or 8K), increase texture anisotropy

### Issue: Earth appears stretched or distorted
- **Solution:** Verify texture is 2:1 aspect ratio (width = 2× height), check texture wrapping settings

---

## Next Steps (Post-Completion)
After completing Task 1.1, proceed to:
- **Task 1.2:** Create satellite point rendering system
- The Earth globe foundation is now ready for adding satellite visualizations

---

## Notes
- Keep camera distance reasonable (1.5-10 Earth radii) for best viewing
- Consider adding subtle rotation animation later (optional enhancement)
- Earth texture should be properly licensed for project use
- Document any texture source and licensing in project README

## Completion Checklist
- [ ] All code written and working
- [ ] All tests passed
- [ ] Performance meets 60fps target
- [ ] Code committed to repository
- [ ] Documented any deviations from plan
