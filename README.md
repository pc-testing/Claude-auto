# Pixel Arcade (Android)

Fourteen small offline games in one Android app, all in the same minimal
grey-pixel style as the game Chrome shows when you're offline. No internet,
no ads, no accounts.

## Download

**[⬇ Download PixelArcade.apk](https://github.com/pc-testing/Claude-auto/releases/download/pixel-arcade/PixelArcade.apk)**

On your phone: open the link, download `PixelArcade.apk`, tap it, and allow
"Install unknown apps" for your browser when Android asks. Needs Android 8.0+.
The app runs in landscape.

## The games

| Game | How to play |
|---|---|
| Dragon Run | Tap to jump (hold for higher), swipe down & hold to duck |
| Dragon Run 2 | Tap left side to jump, right side to breathe fire; burn obstacles, collect coins |
| Two-player race | Player 1 taps the top half, player 2 the bottom half; last dragon running wins |
| Cave flyer | Tap to flap through gaps in the cave |
| Gravity flip | Tap to swap between the floor and the ceiling; dodge spikes |
| Pixel copter | Hold to rise, let go to fall; stay inside the narrowing tunnel |
| Stack tower | Tap to drop the sliding block; perfect drops keep it wide |
| Snake | Swipe to steer; apples grow you, gold coins are worth more |
| Breakout | Drag the paddle, tap to launch; gold capsules widen the paddle |
| Asteroids-lite | Touch & hold to aim and auto-fire; big rocks split |
| Pixel invaders | Slide to move, the cannon fires itself; shoot the bonus UFO |
| 2048 dragon egg | Swipe to merge tiles; 2048 hatches the egg |
| Cactus sweeper | Minesweeper: tap to dig, long-press to flag, tap a number to clear around it |
| Memory match | Find all 12 pairs in as few moves as possible |

Every game keeps its own high score (or best time / fewest moves) on the
phone. The `<` button (or Android's back gesture) returns to the menu, and
the speaker icon toggles sound.

## How it's built

- The games are plain HTML5 canvas + JavaScript in `app/src/main/assets/`
  (`core.js` is the shared engine and menu, `g_*.js` are the games). Open
  `index.html` in any browser to play on a computer (Space / arrow keys).
- `MainActivity` shows them full-screen in a WebView.
- Every push to `main` runs `.github/workflows/build.yml`, which builds the
  APK and uploads it to the
  [`pixel-arcade` release](https://github.com/pc-testing/Claude-auto/releases/tag/pixel-arcade).

To build locally (needs the Android SDK): `gradle assembleRelease` (Gradle 8.14)

> Note: the APK is signed with the build machine's debug key, which changes per
> build. If installing a newer version fails, uninstall the old one first
> (high scores will reset).
