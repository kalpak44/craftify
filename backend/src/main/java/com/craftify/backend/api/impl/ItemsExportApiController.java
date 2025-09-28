package com.craftify.backend.api.impl;

import com.craftify.backend.api.ItemsExportApi;
import com.craftify.backend.api.model.Status;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Dummy implementation of ItemsExportApi.
 * Generates CSV from in-memory sample items with random UUIDs each time.
 */
@RestController
public class ItemsExportApiController implements ItemsExportApi {

    private static final Logger log = LoggerFactory.getLogger(ItemsExportApiController.class);

    @Override
    public ResponseEntity<org.springframework.core.io.Resource> itemsExportGet(
            @Nullable String q,
            @Nullable Status status,
            @Nullable UUID categoryId,
            @Nullable String uom,
            @Nullable String ids
    ) {
        log.info("GET /items:export (dummy) q={} status={} uom={} ids={}", q, status, uom, ids);

        // Build random in-memory data on each request
        List<DemoItem> rows = new ArrayList<>(List.of(
                new DemoItem(UUID.randomUUID(), "ITM-001", "Warm Yellow LED", Status.ACTIVE, "Component", "pcs"),
                new DemoItem(UUID.randomUUID(), "ITM-002", "Large Widget", Status.ACTIVE, "Assembly", "pcs"),
                new DemoItem(UUID.randomUUID(), "ITM-008", "Blue Paint (RAL5010)", Status.HOLD, "Consumable", "L"),
                new DemoItem(UUID.randomUUID(), "ITM-010", "Assembly Kit 10", Status.DISCONTINUED, "Kit", "kit")
        ));

        // Apply basic filters
        if (ids != null && !ids.isBlank()) {
            Set<UUID> wanted = Arrays.stream(ids.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(UUID::fromString)
                    .collect(Collectors.toSet());
            rows = rows.stream().filter(d -> wanted.contains(d.id())).collect(Collectors.toList());
        }
        if (q != null && !q.isBlank()) {
            String qq = q.toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(d -> d.code().toLowerCase().contains(qq) || d.name().toLowerCase().contains(qq)).collect(Collectors.toList());
        }
        if (status != null) {
            rows = rows.stream().filter(d -> d.status() == status).collect(Collectors.toList());
        }
        if (uom != null && !uom.isBlank()) {
            String uu = uom.toLowerCase(Locale.ROOT);
            rows = rows.stream().filter(d -> d.uom().equalsIgnoreCase(uu)).collect(Collectors.toList());
        }

        String csv = toCsv(rows);
        byte[] bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] payload = concat(bom, csv.getBytes(StandardCharsets.UTF_8));

        String filename = "items_" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(new ByteArrayResource(payload));
    }

    private static String toCsv(List<DemoItem> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Code,Product name,Status,Category,UoM\n");
        for (DemoItem d : rows) {
            sb.append(csv(d.id().toString())).append(',')
                    .append(csv(d.code())).append(',')
                    .append(csv(d.name())).append(',')
                    .append(csv(d.status().name())).append(',')
                    .append(csv(d.category())).append(',')
                    .append(csv(d.uom())).append('\n');
        }
        return sb.toString();
    }

    private static String csv(String v) {
        if (v == null) return "";
        boolean needsQuotes = v.contains(",") || v.contains("\"") || v.contains("\n") || v.contains("\r");
        String s = v.replace("\"", "\"\"");
        return needsQuotes ? "\"" + s + "\"" : s;
    }

    private static byte[] concat(byte[] a, byte[] b) {
        byte[] out = new byte[a.length + b.length];
        System.arraycopy(a, 0, out, 0, a.length);
        System.arraycopy(b, 0, out, a.length, b.length);
        return out;
    }

    private record DemoItem(UUID id, String code, String name, Status status, String category, String uom) {
    }
}
