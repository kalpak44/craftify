package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.BomsApi;
import com.craftify.backend.model.BomComponent;
import com.craftify.backend.model.BomDetail;
import com.craftify.backend.model.BomList;
import com.craftify.backend.model.BomPage;
import com.craftify.backend.model.BomStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
public class BomsApiController implements BomsApi {

    private static final Logger log = LoggerFactory.getLogger(BomsApiController.class);

    private static final Map<String, BomDetail> STORE = new ConcurrentHashMap<>();

    static {
        seed("BOM-001", "ITM-001", "Warm Yellow LED", "v1", BomStatus.DRAFT,
                List.of(
                        new BomComponent().itemId("ITM-002").uom("pcs").quantity(2.0),
                        new BomComponent().itemId("ITM-003").uom("pcs").quantity(1.0)
                ));
        seed("BOM-002", "ITM-006", "Front Assembly", "v3", BomStatus.ACTIVE,
                List.of(
                        new BomComponent().itemId("ITM-004").uom("pcs").quantity(4.0),
                        new BomComponent().itemId("ITM-005").uom("pcs").quantity(8.0)
                ));
    }

    private static void seed(String id, String productId, String productName, String rev, BomStatus status, List<BomComponent> components) {
        BomDetail b = new BomDetail()
                .id(id)
                .productId(productId)
                .productName(productName)
                .revision(rev)
                .status(status)
                .description(null)
                .note(null)
                .components(new ArrayList<>(components))
                .createdAt(OffsetDateTime.now().minusDays(2))
                .updatedAt(OffsetDateTime.now())
                .version(0);
        STORE.put(id, b);
    }

    @Override
    public ResponseEntity<BomPage> bomsGet(Integer page, Integer size, @Nullable String sort, @Nullable String q, @Nullable BomStatus status) {
        log.info("GET /boms page={} size={} sort={} q={} status={}", page, size, sort, q, status);

        List<BomDetail> list = new ArrayList<>(STORE.values());
        if (q != null && !q.isBlank()) {
            String qq = q.toLowerCase(Locale.ROOT);
            list = list.stream().filter(b ->
                    (b.getId() != null && b.getId().toLowerCase(Locale.ROOT).contains(qq)) ||
                            (b.getProductName() != null && b.getProductName().toLowerCase(Locale.ROOT).contains(qq))
            ).toList();
        }
        if (status != null) {
            BomStatus st = status;
            list = list.stream().filter(b -> st.equals(b.getStatus())).toList();
        }

        String sortKey = "productName";
        boolean asc = true;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",", 2);
            sortKey = parts[0].trim();
            if (parts.length > 1) asc = !"desc".equalsIgnoreCase(parts[1].trim());
        }
        Comparator<BomDetail> cmp;
        if ("id".equalsIgnoreCase(sortKey)) {
            cmp = Comparator.comparing(BomDetail::getId, Comparator.nullsLast(String::compareToIgnoreCase));
        } else if ("productId".equalsIgnoreCase(sortKey)) {
            cmp = Comparator.comparing(BomDetail::getProductId, Comparator.nullsLast(String::compareToIgnoreCase));
        } else {
            cmp = Comparator.comparing(BomDetail::getProductName, Comparator.nullsLast(String::compareToIgnoreCase));
        }
        if (!asc) cmp = cmp.reversed();
        list = list.stream().sorted(cmp).toList();

        int total = list.size();
        int from = Math.max(0, Math.min(page * size, total));
        int to = Math.max(from, Math.min(from + size, total));
        List<BomDetail> slice = list.subList(from, to);

        List<BomList> content = slice.stream().map(b -> new BomList()
                .id(b.getId())
                .productId(b.getProductId())
                .productName(b.getProductName())
                .revision(b.getRevision())
                .status(b.getStatus())
                .updatedAt(b.getUpdatedAt())
                .componentsCount(b.getComponents() != null ? b.getComponents().size() : 0)
        ).toList();

        BomPage body = new BomPage()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(total)
                .totalPages(Math.max(1, (int) Math.ceil((double) total / (double) size)))
                .sort(List.of(sort != null ? sort : (sortKey + "," + (asc ? "asc" : "desc"))));

        return ResponseEntity.ok(body);
    }

    @Override
    public ResponseEntity<BomDetail> bomsIdGet(String id) {
        BomDetail existing = STORE.get(id);
        if (existing == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(existing);
    }

    @Override
    public ResponseEntity<BomDetail> bomsPost(BomDetail req) {
        if (req == null || req.getProductId() == null || req.getProductId().isBlank()
                || req.getRevision() == null || req.getRevision().isBlank()
                || req.getStatus() == null) {
            return ResponseEntity.badRequest().build();
        }
        String id = req.getId();
        if (id == null || id.isBlank()) {
            id = "BOM-" + String.format("%03d", STORE.size() + 1);
        }
        if (STORE.containsKey(id)) {
            return ResponseEntity.status(409).build();
        }
        BomDetail created = new BomDetail()
                .id(id)
                .productId(req.getProductId())
                .productName(req.getProductName())
                .revision(req.getRevision())
                .status(req.getStatus())
                .description(req.getDescription())
                .note(req.getNote())
                .components(req.getComponents() != null ? new ArrayList<>(req.getComponents()) : new ArrayList<>())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .version(0);
        STORE.put(id, created);
        return ResponseEntity.created(URI.create("/boms/" + id)).body(created);
    }

    @Override
    public ResponseEntity<BomDetail> bomsIdPut(String id, String ifMatch, BomDetail req) {
        BomDetail existing = STORE.get(id);
        if (existing == null) return ResponseEntity.notFound().build();
        String expected = "W\"" + existing.getVersion() + "\"";
        if (ifMatch == null || !ifMatch.equals(expected)) {
            return ResponseEntity.status(412).build();
        }
        if (req == null || req.getProductId() == null || req.getProductId().isBlank()
                || req.getRevision() == null || req.getRevision().isBlank()
                || req.getStatus() == null) {
            return ResponseEntity.badRequest().build();
        }
        existing.setProductId(req.getProductId());
        existing.setProductName(req.getProductName());
        existing.setRevision(req.getRevision());
        existing.setStatus(req.getStatus());
        existing.setDescription(req.getDescription());
        existing.setNote(req.getNote());
        existing.setComponents(req.getComponents() != null ? new ArrayList<>(req.getComponents()) : new ArrayList<>());
        existing.setUpdatedAt(OffsetDateTime.now());
        existing.setVersion(existing.getVersion() + 1);
        STORE.put(id, existing);
        return ResponseEntity.ok(existing);
    }

    @Override
    public ResponseEntity<Void> bomsIdDelete(String id, String ifMatch) {
        BomDetail existing = STORE.get(id);
        if (existing == null) return ResponseEntity.notFound().build();
        String expected = "W\"" + existing.getVersion() + "\"";
        if (ifMatch == null || !ifMatch.equals(expected)) {
            return ResponseEntity.status(412).build();
        }
        STORE.remove(id);
        return ResponseEntity.noContent().build();
    }
}
