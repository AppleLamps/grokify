# Phase 4 UI/UX Improvements

## Summary

Focus the next pass on making the main product surfaces easier to scan and use, especially on mobile. Keep the current dark Grokify/Xpressionist visual system, but reduce crowding, make primary actions visible sooner, and avoid promoting unavailable features too loudly.

## First Pass Changes

- Home mobile layout:
  - Reduce mobile horizontal pressure by stacking the funding/action badges.
  - Tighten the mobile first viewport spacing so the phone interaction appears sooner.
  - Slightly reduce default phone mockup width on small screens.
  - Replace the long disabled Grok Imagine message in the phone with a compact status note while keeping the full message in the tooltip/title.
- Prompt generator:
  - Collapse advanced config flags by default.
  - Show active advanced-config count in the section header.
  - Bring the primary action bar into the first viewport on desktop/laptop layouts.

## Next Candidates

- Add a clearer active/disabled treatment for unavailable Grok Imagine actions in the home flow and `/prompt`.
- Add a mobile-first navigation affordance for the secondary tools instead of stacking large link cards above the phone.
- Review loading overlays for shorter status copy and less visual blocking on mobile.
- Add keyboard/focus polish for modal upload and joint-picture flows.
