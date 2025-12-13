// ============================================
// HEATMAP PANEL
// UI for heatmap generation
// ============================================

import { getSatelliteRecords } from "../satelliteData.js";
import { getSatelliteMeshes } from "../satelliteRenderer.js";
import {
  startHeatmapGeneration,
  stopHeatmapGeneration,
  clearHeatmap,
  getGenerationStatus,
  setStatusCallback,
  setFrameSliderCallback,
  navigateToFrame,
  stopFrameAnimation,
  startFrameAnimation,
  isFrameAnimationRunning,
} from "../heatmapManager.js";
import { displaySatelliteInfo } from "../satelliteInteraction.js";
import { showOrbitPath, removeOrbitLine } from "../orbitalPath.js";

let panelElement = null;
let selectedSatellite = null;
let statusElement = null;
let progressBar = null;
let frameSliderElement = null;
let frameSliderInput = null;
let frameSliderLabel = null;

/**
 * Initialize heatmap panel
 */
export function initHeatmapPanel() {
  if (panelElement) {
    console.warn("Heatmap panel already initialized");
    return;
  }

  // Create panel (centered popup)
  panelElement = document.createElement("div");
  panelElement.id = "heatmap-panel";
  panelElement.className = "hidden";

  panelElement.innerHTML = `
        <div class="panel-header">
            <h2>Generate Heatmap</h2>
            <button id="close-heatmap-panel" class="close-btn">&times;</button>
        </div>
        
        <div class="panel-content">
            <!-- Satellite Selection -->
            <div class="heatmap-section">
                <label for="heatmap-satellite-select">Select Satellite:</label>
                <select id="heatmap-satellite-select" class="heatmap-select">
                    <option value="">-- Select a satellite --</option>
                </select>
            </div>
            
            <!-- Selected Satellite Info -->
            <div id="heatmap-satellite-info" class="heatmap-satellite-info hidden">
                <h3>Selected Satellite</h3>
                <div id="heatmap-satellite-details"></div>
            </div>
            
            <!-- Configuration -->
            <div class="heatmap-section">
                <label for="heatmap-duration">Duration (seconds):</label>
                <input type="number" id="heatmap-duration" class="heatmap-input" value="600" min="60" max="3600" step="60">
                
                <label for="heatmap-step">Step (seconds):</label>
                <input type="number" id="heatmap-step" class="heatmap-input" value="10" min="1" max="60" step="1">
            </div>
            
            <!-- Status Panel -->
            <div id="heatmap-status" class="heatmap-status hidden">
                <div class="heatmap-status-message" id="heatmap-status-message">Ready</div>
                <div class="heatmap-progress-container">
                    <div class="heatmap-progress-bar" id="heatmap-progress-bar">
                        <div class="heatmap-progress-fill" id="heatmap-progress-fill"></div>
                    </div>
                    <span class="heatmap-progress-text" id="heatmap-progress-text">0%</span>
                </div>
            </div>
            
            <!-- Frame Slider -->
            <div id="heatmap-frame-slider" class="heatmap-frame-slider hidden">
                <div class="frame-slider-container">
                    <label for="frame-slider-input" class="frame-slider-label">Frame:</label>
                    <input 
                        type="range" 
                        id="frame-slider-input" 
                        class="frame-slider-input" 
                        min="0" 
                        max="0" 
                        value="0" 
                        step="1"
                    >
                    <span id="frame-slider-value" class="frame-slider-value">0 / 0</span>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="heatmap-actions">
                <button id="heatmap-generate-btn" class="heatmap-btn heatmap-btn-primary" disabled>
                    Generate Heatmap
                </button>
                <button id="heatmap-stop-btn" class="heatmap-btn heatmap-btn-danger hidden">
                    Stop Heatmap
                </button>
                <button id="heatmap-clear-btn" class="heatmap-btn heatmap-btn-secondary hidden">
                    Clear Heatmap
                </button>
            </div>
        </div>
    `;

  document.body.appendChild(panelElement);

  // Setup event listeners
  setupEventListeners();

  // Populate satellite list
  populateSatelliteList();

  // Setup status callback
  setStatusCallback(updateStatus);

  // Setup frame slider callback
  setFrameSliderCallback(updateFrameSlider);

  // Setup frame slider event listener (already in panel HTML)
  setupFrameSlider();

  console.log("✓ Heatmap panel initialized");
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Close button
  const closeBtn = document.getElementById("close-heatmap-panel");
  if (closeBtn) {
    closeBtn.addEventListener("click", hideHeatmapPanel);
  }

  // Satellite selection
  const satelliteSelect = document.getElementById("heatmap-satellite-select");
  if (satelliteSelect) {
    satelliteSelect.addEventListener("change", (e) => {
      const satelliteName = e.target.value;
      if (satelliteName) {
        selectSatellite(satelliteName);
      } else {
        deselectSatellite();
      }
    });
  }

  // Generate button
  const generateBtn = document.getElementById("heatmap-generate-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", handleGenerate);
  }

  // Stop button
  const stopBtn = document.getElementById("heatmap-stop-btn");
  if (stopBtn) {
    stopBtn.addEventListener("click", handleStop);
  }

  // Clear button
  const clearBtn = document.getElementById("heatmap-clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", handleClear);
  }

  // ESC key to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panelElement.classList.contains("hidden")) {
      hideHeatmapPanel();
    }
  });
}

