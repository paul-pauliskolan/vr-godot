import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { buildLevel, blocked, loadModel, nextPathStep } from './level.js';
import { canOpenDoor, createState, formatTime, monsterKindForSpawn, restoredHealth, RULES, scoreFor } from './rules.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const scene = new THREE.Scene();
const rig = new THREE.Group();
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 100);
camera.position.y = 1.65;
rig.add(camera);
scene.add(rig);
const level = buildLevel(scene);
const storageKey = 'alien-escape-threejs-best-score';
let bestScore = 0;
try { bestScore = Math.max(0, Number(localStorage.getItem(storageKey)) || 0); } catch { /* Private browsing. */ }
const state = createState(bestScore);
let previousFrame = performance.now();
const keysDown = new Set();
const raycaster = new THREE.Raycaster();
const shotOrigin = new THREE.Vector3();
const shotDirection = new THREE.Vector3();
const temp = new THREE.Vector3();
const monsters = [];
const buckets = [];
const looseMagazines = [];
const medkits = [];
const doors = [];
const controllers = [];
const spawnPositions = [[-8, -8.5], [8, -8.5], [-8, -6.7], [6, -6.7], [0, -8.5]];
let renderer;
let spawnClock = 0;
let powerClock = 0;
let spawnCount = 0;
let lastShot = 0;
let damageCooldown = 0;
let verticalSpeed = 0;
let groundHeight = 0;
let noticeTimeout;
let music;
let shotAudio;
let heldMagazine = null;
let heldBy = null;
let audioContext = null;
let footstepTimer = 0;
let desktopYaw = Math.PI;
let desktopPitch = 0;
const defaultEyeHeight = 1.65;
const crouchedEyeHeight = 1.0;
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

const modelPaths = {
  bucket: assetUrl('assets/escape_props/bucket.glb'), key: assetUrl('assets/escape_props/key.glb'),
  door: assetUrl('assets/escape_props/door.glb'), horror: assetUrl('assets/monsters/horror_monster.glb'),
  spider: assetUrl('assets/monsters/spider.glb'), medkit: assetUrl('assets/medkit/medkit.glb')
};

function announce(message, seconds = 2.5) {
  $('notice').textContent = message;
  $('notice').classList.add('show');
  clearTimeout(noticeTimeout);
  noticeTimeout = setTimeout(() => $('notice').classList.remove('show'), seconds * 1000);
}

function sound(url, volume, loop = false) {
  const audio = new Audio(url);
  audio.volume = volume; audio.loop = loop; audio.preload = 'auto';
  return audio;
}

function playShot() {
  if (!state.sfx) return;
  const instance = shotAudio.cloneNode();
  instance.volume = 0.58;
  instance.play().catch(() => {});
  instance.addEventListener('ended', () => instance.remove(), { once: true });
}

function playTone(frequency, duration, volume, worldPosition = null) {
  if (!state.sfx) return;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 650;
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(frequency * .45, 25), audioContext.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
  oscillator.connect(filter); filter.connect(gain);
  if (worldPosition) {
    const pan = audioContext.createStereoPanner();
    const relative = worldPosition.clone().sub(rig.position).applyAxisAngle(new THREE.Vector3(0, 1, 0), -rig.rotation.y);
    pan.pan.value = THREE.MathUtils.clamp(relative.x / 6, -1, 1);
    gain.connect(pan); pan.connect(audioContext.destination);
  } else gain.connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); gain.disconnect(); };
}

function updateAudio() {
  state.sfx = $('sfx-toggle').checked;
  state.music = $('music-toggle').checked;
  if (music) { if (state.music && state.started && !state.won && !state.gameOver) music.play().catch(() => {}); else music.pause(); }
}

function newMaterial(color, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.45, roughness: 0.58, emissive });
}

function part(group, geometry, material, x, y, z) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function makePistol() {
  const group = new THREE.Group();
  const steel = newMaterial(0x24292b);
  const grip = newMaterial(0x111a1b);
  part(group, new THREE.BoxGeometry(.09, .1, .28), steel, 0, .055, -.11);
  part(group, new THREE.BoxGeometry(.07, .15, .08), grip, 0, -.07, .01).rotation.x = -.25;
  part(group, new THREE.BoxGeometry(.025, .03, .07), steel, 0, -.04, -.07);
  part(group, new THREE.BoxGeometry(.025, .025, .04), steel, 0, .12, .01);
  const muzzle = new THREE.Object3D(); muzzle.position.set(0, .05, -.27); group.add(muzzle);
  group.userData.muzzle = muzzle;
  return group;
}

const desktopPistol = makePistol();
desktopPistol.position.set(.25, -.21, -.46);
camera.add(desktopPistol);
const xrPistol = makePistol();
xrPistol.position.set(0, -.03, -.09);
xrPistol.rotation.x = -.13;
xrPistol.visible = false;

