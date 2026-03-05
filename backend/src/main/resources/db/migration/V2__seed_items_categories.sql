INSERT INTO categories (id, name) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Component'),
  ('00000000-0000-0000-0000-000000000102', 'Fabrication'),
  ('00000000-0000-0000-0000-000000000103', 'Hardware'),
  ('00000000-0000-0000-0000-000000000104', 'Assembly'),
  ('00000000-0000-0000-0000-000000000105', 'Finished Good'),
  ('00000000-0000-0000-0000-000000000106', 'Consumable'),
  ('00000000-0000-0000-0000-000000000107', 'Kit')
ON CONFLICT (name) DO NOTHING;

INSERT INTO items (id, code, name, status, category_name, uom_base, description, deleted, created_at, updated_at, version) VALUES
  ('00000000-0000-0000-0000-000000001001', 'ITM-001', 'Warm Yellow LED', 'ACTIVE', 'Component', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001002', 'ITM-002', 'Large Widget', 'ACTIVE', 'Assembly', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001003', 'ITM-003', 'Plastic Case', 'DRAFT', 'Component', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001004', 'ITM-004', 'Lion Bracket', 'HOLD', 'Hardware', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001005', 'ITM-005', 'Chain Bracket', 'ACTIVE', 'Hardware', 'pcs', NULL, FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001006', 'ITM-006', 'Front Assembly', 'ACTIVE', 'Assembly', 'ea', NULL, FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001008', 'ITM-008', 'Blue Paint (RAL5010)', 'HOLD', 'Consumable', 'L', NULL, FALSE, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000001010', 'ITM-010', 'Assembly Kit 10', 'DISCONTINUED', 'Kit', 'kit', NULL, FALSE, NOW(), NOW(), 0)
ON CONFLICT (code) DO NOTHING;
