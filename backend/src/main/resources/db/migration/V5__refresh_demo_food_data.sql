-- Refresh demo master data to food/recipe-oriented examples.
-- This migration updates existing seeded records by code and keeps user-created records intact.

-- Re-map seeded category names.
UPDATE categories SET name = 'Produce' WHERE id = '00000000-0000-0000-0000-000000000101';
UPDATE categories SET name = 'Dairy' WHERE id = '00000000-0000-0000-0000-000000000102';
UPDATE categories SET name = 'Bakery' WHERE id = '00000000-0000-0000-0000-000000000103';
UPDATE categories SET name = 'Pantry' WHERE id = '00000000-0000-0000-0000-000000000104';
UPDATE categories SET name = 'Protein' WHERE id = '00000000-0000-0000-0000-000000000105';
UPDATE categories SET name = 'Spices' WHERE id = '00000000-0000-0000-0000-000000000106';
UPDATE categories SET name = 'Prepared Food' WHERE id = '00000000-0000-0000-0000-000000000107';

-- Ensure food categories exist even if previous rows were removed.
INSERT INTO categories (id, name) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Produce'),
  ('00000000-0000-0000-0000-000000000102', 'Dairy'),
  ('00000000-0000-0000-0000-000000000103', 'Bakery'),
  ('00000000-0000-0000-0000-000000000104', 'Pantry'),
  ('00000000-0000-0000-0000-000000000105', 'Protein'),
  ('00000000-0000-0000-0000-000000000106', 'Spices'),
  ('00000000-0000-0000-0000-000000000107', 'Prepared Food')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Refresh seeded items to food ingredients/products.
INSERT INTO items (id, code, name, status, category_name, uom_base, description, deleted, created_at, updated_at, version) VALUES
  ('00000000-0000-0000-0000-000000001001', 'ITM-001', 'Tomato Sauce', 'ACTIVE', 'Pantry', 'kg', 'Slow-cooked tomato base sauce.', FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001002', 'ITM-002', 'Mozzarella', 'ACTIVE', 'Dairy', 'kg', 'Low-moisture mozzarella for baking.', FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001003', 'ITM-003', 'Fresh Basil', 'ACTIVE', 'Spices', 'g', 'Fresh basil leaves.', FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001004', 'ITM-004', 'Pizza Dough Ball', 'ACTIVE', 'Bakery', 'pcs', '280g fermented dough ball.', FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001005', 'ITM-005', 'Extra Virgin Olive Oil', 'ACTIVE', 'Pantry', 'L', 'Cold-pressed EVOO.', FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001006', 'ITM-006', 'Chicken Breast', 'ACTIVE', 'Protein', 'kg', 'Trimmed boneless chicken breast.', FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001008', 'ITM-008', 'Parmesan Cheese', 'ACTIVE', 'Dairy', 'kg', 'Aged grated parmesan.', FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001010', 'ITM-010', 'Dry Pasta', 'ACTIVE', 'Pantry', 'kg', 'Durum wheat dry pasta.', FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001011', 'ITM-011', 'Margherita Pizza', 'ACTIVE', 'Prepared Food', 'pcs', 'Finished Margherita pizza.', FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001012', 'ITM-012', 'Chicken Parmesan Pasta', 'ACTIVE', 'Prepared Food', 'pcs', 'Finished chicken pasta dish.', FALSE, NOW(), NOW(), 0)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  category_name = EXCLUDED.category_name,
  uom_base = EXCLUDED.uom_base,
  description = EXCLUDED.description,
  deleted = FALSE,
  updated_at = NOW();

-- Refresh BOM headers to recipe examples.
INSERT INTO boms (id, code, product_id, product_name, revision, status, description, note, created_at, updated_at, version) VALUES
  ('00000000-0000-0000-0000-000000002001', 'BOM-001', 'ITM-011', 'Margherita Pizza', 'v2', 'ACTIVE', 'Standard Margherita recipe per pizza.', NULL, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000002002', 'BOM-002', 'ITM-012', 'Chicken Parmesan Pasta', 'v2', 'ACTIVE', 'Chicken pasta recipe per plated serving.', NULL, NOW(), NOW(), 0)
ON CONFLICT (code) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  product_name = EXCLUDED.product_name,
  revision = EXCLUDED.revision,
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  note = EXCLUDED.note,
  updated_at = NOW();

-- Replace components for recipe BOMs.
DELETE FROM bom_components
WHERE bom_id IN (SELECT id FROM boms WHERE code IN ('BOM-001', 'BOM-002'));

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 0, 'ITM-004', 1.000000, 'pcs', 'One dough ball'
FROM boms b
WHERE b.code = 'BOM-001';

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 1, 'ITM-001', 0.180000, 'kg', 'Sauce per pizza'
FROM boms b
WHERE b.code = 'BOM-001';

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 2, 'ITM-002', 0.140000, 'kg', 'Mozzarella topping'
FROM boms b
WHERE b.code = 'BOM-001';

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 3, 'ITM-003', 4.000000, 'g', 'Fresh basil finish'
FROM boms b
WHERE b.code = 'BOM-001';

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 4, 'ITM-005', 0.015000, 'L', 'Olive oil drizzle'
FROM boms b
WHERE b.code = 'BOM-001';

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 0, 'ITM-010', 0.180000, 'kg', 'Dry pasta portion'
FROM boms b
WHERE b.code = 'BOM-002';

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 1, 'ITM-006', 0.200000, 'kg', 'Chicken protein portion'
FROM boms b
WHERE b.code = 'BOM-002';

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 2, 'ITM-001', 0.120000, 'kg', 'Tomato sauce base'
FROM boms b
WHERE b.code = 'BOM-002';

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 3, 'ITM-008', 0.035000, 'kg', 'Parmesan topping'
FROM boms b
WHERE b.code = 'BOM-002';

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 4, 'ITM-005', 0.010000, 'L', 'Oil for saute'
FROM boms b
WHERE b.code = 'BOM-002';
