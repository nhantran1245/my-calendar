# Fonts

This system uses **Geist** (sans + mono) and **Instrument Serif** (display).

## ⚠️ Substitution flag

No proprietary font files were provided. The CSS currently falls back to **Google Fonts** for all three families via an `@import` in `colors_and_type.css`. This is acceptable for prototyping but means the design system pulls from a network at runtime.

**Both substitutions are exact matches** (Geist and Instrument Serif are both on Google Fonts) — visually you get the real fonts. To remove the runtime dependency, drop these files into this folder and the `@font-face` rules will pick them up:

- `Geist-Regular.woff2`, `Geist-Medium.woff2`, `Geist-SemiBold.woff2`, `Geist-Bold.woff2`
- `GeistMono-Regular.woff2`
- `InstrumentSerif-Regular.woff2`, `InstrumentSerif-Italic.woff2`

Sources:
- Geist: <https://vercel.com/font> (or Google Fonts)
- Instrument Serif: <https://fonts.google.com/specimen/Instrument+Serif>