function canvasPanel() {
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 320;
  const texture = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.54, .225), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, side: THREE.DoubleSide }));
  mesh.position.set(0, .11, -.23); mesh.rotation.x = -.3; mesh.renderOrder = 10;
  return { mesh, canvas, texture };
}
const wrist = canvasPanel();
const startPanel = canvasPanel();
startPanel.mesh.position.set(0, -.22, -.75);
startPanel.mesh.scale.set(2.2, 2.2, 2.2);
camera.add(startPanel.mesh);

function paintPanel(panel, lines, background = '#06191b') {
  const ctx = panel.canvas.getContext('2d');
  ctx.fillStyle = background; ctx.fillRect(0, 0, 768, 320);
  ctx.strokeStyle = '#78dfc4'; ctx.lineWidth = 10; ctx.strokeRect(6, 6, 756, 308);
  ctx.fillStyle = '#b3ffe2'; ctx.font = 'bold 47px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, 30, 75 + 72 * i));
  panel.texture.needsUpdate = true;
}

function updateHud() {
  $('health-label').textContent = `HEALTH ${state.health}`;
  $('health-fill').style.width = `${state.health}%`;
  $('key-label').textContent = `KEYS ${state.keys.filter(Boolean).length}/2`;
  $('kill-label').textContent = `KILLS ${state.kills}`;
  $('ammo-label').textContent = `${state.hasMagazine ? state.ammo : '—'} / ${state.magazines} magazines`;
  $('time-label').textContent = formatTime(state.time);
  $('best-score').textContent = state.bestScore;
  const nearby = nearestAction(new THREE.Vector3(rig.position.x, .45, rig.position.z));
  const action = nearby?.kind === 'bucket' ? 'Lift bucket' : nearby?.kind === 'key' ? 'Take key' : nearby?.kind === 'magazine' ? 'Take magazine' : nearby?.kind === 'medkit' ? 'Take medkit' : nearby?.kind === 'door' ? 'Use door' : '';
  const fullHealth = !action && medkits.some((medkit) => Math.hypot(rig.position.x - medkit.position.x, rig.position.z - medkit.position.z) < 1.1);
  $('hint-label').textContent = action ? `${renderer?.xr.isPresenting ? 'Grip' : 'E'} · ${action}` : fullHealth ? 'Health full' : '';
  paintPanel(wrist, [`HEALTH ${state.health}   KEYS ${state.keys.filter(Boolean).length}/2`, `AMMO ${state.hasMagazine ? state.ammo : '—'}   MAGS ${state.magazines}`, `KILLS ${state.kills}   ${formatTime(state.time)}`, action ? `GRIP: ${action.toUpperCase()}` : fullHealth ? 'HEALTH FULL' : '']);
  startPanel.mesh.visible = !!renderer?.xr.isPresenting && (!state.started || state.won || state.gameOver);
  paintPanel(startPanel, ['ALIEN ESCAPE', 'Trigger: start   Grip: interact', 'Move: left stick   Fire: trigger']);
}

function modelAt(path, height, position, color, parent = scene) {
  const anchor = new THREE.Group(); anchor.position.set(...position); parent.add(anchor);
  loadModel(path, height, color).then(({ object, animations }) => {
    if (!anchor.parent) return;
    anchor.add(object); anchor.userData.model = object;
    anchor.userData.animations = animations;
  });
  return anchor;
}

function makeKey(number, x, z) {
  const anchor = modelAt(modelPaths.key, .42, [x, .45, z], 0xdcc47d);
  anchor.visible = false;
  anchor.userData.number = number;
  anchor.userData.revealedAt = Infinity;
  const light = new THREE.PointLight(0xfbd675, 5, 2.3); light.position.y = .25; anchor.add(light);
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.09), new THREE.MeshBasicMaterial({ color: 0xffe080 }));
  marker.position.y = .72; anchor.add(marker);
  anchor.userData.marker = marker;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.25, .018, 6, 28), new THREE.MeshBasicMaterial({ color: 0xffd568, side: THREE.DoubleSide }));
  ring.rotation.x = Math.PI / 2; ring.position.y = -.35; anchor.add(ring);
  return anchor;
}

function makeBucket(number, x, z) {
  const key = makeKey(number, x, z);
  const anchor = modelAt(modelPaths.bucket, .42, [x, 0, z], 0x7b8580);
  anchor.userData = { number, key, moved: false, moveProgress: 0, startX: x, startZ: z };
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(.08), new THREE.MeshBasicMaterial({ color: 0x86fff0 }));
  marker.position.y = .68; anchor.add(marker);
  buckets.push(anchor);
}

function moveBucket(bucket) {
  if (bucket.userData.moved) return;
  bucket.userData.moved = true;
  bucket.userData.key.visible = true;
  bucket.userData.key.userData.revealedAt = state.time + 1.8;
  announce(`Key ${bucket.userData.number} revealed! Press E or grip to take it.`);
}

