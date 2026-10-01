# Zombie Smash — ZC2 Arena 6.0.1

Static, root-flat PWA. No build service or npm install is required to host the release.
Merged with repository main through `d2c2d16` (menu crash, app profile selection,
branding and icon corrections). The six existing bosses and community application
remain part of the build.

## Deploy

1. Extract the release ZIP. Upload its **contents** to the website root: `index.html`
   must sit beside `app.js`, `sw.js`, the manifest and all artwork/audio files.
2. Serve over HTTPS. Vercel uses the included `vercel.json`. Other hosts should
   revalidate HTML, JavaScript, CSS, the manifest and service worker rather than
   applying immutable caching to these unversioned filenames.
3. Keep the existing Supabase project and authentication redirect URLs. The app
   uses the existing app `profiles` table for identity, character choice, skins
   and Classic high scores. It never requests a separate arcade account.
4. If the repository's profile migration has not already been applied, a database
   owner must apply `supabase-migration.sql` once. It only adds missing columns and
   indexes; it does not delete profiles, history or legacy tables. Existing RLS
   must allow authenticated members to update their own profile. No live database
   migration or policy change was executed while preparing this package.
5. Visit the site, let the initial game cache finish, then install from the browser.
   Existing installs receive the new worker after all old app tabs/windows close;
   reopen the app online. The next offline launch uses the bundled game assets.

`CNAME` retains the repository's custom domain. Keep it for that deployment; remove
it if you deliberately host this build on a different GitHub Pages domain.

## Play

- **Classic:** vertical defence; move left/right and fire upward. Ten waves, then
  infinite survival. Global Classic scores use the member's app profile.
- **Adventure:** twelve scrolling street encounters; free movement, aim assist,
  dodge and melee. A boss every two streets, then infinite survival. Its device
  best and saved run are separate from Classic.
- **Keyboard:** arrows/WASD, Space fire, G grenade, Shift dodge, X smash, P pause.
  Touch controls are outside the field. Gamepad: left stick/D-pad, A/RT fire,
  B dodge, X smash, Y grenade.
- **Boosts:** 10 kills ×2, 20 ×4, 30 ×10. Damage or seven seconds without a kill
  resets the streak. Boss scenes and street travel preserve the remaining time.
- **Characters:** choose a thumbnail in the popup gallery and press Use Character.
  Signed-in choices update the app profile; guests retain a device-only choice.
- **Music:** original bundled Classic, Adventure and boss loops, plus an entrance
  sting. Playback begins with a user gesture. The game menu controls sound.

Offline play is available after one successful cache download. Accounts, online
leaderboards, chat, tournaments and optional screenshot OCR require connectivity.
Cheated runs do not update best scores or the online leaderboard. Completed Classic
runs submit online; guest or failed online submissions remain saved as device bests.

## Validation

- 19 production-engine regression checks: scoring, movement, cooldowns, save/restore,
  menu migration, wave progression, boss order, preferences and profile-only posting.
- Chromium phone/tablet checks: install advert, both modes, skin menu, pause/resume,
  rotation, portrait gallery and shared profile selection/save/reload.
- Real service-worker test: 124 cached assets, offline reload and both game starts.
- All four MP3s decoded in the browser; no missing local assets or page errors in
  the exercised browser flows.

Backend responses were mocked for member/profile tests. Real OAuth, production RLS,
physical iOS/Android installation and multiplayer/community flows still need a live
acceptance check. This release package has not been deployed or pushed to main.

Development checks are in `tests/`; packaging and asset preparation are in `scripts/`
in the source repository. They are intentionally omitted from the flat release ZIP.
The browser Supabase client is bundled locally; its MIT notice is in
`SUPABASE-LICENSE.txt`. Existing artwork stays credited to its repository provenance.
