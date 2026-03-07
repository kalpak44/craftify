-- Switch items deletion from soft-delete to hard-delete.
-- Clean up legacy soft-deleted rows first so old hidden records do not block imports.
DELETE FROM items WHERE deleted = TRUE;

DROP INDEX IF EXISTS idx_items_deleted;
ALTER TABLE items DROP COLUMN IF EXISTS deleted;