function makeDoor(number, z) {
  const hinge = new THREE.Group(); hinge.position.set(-.82, 0, z); scene.add(hinge);
  const leaf = modelAt(modelPaths.door, 2.3, [.82, 0, 0], 0x7e5b45, hinge);
  const rustTexture = new THREE.TextureLoader().load(assetUrl('assets/textures/rusty_metal_sheet_diff_1k.jpg'));
  rustTexture.colorSpace = THREE.SRGBColorSpace;
  const rustFinish = new THREE.MeshStandardMaterial({ map: rustTexture, color: 0xc3bbb0, metalness: .52, roughness: .8 });
  const finishTimer = setInterval(() => {
    if (!leaf.userData.model && leaf.parent) return;
    clearInterval(finishTimer);
    leaf.userData.model?.traverse((node) => { if (node.isMesh && /door/i.test(node.name)) node.material = rustFinish; });
  }, 60);
  const collider = part(hinge, new THREE.BoxGeometry(1.7, 2.45, .18), new THREE.MeshBasicMaterial({ visible: false }), .82, 1.23, 0);
  const indicator = new THREE.Mesh(new THREE.SphereGeometry(.08), new THREE.MeshBasicMaterial({ color: 0xe17c5f }));
  indicator.position.set(.69, 1.13, -.16); hinge.add(indicator);
  doors.push({ number, z, hinge, leaf, collider, indicator, progress: 0 });
}

function openDoor(door) {
  if (!canOpenDoor(state, door.number)) return;
  state.doors[door.number - 1] = true;
  door.indicator.material.color.set(0x5affad);
  announce(`Door ${door.number} unlocked`);
  updateHud();
}

function makeMedkit(x, z) {
  const anchor = modelAt(modelPaths.medkit, .38, [x, .06, z], 0xe5ece9);
  anchor.userData.baseY = .06;
  medkits.push(anchor);
}

function makeMagazine(x, z) {
  const anchor = new THREE.Group(); anchor.position.set(x, .19, z); scene.add(anchor);
  part(anchor, new THREE.BoxGeometry(.09, .28, .065), newMaterial(0x303638), 0, 0, 0);
  part(anchor, new THREE.BoxGeometry(.09, .035, .07), newMaterial(0xa58b5f), 0, .13, 0);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.18, .012, 6, 24), new THREE.MeshBasicMaterial({ color: 0x80e7be }));
  ring.rotation.x = Math.PI / 2; ring.position.y = -.16; anchor.add(ring);
  looseMagazines.push(anchor);
}

function nearestAction(position) {
  let best = null, bestDistance = 1.6;
  const consider = (kind, object, point = object.position) => {
    const distance = Math.hypot(position.x - point.x, position.z - point.z);
    if (distance < bestDistance) { best = { kind, object }; bestDistance = distance; }
  };
  for (const bucket of buckets) if (!bucket.userData.moved) consider('bucket', bucket);
  for (const bucket of buckets) if (bucket.userData.key.visible && !state.keys[bucket.userData.number - 1]) consider('key', bucket.userData.key);
  if (state.health < RULES.maxHealth) for (const medkit of medkits) consider('medkit', medkit);
  for (const magazine of looseMagazines) consider('magazine', magazine);
  for (const door of doors) if (!state.doors[door.number - 1]) consider('door', door, new THREE.Vector3(0, position.y, door.z));
  return best;
}

function interact(hand = null) {
  if (!state.started || state.won || state.gameOver) return;
  if (heldMagazine && hand?.userData.hand === 'left') { insertHeldMagazine(); return; }
  const position = hand ? hand.getWorldPosition(new THREE.Vector3()) : rig.position.clone().add(new THREE.Vector3(0, .8, 0));
  position.y = .45;
  const target = nearestAction(position);
  if (!target) { announce('Move closer to an object'); return; }
  const { kind, object } = target;
  if (kind === 'bucket') moveBucket(object);
  if (kind === 'key') collectKey(object);
  if (kind === 'medkit') {
    collectMedkit(object);
  }
  if (kind === 'magazine') {
    looseMagazines.splice(looseMagazines.indexOf(object), 1); scene.remove(object);
    state.magazines++; announce('Picked up one full magazine'); updateHud();
  }
  if (kind === 'door') {
    if (state.keys[object.number - 1]) openDoor(object);
    else announce(`Door ${object.number} needs key ${object.number}`);
  }
}

function collectMedkit(medkit) {
  if (state.health >= RULES.maxHealth) return;
  const newHealth = restoredHealth(state.health);
  const restored = newHealth - state.health;
  state.health = newHealth;
  scene.remove(medkit); medkits.splice(medkits.indexOf(medkit), 1);
  announce(`Health restored +${restored}`); updateHud();
}

