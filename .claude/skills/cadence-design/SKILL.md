---
name: cadence-design
description: Use this skill to generate well-branded interfaces and assets for Cadence, either for production or throwaway prototypes/mocks/etc. Cadence is a calendar app for mobile and desktop. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `README.md` — brand, content, visual, and iconography foundations. Start here.
- `colors_and_type.css` — the design tokens. Link this in any HTML you create and you get both themes (`<html data-theme="light|dark">`) for free.
- `fonts/` — Geist + Instrument Serif (currently loaded via Google Fonts; drop in `.woff2` files to go offline).
- `assets/` — logo (`logo-wordmark.svg`), app icons, `empty-state.svg`, and `icons/` (mirrored Lucide set).
- `ui_kits/mobile/` — iPhone-scale React components and screens.
- `ui_kits/desktop/` — full desktop app shell.
- `preview/` — small specimen cards used by the Design System review tab.

## Hard rules
- No emoji in Cadence's own product UI.
- No gradients on primary surfaces — flat warm-slate fills.
- Numerals on day headers always use Instrument Serif.
- Times: 12-hour with lowercase `am`/`pm` by default.
- Sentence case everywhere. No ALL CAPS except in micro labels (`text-transform: uppercase` with `tracking-caps`).
- Iconography is Lucide (24px viewBox / 2px stroke / `currentColor`). Stroke-only unless representing a state.
