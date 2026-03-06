CREATE TABLE IF NOT EXISTS boms (
  id UUID PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(200),
  revision VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  description VARCHAR(4000),
  note VARCHAR(4000),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bom_components (
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  ord INTEGER NOT NULL,
  item_id VARCHAR(64) NOT NULL,
  quantity NUMERIC(19,6) NOT NULL,
  uom VARCHAR(16) NOT NULL,
  note VARCHAR(4000),
  PRIMARY KEY (bom_id, ord)
);

CREATE INDEX IF NOT EXISTS idx_boms_code_lower ON boms(LOWER(code));
CREATE INDEX IF NOT EXISTS idx_boms_product_id_lower ON boms(LOWER(product_id));
CREATE INDEX IF NOT EXISTS idx_boms_product_name_lower ON boms(LOWER(product_name));
CREATE INDEX IF NOT EXISTS idx_boms_updated_at ON boms(updated_at);
