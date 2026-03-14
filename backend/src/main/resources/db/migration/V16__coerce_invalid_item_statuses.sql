-- Final cleanup for any unexpected historical item statuses that still break enum hydration.
UPDATE items
SET status = CASE
  WHEN upper(trim(status)) IN ('DRAFT', 'ACTIVE', 'HOLD', 'DISCONTINUED') THEN upper(trim(status))
  WHEN lower(trim(status)) = 'draft' THEN 'DRAFT'
  WHEN lower(trim(status)) = 'active' THEN 'ACTIVE'
  WHEN lower(trim(status)) = 'hold' THEN 'HOLD'
  WHEN lower(trim(status)) = 'discontinued' THEN 'DISCONTINUED'
  ELSE 'DRAFT'
END
WHERE status IS NOT NULL;
