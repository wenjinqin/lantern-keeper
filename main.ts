// Lantern Keeper — Mothstorm: hand-in program for make.fun's best-game-01.
// Run with Node 22+: copies game/ and screenshots/ into the output
// directory and writes dossier.json with the vendored make.fun library,
// after a quick self-check that the entry stays inside the gate's caps.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function walk(dir: string, base: string, acc: { files: number; bytes: number }): void {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const rel = join(base, name);
    if (rel.length > 1000) throw new Error(`path too long for the gate: ${rel}`);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, rel, acc);
    else { acc.files += 1; acc.bytes += st.size; }
  }
}

const gameStats = { files: 0, bytes: 0 };
walk(join(here, 'game'), 'game', gameStats);
if (gameStats.files > 993) throw new Error(`game/ holds ${gameStats.files} files, over the 993 cap`);
if (gameStats.bytes > 48 * 1024 * 1024) throw new Error('game/ is over the 48 MiB cap');

const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir) ? readdirSync(shotsDir).filter((n) => /\.(png|jpe?g)$/i.test(n)) : [];
if (shots.length < 3 || shots.length > 4) throw new Error(`need 3 or 4 screenshots, found ${shots.length}`);
for (const name of shots) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > 256 * 1024) throw new Error(`screenshot ${name} is ${size} bytes, over the 256 KiB cap`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`lantern-keeper: ${gameStats.files} game files, ${shots.length} screenshots, dossier ${dossier.length} bytes -> ${out}`);
