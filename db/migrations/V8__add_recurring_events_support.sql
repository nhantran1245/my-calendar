-- Create ENUM types for recurrence
CREATE TYPE recurrence_frequency AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

CREATE TYPE recurrence_end_type AS ENUM (
  'never',
  'after_occurrences',
  'on_date'
);

-- Add recurrence columns to events table
ALTER TABLE events
  ADD COLUMN recurring_event_id UUID,
  ADD COLUMN recurrence_frequency recurrence_frequency,
  ADD COLUMN recurrence_pattern JSONB,
  ADD COLUMN recurrence_end_type recurrence_end_type,
  ADD COLUMN recurrence_end_value TEXT,
  ADD COLUMN recurrence_generated_until TIMESTAMPTZ,
  ADD COLUMN is_recurrence_template BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN is_recurrence_override BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN overridden_at TIMESTAMPTZ;

-- Self-referencing FK: instances point to their series template
ALTER TABLE events
  ADD CONSTRAINT fk_events_recurring_event_id
  FOREIGN KEY (recurring_event_id) REFERENCES events(id) ON DELETE CASCADE;

-- Indexes for efficient queries
CREATE INDEX idx_events_recurring_event_id ON events(recurring_event_id);
CREATE INDEX idx_events_is_recurrence_template ON events(is_recurrence_template);
CREATE INDEX idx_events_recurrence_frequency ON events(recurrence_frequency);
CREATE INDEX idx_events_is_recurrence_override ON events(is_recurrence_override);

-- Composite index for calendar queries filtering instances of a series
CREATE INDEX idx_events_recurring_event_start_at
  ON events(recurring_event_id, start_at)
  WHERE recurring_event_id IS NOT NULL;

-- Index for finding series templates
CREATE INDEX idx_events_template_start
  ON events(is_recurrence_template, start_at)
  WHERE is_recurrence_template = TRUE;
