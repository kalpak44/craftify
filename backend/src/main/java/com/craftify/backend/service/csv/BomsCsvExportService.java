package com.craftify.backend.service.csv;

import com.craftify.backend.error.ApiException;
import com.craftify.backend.model.BomComponent;
import com.craftify.backend.model.BomDetail;
import com.craftify.backend.model.BomStatus;
import com.craftify.backend.service.BomService;
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
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class BomsCsvExportService {

  private static final Logger log = LoggerFactory.getLogger(BomsCsvExportService.class);

  private final BomService bomService;

  public BomsCsvExportService(BomService bomService) {
    this.bomService = bomService;
  }

  public CsvExportPayload export(String q, BomStatus status, String ids) {
    List<String> codes =
        (ids == null || ids.isBlank())
            ? List.of()
            : Arrays.stream(ids.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .map(s -> s.toUpperCase(Locale.ROOT))
                .toList();

    log.info("GET /boms:export q={} status={} codes={}", q, status, codes.size());
    List<BomDetail> rows = bomService.listForExport(q, status, codes);
    String filename = "boms_" + LocalDate.now() + ".csv";
    return new CsvExportPayload(writeCsv(rows, filename), filename);
  }

  private TempFileResource writeCsv(List<BomDetail> rows, String filename) {
    Path tempFile;
    try {
      tempFile = Files.createTempFile("boms-export-", ".csv");
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
                    "BomId",
                    "ProductId",
                    "ProductName",
                    "Revision",
                    "Status",
                    "Description",
                    "Note",
                    "ComponentOrder",
                    "ComponentItemId",
                    "ComponentQuantity",
                    "ComponentUom",
                    "ComponentNote")
                .build())) {
      for (BomDetail d : rows) {
        List<BomComponent> components = Objects.requireNonNullElse(d.getComponents(), List.of());
        if (components.isEmpty()) {
          appendRow(printer, d, null, -1);
          continue;
        }
        for (int i = 0; i < components.size(); i++) {
          appendRow(printer, d, components.get(i), i);
        }
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

  private static void appendRow(CSVPrinter printer, BomDetail d, BomComponent c, int ord)
      throws IOException {
    printer.printRecord(
        d.getId(),
        d.getProductId(),
        d.getProductName(),
        d.getRevision(),
        d.getStatus() == null ? "" : d.getStatus().getValue(),
        d.getDescription(),
        d.getNote(),
        ord >= 0 ? ord : "",
        c == null ? "" : c.getItemId(),
        c == null || c.getQuantity() == null ? "" : c.getQuantity(),
        c == null ? "" : c.getUom(),
        c == null ? "" : c.getNote());
  }

  private void deleteQuietly(Path path) {
    try {
      Files.deleteIfExists(path);
    } catch (IOException suppressed) {
      log.warn("Failed to delete temp export file {}", path, suppressed);
    }
  }
}
