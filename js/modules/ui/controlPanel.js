// ============================================
// CONTROL PANEL - Main UI Orchestrator
// Creates bottom control panel with all buttons
// ============================================

let controlPanelElement = null;
let isMinimized = false;
const buttonRegistry = new Map();

/**
 * Initialize control panel structure
 */
export function initControlPanel() {
  if (controlPanelElement) {
    console.warn("Control panel already initialized");
    return controlPanelElement;
  }

  // Create main control panel container
  const panel = document.createElement("div");
  panel.id = "control-panel";
  panel.className = "control-panel";

  // Create minimize/maximize toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "control-panel-toggle";
  toggleBtn.innerHTML = "▼";
  toggleBtn.title = "Minimize/Maximize Panel";
  toggleBtn.setAttribute("aria-label", "Toggle control panel");
  panel.appendChild(toggleBtn);

  // Create three sections
  const leftSection = document.createElement("div");
  leftSection.className = "control-panel-left";
  leftSection.id = "control-panel-left";

  const centerSection = document.createElement("div");
  centerSection.className = "control-panel-center";
  centerSection.id = "control-panel-center";

  const rightSection = document.createElement("div");
  rightSection.className = "control-panel-right";
  rightSection.id = "control-panel-right";

  // Append sections to panel
  panel.appendChild(leftSection);
  panel.appendChild(centerSection);
  panel.appendChild(rightSection);

  // Append panel to body
  document.body.appendChild(panel);

  // Setup toggle functionality
  toggleBtn.addEventListener("click", toggleMinimize);

  controlPanelElement = panel;
  console.log("✓ Control panel structure initialized");

  return panel;
}

/**
 * Toggle minimize/maximize state
 */
function toggleMinimize() {
  if (!controlPanelElement) return;

  isMinimized = !isMinimized;

  if (isMinimized) {
    controlPanelElement.classList.add("minimized");
    const toggleBtn = controlPanelElement.querySelector(
      ".control-panel-toggle",
    );
    if (toggleBtn) toggleBtn.innerHTML = "▲";
  } else {
    controlPanelElement.classList.remove("minimized");
    const toggleBtn = controlPanelElement.querySelector(
      ".control-panel-toggle",
    );
    if (toggleBtn) toggleBtn.innerHTML = "▼";
  }
}

/**
 * Register a button in the control panel
 * @param {string} id - Button ID
 * @param {string} section - Section to add to ('left', 'center', 'right')
 * @param {HTMLElement} buttonElement - The button element
 */
export function registerButton(id, section, buttonElement) {
  if (buttonRegistry.has(id)) {
    console.warn(`Button ${id} already registered`);
    return;
  }

  const sectionElement = document.getElementById(`control-panel-${section}`);
  if (!sectionElement) {
    console.error(`Section ${section} not found`);
    return;
  }

  sectionElement.appendChild(buttonElement);
  buttonRegistry.set(id, { section, element: buttonElement });
}

/**
 * Unregister a button
 * @param {string} id - Button ID
 */
export function unregisterButton(id) {
  const button = buttonRegistry.get(id);
  if (button && button.element.parentNode) {
    button.element.parentNode.removeChild(button.element);
  }
  buttonRegistry.delete(id);
}

/**
 * Get button element by ID
 * @param {string} id - Button ID
 * @returns {HTMLElement|null}
 */
export function getButton(id) {
  const button = buttonRegistry.get(id);
  return button ? button.element : null;
}

/**
 * Set button active state
 * @param {string} id - Button ID
 * @param {boolean} active - Active state
 */
export function setButtonActive(id, active) {
  const button = getButton(id);
  if (button) {
    if (active) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  }
}

/**
 * Set button loading state
 * @param {string} id - Button ID
 * @param {boolean} loading - Loading state
 */
export function setButtonLoading(id, loading) {
  const button = getButton(id);
  if (button) {
    if (loading) {
      button.classList.add("loading");
      button.disabled = true;
    } else {
      button.classList.remove("loading");
      button.disabled = false;
    }
  }
}

