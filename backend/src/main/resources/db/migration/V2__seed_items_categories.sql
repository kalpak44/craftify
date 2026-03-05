INSERT INTO categories (name) VALUES
  ('Component'),
  ('Fabrication'),
  ('Hardware'),
  ('Assembly'),
  ('Finished Good'),
  ('Consumable'),
  ('Kit')
ON CONFLICT (name) DO NOTHING;

INSERT INTO items (code, name, status, category_name, uom_base, description, deleted, created_at, updated_at, version) VALUES
  ('ITM-001', 'Warm Yellow LED', 'ACTIVE', 'Component', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('ITM-002', 'Large Widget', 'ACTIVE', 'Assembly', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('ITM-003', 'Plastic Case', 'DRAFT', 'Component', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('ITM-004', 'Lion Bracket', 'HOLD', 'Hardware', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('ITM-005', 'Chain Bracket', 'ACTIVE', 'Hardware', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('ITM-006', 'Front Assembly', 'ACTIVE', 'Assembly', 'ea', NULL, FALSE, NOW(), NOW(), 0),
  ('ITM-008', 'Blue Paint (RAL5010)', 'HOLD', 'Consumable', 'L', NULL, FALSE, NOW(), NOW(), 0),
  ('ITM-010', 'Assembly Kit 10', 'DISCONTINUED', 'Kit', 'kit', NULL, FALSE, NOW(), NOW(), 0)
ON CONFLICT (code) DO NOTHING;
