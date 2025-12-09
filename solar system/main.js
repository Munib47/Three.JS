import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== Sizes =====
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// ===== Scene =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// ===== Camera =====
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(0, 35, 60);
scene.add(camera);

// ===== Renderer =====
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// ===== Controls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 150;
controls.target.set(0, 0, 0);
controls.update();

// ===== Lights =====
const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2.5, 400);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// ===== Sun =====
const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
const sunMaterial = new THREE.MeshStandardMaterial({
  emissive: 0xffff00,
  emissiveIntensity: 1.3,
  color: 0xffcc00
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// ===== Helpers =====
function createOrbitRing(radius, color = 0x333333) {
  const ringGeometry = new THREE.RingGeometry(radius - 0.05, radius + 0.05, 128);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2; // lay flat
  scene.add(ring);
}

// ===== Planet configs =====
// (scaled sizes + distances, not realistic but nice looking)
const planetConfigs = [
  { name: 'Mercury', radius: 0.7, color: 0xb1b1b1, distance: 7,  orbitSpeed: 1.2, rotationSpeed: 0.03 },
  { name: 'Venus',   radius: 1.1, color: 0xe0c16c, distance: 10, orbitSpeed: 0.9, rotationSpeed: 0.02 },
  { name: 'Earth',   radius: 1.3, color: 0x3399ff, distance: 13, orbitSpeed: 0.7, rotationSpeed: 0.04, hasMoon: true },
  { name: 'Mars',    radius: 1.0, color: 0xff5533, distance: 16, orbitSpeed: 0.6, rotationSpeed: 0.03 },
  { name: 'Jupiter', radius: 2.6, color: 0xd2b48c, distance: 21, orbitSpeed: 0.35, rotationSpeed: 0.05 },
  { name: 'Saturn',  radius: 2.3, color: 0xf4e2b0, distance: 26, orbitSpeed: 0.3, rotationSpeed: 0.045, hasRings: true },
  { name: 'Uranus',  radius: 2.0, color: 0x7fffd4, distance: 31, orbitSpeed: 0.22, rotationSpeed: 0.035 },
  { name: 'Neptune', radius: 1.9, color: 0x4169e1, distance: 36, orbitSpeed: 0.18, rotationSpeed: 0.035 }
];

const planets = [];

// ===== Create planets, orbits & extras =====
planetConfigs.forEach((cfg) => {
  // Orbit group (centered at Sun)
  const orbitGroup = new THREE.Object3D();
  scene.add(orbitGroup);

  // Planet mesh
  const geom = new THREE.SphereGeometry(cfg.radius, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color: cfg.color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(cfg.distance, 0, 0);
  orbitGroup.add(mesh);

  // Orbit ring (line) on the "ground"
  createOrbitRing(cfg.distance);

  // Optional moon (for Earth)
  let moonOrbit = null;
  let moonMesh = null;
  if (cfg.hasMoon) {
    moonOrbit = new THREE.Object3D();
    mesh.add(moonOrbit);

    const moonGeom = new THREE.SphereGeometry(0.4, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    moonMesh = new THREE.Mesh(moonGeom, moonMat);
    moonMesh.position.set(3, 0, 0);
    moonOrbit.add(moonMesh);
  }

  // Optional rings (for Saturn)
  let saturnRings = null;
  if (cfg.hasRings) {
    const ringGeom = new THREE.RingGeometry(
      cfg.radius * 1.4,
      cfg.radius * 2.1,
      128
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd8c8a8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });

    saturnRings = new THREE.Mesh(ringGeom, ringMat);
    saturnRings.rotation.x = Math.PI / 2.5; // tilted a bit
    mesh.add(saturnRings);
  }

  planets.push({
    ...cfg,
    orbitGroup,
    mesh,
    moonOrbit,
    moonMesh,
    saturnRings
  });
});

// ===== Stars =====
function createStars(count = 800) {
  const positions = new Float32Array(count * 3);
  const radius = 200;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    positions[i3 + 0] = (Math.random() - 0.5) * radius * 2;
    positions[i3 + 1] = (Math.random() - 0.5) * radius * 2;
    positions[i3 + 2] = (Math.random() - 0.5) * radius * 2;
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

createStars();

// ===== Animation loop =====
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // Sun spin
  sun.rotation.y += 0.002;

  // Planets
  planets.forEach((p) => {
    // Orbit around Sun
    p.orbitGroup.rotation.y = elapsed * p.orbitSpeed;

    // Self-rotation
    p.mesh.rotation.y += p.rotationSpeed;

    // Moon orbit (Earth)
    if (p.moonOrbit) {
      p.moonOrbit.rotation.y = elapsed * 1.5;
      if (p.moonMesh) {
        p.moonMesh.rotation.y += 0.03;
      }
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

// ===== Resize handling =====
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
