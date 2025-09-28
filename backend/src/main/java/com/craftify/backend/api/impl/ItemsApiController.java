package com.craftify.backend.api.impl;

import com.craftify.backend.api.ItemsApi;
import com.craftify.backend.api.model.CreateItemRequest;
import com.craftify.backend.api.model.ItemDetail;
import com.craftify.backend.api.model.ItemList;
import com.craftify.backend.api.model.ItemPage;
import com.craftify.backend.api.model.Status;
import com.craftify.backend.api.model.UpdateItemRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
public class ItemsApiController implements ItemsApi {

    private static final Logger log = LoggerFactory.getLogger(ItemsApiController.class);

    /**
     * In-memory dummy store keyed by item code (used as id in paths)
     */
    private static final Map<String, ItemDetail> STORE = new ConcurrentHashMap<>();

    static {
        // Seed a couple of demo items for FE integration
        seed("ITM-001", "Widget A", Status.DRAFT, categoryNameOf(UUID.randomUUID()), "pcs");
        seed("ITM-002", "Gadget B", Status.ACTIVE, categoryNameOf(UUID.randomUUID()), "pcs");
        seed("ITM-003", "Assembly C", Status.HOLD, categoryNameOf(UUID.randomUUID()), "set");
    }

    private static void seed(String code, String name, Status status, String categoryName, String uomBase) {
        ItemDetail d = new ItemDetail()
                .id(code)
                .code(code)
                .name(name)
                .status(status)
                .categoryName(categoryName)
                .uomBase(uomBase)
                .version(0)
                .createdAt(OffsetDateTime.now().minusDays(2))
                .updatedAt(OffsetDateTime.now());
        STORE.put(code, d);
    }

    private static @Nullable String categoryNameOf(@Nullable UUID id) {
        if (id == null) return null;
        String s = id.toString();
        String prefix = s.length() >= 8 ? s.substring(0, 8) : s;
        return "Category " + prefix.toUpperCase(Locale.ROOT);
    }

    @Override
    public ResponseEntity<ItemPage> itemsGet(Integer page, Integer size, @Nullable String sort, @Nullable String q,
                                             @Nullable Status status, @Nullable UUID categoryId, @Nullable String uom,
                                             Boolean includeDeleted) {
        log.info("GET /items page={} size={} sort={} q={} status={} categoryId={} uom={} includeDeleted={}",
                page, size, sort, q, status, categoryId, uom, includeDeleted);

        // filter
        List<ItemDetail> list = new ArrayList<>(STORE.values());
        if (q != null && !q.isBlank()) {
            String qq = q.toLowerCase(Locale.ROOT);
            list = list.stream()
                    .filter(it -> (it.getCode() != null && it.getCode().toLowerCase(Locale.ROOT).contains(qq))
                            || (it.getName() != null && it.getName().toLowerCase(Locale.ROOT).contains(qq)))
                    .toList();
        }
        if (status != null) {
            Status st = status; // enum
            list = list.stream().filter(it -> st.equals(it.getStatus())).toList();
        }
        // categoryId filter removed: ItemDetail now uses categoryName only
        if (uom != null && !uom.isBlank()) {
            String u = uom.toLowerCase(Locale.ROOT);
            list = list.stream().filter(it ->
                    (it.getUomBase() != null && it.getUomBase().toLowerCase(Locale.ROOT).equals(u))
            ).toList();
        }

        // sort (supports name or code; default name,asc)
        String sortKey = "name";
        boolean asc = true;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",", 2);
            sortKey = parts[0].trim();
            if (parts.length > 1) asc = !"desc".equalsIgnoreCase(parts[1].trim());
        }
        Comparator<ItemDetail> cmp;
        if ("code".equalsIgnoreCase(sortKey)) {
            cmp = Comparator.comparing(ItemDetail::getCode, Comparator.nullsLast(String::compareToIgnoreCase));
        } else {
            cmp = Comparator.comparing(ItemDetail::getName, Comparator.nullsLast(String::compareToIgnoreCase));
        }
        if (!asc) cmp = cmp.reversed();
        list = list.stream().sorted(cmp).toList();

        // page
        int total = list.size();
        int from = Math.max(0, Math.min(page * size, total));
        int to = Math.max(from, Math.min(from + size, total));
        List<ItemDetail> slice = list.subList(from, to);

        List<ItemList> content = slice.stream().map(it -> new ItemList()
                .id(it.getId())
                .code(it.getCode())
                .name(it.getName())
                .status(it.getStatus())
                .categoryId(null)
                .categoryName(it.getCategoryName())
                .uomBase(it.getUomBase())
                .updatedAt(it.getUpdatedAt())
        ).toList();

        ItemPage body = new ItemPage()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(total)
                .totalPages(Math.max(1, (int) Math.ceil((double) total / (double) size)))
                .sort(List.of(sort != null ? sort : (sortKey + "," + (asc ? "asc" : "desc"))));

        return ResponseEntity.ok(body);
    }

    @Override
    public ResponseEntity<Void> itemsIdDelete(String id, String ifMatch) {
        ItemDetail existing = STORE.get(id);
        if (existing == null) return ResponseEntity.notFound().build();
        // Very simple ETag/version check: expect W/"<version>"
        String expected = "W\"" + existing.getVersion() + "\"";
        if (ifMatch == null || !ifMatch.equals(expected)) {
            return ResponseEntity.status(412).build();
        }
        STORE.remove(id);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<ItemDetail> itemsIdGet(String id) {
        ItemDetail existing = STORE.get(id);
        if (existing == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(existing);
    }

    @Override
    public ResponseEntity<ItemDetail> itemsIdPut(String id, String ifMatch, UpdateItemRequest req) {
        ItemDetail existing = STORE.get(id);
        if (existing == null) return ResponseEntity.notFound().build();

        String expected = "W\"" + existing.getVersion() + "\"";
        if (ifMatch == null || !ifMatch.equals(expected)) {
            return ResponseEntity.status(412).build();
        }

        // minimal validation
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        // Keep code consistency with path id for dummy
        existing.setCode(req.getCode());
        existing.setName(req.getName());
        existing.setStatus(req.getStatus());
        existing.setCategoryName(req.getCategoryName());
        existing.setUomBase(req.getUomBase());
        existing.setDescription(req.getDescription());
        existing.setUoms(req.getUoms());
        existing.setUpdatedAt(OffsetDateTime.now());
        existing.setVersion(existing.getVersion() + 1);
        STORE.put(id, existing);
        return ResponseEntity.ok(existing);
    }

    @Override
    public ResponseEntity<ItemDetail> itemsPost(CreateItemRequest req) {
        if (req == null || req.getName() == null || req.getName().isBlank()
                || req.getStatus() == null || req.getCategoryName() == null || req.getCategoryName().isBlank()
                || req.getUomBase() == null || req.getUomBase().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String code = req.getCode();
        if (code == null || code.isBlank()) {
            // generate simple code
            code = "ITM-" + String.format("%03d", STORE.size() + 1);
        }
        if (STORE.containsKey(code)) {
            return ResponseEntity.status(409).build();
        }
        ItemDetail created = new ItemDetail()
                .id(code)
                .code(code)
                .name(req.getName().trim())
                .status(req.getStatus())
                .categoryName(req.getCategoryName())
                .uomBase(req.getUomBase())
                .description(req.getDescription())
                .uoms(req.getUoms())
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .version(0);
        STORE.put(code, created);
        return ResponseEntity.created(URI.create("/items/" + code)).body(created);
    }
}