function collectKey(key) {
  const number = key.userData.number;
  if (state.keys[number - 1]) return;
  state.keys[number - 1] = true;
  scene.remove(key);
  announce(`Key ${number} collected`); updateHud();
}

function ejectMagazine() {
  if (!state.started || !state.hasMagazine) return;
  state.hasMagazine = false;
  state.ammo = 0;
  announce('Magazine ejected. Find another or draw one from your left hip.');
  updateHud();
}

function reloadDesktop() {
  if (!state.started || state.won || state.gameOver) return;
  if (!state.magazines) { announce('No spare magazines'); return; }
  state.magazines--; state.hasMagazine = true; state.ammo = RULES.magazineSize;
  announce('Fresh eight-round magazine inserted'); updateHud();
}

function takeHipMagazine(hand) {
  if (heldMagazine || !state.magazines) return false;
  state.magazines--;
  heldMagazine = makeMagazine(0, 0);
  looseMagazines.splice(looseMagazines.indexOf(heldMagazine), 1);
  hand.attach(heldMagazine); heldMagazine.position.set(0, -.02, -.07);
  heldBy = hand; announce('Move magazine to the pistol to insert it'); updateHud();
  return true;
}

function insertHeldMagazine() {
  if (!heldMagazine || state.hasMagazine) return false;
  const gunPosition = xrPistol.getWorldPosition(new THREE.Vector3());
  const magazinePosition = heldMagazine.getWorldPosition(new THREE.Vector3());
  if (gunPosition.distanceTo(magazinePosition) > .35) { announce('Bring the magazine close to the pistol grip'); return false; }
  heldBy.remove(heldMagazine); heldMagazine = null; heldBy = null;
  state.hasMagazine = true; state.ammo = RULES.magazineSize;
  announce('Magazine inserted · 8 rounds'); updateHud(); return true;
}

function fire() {
  if (!state.started || state.won || state.gameOver) return;
  const now = performance.now();
  if (now - lastShot < 160) return;
  if (!state.hasMagazine || state.ammo <= 0) { announce('Empty · reload your pistol'); return; }
  lastShot = now; state.ammo--; updateHud(); playShot();
  const gun = renderer.xr.isPresenting ? xrPistol : desktopPistol;
  gun.userData.muzzle.getWorldPosition(shotOrigin);
  gun.userData.muzzle.getWorldDirection(shotDirection).negate().normalize();
  if (!renderer.xr.isPresenting) camera.getWorldDirection(shotDirection);
  raycaster.set(shotOrigin, shotDirection); raycaster.far = 30;
  const walls = level.obstacles.map((wall) => wall.mesh);
  for (const door of doors) if (!state.doors[door.number - 1]) walls.push(door.collider);
  let maxDistance = raycaster.intersectObjects(walls, false)[0]?.distance ?? 30;
  let hitMonster = null;
  for (const monster of monsters) {
    if (monster.dead) continue;
    const center = monster.anchor.position.clone().add(new THREE.Vector3(0, monster.kind === 'spider' ? .42 : 1.05, 0));
    const along = center.sub(shotOrigin).dot(shotDirection);
    if (along < 0 || along > maxDistance) continue;
    const closest = shotOrigin.clone().addScaledVector(shotDirection, along);
    const distance = closest.distanceTo(monster.anchor.position.clone().add(new THREE.Vector3(0, monster.kind === 'spider' ? .42 : 1.05, 0)));
    if (distance < (monster.kind === 'spider' ? .48 : .5)) { maxDistance = along; hitMonster = monster; }
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.009, .009, maxDistance, 5), new THREE.MeshBasicMaterial({ color: 0xffd793, transparent: true, opacity: .7 }));
  beam.position.copy(shotOrigin).addScaledVector(shotDirection, maxDistance / 2);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), shotDirection);
  scene.add(beam); setTimeout(() => scene.remove(beam), 55);
  if (hitMonster) damageMonster(hitMonster);
}

