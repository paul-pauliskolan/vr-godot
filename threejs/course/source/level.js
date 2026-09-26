import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const modelCache = new Map();
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

export async function loadModel(path, height, fallbackColor = 0x7d8585) {
  try {
    if (!modelCache.has(path)) modelCache.set(path, loader.loadAsync(path));
    const gltf = await modelCache.get(path);
    let object;
    let animations = gltf.animations;
    if (path.endsWith('/horror_monster.glb')) {
      // The FBX-converted armature produces an invalid scale/orientation with
      // Three.js skinning. Its bind-pose geometry is upright, so use that mesh
      // directly and animate locomotion procedurally in the game instead.
      const body = gltf.scene.getObjectByName('HorrorBody');
      if (!body?.isMesh) throw new Error('HorrorBody mesh missing from GLB');
      object = new THREE.Group();
      object.add(new THREE.Mesh(body.geometry, body.material));
      animations = [];
    } else object = cloneSkeleton(gltf.scene);
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const factor = height / Math.max(size.y, 0.001);
    object.scale.multiplyScalar(factor);
    const scaled = new THREE.Box3().setFromObject(object);
    const center = scaled.getCenter(new THREE.Vector3());
    object.position.set(-center.x, -scaled.min.y, -center.z);
    object.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true; node.receiveShadow = true;
        node.material = Array.isArray(node.material) ? node.material.map((item) => item.clone()) : node.material.clone();
      }
    });
    return { object, animations };
  } catch (error) {
    console.warn(`Could not load ${path}`, error);
    const object = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, Math.max(0.1, height - 0.44)), new THREE.MeshStandardMaterial({ color: fallbackColor }));
    object.position.y = height / 2;
    return { object, animations: [] };
  }
}

function material(url, color, repeatX = 1, repeatY = 1) {
  const texture = new THREE.TextureLoader().load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  return new THREE.MeshStandardMaterial({ map: texture, color, roughness: 0.95 });
}

function box(scene, width, height, depth, x, y, z, mat, shadows = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadows;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function label(scene, text, x, y, z, color = '#d1fff0', scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(4, 15, 18, .85)'; ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = '#3c746b'; ctx.strokeRect(3, 3, 506, 122);
  ctx.fillStyle = color; ctx.font = 'bold 46px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(text, 256, 80);
  const texture = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.8 * scale, 0.45 * scale), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  mesh.position.set(x, y, z); scene.add(mesh);
  return mesh;
}

