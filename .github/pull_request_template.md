<!--
Keep this short. The goal is that someone reading the merge commit in
six months understands why, not what — the diff already shows what.
-->

## What changed

## Why

<!-- What was wrong with the previous behaviour? If this is a new
     feature, what could the system not do before? -->

## How it was verified

<!-- What you actually ran, and what it printed. "Tests pass" is weaker
     than "75 backend + 21 frontend pass, and /api/qr/t/<token> returns
     detailLevel: full while /api/qr/<code> leaks none of the restricted
     fields." -->

## Checklist

- [ ] `npm test` passes in both packages
- [ ] `npm run build` passes (frontend)
- [ ] Lint count has not risen above 61
- [ ] `CHANGELOG.md` updated, if user-visible
- [ ] Docs updated in **this** PR, if behaviour they describe changed
- [ ] Any architectural decision recorded in `docs/PROJECT_TRACKER.md`

## Anything reviewers should push back on

<!-- Shortcuts taken, assumptions made, things you were unsure about.
     Say them here rather than hoping nobody notices. -->
