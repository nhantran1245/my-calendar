-- V10__create_agenda_events_table.sql
-- Creates the agenda_events table: standalone tasks/items within agendas.
-- NOT a junction table — owns its own title, description, times, and status.
-- Optional source_event_id links to a calendar event (informational only;
-- deleting the source event sets this column to NULL, never cascades).

CREATE TABLE IF NOT EXISTS agenda_events (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    agenda_id       UUID        NOT NULL REFERENCES agendas(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    start_at        TIMESTAMPTZ  NOT NULL,
    end_at          TIMESTAMPTZ  NOT NULL,
    status          VARCHAR(50)  NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'completed', 'cancelled')),
    sort_order      INT          NOT NULL DEFAULT 0,
    source_event_id UUID         REFERENCES events(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agenda_events_agenda_id            ON agenda_events(agenda_id);
CREATE INDEX idx_agenda_events_agenda_id_start_at   ON agenda_events(agenda_id, start_at);
CREATE INDEX idx_agenda_events_agenda_id_sort_order ON agenda_events(agenda_id, sort_order);
CREATE INDEX idx_agenda_events_status               ON agenda_events(status);
CREATE INDEX idx_agenda_events_source_event_id      ON agenda_events(source_event_id);

CREATE TRIGGER agenda_events_set_updated_at
    BEFORE UPDATE ON agenda_events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