async function spawnMonster() {
  if (!state.started || state.won || state.gameOver || monsters.filter((m) => !m.dead).length >= RULES.maxMonsters) return;
  const valid = spawnPositions.filter(([x, z]) => {
    const distance = Math.hypot(x - rig.position.x, z - rig.position.z);
    return distance >= RULES.minimumSpawnDistance && !monsters.some((monster) => !monster.dead && Math.hypot(x - monster.anchor.position.x, z - monster.anchor.position.z) < 1.2);
  });
  if (!valid.length) return;
  const [x, z] = valid[Math.floor(Math.random() * valid.length)];
  const kind = monsterKindForSpawn(spawnCount++, monsters.some((m) => !m.dead && m.kind === 'spider'));
  const anchor = modelAt(modelPaths[kind], kind === 'spider' ? .7 : 1.85, [x, 0, z], kind === 'spider' ? 0x604b3e : 0x83756a);
  const monster = { anchor, kind, health: RULES.monsterHealth, dead: false, waypoint: null, pathTimer: 0, attackTimer: 0, jumpTimer: 2, leap: 0, flash: 0, mixer: null, soundTimer: 2 + Math.random() * 3 };
  monsters.push(monster);
  const waitForModel = () => {
    if (monster.dead || !anchor.parent) return;
    if (!anchor.userData.model) { setTimeout(waitForModel, 50); return; }
    if (anchor.userData.animations.length) {
      monster.mixer = new THREE.AnimationMixer(anchor.userData.model);
      const clip = anchor.userData.animations.find((item) => /walk|run/i.test(item.name)) || anchor.userData.animations[0];
      monster.mixer.clipAction(clip).play();
    }
  };
  waitForModel();
}

function damageMonster(monster) {
  monster.health--;
  monster.flash = .2;
  if (monster.health > 0) return;
  monster.dead = true; state.kills++; updateHud();
  announce(`${monster.kind === 'spider' ? 'Spider' : 'Monster'} down`);
  setTimeout(() => { scene.remove(monster.anchor); monsters.splice(monsters.indexOf(monster), 1); }, 300);
}

function updateMonsters(dt) {
  for (const monster of monsters) {
    if (monster.dead) continue;
    monster.mixer?.update(dt);
    monster.pathTimer -= dt; monster.jumpTimer -= dt; monster.attackTimer -= dt; monster.soundTimer -= dt;
    if (monster.soundTimer <= 0 && Math.hypot(monster.anchor.position.x - rig.position.x, monster.anchor.position.z - rig.position.z) < 12) {
      playTone(monster.kind === 'spider' ? 145 : 76, monster.kind === 'spider' ? .19 : .42, .045, monster.anchor.position);
      monster.soundTimer = 2.5 + Math.random() * 2.5;
    }
    if (monster.pathTimer <= 0) {
      monster.waypoint = nextPathStep(monster.anchor.position, rig.position, level.obstacles, state.doors);
      monster.pathTimer = .65;
    }
    const distance = Math.hypot(monster.anchor.position.x - rig.position.x, monster.anchor.position.z - rig.position.z);
    if (monster.kind === 'spider' && distance < 2.8 && distance > .8 && monster.jumpTimer <= 0) {
      monster.leap = .7; monster.jumpTimer = 4;
      playTone(170, .22, .08, monster.anchor.position);
    }
    if (monster.waypoint) {
      const direction = monster.waypoint.clone().sub(monster.anchor.position); direction.y = 0;
      if (direction.length() > .12) {
        direction.normalize();
        const speed = monster.kind === 'spider' ? 1.05 : .7;
        const step = speed * dt * (monster.leap > 0 ? 3.5 : 1);
        const nx = monster.anchor.position.x + direction.x * step;
        const nz = monster.anchor.position.z + direction.z * step;
        if (!blocked(nx, nz, monster.kind === 'spider' ? .34 : .42, level.obstacles, state.doors)) monster.anchor.position.set(nx, 0, nz);
        monster.anchor.rotation.y = Math.atan2(-direction.x, -direction.z);
      }
    }
    if (monster.leap > 0) {
      monster.leap = Math.max(0, monster.leap - dt);
      monster.anchor.position.y = Math.sin((.7 - monster.leap) / .7 * Math.PI) * .9;
    } else monster.anchor.position.y = 0;
    if (monster.kind === 'horror' && monster.anchor.userData.model) {
      monster.anchor.userData.model.rotation.z = Math.sin(state.time * 3 + monster.anchor.position.x) * .035;
    }
    if (monster.flash > 0) {
      monster.flash -= dt;
      if (monster.anchor.userData.model) monster.anchor.userData.model.traverse((node) => {
        if (node.isMesh && node.material?.color) {
          if (!node.userData.originalColor) node.userData.originalColor = node.material.color.clone();
          node.material.color.copy(monster.flash > 0 ? new THREE.Color(0xff3530) : node.userData.originalColor);
        }
      });
    }
    if (distance < .7 && monster.attackTimer <= 0 && damageCooldown <= 0) {
      state.health = Math.max(0, state.health - RULES.contactDamage);
      monster.attackTimer = RULES.contactCooldown; damageCooldown = .55;
      updateHud(); announce(`Hit by ${monster.kind === 'spider' ? 'spider' : 'monster'} · -${RULES.contactDamage} health`);
      if (state.health === 0) endRun(false);
    }
  }
}

