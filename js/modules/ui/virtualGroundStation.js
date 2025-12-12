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
        <button type="submit" form="form-add-station" class="btn btn-primary" id="btn-create-station">Create Station</button>
    `;
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    backdrop.appendChild(modal);
    
    // Append to body (hidden by default)
    backdrop.classList.add('hidden');
    document.body.appendChild(backdrop);

    // Handle form submission for adding a new ground station
    // Query form directly from the modal that was just appended
    const form = modal.querySelector('#form-add-station');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form input elements directly from the form
            const nameInput = form.querySelector('#station-name');
            const typeInput = form.querySelector('#station-type');
            const latInput = form.querySelector('#station-latitude');
            const lonInput = form.querySelector('#station-longitude');
            const elevationInput = form.querySelector('#station-elevation');
            
            // Check if all inputs exist
            if (!nameInput || !typeInput || !latInput || !lonInput || !elevationInput) {
                console.error('Form inputs not found:', {
                    nameInput: !!nameInput,
                    typeInput: !!typeInput,
                    latInput: !!latInput,
                    lonInput: !!lonInput,
                    elevationInput: !!elevationInput
                });
                alert('Error: Form inputs not properly initialized.');
                return;
            }
            
            const name = document.getElementById('station-name')?.value || '';
            const type = document.getElementById('station-type')?.value || '';
            const latValue = document.getElementById('station-latitude')?.value || '';
            const lonValue = document.getElementById('station-longitude')?.value || '';
            const elevationValue = document.getElementById('station-elevation')?.value || '';

            if (!name || !type || latValue === '' || lonValue === '' || elevationValue === '') {
                alert('Please fill all required fields (Name, Type, Latitude, Longitude, Elevation).');
                return;
            }

            const lat = parseFloat(latValue);
            const lon = parseFloat(lonValue);
            const elevation = parseFloat(elevationValue);

            if (isNaN(lat) || isNaN(lon) || isNaN(elevation)) {
                alert('Latitude, Longitude, and Elevation must be valid numbers.');
                return;
            }
            // Create new station object
            const newStation = {
                id: 'gs_' + Date.now(),
                name,
                lat,
                lon,
                elevation,
                type
            };
            
            console.log('Creating ground station:', newStation);
            
            try {
                window.dispatchEvent(new CustomEvent('add-ground-station', { detail: newStation }));
                // Close modal
                backdrop.classList.add('hidden');
                form.reset();
                alert('Ground station added!');
            } catch (err) {
                alert('Failed to add ground station: ' + err.message);
            }
        });
    } else {
        console.error('Form #form-add-station not found in modal');
    }

    // Create form elements
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            backdrop.classList.add('hidden');
            form.reset();
        });
    }

    // Cancel button in footer
    const cancelButton = document.getElementById('btn-cancel-station');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            backdrop.classList.add('hidden');
            form.reset();
        });
    }
    cancelButton.addEventListener('click', (e) => {
    e.preventDefault();
    backdrop.classList.add('hidden');
    form.reset();
    });

    // Listen for globe location selection and populate form fields
    window.addEventListener('station-location-selected', (e) => {
        const { lat, lon } = e.detail;
        const latInput = document.getElementById('station-latitude');
        const lonInput = document.getElementById('station-longitude');
        if (latInput && lonInput) {
            latInput.value = lat.toFixed(5);
            lonInput.value = lon.toFixed(5);
            // Visual confirmation: highlight fields
            latInput.classList.add('field-confirmed');
            lonInput.classList.add('field-confirmed');
            setTimeout(() => {
                latInput.classList.remove('field-confirmed');
                lonInput.classList.remove('field-confirmed');
            }, 1200);
        }
        // Show the modal after selection
        backdrop.classList.remove('hidden');
    });

    // Debug: log when Click on Globe button is bound
    setTimeout(() => {
        const clickBtn = document.getElementById('btn-click-on-globe');
        if (clickBtn) {
            console.log('[AddStation] Click on Globe button found, binding event');
            clickBtn.addEventListener('click', () => {
                console.log('[AddStation] Click on Globe button clicked');
                // Hide modal while selecting
                backdrop.classList.add('hidden');
                // Dispatch event to activate globe click mode
                window.dispatchEvent(new CustomEvent('activate-globe-click-mode'));
            });
        } else {
            console.warn('[AddStation] Click on Globe button NOT found');
        }
    }, 500);

    // Listen for custom event to show modal after globe selection
    window.addEventListener('show-add-station-modal', () => {
        backdrop.classList.remove('hidden');
    });

    // Listen for esc key to hide modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            backdrop.classList.add('hidden');
        }
    });

    // Hide modal initially
    backdrop.classList.add('hidden');
    
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