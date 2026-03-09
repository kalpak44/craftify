package com.craftify.backend.service.csv;

import com.craftify.backend.error.ApiException;
import com.craftify.backend.model.ItemDetail;
import com.craftify.backend.model.ItemUom;
import com.craftify.backend.model.Status;
import com.craftify.backend.service.ItemService;
import com.craftify.backend.utils.TempFileResource;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ItemsCsvExportService {

  private static final Logger log = LoggerFactory.getLogger(ItemsCsvExportService.class);

  private final ItemService itemService;

  public ItemsCsvExportService(ItemService itemService) {
    this.itemService = itemService;
  }

  public CsvExportPayload export(
      String q, Status status, UUID categoryId, String categoryName, String uom, String ids) {
    List<String> codes =
        (ids == null || ids.isBlank())
            ? List.of()
            : Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(s -> s.toUpperCase(Locale.ROOT))
                .toList();

    log.info(
        "GET /items:export q={} status={} categoryId={} categoryName={} uom={} codes={}",
        q,
        status,
        categoryId,
        categoryName,
        uom,
        codes.size());

    List<ItemDetail> rows = itemService.listForExport(q, status, categoryName, uom, codes);
    String filename = "items_" + LocalDate.now() + ".csv";
    return new CsvExportPayload(writeCsv(rows, filename), filename);
  }

  private TempFileResource writeCsv(List<ItemDetail> rows, String filename) {
    Path tempFile;
    try {
      tempFile = Files.createTempFile("items-export-", ".csv");
    } catch (IOException ex) {
      throw ApiException.internalServerError("failed_to_generate_csv");
    }

    try (BufferedOutputStream outputStream = new BufferedOutputStream(Files.newOutputStream(tempFile))) {
      outputStream.write(new byte[] {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
    } catch (IOException ex) {
      deleteQuietly(tempFile);
      throw ApiException.internalServerError("failed_to_generate_csv");
    }

    try (CSVPrinter printer =
        new CSVPrinter(
            new OutputStreamWriter(
                new BufferedOutputStream(Files.newOutputStream(tempFile, StandardOpenOption.APPEND)),
                StandardCharsets.UTF_8),
            CSVFormat.DEFAULT.builder()
                .setHeader(
                    "Id",
                    "Code",
                    "Name",
                    "Status",
                    "Category",
                    "UoM Base",
                    "Description",
                    "Additional Units Count",
                    "Additional Units",
                    "Created At",
                    "Updated At",
                    "Version")
                .build())) {
      for (ItemDetail d : rows) {
        printer.printRecord(
            d.getId(),
            d.getCode(),
            d.getName(),
            d.getStatus() == null ? "" : d.getStatus().getValue(),
            d.getCategoryName(),
            d.getUomBase(),
            d.getDescription(),
            String.valueOf(Objects.requireNonNullElse(d.getUoms(), List.<ItemUom>of()).size()),
            formatAdditionalUnits(d.getUoms()),
            d.getCreatedAt() == null ? "" : d.getCreatedAt().toString(),
            d.getUpdatedAt() == null ? "" : d.getUpdatedAt().toString(),
            d.getVersion() == null ? "" : d.getVersion().toString());
      }
    } catch (IOException ex) {
      deleteQuietly(tempFile);
      throw ApiException.internalServerError("failed_to_generate_csv");
    }

    try {
      return TempFileResource.from(tempFile, filename);
    } catch (IOException ex) {
      deleteQuietly(tempFile);
      throw ApiException.internalServerError("failed_to_generate_csv");
    }
  }

  private static String formatAdditionalUnits(List<ItemUom> uoms) {
    if (uoms == null || uoms.isEmpty()) {
      return "";
    }
    return uoms.stream()
        .map(
            uom ->
                String.join(
                    "|",
                    escapeAdditionalUnitsPart(uom.getUom()),
                    escapeAdditionalUnitsPart(
                        uom.getCoef() == null ? "" : uom.getCoef().toPlainString()),
                    escapeAdditionalUnitsPart(uom.getNotes())))
        .collect(Collectors.joining("; "));
  }

  private static String escapeAdditionalUnitsPart(String value) {
    if (value == null) {
      return "";
    }
    return value.replace("\\", "\\\\").replace("|", "\\|").replace(";", "\\;");
  }

  private void deleteQuietly(Path path) {
    try {
      Files.deleteIfExists(path);
    } catch (IOException suppressed) {
      log.warn("Failed to delete temp export file {}", path, suppressed);
    }
  }
}
