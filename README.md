# lantern-keeper

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/wenjinqin/lantern-keeper/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/wenjinqin/lantern-keeper/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**Lantern Keeper — Mothstorm.** Every night the moths come for the last lantern in the garden. You are its keeper: drift through the dark on WASD or the arrow keys while your lantern fires bolts of light on its own. Popped moths drop glowing embers — gather three and unleash a flare (SPACE) that clears the swarm around you. Catch the green wisps that rise through the garden to mend your lantern oil, survive wave after deepening wave, and chase a best score that the game remembers between nights.

The game is plain HTML, CSS and ES modules under `game/` — no build step, no libraries, no network calls. Art is drawn in code on a canvas; sound is synthesized live with WebAudio. `main.ts` at the root is the hand-in program: it copies `game/` and `screenshots/` to the output directory and writes the `dossier.json` summary with the vendored make.fun library in `vendor/`.

## Run it

```sh
node serve.ts
# then open http://localhost:8090 in a desktop browser
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
