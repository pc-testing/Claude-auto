# Dragon Run (Android)

An offline endless-runner for Android, inspired by the game Chrome shows when
you're offline: a little pixel dragon runs across the desert, jumping over
cacti and ducking under flying birds. No internet needed.

## Download

**[⬇ Download DragonRun.apk](https://github.com/pc-testing/claude-auto/releases/download/dragon-run/DragonRun.apk)**

On your phone: open the link, download `DragonRun.apk`, tap it, and allow
"Install unknown apps" for your browser when Android asks. Needs Android 8.0+.

## How to play

- **Tap** anywhere to jump (hold longer for a higher jump, tap quickly for a short hop)
- **Swipe down and hold** to duck under birds (also makes you drop faster mid-air)
- Speed increases the longer you survive; birds appear after 300 points
- Every 100 points: a chime. Every 700 points: day turns to night (and back)
- High score is saved on the phone; tap the speaker icon (top-left) to mute
- After a crash, tap to play again

## How it's built

- The game is a single HTML5 canvas file: `app/src/main/assets/game.html`
  (also playable in any browser — open it directly; Space/↑ to jump, ↓ to duck)
- `MainActivity` shows it full-screen in landscape using a WebView
- Every push to the `dino-game` branch runs `.github/workflows/build.yml`,
  which builds the APK and uploads it to the
  [`dragon-run` release](https://github.com/pc-testing/claude-auto/releases/tag/dragon-run)

To build locally (needs the Android SDK): `gradle assembleRelease` (Gradle 8.14)

> Note: the APK is signed with the build machine's debug key, which changes per
> build. If installing a newer version fails, uninstall the old one first
> (your high score will reset).
