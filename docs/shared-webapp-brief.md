# Use this brief ONLY for: shared web apps hosted on Netlify, accessed via browser/PWA

# Brief: Building a shared, installable single-page web app

Use this context when I ask for a small web app (checklist, tracker, log, etc.)
that multiple people should access via one link, with a Home Screen icon.

## Hosting
- Single HTML file, deployed to Netlify (free static host).
- Must be served over `https://`, not `file://` — Chrome refuses "Install/Add to
  Home Screen" for local files, no workaround.
- When more than one file is needed (manifest, icons, service worker), deploy
  the **whole folder** as siblings of index.html, not just the HTML file —
  relative paths break otherwise.
- Site name can be changed anytime in Site configuration → Change site name
  (free, instant) — do this *before* installing the home-screen icon.

## Shared data storage (no backend, multiple people editing)
- Needs a free, no-login JSON store reachable via `fetch()` from the browser.
- Avoid kvdb.io — it started requiring account signup to create new buckets
  mid-project; unreliable to depend on.
- Avoid jsonblob.com's auto-create flow — it returns the new resource's URL in
  a `Location` response header, which browser JS **cannot read** due to CORS
  (header isn't exposed), so auto-provisioning silently fails.
- Preferred: npoint.io — create the bin manually once via their website
  (no signup), copy the `https://api.npoint.io/...` URL, hardcode it directly
  into the script. No auto-create logic needed — more reliable than any
  API that provisions storage at runtime.

## Race conditions (multiple devices/tabs polling + saving)
Any app that polls a shared JSON store on an interval AND lets the user edit
locally needs these three guards, or edits randomly vanish/reappear:
1. **Don't let polling overwrite an in-flight save** — a `saving` flag that
   `load()` checks before running.
2. **Don't let a slow, already-in-flight poll overwrite a newer local edit**
   — tag every local mutation with an incrementing `version` number; when a
   `load()` fetch resolves, discard the result if `version` changed since the
   fetch started.
3. **Cache-bust every read** — `fetch(url + '?t=' + Date.now(), {cache:'no-store'})`.
   Without this, some browsers serve a stale cached response after a save,
   even though the server has the new data — looks identical to a race bug
   but isn't fixed by version-guarding.
- Known remaining limit: if two people edit at the literal same instant, last
  write wins (this storage model overwrites the whole list, doesn't merge).
  Fine for casual/small-group use; flag if the app needs true conflict-free
  multi-user editing (that needs a real backend, not a JSON blob store).

## Making it installable (PWA)
Chrome's "Install app" prompt (more reliable than "Add to Home Screen") needs:
- `manifest.json` (name, icons, `display: standalone`, theme/background color)
- Two icon PNGs (192px, 512px)
- A minimal `sw.js` service worker registered on load — even a no-op fetch
  listener satisfies Chrome's installability requirement
- All linked from `<head>` and deployed alongside index.html
- Note: Chrome **disables install prompts in Incognito** by design — test in
  a normal window, not Incognito, before concluding it's broken.
- Firefox Android has no install banner but still offers "Add to Home Screen"
  via its menu as a fallback.

## Updates after install
- The installed icon just opens the live URL — it's not a separate copy.
- Since the service worker above doesn't cache anything, redeploys are
  reflected automatically next time anyone opens the app. No reinstall needed.

## MIUI-specific (if relevant)
- Chrome shortcut/install features can be silently blocked by MIUI permissions:
  Settings → Apps → Manage apps → Chrome → Other permissions → enable
  "Create shortcuts" / "Display pop-up windows while running in background".
