CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  item_id VARCHAR(64) NOT NULL,
  item_name VARCHAR(200) NOT NULL,
  item_category_name VARCHAR(100) NOT NULL,
  category_detached BOOLEAN NOT NULL DEFAULT FALSE,
  detached_category_name VARCHAR(100),
  category_name VARCHAR(100) NOT NULL,
  uom VARCHAR(16) NOT NULL,
  available NUMERIC(19,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_inventory_code_lower ON inventory(LOWER(code));
CREATE INDEX IF NOT EXISTS idx_inventory_item_id_lower ON inventory(LOWER(item_id));
CREATE INDEX IF NOT EXISTS idx_inventory_item_name_lower ON inventory(LOWER(item_name));
CREATE INDEX IF NOT EXISTS idx_inventory_category_name_lower ON inventory(LOWER(category_name));
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON inventory(updated_at);
