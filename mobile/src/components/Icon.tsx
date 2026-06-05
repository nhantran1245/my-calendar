/**
 * Cadence Icon — inline SVG icons via react-native-svg.
 *
 * All paths mirror the Lucide icon set (24px viewBox, 2px stroke, currentColor).
 * Icons are stroke-only unless representing a filled state (e.g. more-horizontal dots).
 *
 * Install react-native-svg if not present:
 *   npx expo install react-native-svg
 */

import React from 'react';
import Svg, {
  Circle,
  Line,
  Path,
  Polyline,
  Rect,
} from 'react-native-svg';

export type IconName =
  | 'plus' | 'bell' | 'search' | 'chevron-left' | 'chevron-right' | 'chevron-down'
  | 'chevron-up' | 'x' | 'check' | 'clock' | 'map-pin' | 'users' | 'calendar-days'
  | 'inbox' | 'settings' | 'repeat' | 'trash' | 'more-horizontal' | 'user'
  | 'moon' | 'sun' | 'menu' | 'arrow-right' | 'calendar' | 'eye' | 'eye-off'
  | 'pencil' | 'trash-2' | 'align-left' | 'list-checks' | 'wifi-off'
  | 'calendar-check' | 'calendar-x' | 'clock-4' | 'circle-dot';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2 }: IconProps) {
  const props = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  const content = (() => {
    switch (name) {
      case 'plus':
        return <><Line {...props} x1="12" y1="5" x2="12" y2="19" /><Line {...props} x1="5" y1="12" x2="19" y2="12" /></>;
      case 'bell':
        return <><Path {...props} d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><Path {...props} d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>;
      case 'search':
        return <><Circle {...props} cx="11" cy="11" r="7" /><Line {...props} x1="21" y1="21" x2="16.65" y2="16.65" /></>;
      case 'chevron-left':
        return <Polyline {...props} points="15 18 9 12 15 6" />;
      case 'chevron-right':
        return <Polyline {...props} points="9 18 15 12 9 6" />;
      case 'chevron-down':
        return <Polyline {...props} points="6 9 12 15 18 9" />;
      case 'chevron-up':
        return <Polyline {...props} points="18 15 12 9 6 15" />;
      case 'x':
        return <><Line {...props} x1="18" y1="6" x2="6" y2="18" /><Line {...props} x1="6" y1="6" x2="18" y2="18" /></>;
      case 'check':
        return <Polyline {...props} points="20 6 9 17 4 12" />;
      case 'clock':
        return <><Circle {...props} cx="12" cy="12" r="10" /><Polyline {...props} points="12 6 12 12 16 14" /></>;
      case 'map-pin':
        return <><Path {...props} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><Circle {...props} cx="12" cy="10" r="3" /></>;
      case 'users':
        return <><Path {...props} d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><Circle {...props} cx="8.5" cy="7" r="4" /><Path {...props} d="M22 21v-2a4 4 0 0 0-3-3.87" /><Path {...props} d="M16 3.13a4 4 0 0 1 0 7.75" /></>;
      case 'calendar-days':
        return <><Rect {...props} x="3" y="4" width="18" height="18" rx="2" /><Line {...props} x1="16" y1="2" x2="16" y2="6" /><Line {...props} x1="8" y1="2" x2="8" y2="6" /><Line {...props} x1="3" y1="10" x2="21" y2="10" /></>;
      case 'calendar':
        return <><Rect {...props} x="3" y="4" width="18" height="18" rx="2" /><Line {...props} x1="16" y1="2" x2="16" y2="6" /><Line {...props} x1="8" y1="2" x2="8" y2="6" /><Line {...props} x1="3" y1="10" x2="21" y2="10" /></>;
      case 'inbox':
        return <><Polyline {...props} points="22 12 16 12 14 15 10 15 8 12 2 12" /><Path {...props} d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></>;
      case 'settings':
        return <><Circle {...props} cx="12" cy="12" r="3" /><Path {...props} d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>;
      case 'repeat':
        return <><Polyline {...props} points="17 1 21 5 17 9" /><Path {...props} d="M3 11V9a4 4 0 0 1 4-4h14" /><Polyline {...props} points="7 23 3 19 7 15" /><Path {...props} d="M21 13v2a4 4 0 0 1-4 4H3" /></>;
      case 'trash':
        return <><Polyline {...props} points="3 6 5 6 21 6" /><Path {...props} d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><Path {...props} d="M10 11v6" /><Path {...props} d="M14 11v6" /></>;
      case 'more-horizontal':
        return <><Circle fill={color} stroke="none" cx="12" cy="12" r="1.5" /><Circle fill={color} stroke="none" cx="19" cy="12" r="1.5" /><Circle fill={color} stroke="none" cx="5" cy="12" r="1.5" /></>;
      case 'user':
        return <><Path {...props} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle {...props} cx="12" cy="7" r="4" /></>;
      case 'moon':
        return <Path {...props} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />;
      case 'sun':
        return <><Circle {...props} cx="12" cy="12" r="5" /><Line {...props} x1="12" y1="1" x2="12" y2="3" /><Line {...props} x1="12" y1="21" x2="12" y2="23" /><Line {...props} x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><Line {...props} x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><Line {...props} x1="1" y1="12" x2="3" y2="12" /><Line {...props} x1="21" y1="12" x2="23" y2="12" /></>;
      case 'menu':
        return <><Line {...props} x1="3" y1="12" x2="21" y2="12" /><Line {...props} x1="3" y1="6" x2="21" y2="6" /><Line {...props} x1="3" y1="18" x2="21" y2="18" /></>;
      case 'arrow-right':
        return <><Line {...props} x1="5" y1="12" x2="19" y2="12" /><Polyline {...props} points="12 5 19 12 12 19" /></>;
      case 'eye':
        return <><Path {...props} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><Circle {...props} cx="12" cy="12" r="3" /></>;
      case 'eye-off':
        return <><Path {...props} d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><Line {...props} x1="1" y1="1" x2="23" y2="23" /></>;
      case 'pencil':
        return <><Path {...props} d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><Path {...props} d="m15 5 4 4" /></>;
      case 'trash-2':
        return <><Path {...props} d="M3 6h18" /><Path {...props} d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><Path {...props} d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><Line {...props} x1="10" y1="11" x2="10" y2="17" /><Line {...props} x1="14" y1="11" x2="14" y2="17" /></>;
      case 'align-left':
        return <><Line {...props} x1="21" y1="6" x2="3" y2="6" /><Line {...props} x1="15" y1="12" x2="3" y2="12" /><Line {...props} x1="17" y1="18" x2="3" y2="18" /></>;
      case 'list-checks':
        return <><Path {...props} d="m3 17 2 2 4-4" /><Path {...props} d="m3 7 2 2 4-4" /><Line {...props} x1="13" y1="8" x2="21" y2="8" /><Line {...props} x1="13" y1="16" x2="21" y2="16" /></>;
      case 'wifi-off':
        return <><Line {...props} x1="1" y1="1" x2="23" y2="23" /><Path {...props} d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><Path {...props} d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><Path {...props} d="M10.71 5.05A16 16 0 0 1 22.56 9" /><Path {...props} d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><Path {...props} d="M8.53 16.11a6 6 0 0 1 6.95 0" /><Line {...props} x1="12" y1="20" x2="12.01" y2="20" /></>;
      case 'calendar-check':
        return <><Rect {...props} x="3" y="4" width="18" height="18" rx="2" /><Line {...props} x1="16" y1="2" x2="16" y2="6" /><Line {...props} x1="8" y1="2" x2="8" y2="6" /><Line {...props} x1="3" y1="10" x2="21" y2="10" /><Path {...props} d="m9 16 2 2 4-4" /></>;
      case 'calendar-x':
        return <><Rect {...props} x="3" y="4" width="18" height="18" rx="2" /><Line {...props} x1="16" y1="2" x2="16" y2="6" /><Line {...props} x1="8" y1="2" x2="8" y2="6" /><Line {...props} x1="3" y1="10" x2="21" y2="10" /><Line {...props} x1="10" y1="14" x2="14" y2="18" /><Line {...props} x1="14" y1="14" x2="10" y2="18" /></>;
      case 'clock-4':
        return <><Circle {...props} cx="12" cy="12" r="10" /><Polyline {...props} points="12 6 12 12 16 12" /></>;
      case 'circle-dot':
        return <><Circle {...props} cx="12" cy="12" r="10" /><Circle {...props} cx="12" cy="12" r="3" fill={color} stroke="none" /></>;
      default:
        return null;
    }
  })();

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {content}
    </Svg>
  );
}
