import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// =======================
// Basic setup
// =======================

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(0, 15, 30);
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 5, 0);
controls.update();

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Ground
const groundGeo = new THREE.PlaneGeometry(80, 80);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x111111,
  roughness: 0.9,
  metalness: 0.1
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// =======================
// UI (score + timer)
// =======================

const uiContainer = document.createElement('div');
uiContainer.style.position = 'fixed';
uiContainer.style.top = '1rem';
uiContainer.style.left = '1rem';
uiContainer.style.padding = '0.5rem 0.75rem';
uiContainer.style.borderRadius = '0.5rem';
uiContainer.style.background = 'rgba(0,0,0,0.6)';
uiContainer.style.color = '#fff';
uiContainer.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
uiContainer.style.fontSize = '14px';
uiContainer.style.zIndex = '10';
uiContainer.style.pointerEvents = 'none';
document.body.appendChild(uiContainer);

const scoreEl = document.createElement('div');
const timeEl = document.createElement('div');
const messageEl = document.createElement('div');
messageEl.style.marginTop = '0.25rem';
messageEl.style.fontSize = '12px';
messageEl.style.opacity = '0.8';

uiContainer.appendChild(scoreEl);
uiContainer.appendChild(timeEl);
uiContainer.appendChild(messageEl);

// =======================
// Game state
// =======================

let score = 0;
let timeLeft = 30; // seconds
let gameOver = false;

function updateUI() {
  scoreEl.textContent = `Score: ${score}`;
  timeEl.textContent = `Time: ${timeLeft}s`;
  messageEl.textContent = gameOver ? 'Game over! Reload to play again.' : 'Click the glowing cubes!';
}

updateUI();

// Countdown timer
const timerInterval = setInterval(() => {
  if (gameOver) return;
  timeLeft--;
  if (timeLeft <= 0) {
    timeLeft = 0;
    gameOver = true;
    clearInterval(timerInterval);
  }
  updateUI();
}, 1000);

// =======================
// Cubes setup
// =======================

const cubes = [];
const activeCubes = new Set();

const baseGeometry = new THREE.BoxGeometry(2, 2, 2);

function randomColor() {
  const colors = [0xff6b6b, 0xffc46b, 0x6bffb0, 0x6bbdff, 0xd26bff];
  return colors[Math.floor(Math.random() * colors.length)];
}

// create cubes in a loose grid
const rows = 4;
const cols = 6;
const spacing = 5;
let idCounter = 1;

for (let i = 0; i < rows; i++) {
  for (let j = 0; j < cols; j++) {
    const mat = new THREE.MeshStandardMaterial({
      color: randomColor(),
      metalness: 0.3,
      roughness: 0.6,
      emissive: 0x000000
    });

    const cube = new THREE.Mesh(baseGeometry, mat);
    cube.position.set(
      (j - (cols - 1) / 2) * spacing,
      2,
      (i - (rows - 1) / 2) * spacing
    );

    cube.userData = {
      id: idCounter++,
      isActive: false
    };

    scene.add(cube);
    cubes.push(cube);
  }
}

// Activate random cubes periodically
const maxActive = 3;

function activateRandomCube() {
  if (gameOver) return;
  if (activeCubes.size >= maxActive) return;

  const available = cubes.filter(c => !activeCubes.has(c));
  if (!available.length) return;

  const cube = available[Math.floor(Math.random() * available.length)];
  cube.userData.isActive = true;
  activeCubes.add(cube);

  cube.material.emissive.setHex(0xffffff);
  cube.scale.set(1.3, 1.3, 1.3);
}

function deactivateCube(cube) {
  cube.userData.isActive = false;
  activeCubes.delete(cube);
  cube.material.emissive.setHex(0x000000);
  cube.scale.set(1, 1, 1);
}

// Spawn one active cube every 0.7s
setInterval(() => {
  if (!gameOver) {
    activateRandomCube();
  }
}, 700);

// =======================
// Raycaster for clicks
// =======================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  if (gameOver) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubes);

  if (intersects.length > 0) {
    const hit = intersects[0].object;
    if (hit.userData.isActive) {
      // Successful hit
      score++;
      deactivateCube(hit);
      updateUI();
    }
  }
}

window.addEventListener('click', onClick);

// =======================
// Animation loop
// =======================

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // idle animation for all cubes
  cubes.forEach((cube, idx) => {
    const offset = (idx % 10) * 0.15;
    cube.position.y = 2 + Math.sin(elapsed * 1.5 + offset) * 0.25;
    cube.rotation.y += 0.01;
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// =======================
// Resize
// =======================

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
