// Cadence mobile UI components — assumes design tokens in colors_and_type.css are loaded.
// Uses inline styles referencing CSS custom properties.

// ─────────────────────────────────────────────────────────────
// Icon — reads from /assets/icons/*.svg by name, sized via prop
// ─────────────────────────────────────────────────────────────
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2, style = {} }) {
  // inline SVG paths so the kit is self-contained
  const paths = {
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    'chevron-left': <polyline points="15 18 9 12 15 6" />,
    'chevron-right': <polyline points="9 18 15 12 9 6" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    'map-pin': <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    'calendar-days': <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>,
    repeat: <><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {paths[name] || null}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// CadenceTopBar — translucent app top bar with title + actions
// ─────────────────────────────────────────────────────────────
function CadenceTopBar({ title, subtitle, onSearch, onNotify }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 5,
      background: 'var(--bg-translucent)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      padding: '12px 20px 12px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    }}>
      <div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
            {subtitle}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--fg-0)' }}>
          {title}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <CadenceIconButton icon="search" onClick={onSearch} />
        <CadenceIconButton icon="bell" onClick={onNotify} />
      </div>
    </div>
  );
}

function CadenceIconButton({ icon, onClick, size = 36 }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, border: 'none',
        background: hover ? 'var(--bg-hover)' : 'transparent',
        color: 'var(--fg-0)', borderRadius: 8, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background var(--dur-fast) var(--ease-out)',
      }}
    >
      <Icon name={icon} size={20} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CadenceWeekStrip — horizontal day picker (Mon..Sun)
// ─────────────────────────────────────────────────────────────
function CadenceWeekStrip({ days, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px 16px 12px', justifyContent: 'space-between' }}>
      {days.map(d => {
        const isToday = d.today;
        const isSelected = selected === d.num;
        return (
          <button
            key={d.num}
            onClick={() => onSelect(d.num)}
            style={{
              flex: 1, border: 'none', background: 'transparent',
              padding: '6px 0', borderRadius: 12, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'background var(--dur-fast) var(--ease-out)',
            }}
          >
            <div style={{
              fontSize: 10, fontWeight: 500,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: isToday ? 'var(--accent)' : 'var(--fg-2)',
            }}>{d.dow}</div>
            <div style={{
              width: 30, height: 30, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1,
              background: isSelected ? (isToday ? 'var(--accent)' : 'var(--bg-2)') : 'transparent',
              color: isSelected ? (isToday ? 'var(--accent-fg)' : 'var(--fg-0)') : (d.muted ? 'var(--fg-3)' : 'var(--fg-0)'),
              boxShadow: isToday && isSelected ? 'var(--shadow-sm)' : 'none',
            }}>{d.num}</div>
            {d.events > 0 && !isSelected && (
              <div style={{ width: 4, height: 4, borderRadius: 999, background: 'var(--accent)' }} />
            )}
            {d.events === 0 && <div style={{ width: 4, height: 4 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CadenceEventCard — used in day & agenda views
// ─────────────────────────────────────────────────────────────
const calColors = {
  work:    { tint: 'var(--info-tint)',    bar: 'var(--steel-500)', text: 'var(--steel-700)' },
  personal:{ tint: 'var(--accent-tint)',  bar: 'var(--ember-500)', text: 'var(--ember-800)' },
  health:  { tint: 'var(--success-tint)', bar: 'var(--sage-500)',  text: 'var(--sage-700)' },
  deadline:{ tint: 'var(--warning-tint)', bar: 'var(--amber-500)', text: 'var(--amber-700)' },
};

function CadenceEventCard({ event, compact = false }) {
  const c = calColors[event.cal] || calColors.work;
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'stretch',
      background: c.tint, borderRadius: 10,
      padding: compact ? '8px 10px' : '12px 14px',
      borderLeft: `3px solid ${c.bar}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontWeight: 500,
          fontSize: compact ? 13 : 15, color: c.text, lineHeight: 1.3,
        }}>{event.title}</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: c.text, opacity: 0.75, marginTop: 2,
        }}>{event.time}</div>
        {event.where && !compact && (
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: c.text, opacity: 0.75, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="map-pin" size={11} color={c.text} /> {event.where}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CadenceFab — floating action button (compose new event)
// ─────────────────────────────────────────────────────────────
function CadenceFab({ onClick }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', right: 20, bottom: 96, zIndex: 4,
      width: 56, height: 56, borderRadius: 999, border: 'none',
      background: 'var(--accent)', color: 'var(--accent-fg)',
      cursor: 'pointer', boxShadow: 'var(--shadow-lg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
    }}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Icon name="plus" size={24} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CadenceTabBar — translucent bottom tab bar
// ─────────────────────────────────────────────────────────────
function CadenceTabBar({ tab, onChange }) {
  const tabs = [
    { id: 'month',  label: 'Month',  icon: 'calendar-days' },
    { id: 'day',    label: 'Day',    icon: 'clock' },
    { id: 'agenda', label: 'Agenda', icon: 'inbox' },
    { id: 'settings', label: 'Me',   icon: 'settings' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 3,
      background: 'var(--bg-translucent)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-subtle)',
      paddingBottom: 28, paddingTop: 8,
      display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: active ? 'var(--accent)' : 'var(--fg-2)',
            padding: '4px 12px',
          }}>
            <Icon name={t.icon} size={22} strokeWidth={active ? 2.2 : 1.8} />
            <div style={{ fontSize: 10, fontWeight: 500 }}>{t.label}</div>
          </button>
        );
      })}
    </div>
  );
}

// Export
Object.assign(window, {
  Icon, CadenceTopBar, CadenceIconButton, CadenceWeekStrip,
  CadenceEventCard, CadenceFab, CadenceTabBar, calColors,
});
