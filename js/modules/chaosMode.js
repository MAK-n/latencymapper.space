// ============================================
// CHAOS MODE - Fast Buttons + DVD Screensaver
// ============================================

import * as THREE from 'three';
import { getEarth, switchToVideoTexture, restoreOriginalTexture } from './earth.js';
import { getStationMeshes } from './groundStationRenderer.js';
import { getSatelliteMeshes } from './satelliteRenderer.js';
import { calculateOrbitPath, createOrbitLine } from './orbitalPath.js';

// ------------------------------------------------
// STATE
// ------------------------------------------------
let isChaosModeActive = false;
let animationFrameId = null;
let lastTeleportTime = 0;
const TELEPORT_INTERVAL = 2000;

// ------------------------------------------------
// ORIGINAL STATE STORAGE
// ------------------------------------------------
const originalButtonStates = new Map();
let buttonsCaptured = false;

const originalSatellitePositions = new Map();
const originalStationRotations = new Map();

const chaosOrbitLines = [];
const satelliteOrbitPaths = new Map();

// ------------------------------------------------
// DVD SCREENSAVER STATE
// ------------------------------------------------
let dvdEl = null;
let dvdX = 120;
let dvdY = 120;
let dvdVX = 4.5;
let dvdVY = 3.8;
let dvdReady = false;

// ------------------------------------------------
// RANDOM BUTTON MOTION STATE
// ------------------------------------------------
const buttonChaosState = new Map();

// ------------------------------------------------
// BUTTON HELPERS
// ------------------------------------------------
function getAllButtonsExceptChaos() {
    return Array.from(document.querySelectorAll('.control-btn'))
        .filter(btn => btn.id !== 'btn-chaos-mode');
}

function storeOriginalButtonStates() {
    if (buttonsCaptured) return;

    getAllButtonsExceptChaos().forEach(btn => {
        const rect = btn.getBoundingClientRect();
        originalButtonStates.set(btn, {
            left: rect.left,
            top: rect.top,
            parent: btn.parentElement
        });
    });

    buttonsCaptured = true;
}

function restoreButtonStates() {
    originalButtonStates.forEach((orig, btn) => {
        if (orig.parent && !orig.parent.contains(btn)) {
            orig.parent.appendChild(btn);
        }
        btn.style.position = '';
        btn.style.left = '';
        btn.style.top = '';
        btn.style.transform = '';
        btn.style.zIndex = '';
        delete btn.dataset.chaosDetached;
    });

    originalButtonStates.clear();
    buttonChaosState.clear();
    buttonsCaptured = false;
}

// ------------------------------------------------
// SATELLITES / STATIONS
// ------------------------------------------------
function storeOriginalSatellitePositions() {
    getSatelliteMeshes().forEach(mesh => {
        originalSatellitePositions.set(mesh, {
            position: mesh.position.clone(),
            scale: mesh.scale.clone()
        });

        const path = calculateOrbitPath(mesh);
        if (path?.length) satelliteOrbitPaths.set(mesh, path);
    });
}

function restoreSatellitePositions() {
    originalSatellitePositions.forEach((orig, mesh) => {
        mesh.position.copy(orig.position);
        mesh.scale.copy(orig.scale);
    });
    originalSatellitePositions.clear();
    satelliteOrbitPaths.clear();
}

// ------------------------------------------------
// ORBITS (RANDOM COLORS)
// ------------------------------------------------
function showAllOrbits() {
    if (!window.scene) return;
    removeAllOrbits();

    getSatelliteMeshes().forEach(mesh => {
        const path = satelliteOrbitPaths.get(mesh);
        if (!path) return;

        const line = createOrbitLine(path, false);
        line.material.color.setRGB(Math.random(), Math.random(), Math.random());
        window.scene.add(line);
        chaosOrbitLines.push(line);
    });
}

function removeAllOrbits() {
    chaosOrbitLines.forEach(line => {
        window.scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
    });
    chaosOrbitLines.length = 0;
}

// ------------------------------------------------
// DVD SCREENSAVER
// ------------------------------------------------
function createDVD() {
    if (dvdEl) return;

    dvdEl = document.createElement('img');
    dvdEl.src = './assets/DVD_screen_saver.png';
    Object.assign(dvdEl.style, {
        position: 'fixed',
        left: dvdX + 'px',
        top: dvdY + 'px',
        width: '140px',
        pointerEvents: 'none',
        zIndex: '2147483647'
    });

    dvdEl.onload = () => (dvdReady = true);
    document.body.appendChild(dvdEl);
}

