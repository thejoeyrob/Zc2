ZC2 COMMUNITY ARENA v5.9.0 — MINI BATTLE ART / BOSS STAGING

UPLOAD:
Upload every file from this ZIP directly to the existing GitHub repository root.
Do not create an extra enclosing folder.

GAMEPLAY DIRECTION:
- Portrait remains intentional.
- Joey Rob is at the bottom, visually facing north/up.
- Fire travels straight north/up.
- Zombies and bosses face/advance south/down.
- Existing left/right/fire interaction, collision sizes, wave logic and leaderboard hooks remain intact.

BOSSES:
1. Fat Amy — first score-threshold boss — 3 visual damage states
2. Glowing Humanity — score threshold — 2 states
3. Debo — score threshold — 2 states
4. Jordan — score threshold — 2 states
5. Dr Mantis — enters when the infinite wave starts — 3 states

PERFORMANCE:
War damage uses four composited map overlays, not per-zombie persistent splatter objects.
Rendered PNGs have been web-optimized while preserving alpha transparency.

No Claude handoff is required for this build: the assets are already integrated into `arcade.js` and `arcade.css`.
