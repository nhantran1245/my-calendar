-- Link events to their owning user (nullable for backward compat with existing rows)
ALTER TABLE events ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_events_user_id ON events(user_id);

-- DND (Do Not Disturb) support on the user record
ALTER TABLE users
  ADD COLUMN dnd_until TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN notification_enabled BOOLEAN NOT NULL DEFAULT true;
