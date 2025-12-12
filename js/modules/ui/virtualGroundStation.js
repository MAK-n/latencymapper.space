// ============================================
// VIRTUAL GROUND STATION - Creation UI & Logic
// Modal for creating custom ground stations
// ============================================

let modalElement = null;

/**
 * Initialize Add Ground Station modal structure
 */
export function initAddStationModal() {
    if (modalElement) {
        console.warn('Add Station modal already initialized');
        return modalElement;
    }
    
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop hidden';
    backdrop.id = 'modal-add-station-backdrop';
    
    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal-add-station';
    
    // Modal Header
    const header = document.createElement('header');
    header.className = 'modal-header';
    header.innerHTML = `
        <h2>Add Ground Station</h2>
        <p>Create a virtual ground station on the globe</p>
        <button class="modal-close" aria-label="Close modal">&times;</button>
    `;
    
    // Modal Body with Form
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.innerHTML = `
        <form id="form-add-station">
            <!-- Basic Information Section -->
            <div class="form-section">
                <h3 class="form-section-title">Basic Information</h3>
                
                <div class="form-group">
                    <label class="form-label required" for="station-name">Station Name</label>
                    <input type="text" id="station-name" class="form-input" placeholder="e.g., My Ground Station" required>
                    <span class="form-hint">Give your station a unique name</span>
                </div>
                
                <div class="form-group">
                    <label class="form-label required" for="station-type">Station Type</label>
                    <select id="station-type" class="form-select" required>
                        <option value="">Select type...</option>
                        <option value="amateur">Amateur</option>
                        <option value="professional">Professional</option>
                        <option value="commercial">Commercial</option>
                        <option value="research">Research</option>
                        <option value="military">Military</option>
                    </select>
                </div>
            </div>
            
            <!-- Location Section -->
            <div class="form-section">
                <h3 class="form-section-title">Location</h3>
                
                <div class="form-group">
                    <button type="button" id="btn-click-on-globe" class="btn btn-secondary btn-block">
                        📍 Click on Globe to Select Location
                    </button>
                    <span class="form-hint">Or enter coordinates manually below</span>
                </div>
                
                <div class="form-group">
                    <label class="form-label required" for="station-latitude">Latitude</label>
                    <div class="input-group">
                        <input type="number" id="station-latitude" class="form-input" placeholder="0.00" min="-90" max="90" step="0.0001" required>
                        <span class="input-group-addon">°</span>
                    </div>
                    <span class="form-hint">Range: -90° (South) to +90° (North)</span>
                </div>
                
                <div class="form-group">
                    <label class="form-label required" for="station-longitude">Longitude</label>
                    <div class="input-group">
                        <input type="number" id="station-longitude" class="form-input" placeholder="0.00" min="-180" max="180" step="0.0001" required>
                        <span class="input-group-addon">°</span>
                    </div>
                    <span class="form-hint">Range: -180° (West) to +180° (East)</span>
                </div>
                
                <div class="form-group">
                    <label class="form-label required" for="station-elevation">Elevation</label>
                    <div class="input-group">
                        <input type="number" id="station-elevation" class="form-input" placeholder="0" min="0" max="9000" step="1" value="0" required>
                        <span class="input-group-addon">meters</span>
                    </div>
                    <span class="form-hint">Height above sea level</span>
                </div>
            </div>
        </form>
    `;
    
    // Modal Footer
    const footer = document.createElement('footer');
    footer.className = 'modal-footer';
    footer.innerHTML = `
        <button type="button" id="btn-cancel-station" class="btn btn-secondary">Cancel</button>
        <button type="submit" form="form-add-station" id="btn-create-station" class="btn btn-primary">Create Station</button>
    `;
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    backdrop.appendChild(modal);
    
    // Append to body
    document.body.appendChild(backdrop);
    
    modalElement = backdrop;
    console.log('✓ Add Ground Station modal structure initialized');
    
    return backdrop;
}

/**
 * Show the modal
 */
export function showAddStationModal() {
    if (modalElement) {
        modalElement.classList.remove('hidden');
    }
}

/**
 * Hide the modal
 */
export function hideAddStationModal() {
    if (modalElement) {
        modalElement.classList.add('hidden');
    }
}

/**
 * Get modal element
 */
export function getAddStationModal() {
    return modalElement;
}

