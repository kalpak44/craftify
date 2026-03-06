CREATE TABLE IF NOT EXISTS work_items (
  id UUID PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  bom_id VARCHAR(64) NOT NULL,
  parent_bom_item VARCHAR(200) NOT NULL,
  bom_version VARCHAR(96) NOT NULL,
  components_count INTEGER NOT NULL,
  requested_qty NUMERIC(19,6) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_work_items_code_lower ON work_items(LOWER(code));
CREATE INDEX IF NOT EXISTS idx_work_items_bom_id_lower ON work_items(LOWER(bom_id));
CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);
CREATE INDEX IF NOT EXISTS idx_work_items_requested_at ON work_items(requested_at);
