export const RULES = Object.freeze({
  maxHealth: 100,
  magazineSize: 8,
  monsterHealth: 3,
  initialMonsters: 2,
  maxMonsters: 4,
  spawnInterval: 6,
  minimumSpawnDistance: 6,
  walkSpeed: 2.5,
  sprintSpeed: 4.3,
  contactDamage: 12,
  contactCooldown: 1.2
});

export function scoreFor(seconds, kills) {
  return Math.round(6000 / (1 + Math.max(seconds, 0) / 120)) + Math.min(Math.max(kills, 0), 20) * 100;
}

export function monsterKindForSpawn(spawnIndex, spiderAlive) {
  return spawnIndex % 3 === 2 && !spiderAlive ? 'spider' : 'horror';
}

export function restoredHealth(current, max = RULES.maxHealth, amount = 40) {
  return Math.min(max, Math.max(0, current) + Math.max(0, amount));
}

export function canOpenDoor(state, number) {
  return state.started && !state.won && !state.gameOver && state.keys[number - 1] && !state.doors[number - 1];
}

export function formatTime(seconds) {
  const whole = Math.floor(Math.max(0, seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

export function createState(bestScore = 0) {
  return {
    started: false, won: false, gameOver: false, health: RULES.maxHealth,
    ammo: RULES.magazineSize, magazines: 0, hasMagazine: true,
    keys: [false, false], doors: [false, false], kills: 0, time: 0,
    bestScore, sfx: true, music: true
  };
}
