// ============================================
// CONSTANTS AND CONFIGURATION
// ============================================

export const CONFIG = {
  // Earth properties
  EARTH_RADIUS: 1.0, // Globe radius in Three.js units
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
  MAX_SATELLITES: 5000,

  // Orbit visualization
  ORBIT_SAMPLES: {
    LEO: 120,
    MEO: 180,
    GEO: 240,
  },

  ORBIT_PERIODS: {
    //90
    LEO: 150, // minutes
    MEO: 500, // minutes
    GEO: 2000, // minutes
  },
};

export const COLORS = {
  // Ground stations (theme: orange)
  STATION_DEFAULT: 0xffb039,
  STATION_SELECTED: 0x4a9eff,
  STATION_EMISSIVE: 0xffb039,

  // Satellites (theme: cyan/teal)
  SATELLITE_LEO: 0x00e5ff, // Cyan
  SATELLITE_MEO: 0x00b8a9, // Teal
  SATELLITE_GEO: 0x00dc7d, // Green

  // Orbital paths
  ORBIT_HOVER: 0x5e6a7a, // Gray
  ORBIT_SELECTED: 0x9bb3c9, // Light blue-gray

  // Lighting
  AMBIENT_LIGHT: 0xffffff,
  DIRECTIONAL_LIGHT: 0xffffff,
};

export const URLS = {
  // TLE_DATA: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
  TLE_DATA:
    "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
  GROUND_STATIONS: "./data/ground-stations.json",
  EARTH_TEXTURE: "./texture/nasa-blue-marble-1.png",
};
