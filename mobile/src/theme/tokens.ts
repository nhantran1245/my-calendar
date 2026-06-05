/**
 * Cadence Mobile — Design Tokens
 *
 * All values sourced from the Cadence design system (ui-design/colors_and_type.css).
 * React Native uses JS objects — no CSS custom properties.
 *
 * Usage:
 *   import { colors, spacing, radii, typography, duration } from '../theme/tokens';
 *   style={{ color: colors.light.fg0, padding: spacing[4] }}
 *
 * Font setup:
 *   Install: npx expo install @expo-google-fonts/geist @expo-google-fonts/instrument-serif expo-font
 *   Then load in _layout.tsx:
 *     const [loaded] = useFonts({
 *       'Geist-Regular':         Geist_400Regular,
 *       'Geist-Medium':          Geist_500Medium,
 *       'Geist-SemiBold':        Geist_600SemiBold,
 *       'GeistMono-Regular':     GeistMono_400Regular,
 *       'InstrumentSerif':       InstrumentSerif_400Regular,
 *       'InstrumentSerif-Italic':InstrumentSerif_400Regular_Italic,
 *     });
 */

// ─────────────────────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────────────────────

export const palette = {
  // Slate — warm neutrals
  slate0:  '#FAFAF8',
  slate1:  '#F4F4F1',
  slate2:  '#EBEBE6',
  slate3:  '#DDDDD6',
  slate4:  '#C7C7BE',
  slate5:  '#A8A89E',
  slate6:  '#898980',
  slate7:  '#6B6B63',
  slate8:  '#525249',
  slate9:  '#3E3E36',
  slate10: '#2C2C26',
  slate11: '#1E1E1A',
  slate12: '#131311',

  // Ember — brand primary
  ember50:  '#FDF1EC',
  ember100: '#FBDED2',
  ember200: '#F6BBA1',
  ember300: '#F09872',
  ember400: '#EA8158',
  ember500: '#E26D4D',
  ember600: '#C95A3D',
  ember700: '#A8472F',
  ember800: '#823623',
  ember900: '#4E1F14',

  // Sage — success / health events
  sage50:  '#F1F4ED',
  sage100: '#DCE5D3',
  sage500: '#7C8B5C',
  sage700: '#4F5B3A',

  // Amber — warning / deadline events
  amber50:  '#FDF5E6',
  amber100: '#F9E4B8',
  amber500: '#C8943A',
  amber700: '#8A6027',

  // Clay — danger
  clay50:  '#FCEFEE',
  clay100: '#F5D5D4',
  clay500: '#B85450',
  clay700: '#7A3533',

  // Steel — info / work events
  steel50:  '#EBF0F6',
  steel100: '#CCDAEA',
  steel500: '#5B7FA6',
  steel700: '#34567A',

  white: '#FFFFFF',
  black: '#000000',
} as const;

// ─────────────────────────────────────────────────────────────
// Semantic color themes
// ─────────────────────────────────────────────────────────────

interface ColorTheme {
  // Backgrounds
  bgPage:        string;
  bg0:           string;
  bg1:           string;
  bg2:           string;
  bgHover:       string;
  bgTranslucent: string;

  // Foregrounds
  fg0: string;  // primary text
  fg1: string;  // body text
  fg2: string;  // muted
  fg3: string;  // placeholder

  // Borders
  borderSubtle: string;
  border:       string;
  borderStrong: string;

  // Accent (Ember)
  accent:     string;
  accentFg:   string;
  accentTint: string;

  // Semantic
  success:     string;
  successTint: string;
  warning:     string;
  warningTint: string;
  danger:      string;
  dangerTint:  string;
  info:        string;
  infoTint:    string;
}

