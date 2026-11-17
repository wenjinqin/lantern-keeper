import { CONFIG } from './config.js';
import { Input } from './input.js';
import { SoundBank } from './audio.js';
import { Player } from './player.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { Ui } from './ui.js';

// Lantern Keeper — Mothstorm. Entry point: owns the game states
// (title, playing, paused, over), the fixed-step loop, and a gentle
// autopilot that plays the title-screen attract scene and can drive
// hands-free demo captures.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;

const sound = new SoundBank();
const input = new Input(canvas);
const renderer = new Renderer(ctx);
const ui = new Ui(ctx);

let player = new Player(CONFIG.width / 2, CONFIG.height / 2 + 60);
let world = new World(sound);
let state = 'title';
let best = 0;
try { best = Number(localStorage.getItem('lantern-keeper-best') || 0) || 0; } catch (e) { best = 0; }

const params = new URLSearchParams(location.search);
const autopilot = { active: params.get('demo') === '1', vx: 0, vy: 0, think: 0 };

function startGame() {
  world = new World(sound);
  player = new Player(CONFIG.width / 2, CONFIG.height / 2 + 60);
  state = 'playing';
  sound.ensure();
  sound.wave();
}

function endGame() {
  state = 'over';
  best = Math.max(best, world.score);
  try { localStorage.setItem('lantern-keeper-best', String(best)); } catch (e) { /* private mode */ }
  sound.over();
}

// A simple keeper brain for the attract scene: drift toward shards,
// keep a respectful distance from the swarm, wander when it is calm.
function autopilotAxis(dt) {
  autopilot.think -= dt;
  if (autopilot.think <= 0) {
    autopilot.think = 0.22;
    let tx = CONFIG.width / 2 + Math.cos(world.time * 0.23) * 300;
    let ty = CONFIG.height / 2 + Math.sin(world.time * 0.31) * 190;
    let nearestShard = null; let sd = 1e9;
    for (const s of world.shards) {
      const d = Math.hypot(s.x - player.x, s.y - player.y);
      if (d < sd) { sd = d; nearestShard = s; }
    }
    if (nearestShard) { tx = nearestShard.x; ty = nearestShard.y; }
    const threat = world.nearestMoth(player.x, player.y, 130);
    if (threat) { tx = player.x + (player.x - threat.x) * 2; ty = player.y + (player.y - threat.y) * 2; }
    const dx = tx - player.x; const dy = ty - player.y;
    const d = Math.hypot(dx, dy) || 1;
    autopilot.vx = (dx / d) * Math.min(1, d / 60);
    autopilot.vy = (dy / d) * Math.min(1, d / 60);
    if (player.flareReady && world.nearestMoth(player.x, player.y, 165)) {
      player.embers -= CONFIG.flareCost;
      player.flareTimer = CONFIG.flareCooldown;
      world.flare(player.x, player.y);
    }
  }
  return { x: autopilot.vx, y: autopilot.vy };
}

const demoInput = {
  axis: () => ({ x: 0, y: 0 }),
  wasPressed: () => false,
};

function step(dt) {
  if (state === 'title') {
    // Attract scene: the autopilot tends the lantern behind the title.
    const realAxis = demoInput.axis;
    demoInput.axis = () => autopilotAxis(dt);
    player.update(dt, demoInput, world);
    demoInput.axis = realAxis;
    world.update(dt, player, () => { player.hp = player.maxHp; });
    return;
  }
  if (state !== 'playing') return;
  if (autopilot.active) {
    const realAxis = input.axis.bind(input);
    input.axis = () => autopilotAxis(dt);
    player.update(dt, input, world);
    input.axis = realAxis;
  } else {
    player.update(dt, input, world);
  }
  world.update(dt, player, endGame);
}

function frame() {
  renderer.draw(world, player, state);
  if (state === 'playing' || state === 'paused') ui.hud(world, player);
  if (state === 'title') ui.title();
  if (state === 'paused') ui.paused();
  if (state === 'over') { ui.hud(world, player); ui.gameOver(world, best); }
}

let last = performance.now();
function loop(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (input.wasPressed('enter')) {
    if (state === 'title' || state === 'over') startGame();
  }
  if (input.wasPressed('p') && (state === 'playing' || state === 'paused')) {
    state = state === 'playing' ? 'paused' : 'playing';
  }
  if (input.wasPressed('m')) { sound.ensure(); sound.muted = !sound.muted; }
  if (state !== 'paused') step(dt);
  frame();
  input.endFrame();
  requestAnimationFrame(loop);
}

canvas.addEventListener('pointerdown', () => {
  sound.ensure();
  if (state === 'title' || state === 'over') startGame();
});

// Screenshot / demo staging: ?screen=play begins a run mid-action with a
// populated garden; ?screen=over shows the real game-over screen after a
// staged run; ?demo=1 lets the autopilot play unattended.
if (params.get('screen') === 'play' || params.get('screen') === 'over') {
  startGame();
  autopilot.active = true;
  world.wave = 3;
  world.score = 240;
  world.popped = 17;
  player.embers = 4;
  for (let i = 0; i < 9; i++) world.spawnMoth();
  for (let i = 0; i < 260; i++) step(1 / 30);
  if (params.get('screen') === 'over') {
    world.score = 465;
    world.popped = 29;
    endGame();
  }
}

requestAnimationFrame(loop);
