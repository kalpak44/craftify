-- Persist work-item snapshots so cancel/complete can work even if BOM changes or is deleted.
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS output_item_id VARCHAR(64);
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS output_item_name VARCHAR(200);
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS output_item_category_name VARCHAR(100);
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS output_item_uom VARCHAR(16);
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS allocated_components_json VARCHAR(20000);

UPDATE work_items
SET output_item_id = COALESCE(NULLIF(output_item_id, ''), 'UNKNOWN')
WHERE output_item_id IS NULL OR output_item_id = '';

UPDATE work_items
SET output_item_name = COALESCE(NULLIF(output_item_name, ''), output_item_id)
WHERE output_item_name IS NULL OR output_item_name = '';

UPDATE work_items
SET output_item_category_name = COALESCE(NULLIF(output_item_category_name, ''), 'Unknown')
WHERE output_item_category_name IS NULL OR output_item_category_name = '';

UPDATE work_items
SET output_item_uom = COALESCE(NULLIF(output_item_uom, ''), 'pcs')
WHERE output_item_uom IS NULL OR output_item_uom = '';

UPDATE work_items
SET allocated_components_json = COALESCE(NULLIF(allocated_components_json, ''), '[]')
WHERE allocated_components_json IS NULL OR allocated_components_json = '';

ALTER TABLE work_items ALTER COLUMN output_item_id SET NOT NULL;
ALTER TABLE work_items ALTER COLUMN output_item_name SET NOT NULL;
ALTER TABLE work_items ALTER COLUMN output_item_category_name SET NOT NULL;
ALTER TABLE work_items ALTER COLUMN output_item_uom SET NOT NULL;
ALTER TABLE work_items ALTER COLUMN allocated_components_json SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_work_items_owner_status ON work_items(owner_sub, status);
CREATE INDEX IF NOT EXISTS idx_work_items_owner_output_item_id_upper
  ON work_items(owner_sub, UPPER(output_item_id));
