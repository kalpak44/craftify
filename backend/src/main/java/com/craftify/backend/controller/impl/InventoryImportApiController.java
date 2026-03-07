package com.craftify.backend.controller.impl;

import com.craftify.backend.model.ImportResult;
import com.craftify.backend.model.ImportResultErrorsInner;
import com.craftify.backend.service.InventoryService;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class InventoryImportApiController {

  private static final Logger log = LoggerFactory.getLogger(InventoryImportApiController.class);

  private final InventoryService inventoryService;

  public InventoryImportApiController(InventoryService inventoryService) {
    this.inventoryService = inventoryService;
  }

  @PostMapping(
      value = "/inventory:import",
      consumes = {"multipart/form-data"},
      produces = {"application/json", "application/problem+json"})
  public ResponseEntity<ImportResult> inventoryImportPost(
      @RequestPart(value = "file", required = true) MultipartFile file,
      @RequestParam(value = "mode", required = false, defaultValue = "upsert") String mode) {
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
        "POST /inventory:import mode={} fileName={} size={}",
        mode,
        file.getOriginalFilename(),
        file.getSize());

    List<ImportResultErrorsInner> errors = new ArrayList<>();
    int created = 0;
    int updated = 0;

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
      if (!columns.containsKey("itemId")
          || !columns.containsKey("itemName")
          || !columns.containsKey("categoryName")
          || !columns.containsKey("uom")
          || !columns.containsKey("available")) {
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
                                    "Required columns: itemId (or item ref), itemName, category, uom, available"))));
      }

      String line;
      int rowNumber = 1;
      while ((line = reader.readLine()) != null) {
        rowNumber++;
        if (line.isBlank()) {
          continue;
        }

        ParsedRow row = parseRow(parseCsvLine(line), columns, rowNumber, errors);
        if (!row.valid()) {
          continue;
        }

        try {
          var before = inventoryService.getByCode(row.code());
          inventoryService.upsertFromImport(
              row.code(),
              row.itemId(),
              row.itemName(),
              row.itemCategoryName(),
              row.categoryDetached(),
              row.detachedCategoryName(),
              row.uom(),
              row.available(),
              createOnly);
          if (before == null) {
            created++;
          } else {
            updated++;
          }
        } catch (IllegalStateException ex) {
          String message =
              switch (ex.getMessage()) {
                case "create_only_conflict" -> "Inventory record already exists in create-only mode";
                default -> "Failed to import inventory row";
              };
          errors.add(
              new ImportResultErrorsInner().row(rowNumber).field("code").message(message));
        } catch (DataIntegrityViolationException ex) {
          errors.add(
              new ImportResultErrorsInner()
                  .row(rowNumber)
                  .field("code")
                  .message("Inventory code already exists"));
        } catch (RuntimeException ex) {
          log.error("Unexpected inventory import error at row {}", rowNumber, ex);
          errors.add(
              new ImportResultErrorsInner()
                  .row(rowNumber)
                  .field("row")
                  .message("Unexpected error while importing this row"));
        }
      }
    } catch (IOException e) {
      log.error("Failed to read inventory CSV import file", e);
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
    String code = pick(cells, columns.get("code"));
    String itemId = pick(cells, columns.get("itemId"));
    String itemName = pick(cells, columns.get("itemName"));
    String categoryName = pick(cells, columns.get("categoryName"));
    String itemCategoryName = pick(cells, columns.get("itemCategoryName"));
    String detachedCategoryName = pick(cells, columns.get("detachedCategoryName"));
    String detachedRaw = pick(cells, columns.get("categoryDetached"));
    String uom = pick(cells, columns.get("uom"));
    String availableRaw = pick(cells, columns.get("available"));

    boolean categoryDetached = parseBoolean(detachedRaw);
    BigDecimal available = parseDecimal(availableRaw);

    boolean ok = true;
    if (itemId == null || itemId.isBlank()) {
      errors.add(new ImportResultErrorsInner().row(rowNumber).field("itemId").message("Item Ref is required"));
      ok = false;
    }
    if (itemName == null || itemName.isBlank()) {
      errors.add(
          new ImportResultErrorsInner().row(rowNumber).field("itemName").message("Item Name is required"));
      ok = false;
    }
    String effectiveItemCategory =
        (itemCategoryName == null || itemCategoryName.isBlank()) ? categoryName : itemCategoryName;
    if (effectiveItemCategory == null || effectiveItemCategory.isBlank()) {
      errors.add(
          new ImportResultErrorsInner().row(rowNumber).field("categoryName").message("Category is required"));
      ok = false;
    }
    if (uom == null || uom.isBlank()) {
      errors.add(new ImportResultErrorsInner().row(rowNumber).field("uom").message("UoM is required"));
      ok = false;
    }
    if (available == null) {
      errors.add(
          new ImportResultErrorsInner()
              .row(rowNumber)
              .field("available")
              .message("Available must be a valid number"));
      ok = false;
    }

    if (!ok) {
      return new ParsedRow(false, null, null, null, null, false, null, null, null);
    }

    return new ParsedRow(
        true,
        code == null ? null : code.trim(),
        itemId.trim(),
        itemName.trim(),
        effectiveItemCategory.trim(),
        categoryDetached,
        detachedCategoryName == null ? null : detachedCategoryName.trim(),
        uom.trim(),
        available);
  }

  private static Map<String, Integer> mapColumns(List<String> headers) {
    Map<String, Integer> out = new HashMap<>();
    for (int i = 0; i < headers.size(); i++) {
      String key = normalizeHeader(headers.get(i));
      switch (key) {
        case "code", "id", "inventorycode" -> out.put("code", i);
        case "itemref", "itemid", "item_id", "itemcode" -> out.put("itemId", i);
        case "itemname", "name" -> out.put("itemName", i);
        case "category", "categoryname" -> out.put("categoryName", i);
        case "itemcategory", "itemcategoryname", "item_category_name" -> out.put("itemCategoryName", i);
        case "categorydetached", "detached", "isdetached" -> out.put("categoryDetached", i);
        case "detachedcategory", "detachedcategoryname", "detached_category_name" ->
            out.put("detachedCategoryName", i);
        case "uom" -> out.put("uom", i);
        case "available", "qty", "quantity" -> out.put("available", i);
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

  private static String stripBom(String s) {
    return s != null && s.startsWith("\uFEFF") ? s.substring(1) : s;
  }

  private static String pick(List<String> cells, Integer idx) {
    if (idx == null || idx < 0 || idx >= cells.size()) return null;
    String v = cells.get(idx);
    return v == null ? null : v.trim();
  }

  private static boolean parseBoolean(String raw) {
    if (raw == null || raw.isBlank()) return false;
    String v = raw.trim().toLowerCase(Locale.ROOT);
    return "true".equals(v) || "1".equals(v) || "yes".equals(v) || "y".equals(v);
  }

  private static BigDecimal parseDecimal(String raw) {
    if (raw == null || raw.isBlank()) return null;
    try {
      return new BigDecimal(raw.trim());
    } catch (NumberFormatException ex) {
      return null;
    }
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
      String code,
      String itemId,
      String itemName,
      String itemCategoryName,
      boolean categoryDetached,
      String detachedCategoryName,
      String uom,
      BigDecimal available) {}
}
