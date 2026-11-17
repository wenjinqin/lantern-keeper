import { CONFIG } from './config.js';

// Heads-up display and the three screens: title, pause and game over.
// Everything is drawn on the same canvas so screenshots show the real UI.
export class Ui {
  constructor(ctx) {
    this.ctx = ctx;
  }

  hud(world, player) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(5, 8, 22, 0.62)';
    ctx.fillRect(0, 0, CONFIG.width, 54);
    ctx.fillStyle = 'rgba(255, 176, 66, 0.5)';
    ctx.fillRect(0, 54, CONFIG.width, 2);

    // Lantern oil = health.
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = CONFIG.colors.dim;
    ctx.fillText('LANTERN OIL', 22, 34);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(128, 20, 190, 15);
    const oil = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = oil > 0.3 ? CONFIG.colors.gold : '#ff5d47';
    ctx.fillRect(128, 20, 190 * oil, 15);

    ctx.fillStyle = CONFIG.colors.text;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(`Score  ${world.score}`, 356, 36);
    ctx.fillText(`Wave  ${world.wave}`, 540, 36);
    ctx.fillText(`Moths popped  ${world.popped}`, 664, 36);

    // Embers and flare readiness.
    ctx.fillStyle = player.flareReady ? CONFIG.colors.goldSoft : CONFIG.colors.dim;
    ctx.font = '20px Georgia, serif';
    ctx.fillText(`Embers  ${player.embers}`, 934, 36);
    ctx.font = '15px Georgia, serif';
    if (player.flareReady) {
      ctx.fillStyle = CONFIG.colors.goldSoft;
      ctx.fillText('SPACE — FLARE READY', 1064, 36);
    } else {
      ctx.fillStyle = CONFIG.colors.dim;
      const need = Math.max(0, CONFIG.flareCost - player.embers);
      const wait = Math.max(0, player.flareTimer).toFixed(0);
      ctx.fillText(need > 0 ? `Flare needs ${need} more embers` : `Flare recharging ${wait}s`, 1050, 36);
    }
  }

  veil(alpha) {
    const ctx = this.ctx;
    ctx.fillStyle = `rgba(4, 6, 18, ${alpha})`;
    ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  }

  center(text, y, font, color) {
    const ctx = this.ctx;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, CONFIG.width / 2, y);
    ctx.textAlign = 'left';
  }

  title() {
    this.veil(0.55);
    this.center('LANTERN KEEPER', 268, '84px Georgia, serif', '#ffd88a');
    this.center('—  M O T H S T O R M  —', 322, '26px Georgia, serif', '#aab6ff');
    this.center('Every night the moths come for the last lantern in the garden.', 402, '22px Georgia, serif', '#f3ead2');
    this.center('Keep the flame alive. Pop moths, gather their embers, and flare when the swarm closes in.', 436, '22px Georgia, serif', '#f3ead2');
    this.center('Move — WASD or arrow keys      Your lantern fires on its own', 512, '20px Georgia, serif', '#8d97c4');
    this.center('Flare — SPACE (needs 3 embers)      Catch green wisps to mend      Pause — P', 546, '20px Georgia, serif', '#8d97c4');
    this.center('Click or press ENTER to light the lantern', 632, '26px Georgia, serif', '#ffb042');
  }

  paused() {
    this.veil(0.6);
    this.center('PAUSED', 380, '54px Georgia, serif', '#ffd88a');
    this.center('Press P to resume', 440, '22px Georgia, serif', '#f3ead2');
  }

  gameOver(world, best) {
    this.veil(0.66);
    this.center('THE LIGHT GOES OUT', 268, '58px Georgia, serif', '#ff8a70');
    this.center(`You kept the flame through wave ${world.wave}`, 344, '26px Georgia, serif', '#f3ead2');
    this.center(`Final score  ${world.score}`, 412, '34px Georgia, serif', '#ffd88a');
    this.center(`Moths popped  ${world.popped}      Best score  ${best}`, 462, '22px Georgia, serif', '#aab6ff');
    this.center('Press ENTER to tend the flame again', 560, '26px Georgia, serif', '#ffb042');
  }
}