function endRun(won) {
  if (state.won || state.gameOver) return;
  state.won = won; state.gameOver = !won; music.pause();
  if (won) {
    const score = scoreFor(state.time, state.kills);
    if (score > state.bestScore) {
      state.bestScore = score;
      try { localStorage.setItem(storageKey, String(score)); } catch { /* Storage unavailable. */ }
    }
    $('menu').querySelector('h1').textContent = 'You escaped!';
    $('menu').querySelector('h1 + p').textContent = `Time ${formatTime(state.time)} · ${state.kills} monsters killed · ${score} points · best ${state.bestScore}`;
  } else {
    $('menu').querySelector('h1').textContent = 'Game over';
    $('menu').querySelector('h1 + p').textContent = `You survived ${formatTime(state.time)} and killed ${state.kills} monsters. Try again.`;
  }
  $('start-button').textContent = 'Play again';
  if (!renderer.xr.isPresenting) { $('menu').hidden = false; document.exitPointerLock?.(); }
  else {
    startPanel.mesh.visible = true;
    paintPanel(startPanel, [won ? 'YOU ESCAPED' : 'GAME OVER', `${formatTime(state.time)}  KILLS ${state.kills}`, 'Trigger: play again']);
  }
}

function startRun() {
  for (const monster of monsters) scene.remove(monster.anchor);
  monsters.length = 0;
  for (const bucket of buckets) { scene.remove(bucket); scene.remove(bucket.userData.key); }
  buckets.length = 0;
  for (const medkit of medkits) scene.remove(medkit);
  medkits.length = 0;
  for (const magazine of looseMagazines) scene.remove(magazine);
  looseMagazines.length = 0;
  if (heldMagazine && heldBy) heldBy.remove(heldMagazine);
  heldMagazine = heldBy = null;
  Object.assign(state, createState(state.bestScore));
  state.started = true; state.sfx = $('sfx-toggle').checked; state.music = $('music-toggle').checked;
  rig.position.set(0, 0, 0); rig.rotation.y = Math.PI; desktopYaw = Math.PI;
  camera.rotation.x = 0; desktopPitch = 0; verticalSpeed = 0; groundHeight = 0;
  footstepTimer = 0;
  spawnClock = 0; powerClock = 0; spawnCount = 0;
  doors.forEach((door) => { door.progress = 0; door.hinge.rotation.y = 0; door.indicator.material.color.set(0xe17c5f); });
  makeBucket(1, -2, -1); makeBucket(2, -8, 8.2);
  for (const [x, z] of [[-1.5, -2.4], [6.3, -7.3], [-8, 7.2]]) makeMagazine(x, z);
  for (const [x, z] of [[-5, -7], [5, 7], [-8, 10]]) makeMedkit(x, z);
  spawnMonster(); spawnMonster();
  $('menu').hidden = true; $('hud').hidden = false;
  startPanel.mesh.visible = false;
  updateAudio(); updateHud();
  if (!renderer.xr.isPresenting) renderer.domElement.requestPointerLock?.();
  announce('Find two keys under the buckets and escape.');
}

function updateMovement(dt) {
  if (renderer.xr.isPresenting) {
    const left = controllers.find((controller) => controller.userData.hand === 'left');
    const right = controllers.find((controller) => controller.userData.hand === 'right');
    const leftPad = left?.userData.inputSource?.gamepad;
    const rightPad = right?.userData.inputSource?.gamepad;
    const lx = leftPad?.axes[2] ?? leftPad?.axes[0] ?? 0;
    const ly = leftPad?.axes[3] ?? leftPad?.axes[1] ?? 0;
    const rx = rightPad?.axes[2] ?? rightPad?.axes[0] ?? 0;
    const run = !!leftPad?.buttons[3]?.pressed;
    const speed = run ? RULES.sprintSpeed : RULES.walkSpeed;
    const motion = new THREE.Vector3(Math.abs(lx) > .16 ? lx : 0, 0, Math.abs(ly) > .16 ? ly : 0);
    if (motion.lengthSq() > 1) motion.normalize();
    const headForward = renderer.xr.getCamera(camera).getWorldDirection(new THREE.Vector3());
    headForward.y = 0; headForward.normalize();
    const heading = Math.atan2(-headForward.x, -headForward.z);
    motion.applyAxisAngle(new THREE.Vector3(0, 1, 0), heading);
    movePlayer(motion.x * speed * dt, motion.z * speed * dt);
    if (motion.lengthSq() > .04) playFootstep(dt, run);
    if (Math.abs(rx) > .55 && !right.userData.turnLatch) { rig.rotation.y -= Math.sign(rx) * Math.PI / 6; right.userData.turnLatch = true; }
    if (Math.abs(rx) < .25 && right) right.userData.turnLatch = false;
    if (rightPad?.buttons[3]?.pressed && !right.userData.ejectLatch) { ejectMagazine(); right.userData.ejectLatch = true; }
    if (right && !rightPad?.buttons[3]?.pressed) right.userData.ejectLatch = false;
    if (heldMagazine && !state.hasMagazine) {
      const distance = heldMagazine.getWorldPosition(new THREE.Vector3()).distanceTo(xrPistol.getWorldPosition(new THREE.Vector3()));
      if (distance < .18) insertHeldMagazine();
    }
  } else {
    const x = Number(keysDown.has('KeyD')) - Number(keysDown.has('KeyA'));
    const z = Number(keysDown.has('KeyS')) - Number(keysDown.has('KeyW'));
    const crouching = keysDown.has('KeyC') || keysDown.has('ControlLeft') || keysDown.has('ControlRight');
    const motion = new THREE.Vector3(x, 0, z);
    if (motion.lengthSq() > 1) motion.normalize();
    motion.applyAxisAngle(new THREE.Vector3(0, 1, 0), rig.rotation.y);
    const speed = crouching ? 1.4 : (keysDown.has('ShiftLeft') || keysDown.has('ShiftRight') ? RULES.sprintSpeed : RULES.walkSpeed);
    movePlayer(motion.x * speed * dt, motion.z * speed * dt);
    if (motion.lengthSq() > .04 && groundHeight === 0) playFootstep(dt, speed === RULES.sprintSpeed);
    verticalSpeed -= 9.8 * dt;
    groundHeight = Math.max(0, groundHeight + verticalSpeed * dt);
    if (groundHeight === 0) verticalSpeed = 0;
    camera.position.y = THREE.MathUtils.damp(camera.position.y, (crouching ? crouchedEyeHeight : defaultEyeHeight) + groundHeight, 12, dt);
  }
}

