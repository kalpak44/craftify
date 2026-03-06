INSERT INTO boms (id, code, product_id, product_name, revision, status, description, note, created_at, updated_at, version) VALUES
  ('00000000-0000-0000-0000-000000002001', 'BOM-001', 'ITM-001', 'Warm Yellow LED', 'v1', 'DRAFT', NULL, NULL, NOW(), NOW(), 0),
  ('00000000-0000-0000-0000-000000002002', 'BOM-002', 'ITM-006', 'Front Assembly', 'v3', 'ACTIVE', NULL, NULL, NOW(), NOW(), 0)
ON CONFLICT (code) DO NOTHING;

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 0, 'ITM-002', 2.000000, 'pcs', NULL
FROM boms b
WHERE b.code = 'BOM-001'
ON CONFLICT (bom_id, ord) DO NOTHING;

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 1, 'ITM-003', 1.000000, 'pcs', NULL
FROM boms b
WHERE b.code = 'BOM-001'
ON CONFLICT (bom_id, ord) DO NOTHING;

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 0, 'ITM-004', 4.000000, 'pcs', NULL
FROM boms b
WHERE b.code = 'BOM-002'
ON CONFLICT (bom_id, ord) DO NOTHING;

INSERT INTO bom_components (bom_id, ord, item_id, quantity, uom, note)
SELECT b.id, 1, 'ITM-005', 8.000000, 'pcs', NULL
FROM boms b
WHERE b.code = 'BOM-002'
ON CONFLICT (bom_id, ord) DO NOTHING;