/**
 * Populate satellite list
 */
function populateSatelliteList() {
  const select = document.getElementById("heatmap-satellite-select");
  if (!select) return;

  const records = getSatelliteRecords();

  // Clear existing options (except first)
  while (select.children.length > 1) {
    select.removeChild(select.lastChild);
  }

  // Add satellites
  records.forEach((record) => {
    const option = document.createElement("option");
    option.value = record.name;
    option.textContent = record.name;
    select.appendChild(option);
  });

  console.log(`[HeatmapPanel] Populated ${records.length} satellites`);
}

/**
 * Select satellite
 */
function selectSatellite(satelliteName) {
  const records = getSatelliteRecords();
  const meshes = getSatelliteMeshes();

  const record = records.find((r) => r.name === satelliteName);
  const meshIndex = records.findIndex((r) => r.name === satelliteName);

  if (!record || meshIndex === -1) {
    console.error("[HeatmapPanel] Satellite not found:", satelliteName);
    return;
  }

  selectedSatellite = {
    name: record.name,
    id: record.name,
    tle1: record.tle1 || record.tle?.line1 || "",
    tle2: record.tle2 || record.tle?.line2 || "",
    record: record,
  };

  // Show satellite info
  const infoDiv = document.getElementById("heatmap-satellite-info");
  const detailsDiv = document.getElementById("heatmap-satellite-details");
  if (infoDiv && detailsDiv) {
    detailsDiv.innerHTML = `
            <p><strong>Name:</strong> ${record.name}</p>
            <p><strong>Orbit Type:</strong> ${meshIndex >= 0 && meshes[meshIndex] ? meshes[meshIndex].userData.orbitType : "Unknown"}</p>
            <p><strong>TLE Line 1:</strong> ${selectedSatellite.tle1.substring(0, 30)}...</p>
            <p><strong>TLE Line 2:</strong> ${selectedSatellite.tle2.substring(0, 30)}...</p>
        `;
    infoDiv.classList.remove("hidden");
  }

  // Enable generate button
  const generateBtn = document.getElementById("heatmap-generate-btn");
  if (generateBtn) {
    generateBtn.disabled = false;
  }

  // Highlight satellite on globe
  if (meshIndex >= 0 && meshes[meshIndex]) {
    const mesh = meshes[meshIndex];
    mesh.scale.set(1.5, 1.5, 1.5);
    mesh.material.emissiveIntensity = 1.4;
    showOrbitPath(mesh, true);
    displaySatelliteInfo(mesh.userData);
  }

  console.log("[HeatmapPanel] Satellite selected:", satelliteName);
}

/**
 * Deselect satellite
 */
function deselectSatellite() {
  selectedSatellite = null;

  // Hide satellite info
  const infoDiv = document.getElementById("heatmap-satellite-info");
  if (infoDiv) {
    infoDiv.classList.add("hidden");
  }

  // Disable generate button
  const generateBtn = document.getElementById("heatmap-generate-btn");
  if (generateBtn) {
    generateBtn.disabled = true;
  }

  // Reset satellite appearance
  const meshes = getSatelliteMeshes();
  meshes.forEach((m) => {
    m.scale.set(1, 1, 1);
    m.material.emissiveIntensity = 0.9;
  });
  removeOrbitLine();
}

/**
 * Handle generate button click
 */
