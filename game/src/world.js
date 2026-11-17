import { CONFIG } from './config.js';
import { Moth, Wisp } from './enemies.js';
import { Particles } from './particles.js';

// World owns every live entity and the wave director. The player asks it
// for targets; it resolves bolts, pickups, touches and flare blasts.
export class World {
  constructor(sound) {
    this.sound = sound;
    this.particles = new Particles();
    this.reset();
  }

  reset() {
    this.moths = [];
    this.bolts = [];
    this.shards = [];
    this.wisps = [];
    this.particles = new Particles();
    this.wave = 1;
    this.waveTimer = CONFIG.waveDuration;
    this.spawnTimer = 0;
    this.score = 0;
    this.popped = 0;
    this.time = 0;
    this.shake = 0;
    this.flareFlash = 0;
    this.wispTimer = 7;
  }

  nearestMoth(x, y, range) {
    let best = null;
    let bestD = range;
    for (const m of this.moths) {
      const d = Math.hypot(m.x - x, m.y - y);
      if (d < bestD) { bestD = d; best = m; }
    }
    return best;
  }

  spawnBolt(x, y, target) {
    this.bolts.push({ x, y, target, speed: 560, life: 0.9 });
    this.sound.shoot();
  }

  flare(x, y) {
    this.particles.ring(x, y, CONFIG.flareRadius);
    this.flareFlash = 1;
    this.shake = Math.max(this.shake, 6);
    this.sound.flare();
    const survivors = [];
    for (const m of this.moths) {
      const d = Math.hypot(m.x - x, m.y - y);
      if (d <= CONFIG.flareRadius + m.r) {
        this.popMoth(m);
      } else {
        // The blast shoves distant moths back from the light.
        const push = 130;
        m.x += ((m.x - x) / (d || 1)) * push * 0.4;
        m.y += ((m.y - y) / (d || 1)) * push * 0.4;
        survivors.push(m);
      }
    }
    this.moths = survivors;
  }

  popMoth(m) {
    this.popped += 1;
    this.score += m.kind === 'bulwark' ? 30 : m.kind === 'dart' ? 15 : 10;
    this.particles.burst(m.x, m.y, '#aab6ff', m.kind === 'bulwark' ? 22 : 12, 190);
    this.sound.pop();
    const drops = m.kind === 'bulwark' ? 3 : 1;
    for (let i = 0; i < drops; i++) {
      this.shards.push({
        x: m.x + (Math.random() - 0.5) * 26,
        y: m.y + (Math.random() - 0.5) * 26,
        age: 0,
      });
    }
  }

  spawnMoth() {
    const side = Math.floor(Math.random() * 4);
    let x; let y;
    if (side === 0) { x = -30; y = Math.random() * CONFIG.height; }
    if (side === 1) { x = CONFIG.width + 30; y = Math.random() * CONFIG.height; }
    if (side === 2) { x = Math.random() * CONFIG.width; y = -30; }
    if (side === 3) { x = Math.random() * CONFIG.width; y = CONFIG.height + 30; }
    const roll = Math.random();
    let kind = 'drifter';
    if (this.wave >= 2 && roll > 0.78) kind = 'dart';
    if (this.wave >= 3 && roll < 0.14) kind = 'bulwark';
    this.moths.push(new Moth(x, y, kind, this.wave));
  }

  update(dt, player, onGameOver) {
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 14);
    this.flareFlash = Math.max(0, this.flareFlash - dt * 2.4);

    // Wave director: a new wave every waveDuration seconds, spawning
    // faster and in greater numbers as the night deepens.
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.wave += 1;
      this.waveTimer = CONFIG.waveDuration;
      this.sound.wave();
    }
    this.spawnTimer -= dt;
    const interval = Math.max(0.34, 1.15 - this.wave * 0.09);
    if (this.spawnTimer <= 0 && this.moths.length < 14 + this.wave * 3) {
      this.spawnMoth();
      if (this.wave >= 4) this.spawnMoth();
      this.spawnTimer = interval;
    }

    // Wisps drift in now and then; catching one mends the keeper.
    this.wispTimer -= dt;
    if (this.wispTimer <= 0) {
      this.wisps.push(new Wisp(80 + Math.random() * (CONFIG.width - 160), CONFIG.height + 16));
      this.wispTimer = 11 + Math.random() * 6;
    }

    for (const m of this.moths) m.update(dt, player);

    // Bolts home toward their moth; a bolt whose moth is gone fizzles.
    const liveBolts = [];
    for (const b of this.bolts) {
      b.life -= dt;
      if (b.life <= 0 || !this.moths.includes(b.target)) continue;
      const dx = b.target.x - b.x;
      const dy = b.target.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      b.x += (dx / d) * b.speed * dt;
      b.y += (dy / d) * b.speed * dt;
      if (d < b.target.r + 6) {
        if (b.target.hit(1)) {
          this.moths = this.moths.filter((m) => m !== b.target);
          this.popMoth(b.target);
        }
        continue;
      }
      liveBolts.push(b);
    }
    this.bolts = liveBolts;

    // Shards drift toward the lantern when the keeper comes close.
    const keptShards = [];
    for (const s of this.shards) {
      s.age += dt;
      const dx = player.x - s.x;
      const dy = player.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 130) { s.x += (dx / d) * 240 * dt; s.y += (dy / d) * 240 * dt; }
      if (d < player.r + 12) {
        this.score += CONFIG.shardValue;
        player.embers += CONFIG.emberPerShard;
        this.sound.shard();
        continue;
      }
      if (s.age < 14) keptShards.push(s);
    }
    this.shards = keptShards;

    // Wisps: catch to heal, or they fade at the top of the garden.
    const keptWisps = [];
    for (const w of this.wisps) {
      if (!w.update(dt)) continue;
      const d = Math.hypot(w.x - player.x, w.y - player.y);
      if (d < player.r + w.r + 4) {
        player.heal(14);
        this.particles.burst(w.x, w.y, '#7fe7c4', 14, 130);
        continue;
      }
      keptWisps.push(w);
    }
    this.wisps = keptWisps;

    // Moth touches drain the lantern's keeper.
    for (const m of this.moths) {
      const d = Math.hypot(m.x - player.x, m.y - player.y);
      if (d < m.r + player.r - 2) {
        m.x -= ((player.x - m.x) / (d || 1)) * 26;
        m.y -= ((player.y - m.y) / (d || 1)) * 26;
        this.shake = Math.max(this.shake, 4);
        this.sound.hurt();
        if (player.damage(m.touch)) { onGameOver(); return; }
      }
    }

    if (Math.random() < dt * 8) this.particles.ember(player.x + 14, player.y - 18);
    this.particles.update(dt);
  }
}
