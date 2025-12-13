# JavaScript Module Structure

This directory contains the modular JavaScript codebase for the Latency Map application.

## Directory Structure

```
js/
├── main.js                          # Application entry point
├── modules/                         # All feature modules
│   ├── constants.js                 # Configuration & colors
│   ├── coordinates.js               # Coordinate conversions
│   ├── scene.js                     # Three.js scene setup
│   ├── earth.js                     # Earth model
│   ├── controls.js                  # Camera controls
│   ├── groundStations.js            # Ground station data
│   ├── groundStationRenderer.js     # Ground station rendering
│   ├── groundStationInteraction.js  # Ground station interaction
│   ├── satelliteData.js             # Satellite TLE data & SGP4
│   ├── satelliteRenderer.js         # Satellite rendering
│   ├── satelliteUpdater.js          # Real-time position updates
│   ├── satelliteInteraction.js      # Satellite interaction
│   └── orbitalPath.js               # Orbital path calculation
└── globe.js.backup                  # Old monolithic file (for reference)
```

## Module Overview

### Core Modules
- **main.js** - Entry point that initializes all systems
- **constants.js** - Single source of truth for config
- **coordinates.js** - All coordinate transformations
- **scene.js** - Three.js scene initialization
- **earth.js** - Earth sphere creation
- **controls.js** - OrbitControls setup

### Ground Station Modules
- **groundStations.js** - Load and manage station data
- **groundStationRenderer.js** - Render stations on globe
- **groundStationInteraction.js** - Click/hover interactions

### Satellite Modules
- **satelliteData.js** - TLE data, SGP4 propagation
- **satelliteRenderer.js** - Render satellites on globe
- **satelliteUpdater.js** - Real-time position updates
- **satelliteInteraction.js** - Click/hover interactions
- **orbitalPath.js** - Orbital path visualization

## How to Add a New Feature

### Example: Add a New Satellite Type

1. **Update constants.js:**
```javascript
export const COLORS = {
    SATELLITE_HEO: 0xFF6B35  // New color
};
```

2. **Update satelliteData.js:**
```javascript
export function getOrbitType(altitude) {
    if (altitude > 50000) return 'HEO';
    // ... rest
}
```

3. **Done!** The renderer and interaction automatically use the new type.

## Import Pattern

All modules use ES6 import/export:

```javascript
// Import what you need
import { CONFIG, COLORS } from './constants.js';
import { latLonToVector3 } from './coordinates.js';

// Export what others need
export function myFunction() {
    // ...
}
```

## Old vs New

| Aspect | Old (globe.js) | New (Modular) |
|--------|---------------|---------------|
| Lines | 1377 | ~100-200 per module |
| Files | 1 | 14 |
| Maintainability | ❌ Hard | ✅ Easy |
| Testability | ❌ Difficult | ✅ Simple |
| Scalability | ❌ Limited | ✅ Excellent |

## Migration Notes

The old `globe.js` has been renamed to `globe.js.backup` for reference. The new modular structure provides:

- **Better organization** - Each feature in its own file
- **Clear dependencies** - See exactly what each module needs
- **Easier debugging** - Smaller files are easier to understand
- **Future-proof** - Easy to add features without conflicts

## Entry Point

The application starts in `main.js`:

```javascript
// Initialize everything
await init();

// Start animation loop
animate();
```

## See Also

- `../REFACTORING-COMPLETE.md` - Full refactoring documentation
- `../PLAN.md` - Overall project plan

