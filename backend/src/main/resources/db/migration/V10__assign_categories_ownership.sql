-- Introduce ownership for categories and enforce per-user uniqueness.
ALTER TABLE categories ADD COLUMN IF NOT EXISTS owner_sub VARCHAR(191);

UPDATE categories
SET owner_sub = 'auth0|65096249f1d7142df677a297'
WHERE owner_sub IS NULL OR owner_sub = '';

ALTER TABLE categories ALTER COLUMN owner_sub SET NOT NULL;

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;

CREATE INDEX IF NOT EXISTS idx_categories_owner_sub ON categories(owner_sub);
CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_owner_name_lower
  ON categories(owner_sub, LOWER(name));
