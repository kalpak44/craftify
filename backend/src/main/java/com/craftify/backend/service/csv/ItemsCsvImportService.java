package com.craftify.backend.service.csv;

import com.craftify.backend.error.ApiException;
import com.craftify.backend.model.ImportResult;
import com.craftify.backend.model.ImportResultErrorsInner;
import com.craftify.backend.model.ItemUom;
import com.craftify.backend.model.Status;
import com.craftify.backend.service.ItemService;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ItemsCsvImportService {

  private static final Logger log = LoggerFactory.getLogger(ItemsCsvImportService.class);

  private final ItemService itemService;

  public ItemsCsvImportService(ItemService itemService) {
    this.itemService = itemService;
  }

  public CsvImportExecution importCsv(MultipartFile file, String mode) {
    if (file == null || file.isEmpty()) {
      return badRequest(error("file", "CSV file is required"));
    }

    boolean createOnly = "create-only".equalsIgnoreCase(mode);
    boolean upsert = mode == null || mode.isBlank() || "upsert".equalsIgnoreCase(mode);
    if (!createOnly && !upsert) {
      return badRequest(error("mode", "Mode must be 'upsert' or 'create-only'"));
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
            new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
        CSVParser parser = CSVFormat.DEFAULT.parse(reader)) {
      Iterator<CSVRecord> records = parser.iterator();
      if (!records.hasNext()) {
        return badRequest(error("file", "CSV header row is missing"));
      }

      List<String> headers = toCells(records.next());
      if (!headers.isEmpty()) {
        headers.set(0, stripBom(headers.getFirst()));
      }
      Map<String, Integer> columns = mapColumns(headers);

      if (!columns.containsKey("name")
          || !columns.containsKey("status")
          || !columns.containsKey("categoryName")
          || !columns.containsKey("uomBase")) {
        return badRequest(error("header", "Required columns: name, status, category (or categoryName), uom (or uomBase)"));
      }

      int rowNumber = 1;
      while (records.hasNext()) {
        CSVRecord record = records.next();
        rowNumber++;
        if (isBlankRecord(record)) {
          continue;
        }

        ParsedRow parsed = parseRow(toCells(record), columns, rowNumber, errors);
        if (!parsed.valid()) {
          continue;
        }

        try {
          var before = itemService.getByCode(parsed.code());
          itemService.upsertFromImport(
              parsed.code(),
              parsed.name(),
              parsed.status(),
              parsed.categoryName(),
              parsed.uomBase(),
              parsed.description(),
              parsed.uoms(),
              createOnly);
          if (before == null) {
            created++;
          } else {
            updated++;
          }
        } catch (ApiException ex) {
          String message =
              switch (ex.getErrorCode()) {
                case "create_only_conflict" -> "Item already exists in create-only mode";
                case "code_conflict" -> "Item code already exists";
                default -> "Failed to import item: " + ex.getErrorCode();
              };
          errors.add(error(rowNumber, "code", message));
        } catch (DataIntegrityViolationException ex) {
          errors.add(error(rowNumber, "code", "Item code already exists"));
        } catch (RuntimeException ex) {
          log.error("Unexpected import error at row {}", rowNumber, ex);
          errors.add(error(rowNumber, "row", "Unexpected error while importing this row"));
        }
      }
    } catch (IOException e) {
      log.error("Failed to read CSV import file", e);
      return badRequest(error("file", "Failed to read CSV file"));
    }

    return new CsvImportExecution(
        HttpStatus.OK, new ImportResult().created(created).updated(updated).errors(errors));
  }

  private static ParsedRow parseRow(
      List<String> cells, Map<String, Integer> columns, int rowNumber, List<ImportResultErrorsInner> errors) {
    String code = pick(cells, columns.get("code"));
    String name = pick(cells, columns.get("name"));
    String statusRaw = pick(cells, columns.get("status"));
    String categoryName = pick(cells, columns.get("categoryName"));
    String uomBase = pick(cells, columns.get("uomBase"));
    String description = pick(cells, columns.get("description"));
    String additionalUnitsRaw = pick(cells, columns.get("additionalUnits"));
    List<ItemUom> uoms = parseAdditionalUnits(additionalUnitsRaw, rowNumber, errors);

    boolean ok = true;
    if (name == null || name.isBlank()) {
      errors.add(error(rowNumber, "name", "Name is required"));
      ok = false;
    }
    if (categoryName == null || categoryName.isBlank()) {
      errors.add(error(rowNumber, "categoryName", "Category is required"));
      ok = false;
    }
    if (uomBase == null || uomBase.isBlank()) {
      errors.add(error(rowNumber, "uomBase", "UoM is required"));
      ok = false;
    }

    Status status = parseStatus(statusRaw);
    if (status == null) {
      errors.add(error(rowNumber, "status", "Status must be one of: Draft, Active, Hold, Discontinued"));
      ok = false;
    }
    if (additionalUnitsRaw != null && uoms == null) {
      ok = false;
    }

    if (!ok) {
      return new ParsedRow(false, null, null, null, null, null, null, null);
    }

    return new ParsedRow(
        true,
        code == null ? null : code.trim(),
        name.trim(),
        status,
        categoryName.trim(),
        uomBase.trim(),
        description == null ? null : description.trim(),
        uoms);
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
        case "additionalunits", "additional_units", "additionaluoms", "additional_uoms", "uoms", "extraunits", "extra_units" ->
            out.put("additionalUnits", i);
        case "description", "desc" -> out.put("description", i);
        default -> {
        }
      }
    }
    return out;
  }

  private static String normalizeHeader(String h) {
    if (h == null) return "";
    return h.trim().toLowerCase(Locale.ROOT).replace(" ", "").replace("-", "_");
  }

  private static List<String> toCells(CSVRecord record) {
    List<String> out = new ArrayList<>();
    if (record == null) {
      return out;
    }
    record.forEach(out::add);
    return out;
  }

  private static boolean isBlankRecord(CSVRecord record) {
    if (record == null || record.size() == 0) {
      return true;
    }
    for (String value : record) {
      if (value != null && !value.isBlank()) {
        return false;
      }
    }
    return true;
  }

  private static List<ItemUom> parseAdditionalUnits(
      String raw, int rowNumber, List<ImportResultErrorsInner> errors) {
    if (raw == null) {
      return null;
    }
    if (raw.isBlank()) {
      return List.of();
    }

    List<ItemUom> out = new ArrayList<>();
    List<String> entries = splitEscaped(raw, ';');
    for (int i = 0; i < entries.size(); i++) {
      String entry = entries.get(i).trim();
      if (entry.isBlank()) {
        continue;
      }
      List<String> parts = splitEscaped(entry, '|');
      if (parts.size() < 2) {
        errors.add(error(rowNumber, "additionalUnits", "Invalid additional unit format at entry " + (i + 1) + ". Expected: uom|coef|notes"));
        return null;
      }

      String uom = unescapeAdditionalUnitsPart(parts.getFirst()).trim();
      String coefRaw = unescapeAdditionalUnitsPart(parts.get(1)).trim();
      String notes =
          parts.size() > 2
              ? unescapeAdditionalUnitsPart(String.join("|", parts.subList(2, parts.size()))).trim()
              : null;
      if (uom.isBlank() || coefRaw.isBlank()) {
        errors.add(error(rowNumber, "additionalUnits", "Additional unit must include both uom and coef"));
        return null;
      }

      BigDecimal coef;
      try {
        coef = new BigDecimal(coefRaw);
      } catch (NumberFormatException ex) {
        errors.add(error(rowNumber, "additionalUnits", "Invalid coefficient for additional unit '" + uom + "'"));
        return null;
      }

      out.add(new ItemUom().uom(uom).coef(coef).notes(notes));
    }
    return out;
  }

  private static List<String> splitEscaped(String value, char delimiter) {
    List<String> out = new ArrayList<>();
    StringBuilder cur = new StringBuilder();
    boolean escaped = false;
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      if (escaped) {
        cur.append(ch);
        escaped = false;
      } else if (ch == '\\') {
        escaped = true;
      } else if (ch == delimiter) {
        out.add(cur.toString());
        cur.setLength(0);
      } else {
        cur.append(ch);
      }
    }
    if (escaped) {
      cur.append('\\');
    }
    out.add(cur.toString());
    return out;
  }

  private static String unescapeAdditionalUnitsPart(String value) {
    if (value == null || value.isEmpty()) {
      return value;
    }
    StringBuilder out = new StringBuilder();
    boolean escaped = false;
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      if (escaped) {
        out.append(ch);
        escaped = false;
      } else if (ch == '\\') {
        escaped = true;
      } else {
        out.append(ch);
      }
    }
    if (escaped) {
      out.append('\\');
    }
    return out.toString();
  }

  private static CsvImportExecution badRequest(ImportResultErrorsInner error) {
    return new CsvImportExecution(
        HttpStatus.BAD_REQUEST, new ImportResult().created(0).updated(0).errors(List.of(error)));
  }

  private static ImportResultErrorsInner error(String field, String message) {
    return error(1, field, message);
  }

  private static ImportResultErrorsInner error(int row, String field, String message) {
    return new ImportResultErrorsInner().row(row).field(field).message(message);
  }

  private record ParsedRow(
      boolean valid,
      String code,
      String name,
      Status status,
      String categoryName,
      String uomBase,
      String description,
      List<ItemUom> uoms) {}
}
