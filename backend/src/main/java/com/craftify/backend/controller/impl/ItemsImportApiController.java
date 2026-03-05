package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.ItemsImportApi;
import com.craftify.backend.model.ImportResult;
import com.craftify.backend.model.ImportResultErrorsInner;
import com.craftify.backend.model.Status;
import com.craftify.backend.service.ItemService;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
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
public class ItemsImportApiController implements ItemsImportApi {

  private static final Logger log = LoggerFactory.getLogger(ItemsImportApiController.class);

  private final ItemService itemService;

  public ItemsImportApiController(ItemService itemService) {
    this.itemService = itemService;
  }

  @Override
  public ResponseEntity<ImportResult> itemsImportPost(MultipartFile file, String mode) {
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
        "POST /items:import mode={} fileName={} size={}",
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

      if (!columns.containsKey("name")
          || !columns.containsKey("status")
          || !columns.containsKey("categoryName")
          || !columns.containsKey("uomBase")) {
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
                                    "Required columns: name, status, category (or categoryName), uom (or uomBase)"))));
      }

      String line;
      int rowNumber = 1;
      while ((line = reader.readLine()) != null) {
        rowNumber++;
        if (line.isBlank()) {
          continue;
        }

        List<String> cells = parseCsvLine(line);
        ParsedRow parsed = parseRow(cells, columns, rowNumber, errors);
        if (!parsed.valid()) {
          continue;
        }

        try {
          var before = itemService.getByCodeIncludingDeleted(parsed.code());
          itemService.upsertFromImport(
              parsed.code(),
              parsed.name(),
              parsed.status(),
              parsed.categoryName(),
              parsed.uomBase(),
              parsed.description(),
              createOnly);
          if (before == null) {
            created++;
          } else {
            updated++;
          }
        } catch (IllegalStateException ex) {
          errors.add(
              new ImportResultErrorsInner()
                  .row(rowNumber)
                  .field("code")
                  .message("Item already exists in create-only mode"));
        }
      }
    } catch (IOException e) {
      log.error("Failed to read CSV import file", e);
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
    String name = pick(cells, columns.get("name"));
    String statusRaw = pick(cells, columns.get("status"));
    String categoryName = pick(cells, columns.get("categoryName"));
    String uomBase = pick(cells, columns.get("uomBase"));
    String description = pick(cells, columns.get("description"));

    boolean ok = true;
    if (name == null || name.isBlank()) {
      errors.add(
          new ImportResultErrorsInner().row(rowNumber).field("name").message("Name is required"));
      ok = false;
    }
    if (categoryName == null || categoryName.isBlank()) {
      errors.add(
          new ImportResultErrorsInner()
              .row(rowNumber)
              .field("categoryName")
              .message("Category is required"));
      ok = false;
    }
    if (uomBase == null || uomBase.isBlank()) {
      errors.add(
          new ImportResultErrorsInner().row(rowNumber).field("uomBase").message("UoM is required"));
      ok = false;
    }

    Status status = parseStatus(statusRaw);
    if (status == null) {
      errors.add(
          new ImportResultErrorsInner()
              .row(rowNumber)
              .field("status")
              .message("Status must be one of: Draft, Active, Hold, Discontinued"));
      ok = false;
    }

    if (!ok) {
      return new ParsedRow(false, null, null, null, null, null, null);
    }

    return new ParsedRow(
        true,
        code == null ? null : code.trim(),
        name.trim(),
        status,
        categoryName.trim(),
        uomBase.trim(),
        description == null ? null : description.trim());
  }

  private static Status parseStatus(String raw) {
    if (raw == null || raw.isBlank()) return null;
    String v = raw.trim();
    try {
      return Status.fromValue(v);
    } catch (IllegalArgumentException ex) {
      String norm = v.toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
      for (Status s : Status.values()) {
        if (s.name().equals(norm)) {
          return s;
        }
      }
      return null;
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
        case "code", "id", "itemid", "item_code" -> out.put("code", i);
        case "name", "productname", "itemname", "item" -> out.put("name", i);
        case "status" -> out.put("status", i);
        case "category", "categoryname", "category_name" -> out.put("categoryName", i);
        case "uom", "uombase", "uom_base" -> out.put("uomBase", i);
        case "description", "desc" -> out.put("description", i);
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
      String code,
      String name,
      Status status,
      String categoryName,
      String uomBase,
      String description) {}
}
