-- Normalize legacy item status values to canonical enum names expected by JPA.
UPDATE items
SET status = CASE
  WHEN lower(trim(status)) = 'draft' THEN 'DRAFT'
  WHEN lower(trim(status)) = 'active' THEN 'ACTIVE'
  WHEN lower(trim(status)) = 'hold' THEN 'HOLD'
  WHEN lower(trim(status)) = 'discontinued' THEN 'DISCONTINUED'
  ELSE status
END
WHERE status IS NOT NULL;