export const colors: { light: ColorTheme; dark: ColorTheme } = {
  light: {
    bgPage:        palette.slate0,
    bg0:           palette.slate1,
    bg1:           palette.slate2,
    bg2:           palette.slate3,
    bgHover:       'rgba(19, 19, 17, 0.04)',
    bgTranslucent: 'rgba(250, 250, 248, 0.85)',

    fg0: palette.slate12,
    fg1: palette.slate10,
    fg2: palette.slate7,
    fg3: palette.slate5,

    borderSubtle: 'rgba(19, 19, 17, 0.08)',
    border:       palette.slate3,
    borderStrong: palette.slate5,

    accent:     palette.ember500,
    accentFg:   palette.white,
    accentTint: palette.ember50,

    success:     palette.sage700,
    successTint: 'rgba(124, 139, 92, 0.12)',
    warning:     palette.amber700,
    warningTint: 'rgba(200, 148, 58, 0.12)',
    danger:      palette.clay700,
    dangerTint:  'rgba(184, 84, 80, 0.12)',
    info:        palette.steel700,
    infoTint:    'rgba(91, 127, 166, 0.12)',
  },

  dark: {
    bgPage:        palette.slate12,
    bg0:           palette.slate11,
    bg1:           palette.slate10,
    bg2:           palette.slate9,
    bgHover:       'rgba(250, 250, 248, 0.06)',
    bgTranslucent: 'rgba(19, 19, 17, 0.85)',

    fg0: palette.slate0,
    fg1: palette.slate2,
    fg2: palette.slate5,
    fg3: palette.slate7,

    borderSubtle: 'rgba(250, 250, 248, 0.08)',
    border:       palette.slate9,
    borderStrong: palette.slate7,

    accent:     palette.ember400, // shifted for dark legibility
    accentFg:   palette.white,
    accentTint: 'rgba(226, 109, 77, 0.15)',

    success:     palette.sage500,
    successTint: 'rgba(124, 139, 92, 0.18)',
    warning:     palette.amber500,
    warningTint: 'rgba(200, 148, 58, 0.18)',
    danger:      palette.clay500,
    dangerTint:  'rgba(184, 84, 80, 0.18)',
    info:        palette.steel500,
    infoTint:    'rgba(91, 127, 166, 0.18)',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// Spacing (8px base scale)
// ─────────────────────────────────────────────────────────────

export const spacing = {
  0:  0,
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  24,
  6:  32,
  7:  48,
  8:  64,
  9:  96,
} as const;

// ─────────────────────────────────────────────────────────────
// Border radii
// ─────────────────────────────────────────────────────────────

export const radii = {
  xs:   4,
  sm:   6,
  md:   10,
  lg:   16,
  xl:   24,
  full: 999,
} as const;

// ─────────────────────────────────────────────────────────────
// Typography
// ─────────────────────────────────────────────────────────────

export const fonts = {
  // Using system fonts until custom fonts are installed via expo-font.
  // To add Geist + Instrument Serif:
  //   npx expo install @expo-google-fonts/geist @expo-google-fonts/instrument-serif expo-font
  // Then load them in _layout.tsx with useFonts() and swap these values back.
  sans:        undefined,   // system sans-serif
  sansMedium:  undefined,
  sansSemiBold: undefined,
  mono:        'Courier' as string | undefined,
  serif:       'Georgia' as string | undefined,
  serifItalic: 'Georgia' as string | undefined,

  // Explicit system references
  systemSans:  undefined,
  systemMono:  'Courier',
  systemSerif: 'Georgia',
} as const;

export const textStyles = {
  h1:       { fontFamily: fonts.sansSemiBold, fontSize: 36, lineHeight: 42, letterSpacing: -0.72 },
  h2:       { fontFamily: fonts.sansSemiBold, fontSize: 30, lineHeight: 36, letterSpacing: -0.45 },
  h3:       { fontFamily: fonts.sansSemiBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.24 },
  h4:       { fontFamily: fonts.sansSemiBold, fontSize: 20, lineHeight: 26 },
  display:  { fontFamily: fonts.serif,        fontSize: 32, lineHeight: 32, letterSpacing: -0.64 },
  displaySm:{ fontFamily: fonts.serif,        fontSize: 20, lineHeight: 20, letterSpacing: -0.20 },
  body:     { fontFamily: fonts.sans,         fontSize: 16, lineHeight: 24 },
  bodySm:   { fontFamily: fonts.sans,         fontSize: 14, lineHeight: 21 },
  ui:       { fontFamily: fonts.sansMedium,   fontSize: 15, lineHeight: 20 },
  caption:  { fontFamily: fonts.sans,         fontSize: 12, lineHeight: 17 },
  micro:    { fontFamily: fonts.sansMedium,   fontSize: 10, lineHeight: 14, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  mono:     { fontFamily: fonts.mono,         fontSize: 13, lineHeight: 18 },
  monoSm:   { fontFamily: fonts.mono,         fontSize: 11, lineHeight: 15 },
} as const;

// ─────────────────────────────────────────────────────────────
// Motion (milliseconds — for Animated API)
// ─────────────────────────────────────────────────────────────

export const duration = {
  fast: 150,
  base: 220,
  slow: 320,
} as const;

// ─────────────────────────────────────────────────────────────
// Event category colors (used by EventCard)
// ─────────────────────────────────────────────────────────────

export const calendarColors = {
  work: {
    tint: 'rgba(91, 127, 166, 0.12)',
    bar:  palette.steel500,
    text: palette.steel700,
  },
  personal: {
    tint: palette.ember50,
    bar:  palette.ember500,
    text: palette.ember800,
  },
  health: {
    tint: 'rgba(124, 139, 92, 0.12)',
    bar:  palette.sage500,
    text: palette.sage700,
  },
  deadline: {
    tint: 'rgba(200, 148, 58, 0.12)',
    bar:  palette.amber500,
    text: palette.amber700,
  },
} as const;

export type CalendarCategory = keyof typeof calendarColors;
