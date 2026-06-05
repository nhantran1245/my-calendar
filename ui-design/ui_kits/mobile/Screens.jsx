// Cadence mobile — screens. Each screen renders into the iOS device frame's content area.

// Sample data
const weekDays = [
  { dow: 'Mon', num: 11, today: false, events: 1 },
  { dow: 'Tue', num: 12, today: false, events: 3 },
  { dow: 'Wed', num: 13, today: false, events: 2 },
  { dow: 'Thu', num: 14, today: true,  events: 3 },
  { dow: 'Fri', num: 15, today: false, events: 4 },
  { dow: 'Sat', num: 16, today: false, events: 1 },
  { dow: 'Sun', num: 17, today: false, events: 0, muted: true },
];

const dayEvents = [
  { id: 1, title: 'Coffee with Mira',    time: '9:30 – 10:00am', where: 'Verve · 4th & Mission', cal: 'personal' },
  { id: 2, title: 'Engineering standup', time: '10:30 – 10:45am', where: 'Conf room B',           cal: 'work' },
  { id: 3, title: 'Lunch run',           time: '12:30 – 1:30pm',  where: 'Mission Cliffs',        cal: 'health' },
  { id: 4, title: '1:1 with Anya',       time: '3:00 – 3:30pm',   where: 'Zoom',                  cal: 'work' },
  { id: 5, title: 'Lease renewal due',   time: 'All day',         cal: 'deadline' },
];

// ═══════════════════════════════════════════════════════════════
// 1) MONTH SCREEN
// ═══════════════════════════════════════════════════════════════
function MonthScreen({ onPickDay, onCompose }) {
  // build a 6x7 grid for May 2026 (placeholder shape — May 1 2026 = Fri)
  const startBlank = 4; // Mon-start week
  const daysInMonth = 31;
  const cells = [];
  for (let i = 0; i < startBlank; i++) cells.push({ blank: true });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      num: d,
      today: d === 14,
      busy: [2, 5, 8, 11, 12, 13, 14, 15, 18, 19, 22, 26, 28].includes(d) ? Math.min(3, (d % 4) + 1) : 0,
    });
  }
  while (cells.length % 7) cells.push({ blank: true });

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100%', paddingBottom: 100 }}>
      <CadenceTopBar title="May" subtitle="2026" />

      {/* DOW header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '6px 12px 4px' }}>
        {['M','T','W','T','F','S','S'].map((d,i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 10, color: 'var(--fg-2)',
            fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        rowGap: 6, columnGap: 2, padding: '4px 12px',
      }}>
        {cells.map((c, i) => (
          <button key={i}
            onClick={() => !c.blank && onPickDay(c.num)}
            disabled={c.blank}
            style={{
              border: 'none', background: 'transparent', padding: '8px 0 6px',
              borderRadius: 10, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, cursor: c.blank ? 'default' : 'pointer',
              minHeight: 56,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1,
              background: c.today ? 'var(--accent)' : 'transparent',
              color: c.today ? 'var(--accent-fg)' : (c.blank ? 'transparent' : 'var(--fg-0)'),
              boxShadow: c.today ? 'var(--shadow-sm)' : 'none',
            }}>{c.num}</div>
            <div style={{ display: 'flex', gap: 2, height: 4 }}>
              {!c.blank && Array.from({ length: c.busy }).map((_,k) => (
                <div key={k} style={{
                  width: 4, height: 4, borderRadius: 999,
                  background: c.today ? 'var(--accent)' : 'var(--fg-2)',
                  opacity: c.today ? 0.85 : 0.7,
                }} />
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Selected day quick preview */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)', fontWeight: 500, marginBottom: 10 }}>
          Today · 3 events
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dayEvents.slice(0, 3).map(e => <CadenceEventCard key={e.id} event={e} compact />)}
        </div>
      </div>

      <CadenceFab onClick={onCompose} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2) DAY SCREEN — hour grid with positioned events
// ═══════════════════════════════════════════════════════════════
function DayScreen({ onCompose }) {
  const [selected, setSelected] = React.useState(14);
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am - 6pm
  const hourPx = 56;

  // event positioning helper — 7am = top 0
  const evPos = (startH, endH) => ({
    top: (startH - 7) * hourPx,
    height: (endH - startH) * hourPx - 4,
  });

  const placedEvents = [
    { ...dayEvents[0], pos: evPos(9.5, 10) },
    { ...dayEvents[1], pos: evPos(10.5, 10.75) },
    { ...dayEvents[2], pos: evPos(12.5, 13.5) },
    { ...dayEvents[3], pos: evPos(15, 15.5) },
  ];

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100%', paddingBottom: 100 }}>
      <CadenceTopBar title="Thursday 14" subtitle="May" />
      <CadenceWeekStrip days={weekDays} selected={selected} onSelect={setSelected} />

      {/* Hour grid */}
      <div style={{ position: 'relative', padding: '0 16px 24px' }}>
        {hours.map(h => (
          <div key={h} style={{ position: 'relative', height: hourPx, display: 'flex' }}>
            <div style={{
              width: 44, fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--fg-3)', paddingTop: 0, lineHeight: 1,
              transform: 'translateY(-6px)',
            }}>
              {h === 12 ? '12pm' : h > 12 ? `${h-12}pm` : `${h}am`}
            </div>
            <div style={{ flex: 1, borderTop: '1px solid var(--border-subtle)' }} />
          </div>
        ))}

        {/* now line — assume 2:15pm */}
        <div style={{
          position: 'absolute', left: 60, right: 16,
          top: (14.25 - 7) * hourPx, height: 0,
          borderTop: '1px solid var(--accent)', zIndex: 2,
        }}>
          <div style={{
            position: 'absolute', left: -6, top: -4,
            width: 8, height: 8, borderRadius: 999, background: 'var(--accent)',
          }} />
        </div>

        {/* events */}
        <div style={{ position: 'absolute', left: 60, right: 16, top: 0 }}>
          {placedEvents.map(e => (
            <div key={e.id} style={{
              position: 'absolute', top: e.pos.top, height: e.pos.height,
              left: 0, right: 0,
            }}>
              <CadenceEventCard event={e} compact />
            </div>
          ))}
        </div>
      </div>

      <CadenceFab onClick={onCompose} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3) AGENDA SCREEN — chronological list grouped by day
