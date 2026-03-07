-- Make business codes owner-scoped instead of globally unique.
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_code_key;
ALTER TABLE boms DROP CONSTRAINT IF EXISTS boms_code_key;
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_code_key;
ALTER TABLE work_items DROP CONSTRAINT IF EXISTS work_items_code_key;

DROP INDEX IF EXISTS ux_inventory_item_id_upper;

CREATE UNIQUE INDEX IF NOT EXISTS ux_items_owner_code_upper
  ON items(owner_sub, UPPER(code));

CREATE UNIQUE INDEX IF NOT EXISTS ux_boms_owner_code_upper
  ON boms(owner_sub, UPPER(code));

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_owner_code_upper
  ON inventory(owner_sub, UPPER(code));

CREATE UNIQUE INDEX IF NOT EXISTS ux_work_items_owner_code_upper
  ON work_items(owner_sub, UPPER(code));

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_owner_item_id_upper
  ON inventory(owner_sub, UPPER(item_id));
