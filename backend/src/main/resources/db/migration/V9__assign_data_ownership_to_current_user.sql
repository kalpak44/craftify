-- Introduce row ownership for core business entities and backfill existing data.
ALTER TABLE items ADD COLUMN IF NOT EXISTS owner_sub VARCHAR(191);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS owner_sub VARCHAR(191);
ALTER TABLE boms ADD COLUMN IF NOT EXISTS owner_sub VARCHAR(191);
ALTER TABLE work_items ADD COLUMN IF NOT EXISTS owner_sub VARCHAR(191);

-- Assign all existing records to the current Auth0 subject.
UPDATE items
SET owner_sub = 'auth0|65096249f1d7142df677a297'
WHERE owner_sub IS NULL OR owner_sub = '';

UPDATE inventory
SET owner_sub = 'auth0|65096249f1d7142df677a297'
WHERE owner_sub IS NULL OR owner_sub = '';

UPDATE boms
SET owner_sub = 'auth0|65096249f1d7142df677a297'
WHERE owner_sub IS NULL OR owner_sub = '';

UPDATE work_items
SET owner_sub = 'auth0|65096249f1d7142df677a297'
WHERE owner_sub IS NULL OR owner_sub = '';

ALTER TABLE items ALTER COLUMN owner_sub SET NOT NULL;
ALTER TABLE inventory ALTER COLUMN owner_sub SET NOT NULL;
ALTER TABLE boms ALTER COLUMN owner_sub SET NOT NULL;
ALTER TABLE work_items ALTER COLUMN owner_sub SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_items_owner_sub ON items(owner_sub);
CREATE INDEX IF NOT EXISTS idx_inventory_owner_sub ON inventory(owner_sub);
CREATE INDEX IF NOT EXISTS idx_boms_owner_sub ON boms(owner_sub);
CREATE INDEX IF NOT EXISTS idx_work_items_owner_sub ON work_items(owner_sub);
