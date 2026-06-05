-- Delivery status enum
CREATE TYPE notification_status AS ENUM ('PENDING', 'SENT', 'FAILED');

-- Central audit log for event reminder notifications
CREATE TABLE notifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status         notification_status NOT NULL DEFAULT 'PENDING',
  sent_at        TIMESTAMPTZ DEFAULT NULL,
  is_read        BOOLEAN NOT NULL DEFAULT false,
  read_at        TIMESTAMPTZ DEFAULT NULL,
  is_dismissed   BOOLEAN NOT NULL DEFAULT false,
  dismissed_at   TIMESTAMPTZ DEFAULT NULL,
  delivery_error TEXT DEFAULT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency: one notification per (event, user)
CREATE UNIQUE INDEX uq_notifications_event_user   ON notifications(event_id, user_id);

-- Query indexes
CREATE INDEX idx_notifications_user_created   ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread    ON notifications(user_id, is_read) WHERE is_dismissed = false;
CREATE INDEX idx_notifications_status_created ON notifications(status, created_at ASC) WHERE status IN ('PENDING', 'FAILED');
CREATE INDEX idx_notifications_event_id       ON notifications(event_id);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();
