// ============================================
// SATELLITE DATA MANAGEMENT
// ============================================

import { CONFIG, URLS, COLORS } from "./constants.js";

let satellites = [];
let satelliteRecords = [];
let allSatellites = []; // Store full list before limiting

/**
 * Fetch TLE data from CelesTrak
 */
async function fetchTLEData() {
  try {
    // Check cache first
    const cachedData = localStorage.getItem("tleData");
    const cacheTime = localStorage.getItem("tleDataTime");

    if (cachedData && cacheTime) {
      const age = Date.now() - parseInt(cacheTime);
      const ageMinutes = Math.floor(age / 60000);

      if (age < CONFIG.TLE_CACHE_DURATION) {
        console.log(`✓ Using cached TLE data (age: ${ageMinutes} minutes)`);
        return cachedData;
      }
    }

    // Fetch fresh data
    console.log("Fetching fresh TLE data from CelesTrak...");
    const response = await fetch(URLS.TLE_DATA);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();

    // Cache the data
    localStorage.setItem("tleData", text);
    localStorage.setItem("tleDataTime", Date.now().toString());

    console.log("✓ Fresh TLE data fetched and cached");
    return text;
  } catch (error) {
    console.error("Error fetching TLE data:", error);

    // Try to use cached data even if expired
    const cachedData = localStorage.getItem("tleData");
    if (cachedData) {
      console.warn("Using expired cached TLE data due to fetch error");
      return cachedData;
    }

    throw error;
  }
}

/**
 * Parse TLE text into satellite objects
 */
function parseTLEText(tleText) {
  const lines = tleText.trim().split("\n");
  const satellites = [];

  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      const name = lines[i].trim();
      const line1 = lines[i + 1].trim();
      const line2 = lines[i + 2].trim();

      // Validate TLE format
      if (line1.startsWith("1 ") && line2.startsWith("2 ")) {
        satellites.push({
          name: name,
          tle1: line1,
          tle2: line2,
        });
      }
    }
  }

  return satellites;
}

/**
 * Load satellite data from CelesTrak
 */
export async function loadSatelliteData() {
  try {
    const tleText = await fetchTLEData();
    allSatellites = parseTLEText(tleText);

    // Limit number of satellites for performance
    satellites = allSatellites.slice(0, CONFIG.MAX_SATELLITES);

    console.log(
      `✓ Loaded ${satellites.length} satellites (limited from ${allSatellites.length} total)`,
    );
    return satellites;
  } catch (error) {
    console.error("Error loading satellite data:", error);
    return [];
  }
}

/**
 * Get all satellites (full list before limiting)
 */
export function getAllSatellites() {
  return allSatellites;
}

/**
 * Reload satellites with new limit
 */
export function reloadSatellitesWithLimit(newLimit) {
  // Update the limit
  CONFIG.MAX_SATELLITES = newLimit;
  
  // Re-slice the full list
  satellites = allSatellites.slice(0, CONFIG.MAX_SATELLITES);
  
  console.log(
    `✓ Reloaded ${satellites.length} satellites (limited from ${allSatellites.length} total)`,
  );
  
  return satellites;
}

/**
 * Initialize satellite record with satrec from TLE
 */
export function initializeSatelliteRecord(satellite) {
  try {
    const satrec = window.satellite.twoline2satrec(
      satellite.tle1,
      satellite.tle2,
    );

    if (satrec.error) {
      console.warn(
        `Error initializing satellite ${satellite.name}:`,
        satrec.error,
      );
      return null;
    }

    return {
      name: satellite.name,
      tle1: satellite.tle1,
      tle2: satellite.tle2,
      satrec: satrec,
    };
  } catch (error) {
    console.error(`Error creating satrec for ${satellite.name}:`, error);
    return null;
  }
}

/**
 * Propagate satellite position at given time
 */
export function propagateSatellitePosition(satRecord, time) {
  try {
    const positionAndVelocity = window.satellite.propagate(
      satRecord.satrec,
      time,
    );

    if (positionAndVelocity.position === false) {
      return null;
    }

    const gmst = window.satellite.gstime(time);
    const positionGd = window.satellite.eciToGeodetic(
      positionAndVelocity.position,
      gmst,
    );

    const latitude = positionGd.latitude * (180 / Math.PI);
    const longitude = positionGd.longitude * (180 / Math.PI);
    const altitude = positionGd.height;

    // Calculate velocity magnitude
    let velocity = 0;
    if (positionAndVelocity.velocity) {
      const vel = positionAndVelocity.velocity;
      velocity = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
    }

    return {
      latitude,
      longitude,
      altitude,
      velocity,
    };
  } catch (error) {
    console.error("Error propagating satellite:", error);
    return null;
  }
}

/**
 * Determine orbit type based on altitude
 */
export function getOrbitType(altitude) {
  if (altitude < 2000) return "LEO";
  if (altitude < 35786) return "MEO";
  return "GEO";
}

/**
 * Get orbit color based on type
 */
export function getOrbitColor(orbitType) {
  switch (orbitType) {
    case "LEO":
      return COLORS.SATELLITE_LEO;
    case "MEO":
      return COLORS.SATELLITE_MEO;
    case "GEO":
      return COLORS.SATELLITE_GEO;
    default:
      return COLORS.SATELLITE_LEO;
  }
}

/**
 * Get all satellites
 */
export function getSatellites() {
  return satellites;
}

/**
 * Get satellite records
 */
export function getSatelliteRecords() {
  return satelliteRecords;
}

/**
 * Set satellite records
 */
export function setSatelliteRecords(records) {
  satelliteRecords = records;
}