async function handleGenerate() {
  if (!selectedSatellite) {
    alert("Please select a satellite first");
    return;
  }

  // Get configuration
  const durationInput = document.getElementById("heatmap-duration");
  const stepInput = document.getElementById("heatmap-step");

  const config = {
    duration: parseInt(durationInput?.value || 600),
    step: parseInt(stepInput?.value || 10),
  };

  // Disable controls
  const generateBtn = document.getElementById("heatmap-generate-btn");
  const satelliteSelect = document.getElementById("heatmap-satellite-select");
  const durationField = document.getElementById("heatmap-duration");
  const stepField = document.getElementById("heatmap-step");

  if (generateBtn) generateBtn.disabled = true;
  if (satelliteSelect) satelliteSelect.disabled = true;
  if (durationField) durationField.disabled = true;
  if (stepField) stepField.disabled = true;

  // Show status panel
  const statusPanel = document.getElementById("heatmap-status");
  if (statusPanel) {
    statusPanel.classList.remove("hidden");
  }

  // Show stop button
  const stopBtn = document.getElementById("heatmap-stop-btn");
  if (stopBtn) {
    stopBtn.classList.remove("hidden");
  }

  // Start generation
  try {
    const result = await startHeatmapGeneration(selectedSatellite, config);

    if (!result.success) {
      // Show detailed error message
      const errorDetails = result.error || "Unknown error";
      alert(
        `Failed to start heatmap generation:\n\n${errorDetails}\n\nPlease ensure:\n1. Server is running: npm run server\n2. API endpoints are available\n3. heatmap_client.py is accessible`,
      );

      // Re-enable controls
      if (generateBtn) generateBtn.disabled = false;
      if (satelliteSelect) satelliteSelect.disabled = false;
      if (durationField) durationField.disabled = false;
      if (stepField) stepField.disabled = false;
      if (statusPanel) statusPanel.classList.add("hidden");
      if (stopBtn) stopBtn.classList.add("hidden");
    }
  } catch (error) {
    // Handle unexpected errors
    alert(
      `Error starting heatmap generation: ${error.message}\n\nPlease ensure the API server is running (npm run server)`,
    );

    // Re-enable controls
    if (generateBtn) generateBtn.disabled = false;
    if (satelliteSelect) satelliteSelect.disabled = false;
    if (durationField) durationField.disabled = false;
    if (stepField) stepField.disabled = false;
    if (statusPanel) statusPanel.classList.add("hidden");
    if (stopBtn) stopBtn.classList.add("hidden");
  }
}

/**
 * Handle stop button click
 */
async function handleStop() {
  await stopHeatmapGeneration();

  // Show clear button
  const clearBtn = document.getElementById("heatmap-clear-btn");
  if (clearBtn) {
    clearBtn.classList.remove("hidden");
  }

  // Hide stop button
  const stopBtn = document.getElementById("heatmap-stop-btn");
  if (stopBtn) {
    stopBtn.classList.add("hidden");
  }

  // Re-enable controls
  const satelliteSelect = document.getElementById("heatmap-satellite-select");
  const durationField = document.getElementById("heatmap-duration");
  const stepField = document.getElementById("heatmap-step");

  if (satelliteSelect) satelliteSelect.disabled = false;
  if (durationField) durationField.disabled = false;
  if (stepField) stepField.disabled = false;
}

/**
 * Handle clear button click
 */
function handleClear() {
  clearHeatmap();

  // Hide clear button
  const clearBtn = document.getElementById("heatmap-clear-btn");
  if (clearBtn) {
    clearBtn.classList.add("hidden");
  }

  // Re-enable generate button
  const generateBtn = document.getElementById("heatmap-generate-btn");
  if (generateBtn && selectedSatellite) {
    generateBtn.disabled = false;
  }

  // Hide status panel
  const statusPanel = document.getElementById("heatmap-status");
  if (statusPanel) {
    statusPanel.classList.add("hidden");
  }
}

/**
 * Update status display with forced UI refresh
 */
