# Learning Record: LRN-001 Google Analytics (GA4) Setup Checklist

## 1. Context

- Date discovered: 2026-06-15
- Discovered by: info@crystord.com
- Area: Web analytics / deployment (gtag.js integration in `index.html`)
- Trigger: Regression on another project — GA showed zero data for weeks after the gtag snippet was "modernized."

## 2. What Happened

The official gtag snippet was rewritten to use rest params:

```js
// ❌ BROKEN — silently sends NO data
function gtag(...args) { dataLayer.push(args); }
```

gtag.js **only** treats the `arguments` object as a command. Pushing a plain
array means `config`/`page_view` are ignored — the library loads fine (200) but
never sends a hit. The correct, official form is:

```js
// ✅ CORRECT
function gtag(){ dataLayer.push(arguments); }
```

If ESLint's `prefer-rest-params` flags it, disable the rule for that line — do
not rewrite the function:

```js
function gtag() {
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}
```

## 3. Why It Happened

- **Implementation:** A refactor/linter/AI "cleanup" altered a snippet that must
  be copied verbatim.
- **Testing:** Success was judged by whether `gtag/js` loaded (200), not by
  whether a `collect` hit was sent.
- **Process:** Verification was done from environments that block GA (Brave, VPN,
  Pi-hole/AdGuard, Private DNS), so hits never registered even when correct.
- **Operations:** Reliance on the lagging "Reports snapshot" (24–48h) instead of
  Realtime masked the true state for weeks.
- **Delivery:** A decoupled CI/deploy meant a broken-but-building snippet shipped
  even with a red quality check.

## 4. Impact

- User impact: none (analytics only, no end-user effect)
- Delivery impact: weeks of lost analytics data; rework to diagnose
- Quality impact: silent data-loss defect — no error surfaced

## 5. Prevention and Guardrails

- **Never edit the official GA snippet.** Copy it exactly; protect it from
  Prettier/ESLint/AI refactors.
- **Test the `collect` request, not the loader.** DevTools → Network → filter
  `collect` → reload → expect `…/g/collect?...&en=page_view` returning **204**.
- **Test from a clean environment.** No Brave/Edge InPrivate/VPN/Pi-hole/AdGuard/
  NextDNS/Private DNS — verify from a phone on mobile data with a vanilla browser.
- **Use GA Realtime,** not the report snapshot (which lags 24–48h).
- **Verify the property/stream match** — the `G-XXXX` ID must belong to the
  property whose reports you view.
- **Treat the "Data collection isn't active" banner** as "zero hits ever
  arriving," not "wrong ID."
- **Check what the *deploy* job runs** — a red lint check does not mean it didn't
  ship.
- **Verification signal:** Clean browser → load page → Network filter `collect` →
  `204` with `en=page_view` → confirmed in GA **Realtime**.

## 6. What To Do Next Time

30-second check for any new site: Clean browser → load page → Network tab,
filter `collect` → see `204` with `en=page_view` → confirm in GA **Realtime**.
All three green = it works.

For Crystord specifically: the official gtag snippet (measurement ID
`G-LLSNMGWLH4`) is installed verbatim in [index.html](../../../../index.html). Do
not refactor it.

## 7. Cross-References

- Related backlog items / requirements: N/A
- Related ADRs: N/A
- Related requirements-log entries: N/A

## 8. Status

- Status: Active
- Superseded by: N/A
