package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.ItemsExportApi;
import com.craftify.backend.model.ItemDetail;
import com.craftify.backend.model.ItemUom;
import com.craftify.backend.model.Status;
import com.craftify.backend.service.ItemService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ItemsExportApiController implements ItemsExportApi {

  private static final Logger log = LoggerFactory.getLogger(ItemsExportApiController.class);

  private final ItemService itemService;

  public ItemsExportApiController(ItemService itemService) {
    this.itemService = itemService;
  }

  @Override
  public ResponseEntity<org.springframework.core.io.Resource> itemsExportGet(
      @Nullable String q,
      @Nullable Status status,
      @Nullable UUID categoryId,
      @Nullable String uom,
      @Nullable String ids) {
    String categoryName = null;
    ServletRequestAttributes attrs =
        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    if (attrs != null && attrs.getRequest() != null) {
      categoryName = attrs.getRequest().getParameter("categoryName");
    }

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

    String csv = toCsv(rows);
    byte[] bom = new byte[] {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    byte[] payload = concat(bom, csv.getBytes(StandardCharsets.UTF_8));

    String filename = "items_" + LocalDate.now() + ".csv";

    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .header(HttpHeaders.CACHE_CONTROL, "no-store")
        .body(new ByteArrayResource(payload));
  }

  private static String toCsv(List<ItemDetail> rows) {
    StringBuilder sb = new StringBuilder();
    sb.append(
        "Id,Code,Name,Status,Category,UoM Base,Description,Additional Units Count,Additional Units,Created At,Updated At,Version\n");
    for (ItemDetail d : rows) {
      sb.append(csv(d.getId()))
          .append(',')
          .append(csv(d.getCode()))
          .append(',')
          .append(csv(d.getName()))
          .append(',')
          .append(csv(d.getStatus() == null ? "" : d.getStatus().getValue()))
          .append(',')
          .append(csv(d.getCategoryName()))
          .append(',')
          .append(csv(d.getUomBase()))
          .append(',')
          .append(csv(d.getDescription()))
          .append(',')
          .append(csv(String.valueOf(d.getUoms() == null ? 0 : d.getUoms().size())))
          .append(',')
          .append(csv(formatAdditionalUnits(d.getUoms())))
          .append(',')
          .append(csv(d.getCreatedAt() == null ? "" : d.getCreatedAt().toString()))
          .append(',')
          .append(csv(d.getUpdatedAt() == null ? "" : d.getUpdatedAt().toString()))
          .append(',')
          .append(csv(d.getVersion() == null ? "" : d.getVersion().toString()))
          .append('\n');
    }
    return sb.toString();
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
                    uom.getUom() == null ? "" : uom.getUom(),
                    uom.getCoef() == null ? "" : uom.getCoef().toPlainString(),
                    uom.getNotes() == null ? "" : uom.getNotes()))
        .collect(Collectors.joining("; "));
  }

  private static String csv(String v) {
    if (v == null) return "";
    boolean needsQuotes =
        v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r");
    String s = v.replace("\"", "\"\"");
    return needsQuotes ? "\"" + s + "\"" : s;
  }

  private static byte[] concat(byte[] a, byte[] b) {
    byte[] out = new byte[a.length + b.length];
    System.arraycopy(a, 0, out, 0, a.length);
    System.arraycopy(b, 0, out, a.length, b.length);
    return out;
  }
}