/**
 * Update button badge
 * @param {string} id - Button ID
 * @param {number|string} value - Badge value (empty string to hide)
 */
export function setButtonBadge(id, value) {
  const button = getButton(id);
  if (!button) return;

  let badge = button.querySelector(".control-btn-badge");

  if (value === "" || value === null || value === undefined) {
    // Remove badge
    if (badge) {
      badge.remove();
    }
  } else {
    // Add or update badge
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "control-btn-badge";
      button.appendChild(badge);
    }
    badge.textContent = value;
  }
}

/**
 * Destroy control panel
 */
export function destroyControlPanel() {
  if (controlPanelElement && controlPanelElement.parentNode) {
    controlPanelElement.parentNode.removeChild(controlPanelElement);
  }
  controlPanelElement = null;
  buttonRegistry.clear();
  isMinimized = false;
}

/**
 * Get control panel element
 */
export function getControlPanel() {
  return controlPanelElement;
}

/**
 * Check if panel is minimized
 */
export function isControlPanelMinimized() {
  return isMinimized;
}

// ============================================
// BUTTON CREATION FUNCTIONS
// ============================================

/**
 * Create a control button element
 * @param {string} id - Button ID
 * @param {string} iconPath - Path to icon SVG
 * @param {string} label - Button label text
 * @param {string} tooltip - Tooltip text
 * @returns {HTMLElement}
 */
function createControlButton(id, iconPath, label, tooltip) {
  const button = document.createElement("button");
  button.id = id;
  button.className = "control-btn";
  button.setAttribute("data-tooltip", tooltip);
  button.setAttribute("aria-label", tooltip);

  // Create icon
  const icon = document.createElement("img");
  icon.src = iconPath;
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");

  // Create label
  const labelSpan = document.createElement("span");
  labelSpan.textContent = label;

  button.appendChild(icon);
  button.appendChild(labelSpan);

  return button;
}

/**
 * Initialize all control panel buttons
 */
