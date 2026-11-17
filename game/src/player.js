import { CONFIG } from './config.js';

// The keeper: a hooded figure carrying a lantern. Moves with the input
// axis, auto-lights bolts at the nearest moth, and can flare when charged.
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = CONFIG.playerRadius;
    this.hp = CONFIG.playerMaxHp;
    this.maxHp = CONFIG.playerMaxHp;
    this.embers = 0;
    this.fireTimer = 0;
    this.flareTimer = 0;
    this.hurtFlash = 0;
    this.facing = 1;
    this.bob = 0;
  }

  get flareReady() {
    return this.flareTimer <= 0 && this.embers >= CONFIG.flareCost;
  }

  update(dt, input, world) {
    const axis = input.axis();
    this.x += axis.x * CONFIG.playerSpeed * dt;
    this.y += axis.y * CONFIG.playerSpeed * dt;
    this.x = Math.max(this.r, Math.min(CONFIG.width - this.r, this.x));
    this.y = Math.max(this.r, Math.min(CONFIG.height - this.r, this.y));
    if (axis.x !== 0) this.facing = Math.sign(axis.x);
    this.bob += dt * (axis.x !== 0 || axis.y !== 0 ? 9 : 3);
    this.fireTimer -= dt;
    this.flareTimer -= dt;
    this.hurtFlash = Math.max(0, this.hurtFlash - dt * 3);

    // Lantern bolts: light the nearest moth in range every 0.34 s.
    if (this.fireTimer <= 0) {
      const target = world.nearestMoth(this.x, this.y, 330);
      if (target) {
        world.spawnBolt(this.x, this.y - 10, target);
        this.fireTimer = 0.34;
      }
    }

    if (input.wasPressed(' ') && this.flareReady) {
      this.embers -= CONFIG.flareCost;
      this.flareTimer = CONFIG.flareCooldown;
      world.flare(this.x, this.y);
    }
  }

  damage(amount) {
    this.hp -= amount;
    this.hurtFlash = 1;
    return this.hp <= 0;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
}