function movePlayer(dx, dz) {
  const radius = .28;
  if (!blocked(rig.position.x + dx, rig.position.z, radius, level.obstacles, state.doors)) rig.position.x += dx;
  if (!blocked(rig.position.x, rig.position.z + dz, radius, level.obstacles, state.doors)) rig.position.z += dz;
}

function playFootstep(dt, running) {
  footstepTimer -= dt;
  if (footstepTimer > 0) return;
  footstepTimer = running ? .27 : .43;
  playTone(running ? 105 : 85, .07, .012);
}

function updateObjects(dt) {
  for (const bucket of buckets) {
    if (bucket.userData.moved) {
      bucket.userData.moveProgress = Math.min(1, bucket.userData.moveProgress + dt * 1.5);
      const p = bucket.userData.moveProgress;
      bucket.position.x = bucket.userData.startX + p * 1.1;
      bucket.position.z = bucket.userData.startZ - p * .35;
      bucket.position.y = Math.sin(p * Math.PI) * .4;
      bucket.rotation.z = p * .85;
    }
    const key = bucket.userData.key;
    if (key.visible && !state.keys[bucket.userData.number - 1]) {
      key.rotation.y += dt;
      key.userData.marker.position.y = .72 + Math.sin(state.time * 4) * .08;
      if (state.time >= key.userData.revealedAt && Math.hypot(rig.position.x - key.position.x, rig.position.z - key.position.z) < .45) collectKey(key);
    }
  }
  for (const door of doors) {
    if (state.doors[door.number - 1]) {
      door.progress = Math.min(1, door.progress + dt / 1.25);
      door.hinge.rotation.y = -1.83 * (1 - (1 - door.progress) ** 3);
    } else if (state.keys[door.number - 1] && Math.abs(rig.position.z - door.z) < 1.05 && Math.abs(rig.position.x) < 1.25) openDoor(door);
  }
  for (const medkit of [...medkits]) {
    medkit.rotation.y += dt * .5;
    medkit.position.y = medkit.userData.baseY + Math.sin(state.time * 2 + medkit.position.x) * .045;
    if (state.health < RULES.maxHealth && Math.hypot(rig.position.x - medkit.position.x, rig.position.z - medkit.position.z) < .8) collectMedkit(medkit);
  }
  for (const magazine of looseMagazines) magazine.rotation.y += dt * .45;
  if (state.doors[1] && rig.position.z > 27.6 && Math.abs(rig.position.x) < 2.5) endRun(true);
}

function tick() {
  const now = performance.now();
  const dt = Math.min((now - previousFrame) / 1000, .05);
  previousFrame = now;
  if (state.started && !state.won && !state.gameOver) {
    state.time += dt; damageCooldown = Math.max(0, damageCooldown - dt);
    updateMovement(dt); updateObjects(dt); updateMonsters(dt);
    spawnClock += dt; powerClock += dt;
    if (spawnClock >= RULES.spawnInterval) { spawnClock = 0; spawnMonster(); }
    if (powerClock >= 17 && medkits.length < 4) {
      powerClock = 0;
      const spots = [[-7, -7], [5, -9], [-8, 9], [5, 9]];
      const [x, z] = spots[Math.floor(Math.random() * spots.length)];
      if (Math.hypot(x - rig.position.x, z - rig.position.z) > 2) makeMedkit(x, z);
    }
    if (Math.floor(state.time * 5) !== Math.floor((state.time - dt) * 5)) updateHud();
  }
  renderer.render(scene, camera);
}

