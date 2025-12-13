// ============================================
// HEATMAP MANAGER
// Orchestrates heatmap generation pipeline
// ============================================

import { getSatelliteRecords } from "./satelliteData.js";
import {
  updateHeatmapFrame,
  showHeatmapOverlay,
  hideHeatmapOverlay,
  clearHeatmapOverlay,
  syncHeatmapRotation,
} from "./heatmapOverlay.js";

// API base URL - can be configured
const API_BASE_URL = "/api";
const WS_BASE_URL = (() => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${protocol}//${host}`;
})();

let pythonProcess = null;
let frameMonitorInterval = null;
let websocket = null;
let isGenerating = false;
let selectedSatellite = null;
let outputDirectory = null;
let expectedFrames = 0;
let currentFrame = 0;
let displayedFrame = 0; // Track the last frame actually displayed on the globe
let statusCallback = null;
let frameCache = new Map(); // Store all received frames: Map<frameIndex, blobUrl>
let frameSliderCallback = null; // Callback to update slider UI

// Frame synchronization tracking
let framesReceivedSet = new Set(); // Track which frame indices have been received
let framesRenderedSet = new Set(); // Track which frame indices have been successfully rendered
let totalExpectedFrames = 0; // Total frames expected from WebSocket
let animationTriggered = false; // Flag to prevent multiple animation starts

// Animation loop variables
let animationInterval = null;
let isAnimating = false;
let animationFrameInterval = 500; // Default: 500ms per frame (0.5 seconds)
let animationCurrentFrame = 1; // Current frame index in animation (1-based)

// Default configuration
const DEFAULT_CONFIG = {
  duration: 600, // 10 minutes
  step: 10, // 10 seconds per frame
  outputDir: "./heatmapReciever/output/received_frames",
};

/**
 * Set status update callback
 */
export function setStatusCallback(callback) {
  statusCallback = callback;
}

/**
 * Set frame slider update callback
 */
export function setFrameSliderCallback(callback) {
  frameSliderCallback = callback;
}

/**
 * Update status
 */
function updateStatus(message, progress = null) {
  if (statusCallback) {
    statusCallback({ message, progress });
  }
  console.log(`[HeatmapManager] ${message}`);
}

/**
 * Prepare satellite data JSON
 */
function prepareSatelliteData(satellite) {
  updateStatus("Preparing satellite data...");

  const satelliteData = {
    satellites: [
      {
        id: satellite.id || satellite.name,
        name: satellite.name,
        tle1: satellite.tle1 || satellite.tle?.line1 || "",
        tle2: satellite.tle2 || satellite.tle?.line2 || "",
      },
    ],
  };

  // Validate TLE
  if (!satelliteData.satellites[0].tle1 || !satelliteData.satellites[0].tle2) {
    throw new Error("Invalid TLE data: Missing TLE lines");
  }

  if (
    satelliteData.satellites[0].tle1.length < 69 ||
    satelliteData.satellites[0].tle2.length < 69
  ) {
    throw new Error("Invalid TLE format: TLE lines must be 69 characters");
  }

  updateStatus("Satellite data prepared");
  return satelliteData;
}

/**
 * Initialize backend with satellite data
 * POST /api/initialize
 */