export function initAllButtons() {
  if (!controlPanelElement) {
    console.error(
      "Control panel not initialized. Call initControlPanel() first.",
    );
    return;
  }

  // LEFT SECTION BUTTONS

  // 1. Add Ground Station Button
  const btnAddStation = createControlButton(
    "btn-add-station",
    "assets/icons/add-station-icon.svg",
    "Add Station",
    "Create Virtual Ground Station",
  );
  registerButton("btn-add-station", "left", btnAddStation);

  // Attach Virtual Ground Station modal to Add Station button
  btnAddStation.disabled = true;

  import("./virtualGroundStation.js").then((mod) => {
    mod.initAddStationModal();
    btnAddStation.disabled = false;
    btnAddStation.addEventListener("click", mod.showAddStationModal);
  });

  // 2. Add Custom Satellite Button
  const btnAddSatellite = createControlButton(
    "btn-add-satellite",
    "assets/icons/add-satellite-icon.svg",
    "Add Satellite",
    "Create Custom Satellite",
  );
  registerButton("add-satellite", "left", btnAddSatellite);

  // Attach Custom Satellite modal to Add Satellite button
  btnAddSatellite.disabled = false;
  import("./customSatellite.js").then((mod) => {
    mod.initAddSatelliteModal();
    btnAddSatellite.addEventListener("click", () => {
      mod.showAddSatelliteModal();
    });
  });

  // 3. List Stations Button
  const btnListStations = createControlButton(
    "btn-list-stations",
    "assets/icons/list-icon.svg",
    "Stations",
    "View Ground Station List",
  );
  registerButton("list-stations", "left", btnListStations);

  // Attach Station List panel to List Stations button
  btnListStations.disabled = true;
  import("./stationList.js").then((mod) => {
    mod.initStationListPanel();
    btnListStations.disabled = false;
    btnListStations.addEventListener("click", () => {
      const isHidden =
        mod.getStationListPanel()?.classList.contains("hidden");
      if (isHidden) {
        mod.showStationListPanel();
      } else {
        mod.hideStationListPanel();
      }
    });
  });

  // CENTER SECTION BUTTONS

  // 4. Search Button (Satellites & Ground Stations)
  const btnFindSatellite = createControlButton(
    "btn-find-satellite",
    "assets/icons/search-icon.svg",
    "Search",
    "Search Satellites & Ground Stations",
  );
  registerButton("find-satellite", "center", btnFindSatellite);

  // Attach Search panel to Search button
  btnFindSatellite.disabled = true;
  import("./satelliteFinder.js").then((mod) => {
    mod.initSatelliteFinderPanel();
    btnFindSatellite.disabled = false;
    btnFindSatellite.addEventListener("click", mod.showSatelliteFinderPanel);
  });

  // RIGHT SECTION BUTTONS

  // 6. Settings Button
  const btnSettings = createControlButton(
    "btn-settings",
    "assets/icons/settings-icon.svg",
    "Settings",
    "Application Settings",
  );
  registerButton("settings", "right", btnSettings);

  // Attach Settings panel to Settings button
  btnSettings.disabled = true;
  import("./settingsPanel.js").then((mod) => {
    mod.initSettingsPanel();
    btnSettings.disabled = false;
    btnSettings.addEventListener("click", () => {
      const isHidden = mod.getSettingsPanel()?.classList.contains("hidden");
      if (isHidden) {
        mod.showSettingsPanel();
      } else {
        mod.hideSettingsPanel();
      }
    });
  });

  // 7. Heatmap Button
  const btnHeatmap = createControlButton(
    "btn-heatmap",
    "assets/icons/graphics-icon.svg", // Using graphics icon as placeholder
    "Heatmap",
    "Generate Latency Heatmap",
  );
  registerButton("heatmap", "right", btnHeatmap);

  // Attach Heatmap panel to Heatmap button
  btnHeatmap.disabled = true;
  import("./heatmapPanel.js").then((mod) => {
    mod.initHeatmapPanel();
    btnHeatmap.disabled = false;
    btnHeatmap.addEventListener("click", mod.showHeatmapPanel);
  });

  // 8. Chaos Mode Button
  const btnChaosMode = createControlButton(
    "btn-chaos-mode",
    "assets/icons/search-icon.svg", // Using search icon as placeholder
    "Chaos",
    "Toggle Chaos Mode",
  );
  btnChaosMode.style.background = "linear-gradient(45deg, #ff0000, #ff6600)";
  btnChaosMode.style.color = "#fff";
  registerButton("chaos-mode", "right", btnChaosMode);

  // Attach Chaos Mode functionality
  import("../chaosMode.js").then((mod) => {
    btnChaosMode.addEventListener("click", () => {
      const isActive = mod.toggleChaosMode();
      // Update button appearance
      if (isActive) {
        btnChaosMode.style.background =
          "linear-gradient(45deg, #00ff00, #00cc00)";
        btnChaosMode.classList.add("active");
      } else {
        btnChaosMode.style.background =
          "linear-gradient(45deg, #ff0000, #ff6600)";
        btnChaosMode.classList.remove("active");
      }
    });
  });

  console.log("✓ All 7 control panel buttons initialized");
  console.log("  - Left section: Add Station, Add Satellite, List Stations");
  console.log("  - Center section: Find Satellite");
  console.log("  - Right section: Settings, Heatmap, Chaos Mode");

  return {
    addStation: btnAddStation,
    addSatellite: btnAddSatellite,
    listStations: btnListStations,
    findSatellite: btnFindSatellite,
    settings: btnSettings,
  };
}

/**
 * Get all registered buttons
 */
export function getAllButtons() {
  return Array.from(buttonRegistry.entries()).map(([id, data]) => ({
    id,
    section: data.section,
    element: data.element,
  }));
}
