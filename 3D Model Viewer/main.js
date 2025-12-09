// 3D Model Viewer main.js
// Requires import map in index.html for "three" and "three/addons/"

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ===== Sizes =====
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// ===== Scene =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// ===== Camera =====
const camera = new THREE.PerspectiveCamera(
  50,
  sizes.width / sizes.height,
  0.1,
  1000
);
camera.position.set(0, 2, 6);
scene.add(camera);

// ===== Renderer =====
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.appendChild(renderer.domElement);

// ===== Controls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 1, 0); // focus around model height

// ===== Lights =====
// Soft sky+ground light
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.7);
hemiLight.position.set(0, 10, 0);
scene.add(hemiLight);

// Fake "studio" light
const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

// ===== Ground =====
const groundGeo = new THREE.CircleGeometry(5, 64);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x222222,
  metalness: 0.0,
  roughness: 0.8
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
ground.receiveShadow = true;
scene.add(ground);

// ===== Model loading =====
const loader = new GLTFLoader();
let model = null;

// You can change this URL to any other GLB/GLTF you like
const MODEL_URL =
  'https://threejs.org/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf';

loader.load(
  MODEL_URL,
  (gltf) => {
    model = gltf.scene;

    // Optional: enable shadows on all meshes
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material.side = THREE.FrontSide;
        }
      }
    });

    // Center + scale the model nicely
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Move model so its center is at origin
    model.position.sub(center);

    // Scale to a reasonable size
    const maxAxis = Math.max(size.x, size.y, size.z);
    const desiredSize = 3; // how big you want it
    const scale = desiredSize / maxAxis;
    model.scale.setScalar(scale);

    // Raise model a bit so it sits on the ground
    model.position.y += 1.0;

    scene.add(model);

    console.log('Model loaded:', MODEL_URL);
  },
  (xhr) => {
    // Progress (optional)
    if (xhr.total) {
      const percent = (xhr.loaded / xhr.total) * 100;
      console.log(`Loading model: ${percent.toFixed(1)}%`);
    }
  },
  (error) => {
    console.error('Error loading model:', error);
  }
);

// ===== Animation loop =====
const clock = new THREE.Clock();
let autoRotate = true;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Auto-rotate model if loaded
  if (model && autoRotate) {
    model.rotation.y += delta * 0.5; // adjust speed here
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

// ===== Optional: toggle auto-rotate on click anywhere =====
window.addEventListener('click', () => {
  autoRotate = !autoRotate;
});
