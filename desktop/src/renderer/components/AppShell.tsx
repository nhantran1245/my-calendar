/**
 * AppShell — top-level Cadence desktop layout.
 *
 * Structure:
 *   <AppShell>          ← fills the window, flex-row
 *     NavRail           ← 64px left sidebar with icon nav
 *     <main>            ← flex-col, fills remaining space
 *       AppHeader       ← optional top bar with title + actions
 *       {children}      ← page content
 *     </main>
 *   </AppShell>
 *
 * Usage:
 *   <AppShell
 *     navItems={[...]}
 *     activeNav="day"
 *     onNav={(id) => setView(id)}
 *     headerTitle="Wednesday 14"
 *     headerSubtitle="May 2026"
 *     onNewEvent={() => ...}
 *   >
 *     <DayView />
 *   </AppShell>
 */

import React from 'react';
import { Icon } from './Icon';

// ─── Types ────────────────────────────────────────────────────

type IconName = Parameters<typeof Icon>[0]['name'];

export interface NavItem {
  id: string;
  icon: IconName;
  label: string;
  kbd?: string;
}

export interface AppShellProps {
  children: React.ReactNode;

  /** Left nav rail */
  navItems?: NavItem[];
  activeNav?: string;
  onNav?: (id: string) => void;

  /** Top header bar (hidden if no title passed) */
  headerTitle?: string;
  headerSubtitle?: string;
  onNewEvent?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;

  /** User initials for the avatar at bottom of nav */
  userInitials?: string;
}

// ─── Default nav items ────────────────────────────────────────

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'month',  icon: 'calendar',      label: 'Month', kbd: '⌘1' },
  { id: 'day',    icon: 'clock',         label: 'Day',   kbd: '⌘2' },
  { id: 'week',   icon: 'calendar-days', label: 'Week',  kbd: '⌘3' },
  { id: 'inbox',  icon: 'inbox',         label: 'Inbox', kbd: '⌘4' },
];

// ─── NavRail ──────────────────────────────────────────────────

function NavRail({ items, active, onSelect, userInitials }: {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  userInitials?: string;
}) {
  return (
    <aside style={{
      width: 64,
      flexShrink: 0,
      height: '100%',
      background: 'var(--bg-page)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 0 12px',
    }}>
      {/* App mark */}
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: 'var(--slate-12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        marginBottom: 20,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 26, color: 'var(--slate-0)', lineHeight: 1,
        }}>c</span>
        <span style={{
          position: 'absolute', top: 7, right: 7,
          width: 4, height: 4, borderRadius: 999,
          background: 'var(--accent)',
        }} />
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {items.map(item => {
          const isActive = active === item.id;
          return (
            <NavButton
              key={item.id}
              item={item}
              isActive={isActive}
              onClick={() => onSelect(item.id)}
            />
          );
        })}
      </nav>

      {/* Bottom: settings + avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <NavButton
          item={{ id: 'settings', icon: 'settings', label: 'Settings' }}
          isActive={false}
          onClick={() => onSelect('settings')}
        />
        {userInitials && (
          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: 'var(--sage-500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 600, fontSize: 12,
            letterSpacing: '0.03em',
          }}>
            {userInitials.toUpperCase().slice(0, 2)}
          </div>
        )}
      </div>
    </aside>
  );
}

function NavButton({ item, isActive, onClick }: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      title={item.kbd ? `${item.label} ${item.kbd}` : item.label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 40, height: 40, border: 'none', borderRadius: 8,
        background: isActive ? 'var(--bg-2)' : (hovered ? 'var(--bg-hover)' : 'transparent'),
        color: isActive ? 'var(--fg-0)' : 'var(--fg-2)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
      }}
    >
      <Icon name={item.icon} size={20} strokeWidth={isActive ? 2 : 1.7} />
    </button>
  );
}

// ─── AppHeader ────────────────────────────────────────────────

function AppHeader({ title, subtitle, onNewEvent, onPrev, onNext, onToday }: {
  title: string;
  subtitle?: string;
  onNewEvent?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
}) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-page)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 30, lineHeight: 1, letterSpacing: '-0.02em',
            color: 'var(--fg-0)',
          }}>{title}</div>
          {subtitle && (
            <div style={{
              fontSize: 11, color: 'var(--fg-2)', marginTop: 3,
              letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500,
            }}>{subtitle}</div>
          )}
        </div>

        {/* Date navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconBtn icon="chevron-left" onClick={onPrev} />
          <button
            onClick={onToday}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--bg-0)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12, fontWeight: 500,
              color: 'var(--fg-0)',
              cursor: 'pointer',
            }}
          >
            Today
          </button>
          <IconBtn icon="chevron-right" onClick={onNext} />
        </div>
      </div>

      {onNewEvent && (
        <button
          onClick={onNewEvent}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            fontFamily: 'var(--font-sans)',
            fontSize: 13, fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Icon name="plus" size={14} strokeWidth={2.2} />
          New event
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.7,
            padding: '1px 5px',
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 3, marginLeft: 2,
          }}>⌘K</span>
        </button>
      )}
    </header>
  );
}

function IconBtn({ icon, onClick }: { icon: Parameters<typeof Icon>[0]['name']; onClick?: () => void }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28, height: 28, border: 'none', borderRadius: 'var(--radius-sm)',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        color: 'var(--fg-1)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={15} />
    </button>
  );
}

// ─── AppShell ─────────────────────────────────────────────────

export function AppShell({
  children,
  navItems = DEFAULT_NAV_ITEMS,
  activeNav = 'day',
  onNav = () => {},
  headerTitle,
  headerSubtitle,
  onNewEvent,
  onPrev,
  onNext,
  onToday,
  userInitials,
}: AppShellProps) {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <NavRail
        items={navItems}
        active={activeNav}
        onSelect={onNav}
        userInitials={userInitials}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-0)' }}>
        {headerTitle && (
          <AppHeader
            title={headerTitle}
            subtitle={headerSubtitle}
            onNewEvent={onNewEvent}
            onPrev={onPrev}
            onNext={onNext}
            onToday={onToday}
          />
        )}
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
