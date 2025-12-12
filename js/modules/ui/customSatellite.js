// ============================================
// CUSTOM SATELLITE - Creation UI & Logic
// Modal for creating custom satellites
// ============================================

let modalElement = null;

/**
 * Initialize Add Custom Satellite modal structure
 */
export function initAddSatelliteModal() {
    if (modalElement) {
        console.warn('Add Satellite modal already initialized');
        return modalElement;
    }
    
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop hidden';
    backdrop.id = 'modal-add-satellite-backdrop';
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-add-satellite';
    
    // Modal Header
    const header = document.createElement('header');
    header.className = 'modal-header';
    header.innerHTML = `
        <h2>Add Custom Satellite</h2>
        <p>Create a virtual satellite with custom orbital parameters</p>
        <button class="modal-close" aria-label="Close modal">&times;</button>
    `;
    
    // Modal Body with Form
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = `
        <form id="form-add-satellite">
            <!-- Basic Information Section -->
            <div class="form-section">
                <h3 class="form-section-title">Basic Information</h3>
                
                <div class="form-group">
                    <label class="form-label required" for="satellite-name">Satellite Name</label>
                    <input type="text" id="satellite-name" class="form-input" placeholder="e.g., My Custom Satellite" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="satellite-norad">NORAD ID (Optional)</label>
                    <input type="text" id="satellite-norad" class="form-input" placeholder="Auto-generated if empty">
                    <span class="form-hint">Leave empty for auto-generated ID</span>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="satellite-description">Description</label>
                    <textarea id="satellite-description" class="form-textarea" placeholder="Optional description..."></textarea>
                </div>
            </div>
            
            <!-- Orbital Parameters Section -->
            <div class="form-section">
                <h3 class="form-section-title">Orbital Parameters</h3>
                
                <div class="form-group">
                    <label class="form-label required" for="orbit-preset">Orbit Type</label>
                    <select id="orbit-preset" class="form-select" required>
                        <option value="">Select orbit type...</option>
                        <option value="leo">LEO - Low Earth Orbit (400 km)</option>
                        <option value="meo">MEO - Medium Earth Orbit (20,200 km)</option>
                        <option value="geo">GEO - Geostationary Orbit (35,786 km)</option>
                        <option value="custom">Custom - Advanced Parameters</option>
                    </select>
                    <span class="form-hint">Select a preset or choose custom for advanced options</span>
                </div>
                
                <!-- Advanced Orbital Parameters (hidden by default) -->
                <div id="advanced-orbital-params" class="hidden">
                    <div class="form-group">
                        <label class="form-label" for="semi-major-axis">Semi-major Axis (km)</label>
                        <input type="number" id="semi-major-axis" class="form-input" placeholder="6771" min="6371" step="1">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="eccentricity">Eccentricity</label>
                        <input type="number" id="eccentricity" class="form-input" placeholder="0.0" min="0" max="0.99" step="0.001">
                        <span class="form-hint">0 = circular orbit, >0 = elliptical</span>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="inclination">Inclination (degrees)</label>
                        <input type="number" id="inclination" class="form-input" placeholder="51.6" min="0" max="180" step="0.1">
                        <span class="form-hint">0° = equatorial, 90° = polar</span>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="raan">Right Ascension (degrees)</label>
                        <input type="number" id="raan" class="form-input" placeholder="0" min="0" max="360" step="0.1">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="arg-perigee">Argument of Perigee (degrees)</label>
                        <input type="number" id="arg-perigee" class="form-input" placeholder="0" min="0" max="360" step="0.1">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="mean-anomaly">Mean Anomaly (degrees)</label>
                        <input type="number" id="mean-anomaly" class="form-input" placeholder="0" min="0" max="360" step="0.1">
                    </div>
                </div>
            </div>
            
            <!-- Appearance Section -->
            <div class="form-section">
                <h3 class="form-section-title">Appearance</h3>
                
                <div class="form-group">
                    <label class="form-label" for="satellite-color">Color</label>
                    <input type="color" id="satellite-color" class="form-input" value="#00E5FF">
                    <span class="form-hint">Choose a color for your satellite</span>
                </div>
                
                <div class="form-group">
                    <label class="form-label" for="satellite-size">Size</label>
                    <select id="satellite-size" class="form-select">
                        <option value="small">Small</option>
                        <option value="medium" selected>Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>
            </div>
        </form>
    `;
    
    // Modal Footer
    const footer = document.createElement('footer');
    footer.className = 'modal-footer';
    footer.innerHTML = `
        <button type="button" id="btn-cancel-satellite" class="btn btn-secondary">Cancel</button>
        <button type="submit" form="form-add-satellite" id="btn-create-satellite" class="btn btn-primary">Create Satellite</button>
    `;
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    backdrop.appendChild(modal);
    
    // Append to body
    document.body.appendChild(backdrop);
    
    modalElement = backdrop;
    console.log('✓ Add Custom Satellite modal structure initialized');
    
    return backdrop;
}

/**
 * Show the modal
 */
export function showAddSatelliteModal() {
    if (modalElement) {
        modalElement.classList.remove('hidden');
    }
}

/**
 * Hide the modal
 */
export function hideAddSatelliteModal() {
    if (modalElement) {
        modalElement.classList.add('hidden');
    }
}

/**
 * Get modal element
 */
export function getAddSatelliteModal() {
    return modalElement;
}

