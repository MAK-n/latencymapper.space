// ============================================
// CUSTOM SATELLITE - Creation UI & Logic
// Modal for creating custom satellites
// ============================================

import { renderSatellites, getSatelliteMeshes } from '../satelliteRenderer.js';
import { initializeSatelliteRecord, setSatelliteRecords, getSatelliteRecords, propagateSatellitePosition } from '../satelliteData.js';
import { addSatellitePosition } from '../satelliteUpdater.js';

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
        <p>Add a satellite using Two-Line Element (TLE) data</p>
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
            </div>
            
            <!-- TLE Data Section -->
            <div class="form-section">
                <h3 class="form-section-title">TLE Data</h3>
                
                <div class="form-group">
                    <label class="form-label required" for="satellite-tle1">TLE Line 1</label>
                    <input type="text" id="satellite-tle1" class="form-input" placeholder="1 25544U 98067A   25346.15413386  .00014398  00000-0  26408-3 0  9999" required>
                    <span class="form-hint">First line of the Two-Line Element set</span>
                </div>
                
                <div class="form-group">
                    <label class="form-label required" for="satellite-tle2">TLE Line 2</label>
                    <input type="text" id="satellite-tle2" class="form-input" placeholder="2 25544  51.6307 145.3792 0003284 237.6977 122.3694 15.49529746542766" required>
                    <span class="form-hint">Second line of the Two-Line Element set</span>
                </div>
                
                <div class="form-group">
                    <button type="button" id="btn-load-iss-tle" class="btn btn-secondary btn-block">
                        📡 Load ISS TLE (Example)
                    </button>
                    <span class="form-hint">Click to load ISS TLE as an example</span>
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

    // Handle form submission
    const form = modal.querySelector('#form-add-satellite');
    if (form) {
        // Load ISS TLE example button
        const loadIssBtn = form.querySelector('#btn-load-iss-tle');
        if (loadIssBtn) {
            loadIssBtn.addEventListener('click', () => {
                const tle1Input = form.querySelector('#satellite-tle1');
                const tle2Input = form.querySelector('#satellite-tle2');
                const nameInput = form.querySelector('#satellite-name');
                if (tle1Input && tle2Input) {
                    tle1Input.value = '1 25544U 98067A   25346.15413386  .00014398  00000-0  26408-3 0  9999';
                    tle2Input.value = '2 25544  51.6307 145.3792 0003284 237.6977 122.3694 15.49529746542766';
                    if (nameInput && !nameInput.value) {
                        nameInput.value = 'ISS (ZARYA)';
                    }
                }
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[CustomSatellite] Form submitted');

            // Get form values
            const nameInput = form.querySelector('#satellite-name');
            const tle1Input = form.querySelector('#satellite-tle1');
            const tle2Input = form.querySelector('#satellite-tle2');

            console.log('[CustomSatellite] Form inputs:', {
                nameInput: !!nameInput,
                tle1Input: !!tle1Input,
                tle2Input: !!tle2Input
            });

            if (!nameInput || !tle1Input || !tle2Input) {
                console.error('[CustomSatellite] Missing required form inputs');
                alert('Missing required fields.');
                return;
            }

            const name = nameInput.value.trim();
            const tle1 = tle1Input.value.trim();
            const tle2 = tle2Input.value.trim();

            console.log('[CustomSatellite] Form values:', { name, tle1Length: tle1.length, tle2Length: tle2.length });

            if (!name || !tle1 || !tle2) {
                console.error('[CustomSatellite] Empty form values');
                alert('Please fill all required fields (Name, TLE Line 1, and TLE Line 2).');
                return;
            }

            try {
                console.log('[CustomSatellite] Starting satellite creation process...');
                
                // Wait for satellite.js if needed
                if (typeof window.satellite === 'undefined') {
                    console.warn('[CustomSatellite] satellite.js not loaded, waiting...');
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (typeof window.satellite === 'undefined') {
                        throw new Error('satellite.js library not loaded');
                    }
                }
                console.log('[CustomSatellite] satellite.js is available');

                // Create satellite object (same format as loaded satellites)
                const satellite = {
                    name: name,
                    tle1: tle1,
                    tle2: tle2
                };
                console.log('[CustomSatellite] Created satellite object:', satellite);

                // Initialize satellite record (same as existing satellites)
                console.log('[CustomSatellite] Initializing satellite record...');
                const satRecord = initializeSatelliteRecord(satellite);
                if (!satRecord) {
                    throw new Error('Failed to initialize satellite record from TLE');
                }
                // Mark as custom satellite for red coloring
                satRecord.isCustom = true;
                console.log('[CustomSatellite] Satellite record initialized:', {
                    name: satRecord.name,
                    hasSatrec: !!satRecord.satrec,
                    satrecError: satRecord.satrec?.error,
                    isCustom: satRecord.isCustom
                });

                // Propagate initial position (same as existing satellites)
                const currentTime = new Date();
                console.log('[CustomSatellite] Propagating position at time:', currentTime);
                const position = propagateSatellitePosition(satRecord, currentTime);
                if (!position) {
                    throw new Error('Could not propagate satellite position from TLE');
                }
                console.log('[CustomSatellite] Position propagated:', {
                    latitude: position.latitude,
                    longitude: position.longitude,
                    altitude: position.altitude,
                    velocity: position.velocity
                });

                // Add to satellite records
                const records = getSatelliteRecords();
                console.log('[CustomSatellite] Current records count:', records.length);
                records.push(satRecord);
                setSatelliteRecords(records);
                console.log('[CustomSatellite] Added to records, new count:', records.length);

                // Create target position
                const satTargetPos = { 
                    latitude: position.latitude, 
                    longitude: position.longitude, 
                    altitude: position.altitude, 
                    velocity: position.velocity 
                };
                console.log('[CustomSatellite] Created target position:', satTargetPos);

                // Add position to updater arrays (critical for animation loop)
                console.log('[CustomSatellite] Adding position to updater arrays...');
                addSatellitePosition(satTargetPos);
                console.log('[CustomSatellite] Position added to updater arrays');

                // Render satellite (same as existing satellites)
                console.log('[CustomSatellite] Checking scene availability...');
                console.log('[CustomSatellite] window.TREE:', !!window.TREE);
                console.log('[CustomSatellite] window.scene:', !!window.scene);
                
                if (window.TREE) {
                    console.log('[CustomSatellite] Rendering satellite to scene...');
                    const meshesBefore = getSatelliteMeshes().length;
                    console.log('[CustomSatellite] Meshes before render:', meshesBefore);
                    
                    renderSatellites(window.TREE, [satRecord], [satTargetPos]);
                    
                    const meshesAfter = getSatelliteMeshes().length;
                    console.log('[CustomSatellite] Meshes after render:', meshesAfter);
                    console.log('[CustomSatellite] New meshes created:', meshesAfter - meshesBefore);
                    
                    // Update cached meshes in main.js - CRITICAL for animation loop
                    const allMeshes = getSatelliteMeshes();
                    
                    // Check if mesh was actually added to scene
                    const newMesh = allMeshes[allMeshes.length - 1];
                    if (newMesh) {
                        console.log('[CustomSatellite] New mesh details:', {
                            position: newMesh.position,
                            userData: newMesh.userData,
                            inScene: window.TREE.children.includes(newMesh)
                        });
                    }
                    
                    window.cachedSatelliteMeshes = allMeshes;
                    window.cachedSatelliteRecords = records;
                    console.log('[CustomSatellite] Updated cached arrays:', {
                        meshes: window.cachedSatelliteMeshes.length,
                        records: window.cachedSatelliteRecords.length,
                        targetPositions: window.getSatelliteTargetPositions?.()?.length || 'N/A',
                        currentPositions: window.getSatelliteCurrentPositions?.()?.length || 'N/A'
                    });
                    
                    // Verify the new mesh is in the cached array
                    const lastMesh = allMeshes[allMeshes.length - 1];
                    if (lastMesh && lastMesh.userData.satelliteName === name) {
                        console.log('[CustomSatellite] ✓ New mesh confirmed in cached array at index:', allMeshes.length - 1);
                        console.log('[CustomSatellite] Mesh position:', lastMesh.position);
                        console.log('[CustomSatellite] Mesh visible:', lastMesh.visible);
                        console.log('[CustomSatellite] Mesh material:', lastMesh.material);
                    }

                    console.log('[CustomSatellite] ✓ Custom satellite rendered and added to scene');
                } else {
                    console.error('[CustomSatellite] ERROR: window.TREE (scene) is not available!');
                }

                // Hide modal and reset
                backdrop.classList.add('hidden');
                form.reset();
                console.log('[CustomSatellite] ✓ Custom satellite added successfully:', name);
            } catch (err) {
                console.error('[CustomSatellite] ERROR in satellite creation:', err);
                console.error('[CustomSatellite] Error stack:', err.stack);
                alert('Failed to add satellite: ' + err.message);
            }
        });
    }

    // Close button handlers
    const closeButton = modal.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            backdrop.classList.add('hidden');
            if (form) form.reset();
        });
    }

    const cancelButton = modal.querySelector('#btn-cancel-satellite');
    if (cancelButton) {
        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            backdrop.classList.add('hidden');
            if (form) form.reset();
        });
    }

    // ESC key to close
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !backdrop.classList.contains('hidden')) {
            backdrop.classList.add('hidden');
            if (form) form.reset();
        }
    });

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

