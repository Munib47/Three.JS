import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== Sizes =====
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// ===== Scene =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050509);

// ===== Camera =====
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(0, 15, 25);
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
controls.target.set(0, 0, 0);
controls.update();

// ===== Lights =====
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// ===== Floor =====
const floorGeo = new THREE.PlaneGeometry(60, 60);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x111111,
  metalness: 0.2,
  roughness: 0.8
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.01;
floor.receiveShadow = true;
scene.add(floor);

// ===== Grid of cubes =====
const cubes = [];
const gridSize = 5;       // 5x5
const spacing = 4;        // distance between cubes

const baseGeometry = new THREE.BoxGeometry(2, 2, 2);

function randomColor() {
  const colors = [0xff6b6b, 0xffc46b, 0x6bffb0, 0x6bbdff, 0xd26bff];
  return colors[Math.floor(Math.random() * colors.length)];
}

let idCounter = 1;

for (let x = -gridSize; x <= gridSize; x++) {
  for (let z = -gridSize; z <= gridSize; z++) {
    const mat = new THREE.MeshStandardMaterial({
      color: randomColor(),
      metalness: 0.3,
      roughness: 0.6
    });

    const cube = new THREE.Mesh(baseGeometry, mat);
    cube.position.set(x * spacing, 1, z * spacing);

    // Store custom data
    cube.userData = {
      id: idCounter++,
      info: `Cube at (${x}, ${z})`
    };

    scene.add(cube);
    cubes.push(cube);
  }
}

// ===== Raycaster & mouse tracking =====
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// keep track of hovered cube to un-highlight
let hoveredCube = null;
const hoverScale = 1.2;

// convert mouse from screen to NDC for raycaster
function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove);

// Click handler
function onClick() {
  if (!hoveredCube) return;

  const { id, info } = hoveredCube.userData;
  console.log(`Clicked cube #${id}: ${info}`);
  alert(`You clicked cube #${id}\n${info}`);
}

window.addEventListener('click', onClick);

// ===== Animation loop =====
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // Small idle animation for all cubes
  cubes.forEach((cube, i) => {
    const offset = (i % 10) * 0.1;
    cube.position.y = 1 + Math.sin(elapsed * 1.2 + offset) * 0.2;
    cube.rotation.y += 0.005;
  });

  // Raycasting: find intersected cubes
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubes);

  if (intersects.length > 0) {
    const first = intersects[0].object;

    if (hoveredCube !== first) {
      // reset previous hovered cube
      if (hoveredCube) {
        hoveredCube.scale.set(1, 1, 1);
        hoveredCube.material.emissive = new THREE.Color(0x000000);
      }

      // set new hovered cube
      hoveredCube = first;
      hoveredCube.scale.set(hoverScale, hoverScale, hoverScale);
      hoveredCube.material.emissive = new THREE.Color(0xffffff);
    }
  } else {
    // nothing hovered: reset previous
    if (hoveredCube) {
      hoveredCube.scale.set(1, 1, 1);
      hoveredCube.material.emissive = new THREE.Color(0x000000);
      hoveredCube = null;
    }
  }

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