async function initializeBackend(satelliteData) {
  updateStatus("Initializing backend with satellite data...");

  try {
    const response = await fetch(`${API_BASE_URL}/initialize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        satellites: satelliteData.satellites,
        config: {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Initialize API returned ${response.status}: ${errorText}`,
      );
    }

    const result = await response.json();
    console.log(
      `[HeatmapManager] ✓ Backend initialized, satellites: ${result.satellite_count || 0}`,
    );
    updateStatus("Backend initialized");
    return true;
  } catch (error) {
    const errorMsg = `Failed to initialize backend. Error: ${error.message}`;
    console.error("[HeatmapManager]", errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Start heatmap generation
 * POST /api/generate
 */
async function startGeneration(config) {
  updateStatus("Starting heatmap generation...");

  expectedFrames = Math.floor(config.duration / config.step) + 1;

  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        duration_seconds: config.duration,
        step_seconds: config.step,
        start_time: null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Generate API returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    expectedFrames = result.total_frames || expectedFrames;

    console.log(
      `[HeatmapManager] ✓ Generation started, total frames: ${expectedFrames}`,
    );
    updateStatus("Heatmap generation started");
    return true;
  } catch (error) {
    const errorMsg = `Failed to start generation. Error: ${error.message}`;
    console.error("[HeatmapManager]", errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Connect to WebSocket and receive frames
 * WebSocket /ws/frames
 * REQUIRED: All frames must come from WebSocket (heatmap_client.py)
 */
function startFrameMonitoring() {
  if (websocket) {
    console.warn("[HeatmapManager] WebSocket already connected");
    return;
  }

  updateStatus("Connecting to WebSocket for frame streaming...");

  const wsUrl = `${WS_BASE_URL}/ws/frames`;
  console.log(`[HeatmapManager] Connecting to WebSocket: ${wsUrl}`);

  try {
    websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("[HeatmapManager] ✓ WebSocket connected");
      updateStatus("WebSocket connected, receiving frames...");

      // Set binary type if needed (though we're using JSON messages)
      // websocket.binaryType = 'arraybuffer';
    };

    websocket.onmessage = async (event) => {
      try {
        // Handle both string and Blob data
        let messageData = event.data;
        if (messageData instanceof Blob) {
          // Convert Blob to text
          messageData = await messageData.text();
        } else if (typeof messageData !== "string") {
          // If it's an ArrayBuffer, convert to string
          messageData = new TextDecoder().decode(messageData);
        }

        const data = JSON.parse(messageData);
        const msgType = data.type;

        if (msgType === "status") {
          const status = data.data || {};
          const statusMsg = status.status || "Processing...";
          updateStatus(statusMsg);
          console.log(`[HeatmapManager] Status: ${statusMsg}`);
        } else if (msgType === "frame") {
          const index = data.index;
          const total = data.total;
          const filename = data.filename;
          const frameBase64 = data.data;

          // Track frame receipt (network event)
          framesReceivedSet.add(index);
          currentFrame = index;
          console.log(
            `[HeatmapManager] Received frame ${index}/${total} (received: ${framesReceivedSet.size}/${total})`,
          );

          if (frameBase64) {
            try {
              // Convert base64 to blob URL (network processing)
              const binaryString = atob(frameBase64);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: "image/png" });
              const frameUrl = URL.createObjectURL(blob);

              // Store frame in cache for slider navigation
              frameCache.set(index, frameUrl);

              // Process frame rendering asynchronously (separate from receipt)
              // Use requestAnimationFrame to batch render operations
              requestAnimationFrame(async () => {
                try {
                  // Load and display frame - this will trigger render
                  const renderSuccess = await updateHeatmapFrame(
                    frameUrl,
                    index,
                  );

                  // Track successful rendering (rendering event) only if render succeeded
                  if (renderSuccess) {
                    framesRenderedSet.add(index);
                    displayedFrame = index;
                  } else {
                    console.warn(
                      `[HeatmapManager] Frame ${index} render returned false`,
                    );
                  }

                  // Update progress based on rendered frames
                  const renderedCount = framesRenderedSet.size;
                  const progress =
                    total > 0 ? (renderedCount / total) * 100 : 0;
                  updateStatus(
                    `Frame ${index} of ${total} rendered (${renderedCount}/${total} complete)`,
                    progress,
                  );
                  console.log(
                    `[HeatmapManager] Frame ${index}/${total} rendered on globe (rendered: ${renderedCount}/${total})`,
                  );

                  // Update slider UI if callback is set
                  if (frameSliderCallback) {
                    frameSliderCallback(index, total);
                  }

                  // Force a render update
                  if (window.triggerRender) {
                    window.triggerRender();
                  }

                  // Check if we should trigger animation (after each render)
                  checkAndTriggerAnimation(total);
                } catch (error) {
                  console.error(
                    `[HeatmapManager] Error rendering frame ${index}:`,
                    error,
                  );
                  const renderedCount = framesRenderedSet.size;
                  const progress =
                    total > 0 ? (renderedCount / total) * 100 : 0;
                  updateStatus(
                    `Error rendering frame ${index} of ${total}`,
                    progress,
                  );
                  // Don't mark as rendered on error - will retry on next check
                }
              });
            } catch (error) {
              console.error(
                `[HeatmapManager] Error preparing frame ${index}:`,
                error,
              );
              const renderedCount = framesRenderedSet.size;
              const progress = total > 0 ? (renderedCount / total) * 100 : 0;
              updateStatus(
                `Error preparing frame ${index} of ${total}`,
                progress,
              );
            }
          } else {
            console.warn(`[HeatmapManager] Frame ${index} has no data`);
            // Mark as rendered even without data to avoid blocking
            framesRenderedSet.add(index);
            displayedFrame = index;
            const renderedCount = framesRenderedSet.size;
            const progress = total > 0 ? (renderedCount / total) * 100 : 0;
            updateStatus(`Frame ${index} of ${total} (no data)`, progress);
            checkAndTriggerAnimation(total);
          }
        } else if (msgType === "complete") {
          const totalFrames = data.total_frames || expectedFrames;
          totalExpectedFrames = totalFrames;

          console.log(
            `[HeatmapManager] ✓ WebSocket complete: ${totalFrames} frames expected`,
          );
          console.log(
            `[HeatmapManager] Frames received: ${framesReceivedSet.size}/${totalFrames}, Rendered: ${framesRenderedSet.size}/${totalFrames}`,
          );

          // Mark generation as complete (network side)
          // But don't trigger animation yet - wait for all renders
          updateStatus(
            `All frames received. Rendering: ${framesRenderedSet.size}/${totalFrames}`,
            totalFrames > 0 ? (framesRenderedSet.size / totalFrames) * 100 : 0,
          );

          // Check if all frames are already rendered (race condition: renders finished before complete message)
          checkAndTriggerAnimation(totalFrames);

          // Also set up a polling check in case some renders are still pending
          // This handles slow GPUs and late-arriving render callbacks
          let completionCheckAttempts = 0;
          const maxCompletionChecks = 300; // 30 seconds max (100ms * 300)

          const pollCompletion = () => {
            completionCheckAttempts++;

            if (framesRenderedSet.size >= totalFrames) {
              // All frames rendered, finalize
              finalizeFrameLoading(totalFrames);
            } else if (completionCheckAttempts < maxCompletionChecks) {
              // Still waiting, check again
              const progress =
                totalFrames > 0
                  ? (framesRenderedSet.size / totalFrames) * 100
                  : 0;
              updateStatus(
                `Rendering frames: ${framesRenderedSet.size}/${totalFrames}`,
                progress,
              );
              setTimeout(pollCompletion, 100);
            } else {
              // Timeout - proceed with what we have
              console.warn(
                `[HeatmapManager] Rendering timeout. Rendered ${framesRenderedSet.size}/${totalFrames} frames`,
              );
              finalizeFrameLoading(totalFrames, true);
            }
          };

          // Start polling if not all rendered yet
          if (framesRenderedSet.size < totalFrames) {
            setTimeout(pollCompletion, 100);
          } else {
            // All already rendered
            finalizeFrameLoading(totalFrames);
          }
        }
      } catch (error) {
        console.error(
          "[HeatmapManager] Error processing WebSocket message:",
          error,
        );
        updateStatus(`Error: ${error.message}`, null);
      }
    };

    websocket.onerror = (error) => {
      console.error("[HeatmapManager] WebSocket error:", error);
      updateStatus("WebSocket connection error", null);
    };

    websocket.onclose = (event) => {
      console.log(
        `[HeatmapManager] WebSocket closed (code: ${event.code}, reason: ${event.reason})`,
      );
      websocket = null;

      if (isGenerating && event.code !== 1000) {
        // Unexpected close
        updateStatus("WebSocket connection lost", null);
        isGenerating = false;
      }
    };
  } catch (error) {
    const errorMsg = `Failed to connect to WebSocket. Error: ${error.message}\n\nPlease ensure:\n1. Server is running\n2. WebSocket endpoint /ws/frames is available`;
    console.error("[HeatmapManager]", errorMsg);
    updateStatus(`Error: ${errorMsg}`, null);
    throw new Error(errorMsg);
  }
}

/**
 * Stop frame monitoring (close WebSocket)
 */
function stopFrameMonitoring() {
  if (frameMonitorInterval) {
    clearInterval(frameMonitorInterval);
    frameMonitorInterval = null;
  }

  if (websocket) {
    websocket.close();
    websocket = null;
    console.log("[HeatmapManager] WebSocket closed");
  }
}

/**
 * Execute heatmap_client.py on server
 * Sends satellite data to server, which creates file and spawns Python process
 * Format: python heatmap_client.py --satellite-file <file> --duration <duration> --step <step>
 */
async function executeHeatmapClient(satelliteData, config) {
  console.log("[HeatmapManager] ========================================");
  console.log("[HeatmapManager] Starting heatmap_client.py execution");
  console.log("[HeatmapManager] ========================================");
  console.log(
    "[HeatmapManager] Satellite data:",
    JSON.stringify(satelliteData, null, 2),
  );
  console.log("[HeatmapManager] Config:", {
    duration: config.duration,
    step: config.step,
  });

  updateStatus("Starting heatmap_client.py...");

  try {
    console.log(
      "[HeatmapManager] Sending request to server to execute Python script...",
    );
    console.log("[HeatmapManager] Endpoint: POST /api/run-heatmap-client");

    // Send satellite data and config to server to execute Python script
    const response = await fetch(`${API_BASE_URL}/run-heatmap-client`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        satelliteData: satelliteData,
        duration: config.duration,
        step: config.step,
      }),
    });

    console.log("[HeatmapManager] Server response status:", response.status);
    console.log("[HeatmapManager] Server response ok:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[HeatmapManager] Server returned error:", errorText);
      throw new Error(
        `Failed to execute heatmap_client.py: ${response.status} - ${errorText}`,
      );
    }

    const result = await response.json();
    console.log("[HeatmapManager] Server response data:", result);

    pythonProcess = { pid: result.pid };

    console.log("[HeatmapManager] ✓ heatmap_client.py started successfully");
    console.log("[HeatmapManager] Process PID:", result.pid);
    console.log("[HeatmapManager] Message:", result.message);
    updateStatus("heatmap_client.py is running...");

    return result.pid;
  } catch (error) {
    console.error("[HeatmapManager] ========================================");
    console.error(
      "[HeatmapManager] ERROR: Failed to execute heatmap_client.py",
    );
    console.error("[HeatmapManager] Error type:", error.constructor.name);
    console.error("[HeatmapManager] Error message:", error.message);
    console.error("[HeatmapManager] Error stack:", error.stack);
    console.error("[HeatmapManager] ========================================");

    const errorMsg = `Failed to execute heatmap_client.py. Error: ${error.message}`;
    throw new Error(errorMsg);
  }
}

