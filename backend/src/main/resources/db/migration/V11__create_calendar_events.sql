CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  color VARCHAR(32) NOT NULL,
  calendar_name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  description VARCHAR(4000),
  owner_sub VARCHAR(191) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_owner_sub ON calendar_events(owner_sub);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_at ON calendar_events(end_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_owner_start ON calendar_events(owner_sub, start_at);
