// Cadence Desktop — screens

// Sample data
const desktopCalendars = [
  { id: 'personal', name: 'Personal',   color: '#E26D4D', on: true },
  { id: 'work',     name: 'Work',       color: '#6B86B4', on: true },
  { id: 'health',   name: 'Health',     color: '#6BA67E', on: true },
  { id: 'deadline', name: 'Deadlines',  color: '#DDA94A', on: true },
  { id: 'holiday',  name: 'Holidays',   color: '#898980', on: false },
];

// Each event: day index (0=Mon), startHour (decimal), endHour, calendar, title, where
const weekEvents = [
  { day: 0, start: 10,    end: 10.5,  cal: 'work',     title: 'Eng standup',       where: 'Conf B' },
  { day: 0, start: 14,    end: 15,    cal: 'work',     title: 'Roadmap review' },
  { day: 1, start: 9,     end: 9.5,   cal: 'personal', title: 'Therapy' },
  { day: 1, start: 11,    end: 12,    cal: 'work',     title: 'Design crit' },
  { day: 1, start: 13,    end: 14,    cal: 'health',   title: 'Run loop' },
  { day: 2, start: 10,    end: 10.5,  cal: 'work',     title: 'Eng standup' },
  { day: 2, start: 15,    end: 16,    cal: 'work',     title: '1:1 — Anya' },
  { day: 3, start: 9.5,   end: 10,    cal: 'personal', title: 'Coffee — Mira',     where: 'Verve' },
  { day: 3, start: 10.5,  end: 10.75, cal: 'work',     title: 'Eng standup' },
  { day: 3, start: 12.5,  end: 13.5,  cal: 'health',   title: 'Lunch run' },
  { day: 3, start: 15,    end: 15.5,  cal: 'work',     title: '1:1 — Anya' },
  { day: 4, start: 9,     end: 11,    cal: 'work',     title: 'Sprint planning' },
  { day: 4, start: 12,    end: 13,    cal: 'personal', title: 'Lunch — Jay' },
  { day: 4, start: 14,    end: 14.5,  cal: 'work',     title: 'All-hands' },
  { day: 4, start: 16,    end: 17,    cal: 'work',     title: 'Demo day' },
  { day: 5, start: 7,     end: 9,     cal: 'health',   title: 'Long run' },
];

const eventStyles = {
  work:     { bg: 'rgba(107, 134, 180, 0.16)', bar: '#6B86B4', text: '#46618A' },
  personal: { bg: 'rgba(226, 109, 77, 0.16)',  bar: '#E26D4D', text: '#A8472F' },
  health:   { bg: 'rgba(107, 166, 126, 0.18)', bar: '#6BA67E', text: '#3F7350' },
  deadline: { bg: 'rgba(221, 169, 74, 0.18)',  bar: '#DDA94A', text: '#9F7825' },
};