export function buildLevel(scene) {
  const floor = material(assetUrl('assets/textures/cracked_concrete_diff_1k.jpg'), 0xd5d7d6, 5, 5);
  const walls = material(assetUrl('assets/textures/rebar_reinforced_concrete_diff_1k.jpg'), 0xc3cdd0, 3, 1.5);
  const rust = material(assetUrl('assets/textures/rusty_metal_sheet_diff_1k.jpg'), 0xbac3c1, 2, 3);
  const dark = new THREE.MeshStandardMaterial({ color: 0x17262a, metalness: 0.7, roughness: 0.7 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x14c4b5, emissive: 0x11c5b5, emissiveIntensity: 1.9 });
  const green = new THREE.MeshStandardMaterial({ color: 0x305b2f, roughness: 1 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x9a9278, roughness: 1 });
  const obstacles = [];
  const addWall = (w, d, x, z, h = 2.8) => {
    const mesh = box(scene, w, h, d, x, h / 2, z, walls);
    obstacles.push({ x, z, w, d, mesh });
  };
  box(scene, 24, 0.16, 24, 0, -0.08, 0, floor, false);
  box(scene, 24, 0.16, 20, 0, -0.08, 22, floor, false);
  addWall(24.2, 0.2, 0, -12, 3.4);
  addWall(0.2, 24.2, -12, 0, 3.4); addWall(0.2, 24.2, 12, 0, 3.4);
  addWall(11, 0.2, -6.5, 12, 3.4); addWall(11, 0.2, 6.5, 12, 3.4);
  addWall(11, 0.3, -6.5, 2.8); addWall(11, 0.3, 6.5, 2.8);
  addWall(15, 0.3, -2.5, -4.3); addWall(8, 0.3, 6, 6.3);
  addWall(0.3, 3.5, -7.5, -0.5); addWall(0.3, 3.5, 7.5, 0.5);
  box(scene, 9.5, 0.14, 24, -7.25, 3.36, 0, rust);
  box(scene, 9.5, 0.14, 24, 7.25, 3.36, 0, rust);
  for (const z of [-7.5, 7.5]) box(scene, 24, 0.18, 0.18, 0, 3.25, z, dark);
  box(scene, 2.5, 0.14, 1.2, 0, 0.85, -1.45, dark);
  for (const x of [-1.1, 1.1]) for (const z of [-1.9, -1]) box(scene, 0.1, 0.85, 0.1, x, 0.43, z, dark);
  for (const x of [-12, 12]) addWall(0.25, 20.2, x, 22);
  addWall(24.2, 0.25, 0, 32);
  box(scene, 3.2, 0.04, 15.5, 0, 0.025, 20, stone, false);
  for (const [x, z] of [[-4.4, 22], [4.5, 24], [-8, 27], [8, 29]]) {
    box(scene, 0.18, 2.1, 0.18, x, 1.05, z, dark);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), green);
    crown.position.set(x, 2.4, z); scene.add(crown);
  }
  for (const x of [-1.75, 1.75]) box(scene, 0.3, 3.2, 0.35, x, 1.6, 28.8, dark);
  box(scene, 3.6, 0.3, 0.35, 0, 3.15, 28.8, dark);
  label(scene, 'DAYLIGHT', 0, 2.7, 28.55, '#ffe3a0', 0.9);
  const alien = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), glow);
  alien.position.set(0, 2.05, -11.83); scene.add(alien);
  for (const x of [-0.3, 0.3]) box(scene, 0.055, 1.5, 0.055, x, 1.48, -11.83, glow);
  scene.add(new THREE.HemisphereLight(0xa5c4d7, 0x1b2023, 1.45));
  const lamp = (color, intensity, x, y, z, range) => {
    const light = new THREE.PointLight(color, intensity, range); light.position.set(x, y, z); scene.add(light);
  };
  lamp(0x70e2cb, 12, 0, 2.5, -1.5, 8);
  lamp(0x37aa99, 8, 0, 2.2, -11.7, 7);
  lamp(0x73b4d5, 10, 4.3, 2.5, 3.8, 10);
  lamp(0xffd897, 35, 0, 4.3, 26, 18);
  scene.background = new THREE.Color(0x1c313c);
  scene.fog = new THREE.Fog(0x1c313c, 25, 80);
  return { obstacles, label, addWall };
}

export function blocked(x, z, radius, obstacles, doors) {
  if (x < -11.7 + radius || x > 11.7 - radius || z < -11.7 + radius || z > 31.7 - radius) return true;
  for (const wall of obstacles) {
    if (Math.abs(x - wall.x) < wall.w / 2 + radius && Math.abs(z - wall.z) < wall.d / 2 + radius) return true;
  }
  if (!doors[0] && Math.abs(x) < 0.95 + radius && Math.abs(z - 2.8) < 0.16 + radius) return true;
  if (!doors[1] && Math.abs(x) < 0.95 + radius && Math.abs(z - 12) < 0.16 + radius) return true;
  return false;
}

export function nextPathStep(from, to, obstacles, doors) {
  const cell = 0.7;
  const toCell = (p) => [Math.round(p.x / cell), Math.round(p.z / cell)];
  const start = toCell(from), goal = toCell(to);
  const key = (x, z) => `${x},${z}`;
  const queue = [start], seen = new Set([key(...start)]), parent = new Map();
  let found = null;
  for (let i = 0; i < queue.length && i < 2100; i++) {
    const [x, z] = queue[i];
    if (x === goal[0] && z === goal[1]) { found = [x, z]; break; }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz, id = key(nx, nz);
      if (!seen.has(id) && !blocked(nx * cell, nz * cell, 0.42, obstacles, doors)) {
        seen.add(id); parent.set(id, [x, z]); queue.push([nx, nz]);
      }
    }
  }
  if (!found) return null;
  let cursor = found, previous = found;
  while (parent.has(key(...cursor)) && key(...cursor) !== key(...start)) {
    previous = cursor; cursor = parent.get(key(...cursor));
  }
  return new THREE.Vector3(previous[0] * cell, 0, previous[1] * cell);
}