function bindController(index) {
  const controller = renderer.xr.getController(index);
  controller.userData.hand = index === 0 ? 'left' : 'right';
  controller.addEventListener('connected', (event) => {
    controller.userData.inputSource = event.data;
    controller.userData.hand = event.data.handedness || controller.userData.hand;
    if (controller.userData.hand === 'right') {
      controller.add(xrPistol); xrPistol.visible = true;
    }
    if (controller.userData.hand === 'left') controller.add(wrist.mesh);
  });
  controller.addEventListener('disconnected', () => { controller.userData.inputSource = null; });
  controller.addEventListener('selectstart', () => { if (!state.started || state.won || state.gameOver) startRun(); else if (controller.userData.hand === 'right') fire(); });
  controller.addEventListener('squeezestart', () => {
    if (!state.started) return;
    if (controller.userData.hand === 'left') {
      if (heldMagazine) { insertHeldMagazine(); return; }
      const hip = rig.localToWorld(new THREE.Vector3(-.3, .95, .05));
      if (!state.hasMagazine && controller.getWorldPosition(new THREE.Vector3()).distanceTo(hip) < .42 && takeHipMagazine(controller)) return;
    }
    interact(controller);
  });
  rig.add(controller); controllers.push(controller);
}

function bindInputs() {
  $('start-button').addEventListener('click', startRun);
  $('sfx-toggle').addEventListener('change', updateAudio);
  $('music-toggle').addEventListener('change', updateAudio);
  document.addEventListener('keydown', (event) => {
    keysDown.add(event.code);
    if (!state.started || event.repeat) return;
    if (['Space', 'KeyE', 'KeyR', 'KeyG', 'KeyC', 'ControlLeft', 'ControlRight'].includes(event.code)) event.preventDefault();
    if (event.code === 'Space' && groundHeight === 0) { verticalSpeed = 3.4; playTone(150, .1, .025); }
    if (event.code === 'KeyE') interact();
    if (event.code === 'KeyR') reloadDesktop();
    if (event.code === 'KeyG') ejectMagazine();
  });
  document.addEventListener('keyup', (event) => keysDown.delete(event.code));
  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement !== renderer.domElement || renderer.xr.isPresenting) return;
    desktopYaw -= event.movementX * .0022;
    desktopPitch = THREE.MathUtils.clamp(desktopPitch - event.movementY * .0022, -1.25, 1.25);
    rig.rotation.y = desktopYaw; camera.rotation.x = desktopPitch;
  });
  renderer.domElement.addEventListener('click', () => {
    if (!state.started || renderer.xr.isPresenting) return;
    if (document.pointerLockElement === renderer.domElement) fire();
    else renderer.domElement.requestPointerLock?.();
  });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

async function boot() {
  const quest = /OculusBrowser|Quest/i.test(navigator.userAgent);
  let webglFallback = quest && !('XRGPUBinding' in window);
  try {
    renderer = new WebGPURenderer({ antialias: true, forceWebGL: webglFallback });
    await renderer.init();
  } catch (error) {
    console.warn('WebGPU initialization failed; using WebGL2 fallback.', error);
    webglFallback = true;
    renderer = new WebGPURenderer({ antialias: true, forceWebGL: true });
    await renderer.init();
  }
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, quest ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType('local-floor');
  $('game').appendChild(renderer.domElement);
  let immersiveVr = false;
  try { immersiveVr = !!(await navigator.xr?.isSessionSupported('immersive-vr')); } catch { /* Unavailable on desktop. */ }
  $('renderer-label').textContent = `${webglFallback ? 'WebGL2 fallback' : 'WebGPU'} · ${immersiveVr ? 'WebXR available' : 'VR unavailable here'}`;
  const vrButton = VRButton.createButton(renderer);
  document.body.appendChild(vrButton);
  renderer.xr.addEventListener('sessionstart', () => { desktopPistol.visible = false; startPanel.mesh.visible = !state.started; updateHud(); });
  renderer.xr.addEventListener('sessionend', () => { desktopPistol.visible = true; xrPistol.visible = false; startPanel.mesh.visible = false; });
  bindController(0); bindController(1);
  makeDoor(1, 2.8); makeDoor(2, 12);
  music = sound(assetUrl('assets/audio/dark_ambience.ogg'), .35, true);
  shotAudio = sound(assetUrl('assets/audio/pistol_shot.wav'), .58);
  bindInputs(); updateHud();
  renderer.setAnimationLoop(tick);
}

boot().catch((error) => {
  console.error(error);
  $('renderer-label').textContent = 'Renderer failed';
  announce('The 3D renderer could not start. Try a current Chrome or Quest Browser.', 20);
});
