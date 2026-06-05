-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Auto-update updated_at helper (used by all tables)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
