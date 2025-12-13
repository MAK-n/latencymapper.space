/**
 * Add a ground station to the session array
 */
export function addGroundStation(station) {
  // Prevent duplicates by id
  if (!groundStations.find((s) => s.id === station.id)) {
    groundStations.push(station);
    console.log("✓ Added ground station to session:", station);
  } else {
    console.warn("Station with this id already exists:", station.id);
  }
}
// ============================================
// GROUND STATION DATA MANAGEMENT
// ============================================

import { URLS } from "./constants.js";

let groundStations = [];

/**
 * Load ground station data from JSON file
 */
export async function loadGroundStations() {
  try {
    const response = await fetch(URLS.GROUND_STATIONS);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Handle both array format and object with 'stations' property
    let stationsArray;
    if (Array.isArray(data)) {
      stationsArray = data;
    } else if (data.stations && Array.isArray(data.stations)) {
      stationsArray = data.stations;
    } else {
      throw new Error("Ground stations data is not in expected format");
    }

    // Validate each station has required fields
    groundStations = stationsArray.filter((station) => {
      const isValid =
        station.id &&
        station.name &&
        typeof station.lat === "number" &&
        typeof station.lon === "number";

      if (!isValid) {
        console.warn("Invalid ground station data:", station);
      }

      return isValid;
    });

    console.log(`✓ Loaded ${groundStations.length} ground stations`);
    return groundStations;
  } catch (error) {
    console.error("Error loading ground stations:", error);
    return [];
  }
}

/**
 * Get all ground stations
 */
export function getGroundStations() {
  return groundStations;
}

/**
 * Get ground station by ID
 */
export function getGroundStationById(id) {
  return groundStations.find((station) => station.id === id);
}