/**
 * Start heatmap generation
 * Executes heatmap_client.py locally, then connects to WebSocket for frames
 */
export async function startHeatmapGeneration(satellite, config = {}) {
  if (isGenerating) {
    console.warn("[HeatmapManager] Heatmap generation already in progress");
    return { success: false, error: "Generation already in progress" };
  }

  try {
    isGenerating = true;
    selectedSatellite = satellite;

    // Merge config with defaults
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    expectedFrames = Math.floor(finalConfig.duration / finalConfig.step) + 1;
    currentFrame = 0;
    displayedFrame = 0; // Reset displayed frame counter

    // Reset synchronization tracking
    framesReceivedSet.clear();
    framesRenderedSet.clear();
    totalExpectedFrames = 0;
    animationTriggered = false; // Reset animation trigger flag

    // Clear previous frame cache
    clearFrameCache();

    // Step 1: Prepare satellite data
    const satelliteData = prepareSatelliteData(satellite);

    // Step 2: Execute heatmap_client.py locally
    await executeHeatmapClient(satelliteData, finalConfig);

    // Step 3: Clear any previous heatmap data to prevent stale cache
    clearHeatmapOverlay();

    // Step 4: Show heatmap overlay
    showHeatmapOverlay();

    // Step 5: Connect to WebSocket for frame streaming
    startFrameMonitoring();

    // Step 6: Sync rotation
    syncHeatmapRotation();

    updateStatus(
      "Heatmap generation started, streaming frames via WebSocket...",
      0,
    );
    console.log("[HeatmapManager] ✓ Heatmap generation pipeline started");
    return { success: true };
  } catch (error) {
    console.error(
      "[HeatmapManager] Failed to start heatmap generation:",
      error,
    );
    updateStatus(`Error: ${error.message}`, null);
    isGenerating = false;

    // Show user-friendly error
    const errorMsg = error.message.includes("API")
      ? `${error.message}\n\nPlease ensure:\n1. Server is running: npm run server\n2. heatmap_client.py is accessible\n3. Python is installed`
      : error.message;

    return { success: false, error: errorMsg };
  }
}