// ═══════════════════════════════════════════════════════════════
// WEEK VIEW — main app surface
// ═══════════════════════════════════════════════════════════════
function WeekView({ onEventClick, onQuickAdd }) {
  const hours = Array.from({ length: 11 }, (_, i) => i + 7); // 7am-5pm
  const hourPx = 56;
  const days = [
    { dow: 'Mon', num: 11 }, { dow: 'Tue', num: 12 }, { dow: 'Wed', num: 13 },
    { dow: 'Thu', num: 14, today: true }, { dow: 'Fri', num: 15 },
    { dow: 'Sat', num: 16 }, { dow: 'Sun', num: 17 },
  ];

  return (
    <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg-page)' }}>
      {/* Day-of-week header (sticky) */}
      <div style={{
        display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)',
        position: 'sticky', top: 0, zIndex: 3,
        background: 'var(--bg-translucent)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div />
        {days.map(d => (
          <div key={d.num} style={{
            padding: '10px 8px 12px', textAlign: 'center',
            borderLeft: '1px solid var(--border-subtle)',
          }}>
            <div style={{
              fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
              fontWeight: 500, marginBottom: 4,
              color: d.today ? 'var(--accent)' : 'var(--fg-2)',
            }}>{d.dow}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 999,
              fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1,
              background: d.today ? 'var(--accent)' : 'transparent',
              color: d.today ? 'var(--accent-fg)' : 'var(--fg-0)',
              boxShadow: d.today ? 'var(--shadow-sm)' : 'none',
            }}>{d.num}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '64px repeat(7, 1fr)',
        position: 'relative',
      }}>
        {/* Hour column */}
        <div>
          {hours.map(h => (
            <div key={h} style={{
              height: hourPx, paddingRight: 8, textAlign: 'right',
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)',
              transform: 'translateY(-6px)',
            }}>{h === 12 ? '12pm' : h > 12 ? `${h-12}pm` : `${h}am`}</div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d, dayIdx) => (
          <div key={d.num} style={{
            position: 'relative', borderLeft: '1px solid var(--border-subtle)',
          }}>
            {hours.map(h => (
              <div key={h} style={{
                height: hourPx, borderTop: '1px solid var(--border-subtle)',
              }} />
            ))}

            {/* Now line on today's column */}
            {d.today && (
              <div style={{
                position: 'absolute', left: 0, right: 0,
                top: (14.25 - 7) * hourPx, height: 0,
                borderTop: '1.5px solid var(--accent)', zIndex: 2,
                pointerEvents: 'none',
              }}>
                <div style={{ position: 'absolute', left: -4, top: -4, width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }} />
              </div>
            )}

            {/* Events for this day */}
            {weekEvents.filter(e => e.day === dayIdx).map((e, i) => {
              const s = eventStyles[e.cal];
              return (
                <button key={i} onClick={() => onEventClick(e)} style={{
                  position: 'absolute', left: 4, right: 4,
                  top: (e.start - 7) * hourPx + 1,
                  height: (e.end - e.start) * hourPx - 2,
                  background: s.bg, borderLeft: `3px solid ${s.bar}`,
                  borderRadius: 6, padding: '4px 8px', textAlign: 'left',
                  border: 'none', borderLeftWidth: 3, borderLeftStyle: 'solid', borderLeftColor: s.bar,
                  cursor: 'pointer', overflow: 'hidden',
                  color: s.text, fontFamily: 'var(--font-sans)',
                  display: 'flex', flexDirection: 'column', gap: 2,
                  transition: 'transform var(--dur-fast) var(--ease-out)',
                }}
                onMouseEnter={ev => ev.currentTarget.style.transform = 'scale(1.005)'}
                onMouseLeave={ev => ev.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                  {(e.end - e.start) > 0.6 && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.7 }}>
                      {fmtTime(e.start)} – {fmtTime(e.end)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function fmtTime(t) {
  const h = Math.floor(t);
  const m = Math.round((t - h) * 60);
  const hh = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const mm = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
  const ap = h >= 12 ? 'pm' : 'am';
  return `${hh}${mm}${ap}`;
}

// ═══════════════════════════════════════════════════════════════
// MONTH VIEW
// ═══════════════════════════════════════════════════════════════
function MonthView({ onEventClick }) {
  const startBlank = 4;
  const daysInMonth = 31;
  const cells = [];
  for (let i = 0; i < startBlank; i++) cells.push({ blank: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ num: d, today: d === 14 });
  while (cells.length % 7) cells.push({ blank: true });

  // Map of day-of-month → events
  const dayEvts = {
    11: [{ cal: 'work', title: 'Eng standup' }, { cal: 'work', title: 'Roadmap review' }],
    12: [{ cal: 'personal', title: 'Therapy' }, { cal: 'work', title: 'Design crit' }, { cal: 'health', title: 'Run loop' }],
    13: [{ cal: 'work', title: 'Eng standup' }, { cal: 'work', title: '1:1 — Anya' }],
    14: [{ cal: 'personal', title: 'Coffee — Mira' }, { cal: 'work', title: 'Eng standup' }, { cal: 'health', title: 'Lunch run' }, { cal: 'work', title: '1:1' }],
    15: [{ cal: 'work', title: 'Sprint planning' }, { cal: 'personal', title: 'Lunch — Jay' }, { cal: 'work', title: 'All-hands' }, { cal: 'work', title: 'Demo' }],
    16: [{ cal: 'health', title: 'Long run' }],
    20: [{ cal: 'deadline', title: 'Lease renewal' }],
    23: [{ cal: 'personal', title: 'Mira birthday' }],
    27: [{ cal: 'work', title: 'Quarterly review' }, { cal: 'work', title: 'Offsite prep' }],
  };

  return (
    <div style={{ flex: 1, padding: '0 28px 28px', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      {/* DOW header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '12px 0 8px' }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
          <div key={d} style={{
            fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
            color: 'var(--fg-2)', fontWeight: 500, paddingLeft: 8,
          }}>{d}</div>
        ))}
      </div>

      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gridAutoRows: '1fr',
        border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden',
        background: 'var(--bg-0)',
      }}>
        {cells.map((c, i) => {
          const evts = c.num ? (dayEvts[c.num] || []) : [];
          const visible = evts.slice(0, 3);
          const overflow = evts.length - visible.length;
          return (
            <div key={i} style={{
              padding: 6, minHeight: 96,
              borderRight: (i % 7 < 6) ? '1px solid var(--border-subtle)' : 'none',
              borderTop: (i >= 7) ? '1px solid var(--border-subtle)' : 'none',
              background: c.blank ? 'var(--bg-1)' : 'transparent',
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              {!c.blank && (
                <div style={{
                  display: 'inline-flex', alignSelf: 'flex-start',
                  width: 24, height: 24, borderRadius: 999,
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1,
                  background: c.today ? 'var(--accent)' : 'transparent',
                  color: c.today ? 'var(--accent-fg)' : 'var(--fg-0)',
                  marginBottom: 2,
                }}>{c.num}</div>
              )}
              {visible.map((e, k) => {
                const s = eventStyles[e.cal];
                return (
                  <button key={k} onClick={() => onEventClick(e)} style={{
                    border: 'none', background: 'transparent', textAlign: 'left',
                    padding: '2px 0 2px 8px', borderLeft: `3px solid ${s.bar}`,
                    fontSize: 11, color: s.text, fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{e.title}</button>
                );
              })}
              {overflow > 0 && (
                <div style={{ fontSize: 10, color: 'var(--fg-2)', paddingLeft: 8 }}>+{overflow} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EVENT INSPECTOR — right-side panel
// ═══════════════════════════════════════════════════════════════
function EventInspector({ event, onClose }) {
  if (!event) return null;
  const s = eventStyles[event.cal];
  return (
    <div style={{
      width: 340, flexShrink: 0, height: '100%', overflow: 'auto',
      background: 'var(--bg-0)', borderLeft: '1px solid var(--border-subtle)',
      padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 9px', borderRadius: 999,
          background: s.bg, color: s.text, fontSize: 12, fontWeight: 500,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: s.bar }} />
          {event.cal}
        </span>
        <SmallIconButton icon="x" onClick={onClose} />
      </div>

      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, lineHeight: 1.15, letterSpacing: '-0.01em', color: 'var(--fg-0)' }}>
          {event.title}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 14, color: 'var(--fg-1)' }}>
        <InspectorRow icon="clock" lines={['Thursday, May 14', `${fmtTime(event.start || 9.5)} – ${fmtTime(event.end || 10)}`]} />
        {event.where && <InspectorRow icon="map-pin" lines={[event.where, 'Get directions →']} />}
        <InspectorRow icon="users" lines={['3 attendees', 'You, Mira, Anya']} />
        <InspectorRow icon="repeat" lines={["Doesn't repeat"]} />
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, color: 'var(--fg-1)', fontSize: 14, lineHeight: 1.5 }}>
        Quick sync on the kickoff doc — bring laptops. Coffee on me this time.
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1, padding: '8px 12px', borderRadius: 6,
          background: 'var(--bg-0)', border: '1px solid var(--border)',
          color: 'var(--fg-0)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}>Edit</button>
        <button style={{
          padding: '8px 12px', borderRadius: 6,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--clay-700)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <DesktopIcon name="trash" size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

function InspectorRow({ icon, lines }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, color: 'var(--fg-2)', marginTop: 2 }}>
        <DesktopIcon name={icon} size={16} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ color: i === 0 ? 'var(--fg-0)' : 'var(--fg-2)', fontSize: i === 0 ? 14 : 13 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUICK-ADD MODAL — natural-language event creation
// ═══════════════════════════════════════════════════════════════
function QuickAddModal({ onClose }) {
  const [text, setText] = React.useState('Coffee with Mira tomorrow at 9:30am at Verve');
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'var(--bg-scrim)', zIndex: 50,
        animation: 'fadeIn 220ms var(--ease-out)',
      }} />
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes pop { from { transform: translate(-50%, -52%); opacity: 0 } to { transform: translate(-50%, -50%); opacity: 1 } }
      `}</style>
      <div style={{
        position: 'absolute', left: '50%', top: '38%', transform: 'translate(-50%, -50%)',
        width: 560, background: 'var(--bg-0)', borderRadius: 16,
        boxShadow: 'var(--shadow-lg)', zIndex: 51,
        animation: 'pop 220ms var(--ease-out)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-2)', fontWeight: 500, marginBottom: 6 }}>New event</div>
          <input
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: 'var(--font-serif)', fontSize: 24, lineHeight: 1.3,
              border: 'none', outline: 'none', background: 'transparent',
              color: 'var(--fg-0)', padding: '4px 0',
            }}
          />
        </div>

        {/* Parsed preview chips */}
        <div style={{ padding: '6px 22px 18px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <Chip icon="clock"   label="Tomorrow, 9:30 – 10:00am" />
          <Chip icon="map-pin" label="Verve · 4th & Mission" />
          <Chip icon="users"   label="Add attendees" muted />
          <Chip icon="repeat"  label="Doesn't repeat" muted />
        </div>

        <div style={{
          background: 'var(--bg-1)', padding: '12px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--fg-2)' }}>
            <kbd style={kbdStyle}>Esc</kbd> close
            <kbd style={kbdStyle}>⇧↵</kbd> save &amp; new
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg-0)', color: 'var(--fg-0)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>Cancel</button>
            <button onClick={onClose} style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: 'var(--accent)', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>Save event</button>
          </div>
        </div>
      </div>
    </>
  );
}

const kbdStyle = {
  fontFamily: 'var(--font-mono)', fontSize: 11,
  padding: '1px 6px', background: 'var(--bg-0)',
  border: '1px solid var(--border-subtle)', borderRadius: 4,
  color: 'var(--fg-1)',
};

function Chip({ icon, label, muted }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 999,
      background: muted ? 'transparent' : 'var(--bg-1)',
      border: muted ? '1px dashed var(--border)' : '1px solid transparent',
      fontSize: 12, fontWeight: 500,
      color: muted ? 'var(--fg-2)' : 'var(--fg-0)',
    }}>
      <DesktopIcon name={icon} size={12} />
      {label}
    </span>
  );
}

Object.assign(window, { WeekView, MonthView, EventInspector, QuickAddModal, weekEvents, eventStyles, desktopCalendars });