// ═══════════════════════════════════════════════════════════════
function AgendaScreen({ onCompose }) {
  const groups = [
    { day: 'Today',    dow: 'Thursday', num: 14, events: dayEvents.slice(0,3) },
    { day: 'Tomorrow', dow: 'Friday',   num: 15, events: [
      { id: 6, title: 'Design review',   time: '10:00 – 11:00am', where: 'Studio', cal: 'work' },
      { id: 7, title: 'Mira birthday',   time: 'All day',         cal: 'personal' },
    ]},
    { day: 'Saturday', dow: 'Saturday', num: 16, events: [
      { id: 8, title: 'Long run',        time: '7:00 – 9:00am',   where: 'Crissy Field', cal: 'health' },
    ]},
  ];

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100%', paddingBottom: 100 }}>
      <CadenceTopBar title="Upcoming" subtitle="Agenda" />
      <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {groups.map(g => (
          <div key={g.num}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, lineHeight: 1, color: g.day === 'Today' ? 'var(--accent)' : 'var(--fg-0)' }}>{g.num}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-0)' }}>{g.day}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-2)' }}>{g.dow}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {g.events.map(e => <CadenceEventCard key={e.id} event={e} />)}
            </div>
          </div>
        ))}
      </div>
      <CadenceFab onClick={onCompose} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4) NEW EVENT SHEET
// ═══════════════════════════════════════════════════════════════
function NewEventSheet({ onClose, onSave }) {
  const [title, setTitle] = React.useState('Coffee with Mira');
  const [cal, setCal] = React.useState('personal');

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'var(--bg-scrim)',
        zIndex: 10, animation: 'fadeIn 220ms var(--ease-out)',
      }} />
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 11,
        background: 'var(--bg-0)', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: '12px 20px 32px', boxShadow: 'var(--shadow-lg)',
        animation: 'slideUp 280ms var(--ease-out)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--slate-3)', margin: '0 auto 12px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--fg-2)', fontSize: 15, padding: 0, cursor: 'pointer' }}>Cancel</button>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--fg-0)' }}>New event</div>
          <button onClick={onSave} style={{ border: 'none', background: 'transparent', color: 'var(--accent)', fontSize: 15, fontWeight: 500, padding: 0, cursor: 'pointer' }}>Save</button>
        </div>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          placeholder="Event title"
          style={{
            width: '100%', boxSizing: 'border-box',
            fontFamily: 'var(--font-serif)', fontSize: 28, lineHeight: 1.2,
            border: 'none', outline: 'none', background: 'transparent',
            color: 'var(--fg-0)', padding: 0, marginBottom: 16,
          }}
        />

        {/* Time row */}
        <FormRow icon="clock" label="Thursday 14, 9:30 – 10:00am" right="·" />
        <FormRow icon="map-pin" label="Verve · 4th &amp; Mission" right="·" />
        <FormRow icon="users" label="3 attendees" right="·" />
        <FormRow icon="repeat" label="Doesn't repeat" right="·" />

        {/* Calendar picker */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)', fontWeight: 500, marginBottom: 8 }}>Calendar</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'personal', name: 'Personal', color: 'var(--ember-500)' },
              { id: 'work',     name: 'Work',     color: 'var(--steel-500)' },
              { id: 'health',   name: 'Health',   color: 'var(--sage-500)' },
              { id: 'deadline', name: 'Deadlines',color: 'var(--amber-500)' },
            ].map(c => (
              <button key={c.id} onClick={() => setCal(c.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 999,
                border: '1px solid ' + (cal === c.id ? 'var(--fg-0)' : 'var(--border)'),
                background: cal === c.id ? 'var(--bg-1)' : 'transparent',
                cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                color: 'var(--fg-0)',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function FormRow({ icon, label, right }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderTop: '1px solid var(--border-subtle)',
    }}>
      <Icon name={icon} size={18} color="var(--fg-2)" />
      <div style={{ flex: 1, fontSize: 14, color: 'var(--fg-0)' }} dangerouslySetInnerHTML={{ __html: label }} />
      <div style={{ color: 'var(--fg-3)', fontSize: 18 }}>›</div>
    </div>
  );
}

Object.assign(window, { MonthScreen, DayScreen, AgendaScreen, NewEventSheet, weekDays, dayEvents });
