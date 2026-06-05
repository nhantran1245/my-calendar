-- V9__create_agendas_table.sql
-- Creates the agendas table: top-level container for agenda events

CREATE TABLE IF NOT EXISTS agendas (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    start_at    TIMESTAMPTZ  NOT NULL,
    end_at      TIMESTAMPTZ  NOT NULL,
    status      VARCHAR(50)  NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'cancelled')),
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agendas_start_at    ON agendas(start_at);
CREATE INDEX idx_agendas_status      ON agendas(status);
CREATE INDEX idx_agendas_start_at_id ON agendas(start_at, id);
CREATE INDEX idx_agendas_deleted_at  ON agendas(deleted_at) WHERE deleted_at IS NULL;

CREATE TRIGGER agendas_set_updated_at
    BEFORE UPDATE ON agendas
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
