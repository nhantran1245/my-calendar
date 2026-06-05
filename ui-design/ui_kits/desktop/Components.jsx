// Cadence Desktop UI components

// ─────────────────────────────────────────────────────────────
// DesktopIcon — same paths as mobile, shared inline SVG library
// ─────────────────────────────────────────────────────────────
function DesktopIcon({ name, size = 18, color = 'currentColor', strokeWidth = 1.8, style = {} }) {
  const paths = {
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    'chevron-left': <polyline points="15 18 9 12 15 6" />,
    'chevron-right': <polyline points="9 18 15 12 9 6" />,
    'chevron-down': <polyline points="6 9 12 15 18 9" />,
    x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    check: <polyline points="20 6 9 17 4 12" />,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    'map-pin': <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    'calendar-days': <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>,
    repeat: <><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></>,
    'more-horizontal': <><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /><circle cx="5" cy="12" r="1.5" fill="currentColor" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {paths[name] || null}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// NavRail — vertical app navigation (72px wide)
// ─────────────────────────────────────────────────────────────
function NavRail({ view, onView }) {
  const items = [
    { id: 'inbox',  icon: 'inbox',         hint: '⌘1' },
    { id: 'day',    icon: 'clock',         hint: '⌘2' },
    { id: 'week',   icon: 'calendar-days', hint: '⌘3' },
    { id: 'month',  icon: 'calendar-days', hint: '⌘4' },
  ];
  return (
    <div style={{
      width: 64, flexShrink: 0, height: '100%',
      background: 'var(--bg-page)', borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '20px 0 12px',
    }}>
      {/* App mark */}
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: 'var(--slate-12)', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
      }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, color: 'var(--slate-0)', lineHeight: 1 }}>c</div>
        <div style={{ position: 'absolute', top: 7, right: 7, width: 4, height: 4, borderRadius: 999, background: 'var(--accent)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(it => {
          const active = view === it.id;
          return (
            <button key={it.id} onClick={() => onView(it.id)} title={it.hint}
              style={{
                width: 40, height: 40, borderRadius: 8, border: 'none',
                background: active ? 'var(--bg-2)' : 'transparent',
                color: active ? 'var(--fg-0)' : 'var(--fg-2)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
              }}
            >
              <DesktopIcon name={it.icon} size={20} strokeWidth={active ? 2 : 1.7} />
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button style={{ width: 40, height: 40, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DesktopIcon name="settings" size={20} />
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 999, background: '#7C8B5C',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 500, fontSize: 13,
        }}>MO</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AppHeader — title + view switcher + quick-add
// ─────────────────────────────────────────────────────────────
function AppHeader({ title, subtitle, viewMode = 'week', onViewMode, onQuickAdd, onPrev, onNext, onToday }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 28px', borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--bg-page)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--fg-0)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <SmallIconButton icon="chevron-left" onClick={onPrev} />
          <button onClick={onToday} style={{
            border: '1px solid var(--border)', background: 'var(--bg-0)',
            padding: '5px 12px', borderRadius: 6, fontFamily: 'var(--font-sans)',
            fontSize: 13, fontWeight: 500, color: 'var(--fg-0)', cursor: 'pointer',
          }}>Today</button>
          <SmallIconButton icon="chevron-right" onClick={onNext} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Segmented value={viewMode} onChange={onViewMode}
          options={[
            { id: 'day', label: 'Day' },
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' },
          ]}
        />
        <button onClick={onQuickAdd} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', borderRadius: 6, border: 'none',
          background: 'var(--accent)', color: 'var(--accent-fg)',
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
          cursor: 'pointer',
        }}>
          <DesktopIcon name="plus" size={15} strokeWidth={2.2} />
          New event
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.75, padding: '1px 5px', background: 'rgba(255,255,255,0.18)', borderRadius: 3, marginLeft: 2 }}>⌘K</span>
        </button>
      </div>
    </div>
  );
}

function SmallIconButton({ icon, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: 28, height: 28, border: 'none', borderRadius: 6,
        background: hover ? 'var(--bg-hover)' : 'transparent',
        color: 'var(--fg-1)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      <DesktopIcon name={icon} size={16} />
    </button>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--bg-1)', padding: 3, borderRadius: 8, gap: 2 }}>
      {options.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          border: 'none', background: value === o.id ? 'var(--bg-0)' : 'transparent',
          padding: '5px 12px', borderRadius: 6,
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
          color: value === o.id ? 'var(--fg-0)' : 'var(--fg-2)',
          cursor: 'pointer',
          boxShadow: value === o.id ? 'var(--shadow-sm)' : 'none',
          transition: 'all var(--dur-fast) var(--ease-out)',
        }}>{o.label}</button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MiniCalendar — sidebar month picker
// ─────────────────────────────────────────────────────────────
function MiniCalendar({ year = 2026, month = 'May', selected = 14, today = 14 }) {
  const startBlank = 4;
  const daysInMonth = 31;
  const cells = [];
  for (let i = 0; i < startBlank; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-0)' }}>{month} {year}</div>
        <div style={{ display: 'flex', gap: 2 }}>
          <SmallIconButton icon="chevron-left" />
          <SmallIconButton icon="chevron-right" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {['M','T','W','T','F','S','S'].map((d,i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--fg-3)', fontWeight: 500 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const isToday = d === today;
          const isSelected = d === selected;
          return (
            <button key={i} style={{
              border: 'none', background: isSelected && !isToday ? 'var(--bg-2)' : (isToday ? 'var(--accent)' : 'transparent'),
              color: isToday ? 'var(--accent-fg)' : 'var(--fg-1)',
              fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: isToday ? 600 : 400,
              borderRadius: 999, aspectRatio: '1 / 1', padding: 0,
              cursor: 'pointer',
            }}>{d}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CalendarList — toggleable calendar checkboxes
// ─────────────────────────────────────────────────────────────
function CalendarList({ calendars, onToggle }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)', fontWeight: 500, marginBottom: 8 }}>My calendars</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {calendars.map(c => (
          <button key={c.id} onClick={() => onToggle?.(c.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '5px 8px', borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: 'var(--fg-1)', fontSize: 13,
            transition: 'background var(--dur-fast) var(--ease-out)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{
              width: 14, height: 14, borderRadius: 3,
              background: c.on ? c.color : 'transparent',
              border: '1.5px solid ' + (c.on ? c.color : 'var(--border-strong)'),
              flexShrink: 0,
            }} />
            <span style={{ flex: 1, textAlign: 'left' }}>{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  DesktopIcon, NavRail, AppHeader, SmallIconButton, Segmented,
  MiniCalendar, CalendarList,
});
