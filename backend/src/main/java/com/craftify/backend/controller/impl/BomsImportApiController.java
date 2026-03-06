package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.BomsImportApi;
import com.craftify.backend.model.BomComponent;
import com.craftify.backend.model.BomStatus;
import com.craftify.backend.model.ImportResult;
import com.craftify.backend.model.ImportResultErrorsInner;
import com.craftify.backend.service.BomService;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class BomsImportApiController implements BomsImportApi {

  private static final Logger log = LoggerFactory.getLogger(BomsImportApiController.class);

  private final BomService bomService;

  public BomsImportApiController(BomService bomService) {
    this.bomService = bomService;
  }

  @Override
  public ResponseEntity<ImportResult> bomsImportPost(MultipartFile file, String mode) {
    if (file == null || file.isEmpty()) {
      return ResponseEntity.badRequest()
          .body(
              new ImportResult()
                  .created(0)
                  .updated(0)
                  .errors(
                      List.of(
                          new ImportResultErrorsInner()
                              .row(1)
                              .field("file")
                              .message("CSV file is required"))));
    }

    boolean createOnly = "create-only".equalsIgnoreCase(mode);
    boolean upsert = mode == null || mode.isBlank() || "upsert".equalsIgnoreCase(mode);
    if (!createOnly && !upsert) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(
              new ImportResult()
                  .created(0)
                  .updated(0)
                  .errors(
                      List.of(
                          new ImportResultErrorsInner()
                              .row(1)
                              .field("mode")
                              .message("Mode must be 'upsert' or 'create-only'"))));
    }

    log.info(
        "POST /boms:import mode={} fileName={} size={}",
        mode,
        file.getOriginalFilename(),
        file.getSize());

    List<ImportResultErrorsInner> errors = new ArrayList<>();
    int created = 0;
    int updated = 0;
    Map<String, GroupedBom> grouped = new HashMap<>();

    try (BufferedReader reader =
        new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
      String headerLine = reader.readLine();
      if (headerLine == null || headerLine.isBlank()) {
        return ResponseEntity.badRequest()
            .body(
                new ImportResult()
                    .created(0)
                    .updated(0)
                    .errors(
                        List.of(
                            new ImportResultErrorsInner()
                                .row(1)
                                .field("file")
                                .message("CSV header row is missing"))));
      }

      List<String> headers = parseCsvLine(stripBom(headerLine));
      Map<String, Integer> columns = mapColumns(headers);

      if (!columns.containsKey("bomId")
          || !columns.containsKey("productId")
          || !columns.containsKey("revision")
          || !columns.containsKey("status")) {
        return ResponseEntity.badRequest()
            .body(
                new ImportResult()
                    .created(0)
                    .updated(0)
                    .errors(
                        List.of(
                            new ImportResultErrorsInner()
                                .row(1)
                                .field("header")
                                .message(
                                    "Required columns: bomId, productId, revision, status"))));
      }

      String line;
      int rowNumber = 1;
      while ((line = reader.readLine()) != null) {
        rowNumber++;
        if (line.isBlank()) {
          continue;
        }
        ParsedRow row = parseRow(parseCsvLine(line), columns, rowNumber, errors);
        if (!row.valid) {
          continue;
        }
        final int currentRowNumber = rowNumber;

        GroupedBom gb =
            grouped.computeIfAbsent(row.bomId, k -> new GroupedBom(row, currentRowNumber));
        gb.mergeHeader(row, currentRowNumber, errors);
        gb.addComponent(row.componentOrder, row.componentItemId, row.componentQuantity, row.componentUom, row.componentNote);
      }

      for (GroupedBom gb : grouped.values()) {
        List<ComponentLine> sorted =
            gb.components.stream()
                .sorted(Comparator.comparingInt(ComponentLine::order))
                .toList();
        List<BomComponent> components =
            sorted.stream()
                .map(
                    c ->
                        new BomComponent()
                            .itemId(c.itemId())
                            .quantity(c.quantity())
                            .uom(c.uom())
                            .note(c.note()))
                .toList();

        try {
          var before = bomService.getByCode(gb.bomId);
          bomService.upsertFromImport(
              gb.bomId,
              gb.productId,
              gb.productName,
              gb.revision,
              gb.status,
              gb.description,
              gb.note,
              components,
              createOnly);
          if (before == null) {
            created++;
          } else {
            updated++;
          }
        } catch (IllegalStateException ex) {
          errors.add(
              new ImportResultErrorsInner()
                  .row(gb.firstRow)
                  .field("bomId")
                  .message("BOM already exists in create-only mode"));
        }
      }
    } catch (IOException e) {
      log.error("Failed to read BOM CSV import file", e);
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(
              new ImportResult()
                  .created(0)
                  .updated(0)
                  .errors(
                      List.of(
                          new ImportResultErrorsInner()
                              .row(1)
                              .field("file")
                              .message("Failed to read CSV file"))));
    }

    return ResponseEntity.ok(new ImportResult().created(created).updated(updated).errors(errors));
  }

  private static ParsedRow parseRow(
      List<String> cells,
      Map<String, Integer> columns,
      int rowNumber,
      List<ImportResultErrorsInner> errors) {
    String bomId = pick(cells, columns.get("bomId"));
    String productId = pick(cells, columns.get("productId"));
    String productName = pick(cells, columns.get("productName"));
    String revision = pick(cells, columns.get("revision"));
    String statusRaw = pick(cells, columns.get("status"));
    String description = pick(cells, columns.get("description"));
    String note = pick(cells, columns.get("note"));
    String compOrderRaw = pick(cells, columns.get("componentOrder"));
    String compItemId = pick(cells, columns.get("componentItemId"));
    String compQtyRaw = pick(cells, columns.get("componentQuantity"));
    String compUom = pick(cells, columns.get("componentUom"));
    String compNote = pick(cells, columns.get("componentNote"));

    boolean ok = true;
    if (bomId == null || bomId.isBlank()) {
      errors.add(
          new ImportResultErrorsInner().row(rowNumber).field("bomId").message("BOM ID is required"));
      ok = false;
    }
    if (productId == null || productId.isBlank()) {
      errors.add(
          new ImportResultErrorsInner()
              .row(rowNumber)
              .field("productId")
              .message("Product ID is required"));
      ok = false;
    }
    if (revision == null || revision.isBlank()) {
      errors.add(
          new ImportResultErrorsInner()
              .row(rowNumber)
              .field("revision")
              .message("Revision is required"));
      ok = false;
    }

    BomStatus status = parseStatus(statusRaw);
    if (status == null) {
      errors.add(
          new ImportResultErrorsInner()
              .row(rowNumber)
              .field("status")
              .message("Status must be one of: Draft, Active, Hold, Obsolite"));
      ok = false;
    }

    Integer compOrder = null;
    Double compQty = null;
    if (compOrderRaw != null && !compOrderRaw.isBlank()) {
      try {
        compOrder = Integer.parseInt(compOrderRaw.trim());
      } catch (NumberFormatException ex) {
        errors.add(
            new ImportResultErrorsInner()
                .row(rowNumber)
                .field("componentOrder")
                .message("Component order must be integer"));
        ok = false;
      }
    }
    if (compQtyRaw != null && !compQtyRaw.isBlank()) {
      try {
        compQty = Double.parseDouble(compQtyRaw.trim());
      } catch (NumberFormatException ex) {
        errors.add(
            new ImportResultErrorsInner()
                .row(rowNumber)
                .field("componentQuantity")
                .message("Component quantity must be numeric"));
        ok = false;
      }
    }

    boolean hasAnyComp =
        (compItemId != null && !compItemId.isBlank())
            || compQty != null
            || (compUom != null && !compUom.isBlank());
    if (hasAnyComp) {
      if (compItemId == null || compItemId.isBlank()) {
        errors.add(
            new ImportResultErrorsInner()
                .row(rowNumber)
                .field("componentItemId")
                .message("Component item ID is required when component is present"));
        ok = false;
      }
      if (compQty == null || compQty <= 0) {
        errors.add(
            new ImportResultErrorsInner()
                .row(rowNumber)
                .field("componentQuantity")
                .message("Component quantity must be > 0"));
        ok = false;
      }
      if (compUom == null || compUom.isBlank()) {
        errors.add(
            new ImportResultErrorsInner()
                .row(rowNumber)
                .field("componentUom")
                .message("Component UoM is required"));
        ok = false;
      }
      if (compOrder == null) {
        compOrder = Integer.MAX_VALUE;
      }
    }

    if (!ok) {
      return new ParsedRow(
          false, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    return new ParsedRow(
        true,
        bomId.trim().toUpperCase(Locale.ROOT),
        productId.trim().toUpperCase(Locale.ROOT),
        productName == null ? null : productName.trim(),
        revision.trim(),
        status,
        description == null ? null : description.trim(),
        note == null ? null : note.trim(),
        compOrder,
        compItemId == null ? null : compItemId.trim().toUpperCase(Locale.ROOT),
        compQty,
        compUom == null ? null : compUom.trim(),
        compNote == null ? null : compNote.trim());
  }

  private static BomStatus parseStatus(String raw) {
    if (raw == null || raw.isBlank()) return null;
    try {
      return BomStatus.fromValue(raw);
    } catch (IllegalArgumentException ex) {
      String norm = raw.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
      if ("OBSOLETE".equals(norm)) {
        norm = "OBSOLITE";
      }
      try {
        return BomStatus.valueOf(norm);
      } catch (IllegalArgumentException e2) {
        return null;
      }
    }
  }

  private static String stripBom(String s) {
    return s != null && s.startsWith("\uFEFF") ? s.substring(1) : s;
  }

  private static String pick(List<String> cells, Integer idx) {
    if (idx == null || idx < 0 || idx >= cells.size()) return null;
    String v = cells.get(idx);
    return v == null ? null : v.trim();
  }

  private static Map<String, Integer> mapColumns(List<String> headers) {
    Map<String, Integer> out = new HashMap<>();
    for (int i = 0; i < headers.size(); i++) {
      String key = normalizeHeader(headers.get(i));
      switch (key) {
        case "bomid", "bom_id", "id" -> out.put("bomId", i);
        case "productid", "product_id", "itemid" -> out.put("productId", i);
        case "productname", "product_name" -> out.put("productName", i);
        case "revision", "rev" -> out.put("revision", i);
        case "status" -> out.put("status", i);
        case "description", "desc" -> out.put("description", i);
        case "note", "bomnote", "bom_note" -> out.put("note", i);
        case "componentorder", "component_order", "line", "lineorder" -> out.put("componentOrder", i);
        case "componentitemid", "component_item_id", "itemcode", "component" -> out.put("componentItemId", i);
        case "componentquantity", "component_qty", "qty", "quantity" -> out.put("componentQuantity", i);
        case "componentuom", "component_uom", "uom" -> out.put("componentUom", i);
        case "componentnote", "component_note", "linenote", "line_note" -> out.put("componentNote", i);
        default -> {
          // ignore unknown columns
        }
      }
    }
    return out;
  }

  private static String normalizeHeader(String h) {
    if (h == null) return "";
    return h.trim().toLowerCase(Locale.ROOT).replace(" ", "").replace("-", "_");
  }

  private static List<String> parseCsvLine(String line) {
    List<String> out = new ArrayList<>();
    if (line == null) return out;
    StringBuilder cur = new StringBuilder();
    boolean inQuotes = false;
    for (int i = 0; i < line.length(); i++) {
      char ch = line.charAt(i);
      if (ch == '"') {
        if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
          cur.append('"');
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch == ',' && !inQuotes) {
        out.add(cur.toString());
        cur.setLength(0);
      } else {
        cur.append(ch);
      }
    }
    out.add(cur.toString());
    return out;
  }

  private record ParsedRow(
      boolean valid,
      String bomId,
      String productId,
      String productName,
      String revision,
      BomStatus status,
      String description,
      String note,
      Integer componentOrder,
      String componentItemId,
      Double componentQuantity,
      String componentUom,
      String componentNote) {}

  private record ComponentLine(int order, String itemId, Double quantity, String uom, String note) {}

  private static final class GroupedBom {
    private final String bomId;
    private final int firstRow;
    private String productId;
    private String productName;
    private String revision;
    private BomStatus status;
    private String description;
    private String note;
    private final List<ComponentLine> components = new ArrayList<>();

    private GroupedBom(ParsedRow row, int rowNumber) {
      this.bomId = row.bomId;
      this.firstRow = rowNumber;
      this.productId = row.productId;
      this.productName = row.productName;
      this.revision = row.revision;
      this.status = row.status;
      this.description = row.description;
      this.note = row.note;
    }

    private void mergeHeader(ParsedRow row, int rowNumber, List<ImportResultErrorsInner> errors) {
      if (!eq(this.productId, row.productId)
          || !eq(this.productName, row.productName)
          || !eq(this.revision, row.revision)
          || this.status != row.status
          || !eq(this.description, row.description)
          || !eq(this.note, row.note)) {
        errors.add(
            new ImportResultErrorsInner()
                .row(rowNumber)
                .field("bomId")
                .message("Conflicting BOM header values for same BOM ID"));
      }
    }

    private void addComponent(Integer order, String itemId, Double qty, String uom, String note) {
      boolean hasAny = (itemId != null && !itemId.isBlank()) || qty != null || (uom != null && !uom.isBlank());
      if (!hasAny) {
        return;
      }
      components.add(new ComponentLine(order == null ? Integer.MAX_VALUE : order, itemId, qty, uom, note));
    }

    private static boolean eq(Object a, Object b) {
      return (a == null && b == null) || (a != null && a.equals(b));
    }
  }
}