function updateStatus({ message, progress }) {
  // Use requestAnimationFrame to ensure UI updates happen in next frame
  requestAnimationFrame(() => {
    const statusMessage = document.getElementById("heatmap-status-message");
    const progressFill = document.getElementById("heatmap-progress-fill");
    const progressText = document.getElementById("heatmap-progress-text");
    const statusPanel = document.getElementById("heatmap-status");

    // Ensure status panel is visible when receiving updates
    if (statusPanel && message && !statusPanel.classList.contains("hidden")) {
      // Status panel should already be visible during generation
    }

    if (statusMessage) {
      statusMessage.textContent = message || "Ready";
      // Force a reflow to ensure the change is visible
      statusMessage.offsetHeight;
    }

    if (progress !== null && progress !== undefined) {
      const progressPercent = Math.min(100, Math.max(0, progress));

      if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
        // Force a reflow
        progressFill.offsetHeight;
      }

      if (progressText) {
        progressText.textContent = `${Math.round(progressPercent)}%`;
      }
    }

    // Check if generation is complete
    const status = getGenerationStatus();
    if (!status.isGenerating && status.progress >= 100) {
      // Show clear button
      const clearBtn = document.getElementById("heatmap-clear-btn");
      if (clearBtn) {
        clearBtn.classList.remove("hidden");
      }

      // Hide stop button
      const stopBtn = document.getElementById("heatmap-stop-btn");
      if (stopBtn) {
        stopBtn.classList.add("hidden");
      }

      // Re-enable controls
      const satelliteSelect = document.getElementById(
        "heatmap-satellite-select",
      );
      const durationField = document.getElementById("heatmap-duration");
      const stepField = document.getElementById("heatmap-step");

      if (satelliteSelect) satelliteSelect.disabled = false;
      if (durationField) durationField.disabled = false;
      if (stepField) stepField.disabled = false;
    }

    // Panel visibility is handled by CSS transform via panel-right class
    // No need to set display property
  });
}

/**
 * Setup frame slider (already in panel HTML, just need to get references and add listeners)
 */
function setupFrameSlider() {
  // Get slider elements from panel
  frameSliderElement = document.getElementById("heatmap-frame-slider");
  frameSliderInput = document.getElementById("frame-slider-input");
  frameSliderLabel = document.getElementById("frame-slider-value");

  // Add event listener for slider changes
  if (frameSliderInput) {
    frameSliderInput.addEventListener("input", handleFrameSliderChange);
  }

  console.log("✓ Frame slider setup complete");
}

/**
 * Handle frame slider change
 */
async function handleFrameSliderChange(event) {
  const sliderValue = parseInt(event.target.value); // 0-based slider value
  const maxSliderValue = parseInt(event.target.max);

  // Convert to 1-based frame index (server uses 1-based indices)
  const frameIndex = sliderValue + 1;
  const totalFrames = maxSliderValue + 1;

  // Update label (show 1-based frame numbers)
  if (frameSliderLabel) {
    frameSliderLabel.textContent = `${frameIndex} / ${totalFrames}`;
  }

  // Pause animation while user manually navigates
  const wasAnimating = isFrameAnimationRunning();
  if (wasAnimating) {
    stopFrameAnimation();
  }

  // Navigate to selected frame (frameIndex is now 1-based)
  await navigateToFrame(frameIndex);

  // Note: Animation stays paused after manual navigation
  // User can restart it via a button if needed
}

/**
 * Update frame slider UI
 * @param {number} currentIndex - Current frame index (1-based from server)
 * @param {number} totalFrames - Total number of frames (1-based)
 * @param {boolean} show - Whether to show the slider
 */
function updateFrameSlider(currentIndex, totalFrames, show = true) {
  if (!frameSliderElement || !frameSliderInput || !frameSliderLabel) {
    return;
  }

  if (show && totalFrames > 0) {
    // Show slider
    frameSliderElement.classList.remove("hidden");

    // Update slider max value (convert 1-based totalFrames to 0-based for slider)
    frameSliderInput.max = totalFrames - 1;

    // Update current value (convert 1-based currentIndex to 0-based for slider)
    // currentIndex might be 0 initially, so handle that case
    const actualIndex = currentIndex > 0 ? currentIndex : 1;
    const sliderValue = Math.max(0, Math.min(actualIndex - 1, totalFrames - 1));
    frameSliderInput.value = sliderValue;

    // Update label (show 1-based frame numbers to user)
    frameSliderLabel.textContent = `${actualIndex} / ${totalFrames}`;
  } else {
    // Hide slider
    frameSliderElement.classList.add("hidden");
  }
}

/**
 * Show heatmap panel
 */
export function showHeatmapPanel() {
  if (!panelElement) {
    initHeatmapPanel();
  }

  if (panelElement) {
    panelElement.classList.remove("hidden");
    // CSS handles the transform animation
  }
}

/**
 * Hide heatmap panel
 */
export function hideHeatmapPanel() {
  if (panelElement) {
    panelElement.classList.add("hidden");
    // CSS handles the transform animation to slide it off-screen
  }
}
