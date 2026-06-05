ALTER TABLE users
  ADD COLUMN display_name VARCHAR(100) DEFAULT NULL,
  ADD COLUMN bio TEXT DEFAULT NULL,
  ADD COLUMN avatar_url VARCHAR(2048) DEFAULT NULL,
  ADD COLUMN timezone VARCHAR(63) NOT NULL DEFAULT 'UTC';

CREATE INDEX idx_users_timezone ON users (timezone);

UPDATE users SET display_name = username WHERE display_name IS NULL;