function updateDVD() {
    if (!dvdEl || !dvdReady) return;

    const r = dvdEl.getBoundingClientRect();
    dvdX += dvdVX;
    dvdY += dvdVY;

    if (dvdX <= 0 || dvdX + r.width >= innerWidth) dvdVX *= -1;
    if (dvdY <= 0 || dvdY + r.height >= innerHeight) dvdVY *= -1;

    dvdEl.style.left = dvdX + 'px';
    dvdEl.style.top = dvdY + 'px';
}

function removeDVD() {
    dvdEl?.remove();
    dvdEl = null;
    dvdReady = false;
}

// ------------------------------------------------
// CAMERA
// ------------------------------------------------
function teleportCamera() {
    if (!window.camera) return;

    const r = 3 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.PI / 4 + Math.random() * Math.PI / 2;

    window.camera.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
    );
    window.camera.lookAt(0, 0, 0);
}

// ------------------------------------------------
// CHAOS LOOP
// ------------------------------------------------
function chaosAnimation() {
    if (!isChaosModeActive) return;

    // 🛰️ SATELLITE MOTION (FIXED)
    getSatelliteMeshes().forEach((mesh, i) => {
        const path = satelliteOrbitPaths.get(mesh);
        if (!path || path.length < 2) return;

        const t = (Date.now() * 0.001 + i) % 1;
        const scaled = t * (path.length - 1);
        const idx = Math.floor(scaled);
        const next = Math.min(idx + 1, path.length - 1);
        const frac = scaled - idx;

        mesh.position.lerpVectors(path[idx], path[next], frac);
        mesh.rotation.x += 0.1;
        mesh.rotation.y += 0.15;
    });

    // 🌀 RANDOM BUTTON MOTION
    getAllButtonsExceptChaos().forEach(btn => {
        if (!btn.dataset.chaosDetached) {
            document.body.appendChild(btn);
            btn.dataset.chaosDetached = 'true';

            const o = originalButtonStates.get(btn);
            buttonChaosState.set(btn, {
                x: o.left,
                y: o.top,
                vx: (Math.random() * 6 + 5) * (Math.random() < 0.5 ? -1 : 1),
                vy: (Math.random() * 6 + 5) * (Math.random() < 0.5 ? -1 : 1)
            });
        }

        const s = buttonChaosState.get(btn);
        if (!s) return;

        s.x += s.vx;
        s.y += s.vy;

        if (s.x <= 0 || s.x + btn.offsetWidth >= innerWidth) s.vx *= -1;
        if (s.y <= 0 || s.y + btn.offsetHeight >= innerHeight) s.vy *= -1;

        btn.style.position = 'fixed';
        btn.style.left = s.x + 'px';
        btn.style.top = s.y + 'px';
        btn.style.zIndex = '2147483647';
    });

    // 📀 DVD
    updateDVD();

    // 📷 RANDOM CAMERA TELEPORT
    if (Date.now() - lastTeleportTime > TELEPORT_INTERVAL) {
        teleportCamera();
        lastTeleportTime = Date.now();
    }

    animationFrameId = requestAnimationFrame(chaosAnimation);
}

// ------------------------------------------------
// ACTIVATE / DEACTIVATE
// ------------------------------------------------
export function activateChaosMode() {
    if (isChaosModeActive) return;

    restoreButtonStates(); // safety reset

    isChaosModeActive = true;
    lastTeleportTime = Date.now();

    storeOriginalButtonStates();
    storeOriginalSatellitePositions();

    switchToVideoTexture('./assets/rickroll.mp4');
    showAllOrbits();
    createDVD();
    chaosAnimation();
}

export function deactivateChaosMode() {
    if (!isChaosModeActive) return;
    isChaosModeActive = false;

    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;

    removeAllOrbits();
    removeDVD();
    restoreOriginalTexture();
    restoreButtonStates();
    restoreSatellitePositions();
}

// ------------------------------------------------
// PUBLIC API
// ------------------------------------------------
export function toggleChaosMode() {
    isChaosModeActive ? deactivateChaosMode() : activateChaosMode();
    return isChaosModeActive;
}

export function getChaosModeState() {
    return isChaosModeActive;
}
