/**
 * MonthCalendar — the main month-grid view for Cadence.
 *
 * Renders inside AppShell (NavRail + AppHeader). Loads events from the
 * backend for the displayed month and renders them as pills in date cells.
 * CRUD operations use optimistic updates with rollback on failure.
 *
 * Layout: calendar grid (flex: 1) + optional EventInspector panel (340px)
 * that slides in when an event is selected.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { EventModal } from '../components/EventModal';
import { Icon } from '../components/Icon';
import { NotificationsSidebar } from '../components/NotificationsSidebar';
import { CalendarEvent, CreateEventPayload, EventTag, eventsApi } from '../api/events';
import {
  MAX_VISIBLE_EVENTS_PER_CELL,
  MONTH_NAMES,
  MONTHS_LOOKBACK,
  REMINDER_OPTIONS,
  WEEKDAY_NAMES,
} from '../constants/calendar.constants';

// ─── Tag color system ─────────────────────────────────────────

const TAG_STYLES: Record<EventTag, { bar: string; tint: string; text: string; label: string }> = {
  personal: { bar: 'var(--sage-500)',  tint: 'rgba(124,139,92,0.1)',  text: 'var(--sage-700)',  label: 'Personal' },
  work:     { bar: 'var(--steel-500)', tint: 'rgba(91,127,166,0.1)',  text: 'var(--steel-700)', label: 'Work' },
  health:   { bar: 'var(--amber-500)', tint: 'rgba(200,148,58,0.1)',  text: 'var(--amber-700)', label: 'Health' },
  deadline: { bar: 'var(--clay-500)',  tint: 'rgba(184,84,80,0.1)',   text: 'var(--clay-700)',  label: 'Deadline' },
};

// ─── Types ────────────────────────────────────────────────────

interface MonthCalendarProps {
  onLogout: () => void;
}

type ModalState =
  | null
  | { type: 'create'; date: Date }
  | { type: 'edit'; event: CalendarEvent }
  | { type: 'delete'; event: CalendarEvent };

interface CalendarCell {
  date: Date | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

// ─── Calendar grid builder ────────────────────────────────────

function buildCalendarCells(
  year: number,
  month: number, // 1-12
  events: CalendarEvent[],
): CalendarCell[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  // Mon-first: (0=Sun → 6, 1=Mon → 0, …)
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const totalCells = Math.ceil((leadingBlanks + daysInMonth) / 7) * 7;
  const cells: CalendarCell[] = [];

  // Group events by local date string (YYYY-MM-DD)
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const d = new Date(ev.startAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const bucket = eventsByDate.get(key) ?? [];
    bucket.push(ev);
    eventsByDate.set(key, bucket);
  }

  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - leadingBlanks;
    if (dayOffset < 0 || dayOffset >= daysInMonth) {
      cells.push({ date: null, isCurrentMonth: false, isToday: false, events: [] });
    } else {
      const date = new Date(year, month - 1, dayOffset + 1);
      const key = `${year}-${String(month).padStart(2, '0')}-${String(dayOffset + 1).padStart(2, '0')}`;
      const dayEvents = (eventsByDate.get(key) ?? []).sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
      cells.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        events: dayEvents,
      });
    }
  }

  return cells;
}

// ─── Helpers ─────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, '0')}${ampm}`;
}

// ─── Subcomponents ────────────────────────────────────────────

function EventPill({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const s = TAG_STYLES[event.tag] ?? TAG_STYLES.personal;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={event.title}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: hovered ? s.tint : 'transparent',
        borderLeft: `2px solid ${s.bar}`,
        paddingLeft: 5,
        paddingRight: 4,
        paddingTop: 1,
        paddingBottom: 1,
        borderRadius: 'var(--radius-xs)',
        border: 'none',
        borderLeftWidth: 2,
        borderLeftStyle: 'solid',
        borderLeftColor: s.bar,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontSize: 11,
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        color: s.text,
        textDecoration: event.isCompleted ? 'line-through' : 'none',
        opacity: event.isCompleted ? 0.5 : 1,
        transition: 'background var(--dur-fast) var(--ease-out)',
      }}
    >
      {event.title}
    </button>
  );
}

function SkeletonGrid() {
  const cells = Array.from({ length: 35 });
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        flex: 1,
      }}
    >
      {cells.map((_, i) => (
        <div
          key={i}
          style={{
            minHeight: 100,
            borderRight: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: 6,
            background: i % 3 === 0 ? 'var(--bg-page)' : 'var(--bg-0)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
    </div>
  );
}

// ─── EventInspector panel ─────────────────────────────────────

function EventInspector({
  event,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleComplete: (id: string, val: boolean) => void;
}) {
  const s = TAG_STYLES[event.tag] ?? TAG_STYLES.personal;
  const reminder = REMINDER_OPTIONS.find((o) => o.value === event.reminderMinutesBefore);

  return (
    <aside
      style={{
        width: 340,
        flexShrink: 0,
        borderLeft: '1px solid var(--border-subtle)',
        background: 'var(--bg-page)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
        overflow: 'auto',
      }}
    >
      {/* Inspector header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Tag chip */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: s.tint,
            fontSize: 11,
            fontWeight: 600,
            color: s.text,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: s.bar,
              flexShrink: 0,
            }}
          />
          {s.label}
        </span>

        <button
          onClick={onClose}
          title="Close"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--fg-2)',
            padding: '4px 6px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Icon name="x" size={16} />
        </button>
      </div>

      {/* Title */}
      <div style={{ padding: '20px 20px 4px' }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-serif)',
            fontSize: 26,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            color: 'var(--fg-0)',
            textDecoration: event.isCompleted ? 'line-through' : 'none',
            opacity: event.isCompleted ? 0.6 : 1,
          }}
        >
          {event.title}
        </h2>
      </div>

      {/* Metadata rows */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Time */}
        <MetaRow icon="clock">
          <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>
            {event.allDay
              ? 'All day'
              : `${formatTime(event.startAt)}${event.endAt ? ` → ${formatTime(event.endAt)}` : ''}`}
          </span>
          <span style={{ fontSize: 11, color: 'var(--fg-3)', marginLeft: 6 }}>
            {new Date(event.startAt).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </MetaRow>

        {/* Reminder */}
        {reminder && reminder.value !== null && (
          <MetaRow icon="bell">
            <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>{reminder.label}</span>
          </MetaRow>
        )}

        {/* Description */}
        {event.description && (
          <MetaRow icon="align-left">
            <span style={{ fontSize: 13, color: 'var(--fg-1)', whiteSpace: 'pre-wrap' }}>
              {event.description}
            </span>
          </MetaRow>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Actions */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={() => onToggleComplete(event.id, !event.isCompleted)}
          style={{
            flex: 1,
            padding: '7px 0',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-0)',
            color: 'var(--fg-1)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Icon name={event.isCompleted ? 'circle' : 'check-circle'} size={14} />
          {event.isCompleted ? 'Reopen' : 'Complete'}
        </button>
        <button
          onClick={onEdit}
          style={{
            flex: 1,
            padding: '7px 0',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)',
            color: 'var(--accent-fg)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Icon name="pencil" size={13} />
          Edit
        </button>
        <button
          onClick={onDelete}
          title="Delete event"
          style={{
            width: 32,
            height: 32,
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            background: 'none',
            color: 'var(--fg-3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    </aside>
  );
}

function MetaRow({ icon, children }: { icon: Parameters<typeof Icon>[0]['name']; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '7px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <Icon name={icon} size={15} style={{ color: 'var(--fg-3)', marginTop: 1, flexShrink: 0 } as React.CSSProperties} />
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────

export function MonthCalendar({ onLogout }: MonthCalendarProps) {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showNotificationsSidebar, setShowNotificationsSidebar] = useState(false);

  // ── Load events ──────────────────────────────────────────────

  const loadEvents = useCallback(async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await eventsApi.listByMonth(year, month);
      setEvents(result.data);
    } catch {
      setError('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents(currentYear, currentMonth);
  }, [currentYear, currentMonth, loadEvents]);

  // ── Navigation ───────────────────────────────────────────────

  const handlePrev = useCallback(() => {
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth() + 1;
    const monthsBack =
      (todayYear - currentYear) * 12 + (todayMonth - currentMonth);
    if (monthsBack >= MONTHS_LOOKBACK) return;

    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentYear, currentMonth, now]);

  const handleNext = useCallback(() => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const handleToday = useCallback(() => {
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
  }, [now]);

  // ── CRUD handlers ────────────────────────────────────────────

  const handleCreate = useCallback(
    async (payload: CreateEventPayload) => {
      const tempId = `temp-${Date.now()}`;
      const tempEvent: CalendarEvent = {
        id: tempId,
        title: payload.title,
        description: payload.description ?? null,
        startAt: payload.startAt,
        endAt: payload.endAt ?? null,
        allDay: payload.allDay ?? false,
        reminderMinutesBefore: payload.reminderMinutesBefore ?? null,
        tag: payload.tag ?? 'personal',
        isCompleted: false,
        recurringEventId: null,
        isRecurrenceTemplate: false,
        isRecurrenceOverride: false,
        recurrenceFrequency: null,
        recurrencePattern: null,
        recurrenceEndType: null,
        recurrenceEndValue: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEvents((prev) => [...prev, tempEvent]);
      setModal(null);
      try {
        const created = await eventsApi.create(payload);
        setEvents((prev) => prev.map((e) => (e.id === tempId ? created : e)));
      } catch {
        setEvents((prev) => prev.filter((e) => e.id !== tempId));
        setError('Failed to create event.');
      }
    },
    [],
  );

  const handleUpdate = useCallback(
    async (id: string, payload: Partial<CreateEventPayload>) => {
      const prev = events.find((e) => e.id === id);
      if (!prev) return;
      const optimistic: CalendarEvent = {
        ...prev,
        ...payload,
        description: payload.description ?? prev.description,
        endAt: payload.endAt ?? prev.endAt,
        allDay: payload.allDay ?? prev.allDay,
        reminderMinutesBefore:
          payload.reminderMinutesBefore !== undefined
            ? payload.reminderMinutesBefore
            : prev.reminderMinutesBefore,
        tag: payload.tag ?? prev.tag,
        updatedAt: new Date().toISOString(),
      };
      setEvents((evs) => evs.map((e) => (e.id === id ? optimistic : e)));
      setSelectedEvent(optimistic);
      setModal(null);
      try {
        const result = await eventsApi.update(id, payload);
        const updated = result.event ?? result as unknown as CalendarEvent;
        setEvents((evs) => evs.map((e) => (e.id === id ? updated : e)));
        setSelectedEvent(updated);
      } catch {
        setEvents((evs) => evs.map((e) => (e.id === id ? prev : e)));
        setSelectedEvent(prev);
        setError('Failed to update event.');
      }
    },
    [events],
  );

  const handleDelete = useCallback(
    async (event: CalendarEvent) => {
      setEvents((evs) => evs.filter((e) => e.id !== event.id));
      setSelectedEvent(null);
      setModal(null);
      try {
        await eventsApi.remove(event.id);
      } catch {
        setEvents((evs) => [...evs, event]);
        setError('Failed to delete event.');
      }
    },
    [],
  );

  const handleToggleComplete = useCallback(
    async (id: string, isCompleted: boolean) => {
      const prev = events.find((e) => e.id === id);
      if (!prev) return;
      const optimistic = { ...prev, isCompleted };
      setEvents((evs) => evs.map((e) => (e.id === id ? optimistic : e)));
      if (selectedEvent?.id === id) setSelectedEvent(optimistic);
      try {
        const updated = await eventsApi.toggleComplete(id, isCompleted);
        setEvents((evs) => evs.map((e) => (e.id === id ? updated : e)));
        if (selectedEvent?.id === id) setSelectedEvent(updated);
      } catch {
        setEvents((evs) => evs.map((e) => (e.id === id ? prev : e)));
        if (selectedEvent?.id === id) setSelectedEvent(prev);
        setError('Failed to update event.');
      }
    },
    [events, selectedEvent],
  );

  // ── Build grid ───────────────────────────────────────────────

  const cells = buildCalendarCells(currentYear, currentMonth, events);

  // ── Render ───────────────────────────────────────────────────

  return (
    <AppShell
      activeNav="month"
      onNav={(id) => {
        if (id === 'settings') { /* TODO */ }
        if (id === 'inbox') setShowNotificationsSidebar((v) => !v);
      }}
      headerTitle={MONTH_NAMES[currentMonth - 1]}
      headerSubtitle={String(currentYear)}
      onNewEvent={() => setModal({ type: 'create', date: new Date() })}
      onPrev={handlePrev}
      onNext={handleNext}
      onToday={handleToday}
    >
      {/* Error banner */}
      {error && (
        <div
          style={{
            background: 'rgba(122,53,51,0.1)',
            borderBottom: '1px solid rgba(122,53,51,0.2)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: 'var(--danger)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <span>⚠ {error}</span>
          <button
            onClick={() => loadEvents(currentYear, currentMonth)}
            style={{
              background: 'none',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 10px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main content: grid + inspector + notifications sidebar */}
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        {/* Calendar wrapper */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Weekday header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            {WEEKDAY_NAMES.map((day) => (
              <div
                key={day}
                style={{
                  padding: '6px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--fg-3)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-sans)',
                  textAlign: 'center',
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid or skeleton */}
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                flex: 1,
                overflowY: 'auto',
              }}
            >
              {cells.map((cell, idx) => (
                <CalendarCellView
                  key={idx}
                  cell={cell}
                  selectedEventId={selectedEvent?.id ?? null}
                  onClickDate={(date) => {
                    setSelectedEvent(null);
                    setModal({ type: 'create', date });
                  }}
                  onClickEvent={(ev) => {
                    setSelectedEvent(ev);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* EventInspector panel */}
        {selectedEvent && (
          <EventInspector
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onEdit={() => setModal({ type: 'edit', event: selectedEvent })}
            onDelete={() => setModal({ type: 'delete', event: selectedEvent })}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {/* Notifications sidebar */}
        {showNotificationsSidebar && (
          <NotificationsSidebar onClose={() => setShowNotificationsSidebar(false)} />
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create' && (
        <EventModal
          mode="create"
          initialDate={modal.date}
          onSave={handleCreate}
          onRecurringSave={() => loadEvents(currentYear, currentMonth)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'edit' && (
        <EventModal
          mode="edit"
          event={modal.event}
          onSave={(p) => handleUpdate(modal.event.id, p)}
          onDelete={() =>
            setModal({ type: 'delete', event: (modal as { type: 'edit'; event: CalendarEvent }).event })
          }
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          eventTitle={modal.event.title}
          onConfirm={() => handleDelete(modal.event)}
          onCancel={() => setModal(null)}
        />
      )}
    </AppShell>
  );
}

// ─── CalendarCellView ─────────────────────────────────────────

function CalendarCellView({
  cell,
  selectedEventId,
  onClickDate,
  onClickEvent,
}: {
  cell: CalendarCell;
  selectedEventId: string | null;
  onClickDate: (date: Date) => void;
  onClickEvent: (event: CalendarEvent) => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (!cell.date) {
    return (
      <div
        style={{
          minHeight: 100,
          borderRight: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-page)',
        }}
      />
    );
  }

  const visible = cell.events.slice(0, MAX_VISIBLE_EVENTS_PER_CELL);
  const overflow = cell.events.length - MAX_VISIBLE_EVENTS_PER_CELL;

  return (
    <div
      onClick={() => onClickDate(cell.date!)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minHeight: 100,
        borderRight: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: 6,
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-0)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        transition: 'background var(--dur-fast) var(--ease-out)',
      }}
    >
      {/* Date number — serif circle for today */}
      <div style={{ alignSelf: 'flex-start', marginBottom: 2 }}>
        {cell.isToday ? (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                lineHeight: 1,
                color: 'var(--accent-fg)',
              }}
            >
              {cell.date.getDate()}
            </span>
          </div>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              lineHeight: 1,
              color: 'var(--fg-2)',
              display: 'block',
              width: 24,
              textAlign: 'center',
            }}
          >
            {cell.date.getDate()}
          </span>
        )}
      </div>

      {/* Event pills */}
      {visible.map((ev) => (
        <div
          key={ev.id}
          style={{
            outline: ev.id === selectedEventId ? '1.5px solid var(--accent)' : 'none',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <EventPill
            event={ev}
            onClick={(e) => {
              e.stopPropagation();
              onClickEvent(ev);
            }}
          />
        </div>
      ))}

      {/* Overflow badge */}
      {overflow > 0 && (
        <span
          style={{
            fontSize: 10,
            color: 'var(--accent)',
            fontWeight: 600,
            fontFamily: 'var(--font-sans)',
            padding: '1px 4px',
          }}
        >
          +{overflow} more
        </span>
      )}
    </div>
  );
}
