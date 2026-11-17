// Lightweight particle pool: sparks when a moth pops, embers drifting
// up from the lantern, and the expanding ring of a flare.
export class Particles {
  constructor() {
    this.items = [];
    this.rings = [];
  }

  burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.items.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 0.45 + Math.random() * 0.4,
        age: 0,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  ember(x, y) {
    this.items.push({
      x: x + (Math.random() - 0.5) * 10,
      y,
      vx: (Math.random() - 0.5) * 14,
      vy: -26 - Math.random() * 22,
      life: 0.9 + Math.random() * 0.6,
      age: 0,
      size: 1.6 + Math.random() * 1.8,
      color: '#ffb042',
    });
  }

  ring(x, y, radius) {
    this.rings.push({ x, y, radius, age: 0, life: 0.45 });
  }

  update(dt) {
    for (const p of this.items) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
    this.items = this.items.filter((p) => p.age < p.life);
    for (const r of this.rings) r.age += dt;
    this.rings = this.rings.filter((r) => r.age < r.life);
  }

  draw(ctx) {
    for (const p of this.items) {
      const t = 1 - p.age / p.life;
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const r of this.rings) {
      const t = r.age / r.life;
      ctx.globalAlpha = (1 - t) * 0.8;
      ctx.strokeStyle = '#ffd88a';
      ctx.lineWidth = 5 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * t, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
