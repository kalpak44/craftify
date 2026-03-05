CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(32) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  uom_base VARCHAR(16) NOT NULL,
  description VARCHAR(4000),
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS item_uoms (
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  ord INTEGER NOT NULL,
  uom VARCHAR(16) NOT NULL,
  coef NUMERIC(19,6) NOT NULL,
  notes VARCHAR(200),
  PRIMARY KEY (item_id, ord)
);

CREATE INDEX IF NOT EXISTS idx_items_deleted ON items(deleted);
CREATE INDEX IF NOT EXISTS idx_items_code_lower ON items(LOWER(code));
CREATE INDEX IF NOT EXISTS idx_items_name_lower ON items(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_items_category_lower ON items(LOWER(category_name));
CREATE INDEX IF NOT EXISTS idx_items_uom_lower ON items(LOWER(uom_base));