/**
 * Stop heatmap generation
 */
export async function stopHeatmapGeneration() {
  if (!isGenerating) {
    return;
  }

  console.log("[HeatmapManager] ========================================");
  console.log("[HeatmapManager] Stopping heatmap generation");
  console.log("[HeatmapManager] ========================================");

  updateStatus("Stopping heatmap generation...");

  // Stop Python process if running
  if (pythonProcess && pythonProcess.pid) {
    console.log(
      "[HeatmapManager] Stopping Python process, PID:",
      pythonProcess.pid,
    );
    try {
      const response = await fetch(`${API_BASE_URL}/stop-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pid: pythonProcess.pid }),
      });

      console.log(
        "[HeatmapManager] Stop request response status:",
        response.status,
      );

      if (response.ok) {
        const result = await response.json();
        console.log("[HeatmapManager] ✓ Process stopped successfully");
        console.log("[HeatmapManager] Server response:", result);
      } else {
        const errorText = await response.text();
        console.warn(
          "[HeatmapManager] Failed to stop process via API:",
          errorText,
        );
      }
    } catch (error) {
      console.error("[HeatmapManager] Error stopping process:", error);
      console.error("[HeatmapManager] Error details:", error.message);
    }
  } else {
    console.log("[HeatmapManager] No Python process PID found to stop");
  }

  // Close WebSocket connection
  stopFrameMonitoring();

  pythonProcess = null;
  isGenerating = false;
  updateStatus("Heatmap generation stopped");
  console.log("[HeatmapManager] ✓ Heatmap generation stopped");
  console.log("[HeatmapManager] ========================================");
}

/**
 * Clear heatmap
 */
export function clearHeatmap() {
  // Stop animation first
  stopFrameAnimation();

  stopHeatmapGeneration();
  clearHeatmapOverlay();
  clearFrameCache();

  // Reset synchronization tracking
  framesReceivedSet.clear();
  framesRenderedSet.clear();
  totalExpectedFrames = 0;
  animationTriggered = false;

  selectedSatellite = null;
  currentFrame = 0;
  displayedFrame = 0;
  expectedFrames = 0;
  outputDirectory = null;

  // Hide slider
  if (frameSliderCallback) {
    frameSliderCallback(0, 0, false);
  }

  updateStatus("Heatmap cleared");
}

/**
 * Check if all frames are received and rendered, then trigger animation
 * This is the SINGLE AUTHORITATIVE function to start animation
 * @param {number} totalFrames - Total expected frames
 */
function checkAndTriggerAnimation(totalFrames) {
  // Prevent multiple triggers
  if (animationTriggered) {
    return;
  }

  // Only trigger if we have the complete signal AND all frames rendered
  if (
    totalExpectedFrames > 0 &&
    framesReceivedSet.size >= totalExpectedFrames &&
    framesRenderedSet.size >= totalExpectedFrames
  ) {
    // Mark as triggered immediately to prevent race conditions
    animationTriggered = true;

    console.log(
      `[HeatmapManager] ✓ All frames ready: ${framesRenderedSet.size} received and rendered`,
    );
    console.log(`[HeatmapManager] Triggering animation start...`);

    // Finalize and start animation
    finalizeFrameLoading(totalExpectedFrames);
  }
}

/**
 * Finalize frame loading and start animation
 * @param {number} totalFrames - Total frames
 * @param {boolean} timeout - Whether this is a timeout (some frames may be missing)
 */
function finalizeFrameLoading(totalFrames, timeout = false) {
  if (!timeout && framesRenderedSet.size < totalFrames) {
    // Not ready yet
    return;
  }

  // Stop frame monitoring
  stopFrameMonitoring();

  // Mark generation as complete
  isGenerating = false;
  currentFrame = totalFrames;

  // Update status
  if (timeout) {
    updateStatus(
      `Frames loaded: ${framesRenderedSet.size}/${totalFrames} (timeout)`,
      100,
    );
  } else {
    updateStatus("All frames processed and rendered", 100);
  }

  console.log(
    `[HeatmapManager] ✓ Frame loading finalized: ${framesRenderedSet.size}/${totalFrames} frames rendered`,
  );

  // Show slider
  if (frameSliderCallback) {
    frameSliderCallback(displayedFrame, totalFrames, true);
  }

  // Start animation ONLY ONCE (protected by animationTriggered flag)
  if (!animationTriggered) {
    animationTriggered = true;
  }

  // Start animation if we have frames
  if (frameCache.size > 0) {
    startFrameAnimation(animationFrameInterval);
  }
}

/**
 * Get generation status
 */
export function getGenerationStatus() {
  const renderedCount = framesRenderedSet.size;
  return {
    isGenerating,
    selectedSatellite,
    currentFrame,
    displayedFrame,
    expectedFrames,
    framesReceived: framesReceivedSet.size,
    framesRendered: renderedCount,
    progress: expectedFrames > 0 ? (renderedCount / expectedFrames) * 100 : 0,
  };
}

/**
 * Navigate to a specific frame index
 * @param {number} frameIndex - Frame index (1-based from UI, matches WebSocket index)
 */
export async function navigateToFrame(frameIndex) {
  // First, try to get from cache (try both 1-based and 0-based)
  let frameUrl = null;
  let cacheIndex = frameIndex;

  if (frameCache.has(frameIndex)) {
    frameUrl = frameCache.get(frameIndex);
    cacheIndex = frameIndex;
  } else if (frameIndex > 0 && frameCache.has(frameIndex - 1)) {
    // Try 0-based index (in case WebSocket used 0-based)
    frameUrl = frameCache.get(frameIndex - 1);
    cacheIndex = frameIndex - 1;
    console.log(
      `[HeatmapManager] Found frame ${frameIndex} in cache using 0-based index ${cacheIndex}`,
    );
  }

  if (frameUrl) {
    try {
      await updateHeatmapFrame(frameUrl, frameIndex);
      displayedFrame = frameIndex;
      console.log(
        `[HeatmapManager] Navigated to frame ${frameIndex} (from cache, stored as ${cacheIndex})`,
      );
      return true;
    } catch (error) {
      console.error(
        `[HeatmapManager] Error navigating to frame ${frameIndex}:`,
        error,
      );
      // Fall through to file system loading
    }
  }

  // Frame not in cache - try to load from file system
  // Frame indices from UI are 1-based (frame 1, frame 2, ...)
  // Filenames are 0-based (frame_0000.png, frame_0001.png, ...)
  // So frame 1 → frame_0000.png, frame 2 → frame_0001.png, etc.
  const fileIndex = frameIndex - 1;
  const filename = `frame_${String(fileIndex).padStart(4, "0")}.png`;
  const framePath = `/output/received_frames/${filename}`;

  console.log(
    `[HeatmapManager] Frame ${frameIndex} not in cache, loading from: ${framePath}`,
  );

  try {
    // Try to load the frame from the file system
    const response = await fetch(framePath);
    if (!response.ok) {
      console.warn(
        `[HeatmapManager] Frame ${frameIndex} not found at ${framePath} (HTTP ${response.status})`,
      );
      return false;
    }

    // Convert response to blob and create object URL
    const blob = await response.blob();
    frameUrl = URL.createObjectURL(blob);

    // Store in cache for future use (store with the UI's 1-based index)
    frameCache.set(frameIndex, frameUrl);

    // Update the heatmap with the loaded frame
    await updateHeatmapFrame(frameUrl, frameIndex);
    displayedFrame = frameIndex;

    console.log(
      `[HeatmapManager] ✓ Loaded frame ${frameIndex} from file system (${framePath}) and cached`,
    );
    return true;
  } catch (error) {
    console.error(
      `[HeatmapManager] Error loading frame ${frameIndex} from file system:`,
      error,
    );
    return false;
  }
}

/**
 * Get frame count for slider
 */
export function getFrameCount() {
  return frameCache.size;
}

/**
 * Clear frame cache
 */
export function clearFrameCache() {
  // Stop animation if running
  stopFrameAnimation();

  // Revoke all blob URLs
  frameCache.forEach((blobUrl) => {
    if (blobUrl && blobUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        // Ignore errors
      }
    }
  });
  frameCache.clear();
  animationCurrentFrame = 1;
  console.log("[HeatmapManager] Frame cache cleared");
}

/**
 * Start frame animation loop
 * Cycles through all cached frames continuously
 * @param {number} intervalMs - Interval between frames in milliseconds (default: 500ms)
 */
export function startFrameAnimation(intervalMs = 500) {
  if (isAnimating) {
    console.warn("[HeatmapManager] Animation already running");
    return;
  }

  if (frameCache.size === 0) {
    console.warn("[HeatmapManager] No frames to animate");
    return;
  }

  animationFrameInterval = intervalMs;
  isAnimating = true;

  // Get sorted frame indices (1-based)
  const frameIndices = Array.from(frameCache.keys()).sort((a, b) => a - b);

  if (frameIndices.length === 0) {
    isAnimating = false;
    return;
  }

  // Start from first frame or current frame
  animationCurrentFrame = frameIndices[0];

  // Function to advance to next frame
  const advanceFrame = async () => {
    if (!isAnimating || frameCache.size === 0) {
      return;
    }

    // Navigate to current frame
    await navigateToFrame(animationCurrentFrame);

    // Update slider if callback exists
    if (frameSliderCallback) {
      frameSliderCallback(animationCurrentFrame, frameIndices.length, true);
    }

    // Move to next frame (loop back to first if at end)
    const currentIndex = frameIndices.indexOf(animationCurrentFrame);
    const nextIndex = (currentIndex + 1) % frameIndices.length;
    animationCurrentFrame = frameIndices[nextIndex];
  };

  // Start with first frame immediately
  advanceFrame();

  // Set up interval for continuous animation
  animationInterval = setInterval(advanceFrame, animationFrameInterval);

  console.log(
    `[HeatmapManager] Frame animation started (${animationFrameInterval}ms interval, ${frameIndices.length} frames)`,
  );
}

/**
 * Stop frame animation loop
 */
export function stopFrameAnimation() {
  if (!isAnimating) {
    return;
  }

  isAnimating = false;

  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  console.log("[HeatmapManager] Frame animation stopped");
}

/**
 * Check if animation is currently running
 */
export function isFrameAnimationRunning() {
  return isAnimating;
}

/**
 * Set animation frame interval
 * @param {number} intervalMs - Interval in milliseconds
 */
export function setAnimationInterval(intervalMs) {
  animationFrameInterval = Math.max(100, intervalMs); // Minimum 100ms

  // Restart animation with new interval if currently running
  if (isAnimating) {
    stopFrameAnimation();
    startFrameAnimation(animationFrameInterval);
  }

  console.log(
    `[HeatmapManager] Animation interval set to ${animationFrameInterval}ms`,
  );
}

/**
 * Get sorted frame indices from cache
 */
export function getSortedFrameIndices() {
  return Array.from(frameCache.keys()).sort((a, b) => a - b);
}
