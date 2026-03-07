package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.BomsExportApi;
import com.craftify.backend.model.BomComponent;
import com.craftify.backend.model.BomDetail;
import com.craftify.backend.model.BomStatus;
import com.craftify.backend.service.BomService;
import java.io.IOException;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import jakarta.annotation.Nullable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BomsExportApiController implements BomsExportApi {

  private static final Logger log = LoggerFactory.getLogger(BomsExportApiController.class);

  private final BomService bomService;

  public BomsExportApiController(BomService bomService) {
    this.bomService = bomService;
  }

  @Override
  public ResponseEntity<org.springframework.core.io.Resource> bomsExportGet(
      @Nullable String q, @Nullable BomStatus status, @Nullable String ids) {
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
    String csv = toCsv(rows);
    byte[] bom = new byte[] {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    byte[] payload = concat(bom, csv.getBytes(StandardCharsets.UTF_8));
    String filename = "boms_" + LocalDate.now() + ".csv";

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .header(HttpHeaders.CACHE_CONTROL, "no-store")
        .body(new ByteArrayResource(payload));
  }

  private static String toCsv(List<BomDetail> rows) {
    StringWriter writer = new StringWriter();
    try (CSVPrinter printer =
        new CSVPrinter(
            writer,
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
        List<BomComponent> components = d.getComponents() == null ? List.of() : d.getComponents();
        if (components.isEmpty()) {
          appendRow(printer, d, null, -1);
          continue;
        }
        for (int i = 0; i < components.size(); i++) {
          appendRow(printer, d, components.get(i), i);
        }
      }
    } catch (IOException ex) {
      throw new IllegalStateException("failed_to_generate_csv", ex);
    }
    return writer.toString();
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

  private static byte[] concat(byte[] a, byte[] b) {
    byte[] out = new byte[a.length + b.length];
    System.arraycopy(a, 0, out, 0, a.length);
    System.arraycopy(b, 0, out, a.length, b.length);
    return out;
  }
}
