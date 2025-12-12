// ============================================
// CONSTANTS AND CONFIGURATION
// ============================================

export const CONFIG = {
    // Earth properties
    EARTH_RADIUS: 1.0,  // Globe radius in Three.js units
    EARTH_RADIUS_KM: 6371.0,
    
    // Interaction
    CLICK_THRESHOLD: 5,
    
    // Satellite update interval (milliseconds)
    SATELLITE_UPDATE_INTERVAL: 2000,
    
    // Interpolation
    INTERPOLATION_SPEED: 0.15,
    
    // TLE cache duration (milliseconds)
    TLE_CACHE_DURATION: 3600000, // 1 hour
    
    // Satellite limits
    MAX_SATELLITES: 50,
    
    // Orbit visualization
    ORBIT_SAMPLES: {
        LEO: 120,
        MEO: 180,
        GEO: 240
    },
    
    ORBIT_PERIODS: {
        LEO: 90,   // minutes
        MEO: 720,  // minutes
        GEO: 1440  // minutes
    }
};

export const COLORS = {
    // Ground stations (theme: orange)
    STATION_DEFAULT: 0xFFB039,
    STATION_SELECTED: 0x4A9EFF,
    STATION_EMISSIVE: 0xFFB039,
    
    // Satellites (theme: cyan/teal)
    SATELLITE_LEO: 0x00E5FF,      // Cyan
    SATELLITE_MEO: 0x00B8A9,      // Teal
    SATELLITE_GEO: 0x00DC7D,      // Green
    
    // Orbital paths
    ORBIT_HOVER: 0x5E6A7A,        // Gray
    ORBIT_SELECTED: 0x9BB3C9,     // Light blue-gray
    
    // Lighting
    AMBIENT_LIGHT: 0xffffff,
    DIRECTIONAL_LIGHT: 0xffffff
};

export const URLS = {
    // TLE_DATA: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
    TLE_DATA: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
    GROUND_STATIONS: './data/ground-stations.json',
    EARTH_TEXTURE: './texture/nasa-blue-marble-1.png'
};

