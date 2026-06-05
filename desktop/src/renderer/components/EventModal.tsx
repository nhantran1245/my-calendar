/**
 * EventModal — create or edit a calendar event.
 *
 * Modes:
 *   'create' — blank form pre-filled with initialDate
 *   'edit'   — form populated from event prop; past events are read-only
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CalendarEvent,
  CreateEventPayload,
  CreateRecurringEventPayload,
  EventTag,
  RecurrenceEndType,
  RecurrenceFrequency,
  RecurrenceRule,
  recurringApi,
} from '../api/events';
import {
  MAX_TITLE_LENGTH,
  REMINDER_OPTIONS,
} from '../constants/calendar.constants';

// ─── Tag chips ────────────────────────────────────────────────

const TAG_CHIPS: { id: EventTag; label: string; color: string }[] = [
  { id: 'personal', label: 'Personal', color: 'var(--sage-500)' },
  { id: 'work',     label: 'Work',     color: 'var(--steel-500)' },
  { id: 'health',   label: 'Health',   color: 'var(--amber-500)' },
  { id: 'deadline', label: 'Deadline', color: 'var(--clay-500)' },
];

const WEEKDAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const MONTHLY_ORDINALS = ['1st', '2nd', '3rd', '4th', 'last'];
const WEEKDAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// ─── Helpers ──────────────────────────────────────────────────

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function isPastEvent(startAt: string): boolean {
  return new Date(startAt) < new Date();
}

function dayShortFromDate(d: Date): string {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
}

function buildRecurrenceRule(
  frequency: RecurrenceFrequency,
  weeklyDays: string[],
  monthlyType: 'date' | 'relative',
  monthlyDate: number,
  monthlyRelative: string,
  yearlyPattern: { month: number; day: number },
  endType: RecurrenceEndType,
  endCount: string,
  endDate: string,
): RecurrenceRule {
  let pattern: Record<string, unknown> | undefined;

  if (frequency === 'weekly') {
    pattern = { days: weeklyDays };
  } else if (frequency === 'monthly') {
    pattern =
      monthlyType === 'date'
        ? { type: 'date', value: monthlyDate }
        : { type: 'relative', value: monthlyRelative };
  } else if (frequency === 'yearly') {
    pattern = { month: yearlyPattern.month, day: yearlyPattern.day };
  }

  let endValue: string | undefined;
  if (endType === 'after_occurrences') endValue = endCount;
  else if (endType === 'on_date') endValue = endDate ? new Date(endDate).toISOString() : undefined;

  return { frequency, pattern, endType, endValue };
}

// ─── Types ────────────────────────────────────────────────────

export interface EventModalProps {
  mode: 'create' | 'edit';
  initialDate?: Date;
  event?: CalendarEvent;
  onSave: (payload: CreateEventPayload) => Promise<void>;
  onRecurringSave?: (result: { instancesCreated: number }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────

export function EventModal({
  mode,
  initialDate,
  event,
  onSave,
  onRecurringSave,
  onDelete,
  onClose,
}: EventModalProps) {
  const isPast = mode === 'edit' && event ? isPastEvent(event.startAt) : false;
  const readOnly = isPast;

  const defaultStart = event
    ? toDatetimeLocal(new Date(event.startAt))
    : initialDate
      ? toDatetimeLocal(initialDate)
      : toDatetimeLocal(new Date());

  const defaultEnd =
    mode === 'edit' && event?.endAt
      ? toDatetimeLocal(new Date(event.endAt))
      : '';

  // ─── Base event fields ───────────────────────────────────────
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState(defaultEnd);
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number | null>(
    event?.reminderMinutesBefore ?? null,
  );
  const [tag, setTag] = useState<EventTag>(event?.tag ?? 'personal');

  // ─── Recurrence state ────────────────────────────────────────
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly');
  // weekly
  const defaultDay = initialDate ? dayShortFromDate(initialDate) : 'mon';
  const [weeklyDays, setWeeklyDays] = useState<string[]>([defaultDay]);
  // monthly
  const [monthlyType, setMonthlyType] = useState<'date' | 'relative'>('date');
  const [monthlyDate, setMonthlyDate] = useState(1);
  const [monthlyOrdinal, setMonthlyOrdinal] = useState('1st');
  const [monthlyWeekday, setMonthlyWeekday] = useState('monday');
  // yearly: derived from startAt
  const startDate = new Date(startAt || defaultStart);
  const yearlyPattern = { month: startDate.getMonth() + 1, day: startDate.getDate() };
  // end
  const [endType, setEndType] = useState<RecurrenceEndType>('never');
  const [endCount, setEndCount] = useState('10');
  const [endDateValue, setEndDateValue] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instancesCreated, setInstancesCreated] = useState<number | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!readOnly) titleRef.current?.focus();
  }, [readOnly]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Keep weeklyDays in sync when startAt changes and frequency is weekly
  useEffect(() => {
    if (frequency === 'weekly' && weeklyDays.length === 1 && weeklyDays[0] === defaultDay) {
      const d = new Date(startAt);
      setWeeklyDays([dayShortFromDate(d)]);
    }
  }, [startAt]);

  const toggleWeeklyDay = (day: string) => {
    setWeeklyDays((prev) =>
      prev.includes(day)
        ? prev.length > 1 ? prev.filter((d) => d !== day) : prev
        : [...prev, day],
    );
  };

  const monthlyRelativeValue = `${monthlyOrdinal}_${monthlyWeekday}`;

  const handleSave = useCallback(async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    setInstancesCreated(null);

    try {
      const basePayload: CreateEventPayload = {
        title: title.trim(),
        description: description.trim() || null,
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : null,
        allDay,
        reminderMinutesBefore,
        tag,
      };

      if (isRecurring && mode === 'create') {
        const rule = buildRecurrenceRule(
          frequency,
          weeklyDays,
          monthlyType,
          monthlyDate,
          monthlyRelativeValue,
          yearlyPattern,
          endType,
          endCount,
          endDateValue,
        );
        const recurringPayload: CreateRecurringEventPayload = { ...basePayload, recurrenceRule: rule };
        const result = await recurringApi.create(recurringPayload);
        setInstancesCreated(result.instancesCreated);
        onRecurringSave?.({ instancesCreated: result.instancesCreated });
        onClose();
      } else {
        await onSave(basePayload);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save event. Please try again.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [
    title, description, startAt, endAt, allDay, reminderMinutesBefore, tag,
    isRecurring, frequency, weeklyDays, monthlyType, monthlyDate, monthlyRelativeValue,
    yearlyPattern, endType, endCount, endDateValue,
    saving, mode, onSave, onRecurringSave, onClose,
  ]);

  const modalTitle =
    mode === 'create'
      ? `Add Event — ${initialDate ? initialDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'New'}`
      : isPast ? 'View Event (past)' : 'Edit Event';

  const reminderValue = reminderMinutesBefore === null ? 'null' : String(reminderMinutesBefore);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000 }}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          width: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--bg-0)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          fontFamily: 'var(--font-sans)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--fg-0)', letterSpacing: '-0.01em' }}>
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-2)', fontSize: 20, lineHeight: 1, padding: '2px 6px', borderRadius: 'var(--radius-xs)' }}
            title="Close"
          >×</button>
        </div>

        {/* Past warning */}
        {isPast && (
          <div style={{ background: 'rgba(226,109,77,0.1)', border: '1px solid rgba(226,109,77,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: '#C95A3D' }}>
            ⚠ This event is in the past and cannot be edited.
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(122,53,51,0.1)', border: '1px solid rgba(122,53,51,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 13, color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Tag chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TAG_CHIPS.map((chip) => {
              const active = tag === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => !readOnly && setTag(chip.id)}
                  disabled={readOnly}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 'var(--radius-full)',
                    border: active ? `1.5px solid ${chip.color}` : '1.5px solid var(--border)',
                    background: active ? `color-mix(in srgb, ${chip.color} 12%, transparent)` : 'transparent',
                    cursor: readOnly ? 'default' : 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                    color: active ? chip.color : 'var(--fg-2)',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: chip.color, flexShrink: 0 }} />
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Event title"
              disabled={readOnly}
              style={inputStyle(readOnly)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !readOnly) handleSave(); }}
            />
            <span style={{ fontSize: 11, color: title.length > MAX_TITLE_LENGTH * 0.9 ? '#C95A3D' : 'var(--fg-3)', alignSelf: 'flex-end' }}>
              {title.length}/{MAX_TITLE_LENGTH}
            </span>
          </div>

          {/* Description */}
          <textarea
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description (optional)"
            rows={3}
            disabled={readOnly}
            style={{ ...inputStyle(readOnly), resize: 'vertical', minHeight: 72, fontFamily: 'var(--font-sans)' }}
          />

          {/* All Day toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--fg-1)', cursor: readOnly ? 'default' : 'pointer' }}>
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              disabled={readOnly}
              style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
            />
            All day event
          </label>

          {/* Start / End */}
          {!allDay && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Starts</label>
                <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} disabled={readOnly} style={inputStyle(readOnly)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Ends (optional)</label>
                <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} disabled={readOnly} style={inputStyle(readOnly)} />
              </div>
            </>
          )}

          {/* Reminder */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={labelStyle}>Reminder</label>
            <select
              value={reminderValue}
              onChange={(e) => {
                const v = e.target.value;
                setReminderMinutesBefore(v === 'null' ? null : Number(v));
              }}
              disabled={readOnly}
              style={inputStyle(readOnly)}
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* ─── Repeat section (create mode only) ─────────────── */}
          {mode === 'create' && !readOnly && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Repeat toggle */}
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 500, color: 'var(--fg-0)', cursor: 'pointer' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15 }}>↻</span> Repeat
                </span>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                />
              </label>

              {isRecurring && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 4 }}>
                  {/* Frequency */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={labelStyle}>Frequency</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['daily', 'weekly', 'monthly', 'yearly'] as RecurrenceFrequency[]).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFrequency(f)}
                          style={{
                            flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 500,
                            fontFamily: 'var(--font-sans)',
                            border: frequency === f ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            background: frequency === f ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                            color: frequency === f ? 'var(--accent)' : 'var(--fg-1)',
                            cursor: 'pointer',
                          }}
                        >
                          {FREQUENCY_LABELS[f]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pattern — Weekly */}
                  {frequency === 'weekly' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={labelStyle}>Repeat on</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {WEEKDAYS.map((d) => {
                          const active = weeklyDays.includes(d.key);
                          return (
                            <button
                              key={d.key}
                              onClick={() => toggleWeeklyDay(d.key)}
                              style={{
                                width: 34, height: 34, borderRadius: '50%', fontSize: 11, fontWeight: 600,
                                fontFamily: 'var(--font-sans)', border: 'none', cursor: 'pointer',
                                background: active ? 'var(--accent)' : 'var(--bg-1)',
                                color: active ? 'var(--accent-fg)' : 'var(--fg-2)',
                              }}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pattern — Monthly */}
                  {frequency === 'monthly' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={labelStyle}>Repeat on</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setMonthlyType('date')}
                          style={{ ...chipBtn, ...(monthlyType === 'date' ? chipBtnActive : {}) }}
                        >
                          Day of month
                        </button>
                        <button
                          onClick={() => setMonthlyType('relative')}
                          style={{ ...chipBtn, ...(monthlyType === 'relative' ? chipBtnActive : {}) }}
                        >
                          Day of week
                        </button>
                      </div>
                      {monthlyType === 'date' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>On the</span>
                          <input
                            type="number"
                            min={1}
                            max={31}
                            value={monthlyDate}
                            onChange={(e) => setMonthlyDate(Number(e.target.value))}
                            style={{ ...inputStyle(false), width: 64 }}
                          />
                          <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>of each month</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>On the</span>
                          <select value={monthlyOrdinal} onChange={(e) => setMonthlyOrdinal(e.target.value)} style={{ ...inputStyle(false), width: 80 }}>
                            {MONTHLY_ORDINALS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <select value={monthlyWeekday} onChange={(e) => setMonthlyWeekday(e.target.value)} style={{ ...inputStyle(false), width: 110 }}>
                            {WEEKDAY_NAMES.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pattern — Yearly (no UI needed, derived from startAt) */}
                  {frequency === 'yearly' && (
                    <div style={{ fontSize: 13, color: 'var(--fg-2)', background: 'var(--bg-1)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
                      Repeats every year on{' '}
                      {new Date(startAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </div>
                  )}

                  {/* End condition */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Ends</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['never', 'after_occurrences', 'on_date'] as RecurrenceEndType[]).map((et) => {
                        const labels: Record<RecurrenceEndType, string> = { never: 'Never', after_occurrences: 'After', on_date: 'On date' };
                        return (
                          <button
                            key={et}
                            onClick={() => setEndType(et)}
                            style={{
                              flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 500,
                              fontFamily: 'var(--font-sans)',
                              border: endType === et ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              background: endType === et ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'transparent',
                              color: endType === et ? 'var(--accent)' : 'var(--fg-1)',
                              cursor: 'pointer',
                            }}
                          >
                            {labels[et]}
                          </button>
                        );
                      })}
                    </div>

                    {endType === 'after_occurrences' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={endCount}
                          onChange={(e) => setEndCount(e.target.value)}
                          style={{ ...inputStyle(false), width: 80 }}
                        />
                        <span style={{ fontSize: 13, color: 'var(--fg-1)' }}>occurrences</span>
                      </div>
                    )}

                    {endType === 'on_date' && (
                      <input
                        type="date"
                        value={endDateValue}
                        onChange={(e) => setEndDateValue(e.target.value)}
                        style={inputStyle(false)}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Buttons */}
        {!isPast && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
            <div>
              {mode === 'edit' && onDelete && (
                <button
                  onClick={onDelete}
                  disabled={saving}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 13, fontWeight: 500, cursor: saving ? 'default' : 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4, opacity: saving ? 0.5 : 1, padding: '6px 0' }}
                >
                  🗑 Delete
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={cancelBtnStyle} disabled={saving}>Cancel</button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                style={saveBtnStyle(!title.trim() || saving)}
              >
                {saving ? 'Saving…' : isRecurring && mode === 'create' ? 'Create series' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {isPast && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={cancelBtnStyle}>Close</button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Shared micro-styles ──────────────────────────────────────

function inputStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    fontSize: 13,
    fontFamily: 'var(--font-sans)',
    color: disabled ? 'var(--fg-2)' : 'var(--fg-0)',
    background: disabled ? 'var(--bg-page)' : 'var(--bg-0)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    cursor: disabled ? 'default' : 'text',
    opacity: disabled ? 0.7 : 1,
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--fg-2)',
  letterSpacing: '0.02em',
};

const chipBtn: React.CSSProperties = {
  flex: 1, padding: '6px 10px', fontSize: 12, fontWeight: 500,
  fontFamily: 'var(--font-sans)', border: '1.5px solid var(--border)',
  borderRadius: 'var(--radius-sm)', background: 'transparent',
  color: 'var(--fg-1)', cursor: 'pointer',
};

const chipBtnActive: React.CSSProperties = {
  borderColor: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
  color: 'var(--accent)',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '7px 14px', fontSize: 13, fontWeight: 500,
  fontFamily: 'var(--font-sans)', color: 'var(--fg-1)',
  background: 'var(--bg-0)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
};

function saveBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '7px 18px', fontSize: 13, fontWeight: 500,
    fontFamily: 'var(--font-sans)', color: 'var(--accent-fg)',
    background: disabled ? 'rgba(226,109,77,0.4)' : 'var(--accent)',
    border: 'none', borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background var(--dur-fast) var(--ease-out)',
  };
}
