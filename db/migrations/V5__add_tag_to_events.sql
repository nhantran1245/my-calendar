CREATE TYPE event_tag AS ENUM ('personal', 'work', 'health', 'deadline');

ALTER TABLE events
    ADD COLUMN tag event_tag NOT NULL DEFAULT 'personal';
