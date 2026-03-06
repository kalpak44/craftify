-- Ensure one inventory record per item_id.
-- If duplicates exist, keep the most recently updated row and merge availability into it.
WITH ranked AS (
  SELECT
    id,
    item_id,
    available,
    ROW_NUMBER() OVER (
      PARTITION BY UPPER(item_id)
      ORDER BY updated_at DESC, id DESC
    ) AS rn
  FROM inventory
), merged AS (
  SELECT
    keep.id AS keep_id,
    SUM(r.available) AS total_available
  FROM ranked r
  JOIN ranked keep
    ON UPPER(keep.item_id) = UPPER(r.item_id)
   AND keep.rn = 1
  GROUP BY keep.id
)
UPDATE inventory i
SET available = m.total_available,
    updated_at = NOW()
FROM merged m
WHERE i.id = m.keep_id;

DELETE FROM inventory i
USING ranked r
WHERE i.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_inventory_item_id_upper ON inventory(UPPER(item_id));
