// Moths drawn to the lantern light, and the pale wisps that heal.
// Each kind has its own steering so the swarm does not move as one blob.
export class Moth {
  constructor(x, y, kind, wave) {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.seed = Math.random() * Math.PI * 2;
    this.age = 0;
    const scale = 1 + (wave - 1) * 0.06;
    if (kind === 'dart') {
      this.r = 11; this.hp = 1; this.speed = 118 * scale; this.touch = 8;
    } else if (kind === 'bulwark') {
      this.r = 26; this.hp = 6; this.speed = 34 * scale; this.touch = 16;
    } else {
      this.r = 15; this.hp = 2; this.speed = 62 * scale; this.touch = 10;
    }
    this.maxHp = this.hp;
    this.flash = 0;
  }

  update(dt, player) {
    this.age += dt;
    this.flash = Math.max(0, this.flash - dt * 4);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    const wobble = Math.sin(this.age * 3.1 + this.seed) * 0.55;
    const px = -dy / dist * wobble;
    const py = dx / dist * wobble;
    let speed = this.speed;
    if (this.kind === 'dart') {
      // Darts pulse: drift, then lunge at the keeper.
      const cycle = (this.age + this.seed) % 2.4;
      speed = cycle > 1.7 ? this.speed * 2.6 : this.speed * 0.5;
    }
    this.x += (dx / dist + px) * speed * dt;
    this.y += (dy / dist + py) * speed * dt;
  }

  hit(dmg) {
    this.hp -= dmg;
    this.flash = 1;
    return this.hp <= 0;
  }
}

export class Wisp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 10;
    this.age = 0;
    this.life = 9;
  }

  update(dt) {
    this.age += dt;
    this.life -= dt;
    this.y -= 12 * dt;
    return this.life > 0;
  }
}
