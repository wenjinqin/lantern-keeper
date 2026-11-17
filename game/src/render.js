import { CONFIG } from './config.js';

// All drawing lives here: the night garden, the keeper, the swarm.
// The garden floor is painted once onto an offscreen canvas so the
// per-frame work stays cheap.
export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.garden = this.paintGarden();
    this.flicker = 0;
  }

  paintGarden() {
    const c = document.createElement('canvas');
    c.width = CONFIG.width;
    c.height = CONFIG.height;
    const g = c.getContext('2d');
    g.fillStyle = CONFIG.colors.ground;
    g.fillRect(0, 0, c.width, c.height);
    let seed = 1234567;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    // Moss patches.
    for (let i = 0; i < 46; i++) {
      g.fillStyle = `rgba(24, 42, 60, ${0.25 + rnd() * 0.3})`;
      g.beginPath();
      g.ellipse(rnd() * c.width, rnd() * c.height, 30 + rnd() * 90, 18 + rnd() * 50, rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
    // Stepping stones.
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(70, 82, 120, ${0.35 + rnd() * 0.25})`;
      g.beginPath();
      g.ellipse(rnd() * c.width, rnd() * c.height, 8 + rnd() * 16, 5 + rnd() * 9, rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
    // Grass tufts and tiny night flowers.
    for (let i = 0; i < 340; i++) {
      const x = rnd() * c.width;
      const y = rnd() * c.height;
      g.strokeStyle = `rgba(46, 92, 74, ${0.5 + rnd() * 0.4})`;
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + (rnd() - 0.5) * 6, y - 6 - rnd() * 6, x + (rnd() - 0.5) * 10, y - 9 - rnd() * 8);
      g.stroke();
      if (rnd() > 0.86) {
        g.fillStyle = rnd() > 0.5 ? '#c9a7ff' : '#7fe7c4';
        g.beginPath();
        g.arc(x, y - 8, 2, 0, Math.PI * 2);
        g.fill();
      }
    }
    return c;
  }

  draw(world, player, state) {
    const ctx = this.ctx;
    this.flicker += 0.11;
    ctx.save();
    if (world.shake > 0) {
      ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
    }
    ctx.drawImage(this.garden, 0, 0);
    this.drawShards(world);
    this.drawWisps(world);
    this.drawMoths(world);
    this.drawBolts(world);
    this.drawKeeper(player);
    world.particles.draw(ctx);
    this.drawLanternLight(player, world);
    ctx.restore();
    if (world.flareFlash > 0) {
      ctx.fillStyle = `rgba(255, 216, 138, ${world.flareFlash * 0.22})`;
      ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
    }
    if (state === 'playing') this.vignette();
  }

  vignette() {
    const ctx = this.ctx;
    const grad = ctx.createRadialGradient(640, 400, 420, 640, 400, 860);
    grad.addColorStop(0, 'rgba(3,5,16,0)');
    grad.addColorStop(1, 'rgba(3,5,16,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  }

  drawLanternLight(player, world) {
    const ctx = this.ctx;
    const lx = player.x + 15;
    const ly = player.y - 20 + Math.sin(player.bob) * 1.6;
    const r = 150 + Math.sin(this.flicker * 3.7) * 9 + world.flareFlash * 120;
    const grad = ctx.createRadialGradient(lx, ly, 6, lx, ly, r);
    grad.addColorStop(0, 'rgba(255, 190, 80, 0.30)');
    grad.addColorStop(0.55, 'rgba(255, 160, 60, 0.10)');
    grad.addColorStop(1, 'rgba(255, 150, 50, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lx, ly, r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawKeeper(player) {
    const ctx = this.ctx;
    const bobY = Math.sin(player.bob) * 2.2;
    const x = player.x;
    const y = player.y + bobY;
    // Cloak.
    ctx.fillStyle = '#175263';
    ctx.beginPath();
    ctx.moveTo(x, y - 22);
    ctx.quadraticCurveTo(x + 17, y - 6, x + 13, y + 18);
    ctx.quadraticCurveTo(x, y + 23, x - 13, y + 18);
    ctx.quadraticCurveTo(x - 17, y - 6, x, y - 22);
    ctx.fill();
    ctx.fillStyle = '#1f6a80';
    ctx.beginPath();
    ctx.moveTo(x, y - 22);
    ctx.quadraticCurveTo(x + 9, y - 8, x + 6, y + 16);
    ctx.quadraticCurveTo(x, y + 19, x - 6, y + 16);
    ctx.quadraticCurveTo(x - 9, y - 8, x, y - 22);
    ctx.fill();
    // Hood and face.
    ctx.fillStyle = '#0d2f3c';
    ctx.beginPath();
    ctx.arc(x, y - 20, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd88a';
    ctx.beginPath();
    ctx.arc(x - 3.4, y - 20, 1.7, 0, Math.PI * 2);
    ctx.arc(x + 3.4, y - 20, 1.7, 0, Math.PI * 2);
    ctx.fill();
    // Lantern pole and lantern.
    const lx = x + 15;
    const ly = y - 20 + Math.sin(player.bob) * 1.6;
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x + 7, y - 8);
    ctx.lineTo(lx, ly + 4);
    ctx.stroke();
    ctx.fillStyle = '#3a2c14';
    ctx.fillRect(lx - 5, ly - 6, 10, 13);
    const glow = 0.75 + Math.sin(this.flicker * 5.1) * 0.25;
    ctx.fillStyle = `rgba(255, 196, 86, ${glow})`;
    ctx.fillRect(lx - 3, ly - 4, 6, 9);
    if (player.hurtFlash > 0) {
      ctx.fillStyle = `rgba(255, 70, 60, ${player.hurtFlash * 0.35})`;
      ctx.beginPath();
      ctx.arc(x, y - 4, 26, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawMoths(world) {
    const ctx = this.ctx;
    for (const m of world.moths) {
      const flap = Math.sin(m.age * 16 + m.seed) * 0.55;
      ctx.save();
      ctx.translate(m.x, m.y);
      const ang = Math.atan2(Math.sin(m.age * 0.7 + m.seed), 4);
      ctx.rotate(ang);
      const wing = m.kind === 'bulwark' ? '#8fa0e8' : '#c3ccff';
      ctx.fillStyle = m.flash > 0.4 ? '#ffffff' : wing;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.rotate(s * (0.65 + flap * 0.5));
        ctx.beginPath();
        ctx.ellipse(s * m.r * 0.95, 0, m.r * 1.05, m.r * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = m.kind === 'bulwark' ? '#44508a' : '#5d6db3';
      ctx.beginPath();
      ctx.ellipse(0, 0, m.r * 0.42, m.r * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      if (m.kind === 'bulwark' && m.hp < m.maxHp) {
        ctx.fillStyle = 'rgba(6,8,20,0.7)';
        ctx.fillRect(-m.r, -m.r - 9, m.r * 2, 4);
        ctx.fillStyle = '#ffb042';
        ctx.fillRect(-m.r, -m.r - 9, (m.r * 2 * m.hp) / m.maxHp, 4);
      }
      ctx.restore();
    }
  }

  drawBolts(world) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffd88a';
    for (const b of world.bolts) {
      ctx.save();
      ctx.shadowColor = '#ffb042';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawShards(world) {
    const ctx = this.ctx;
    for (const s of world.shards) {
      const pulse = 1 + Math.sin(s.age * 5) * 0.15;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.age * 1.8);
      ctx.fillStyle = '#ffb042';
      ctx.shadowColor = '#ff7847';
      ctx.shadowBlur = 10;
      const r = 7 * pulse;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.7, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  drawWisps(world) {
    const ctx = this.ctx;
    for (const w of world.wisps) {
      const a = Math.max(0, Math.min(1, w.life / 2));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#7fe7c4';
      ctx.shadowColor = '#7fe7c4';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(w.x, w.y + Math.sin(w.age * 3) * 3, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
