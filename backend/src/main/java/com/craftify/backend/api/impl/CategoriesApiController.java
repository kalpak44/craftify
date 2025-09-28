package com.craftify.backend.api.impl;

import com.craftify.backend.api.CategoriesApi;
import com.craftify.backend.api.model.Category;
import com.craftify.backend.api.model.CategoryPage;
import com.craftify.backend.api.model.CreateCategoryRequest;
import com.craftify.backend.api.model.RenameCategoryRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
public class CategoriesApiController implements CategoriesApi {

    private static final Logger log = LoggerFactory.getLogger(CategoriesApiController.class);

    /**
     * In-memory store (name is unique, case-insensitive)
     */
    private static final Map<UUID, Category> STORE = new ConcurrentHashMap<>();

    static {
        // seed a few categories matching your UI mock data
        seed("Component");
        seed("Fabrication");
        seed("Hardware");
        seed("Assembly");
        seed("Finished Good");
        seed("Consumable");
        seed("Kit");
    }

    private static void seed(String name) {
        UUID id = UUID.randomUUID();
        STORE.put(id, new Category().id(id).name(name));
    }

    // ---------- GET /categories (paged, q, sort) ----------
    @Override
    public ResponseEntity<CategoryPage> categoriesGet(Integer page, Integer size, @Nullable String sort, @Nullable String q) {
        log.info("GET /categories page={} size={} sort={} q={}", page, size, sort, q);

        // filter
        List<Category> list = new ArrayList<>(STORE.values());
        if (q != null && !q.isBlank()) {
            String qq = q.toLowerCase(Locale.ROOT);
            list = list.stream()
                    .filter(c -> c.getName() != null && c.getName().toLowerCase(Locale.ROOT).contains(qq))
                    .toList();
        }

        // sort (name asc/desc; default asc)
        boolean asc = true;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",", 2);
            if (parts.length > 1) asc = !"desc".equalsIgnoreCase(parts[1].trim());
        }
        Comparator<Category> cmp = Comparator.comparing(Category::getName, Comparator.nullsLast(String::compareToIgnoreCase));
        if (!asc) cmp = cmp.reversed();
        list = list.stream().sorted(cmp).toList();

        // page
        int total = list.size();
        int from = Math.max(0, Math.min(page * size, total));
        int to = Math.max(from, Math.min(from + size, total));
        List<Category> slice = list.subList(from, to);

        CategoryPage body = new CategoryPage()
                .content(slice)
                .page(page)
                .size(size)
                .totalElements(total)
                .totalPages(Math.max(1, (int) Math.ceil((double) total / (double) size)))
                .sort(List.of(sort != null ? sort : "name,asc"));

        return ResponseEntity.ok(body);
    }

    // ---------- GET /categories/{id} ----------
    @Override
    public ResponseEntity<Category> categoriesIdGet(UUID id) {
        Category c = STORE.get(id);
        if (c == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(c);
    }

    // ---------- POST /categories (create) ----------
    @Override
    public ResponseEntity<Category> categoriesPost(CreateCategoryRequest req) {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String newName = req.getName().trim();

        // uniqueness by name (case-insensitive)
        boolean exists = STORE.values().stream()
                .anyMatch(c -> c.getName() != null && c.getName().equalsIgnoreCase(newName));
        if (exists) {
            // simple 409 for dummy (no ProblemDetail body to keep it minimal)
            return ResponseEntity.status(409).build();
        }

        UUID id = UUID.randomUUID();
        Category created = new Category().id(id).name(newName);
        STORE.put(id, created);

        return ResponseEntity
                .created(URI.create("/categories/" + id))
                .body(created);
    }

    // ---------- PATCH /categories/{id} (rename) ----------
    @Override
    public ResponseEntity<Category> categoriesIdPatch(UUID id, RenameCategoryRequest req) {
        Category existing = STORE.get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String newName = req.getName().trim();

        // conflict if another category has that name (case-insensitive)
        boolean conflict = STORE.entrySet().stream()
                .anyMatch(e -> !e.getKey().equals(id)
                        && e.getValue().getName() != null
                        && e.getValue().getName().equalsIgnoreCase(newName));
        if (conflict) {
            return ResponseEntity.status(409).build();
        }

        existing.setName(newName);
        STORE.put(id, existing);
        return ResponseEntity.ok(existing);
    }

    // ---------- DELETE /categories/{id} ----------
    @Override
    public ResponseEntity<Void> categoriesIdDelete(UUID id, Boolean force) {
        Category existing = STORE.get(id);
        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Dummy behavior:
        // - If force=false and the name equals "Component" (pretend it's in use), return 409.
        // - Otherwise, delete.
        boolean inUseDemo = "Component".equalsIgnoreCase(existing.getName());
        if (!Boolean.TRUE.equals(force) && inUseDemo) {
            return ResponseEntity.status(409).build();
        }

        STORE.remove(id);
        return ResponseEntity.noContent().build();
    }
}
