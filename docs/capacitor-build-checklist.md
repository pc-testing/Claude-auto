# Use this brief ONLY for: native Android apps packaged as APK
# Capacitor Android Build — Setup Prompt

Use this prompt when starting any new Capacitor Android app build with Claude Code, regardless of what the app does:

---

Set up a Capacitor Android app from my web files, applying these lessons from a past build to avoid known issues:

1. **Gradle/AGP/JDK versions**: Don't use whatever Capacitor scaffolds by default — immediately after `npx cap add android`, set Gradle wrapper to 8.9+ and a matching AGP version (8.7.2+), and confirm JDK 21 is installed and used (`java -version`). Older default versions (Gradle 8.2.1) have a known jar-cache bug.

2. **compileSdk/targetSdk**: Set both to 35 from the start, not 34 — many current AndroidX dependencies require it, and it's better to set once than hit a forced bump mid-build when a new plugin is added later.

3. **Browser-only tricks don't work once wrapped in a native app**: anything relying on `<a download>`, blob URLs, `localStorage` persistence assumptions, camera/mic prompts, geolocation, clipboard, or other browser APIs should be checked against Capacitor's plugin equivalents (Filesystem, Share, Camera, Geolocation, Clipboard, etc.) rather than assumed to work as-is inside a WebView.

4. **File saving specifically**: for actual "save to device" behavior (not just sharing), use `@capacitor/filesystem` + native Storage Access Framework (`ACTION_CREATE_DOCUMENT`) for a real file picker — the Share plugin alone only routes to other apps, not a direct file-manager save.

5. **Plain-script HTML (no bundler) + Capacitor plugins**: some Capacitor exports (e.g. `Directory`, `Encoding`) are TypeScript enums, not real plugin bridges — they'll be `undefined` at runtime if destructured from `Capacitor.Plugins` in a no-bundler setup. Hardcode their string values directly instead.

6. **Use app-private storage (`Directory.Cache`/`Directory.Data`) for files that don't need permissions** — public directories like `Directory.Documents` fail silently on Android 11+ due to scoped storage restrictions.

7. **After any new plugin/dependency is added**: run `npx cap sync android` before rebuilding, and do a full rebuild (not reuse of an old APK) before testing.

8. **Test on a real device via `adb logcat`** while reproducing the action, rather than guessing — native runtime errors don't show up in build logs, only at runtime.

9. **Any feature involving permissions** (storage, camera, location, notifications, etc.) needs both a manifest entry AND a runtime permission request — check both, since Android blocks silently rather than erroring clearly if either is missing.

10. If a Homebrew cask install needs `sudo`/password and fails in an automated/background shell, run it manually in a plain Terminal window instead.

11. Once the build succeeds, test the **specific feature that changed**, not just that the app launches — targetSdk/permission/plugin changes can silently break one feature while everything else still looks fine.

---

