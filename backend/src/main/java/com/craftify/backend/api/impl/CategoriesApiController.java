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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RestController
public class CategoriesApiController implements CategoriesApi {

    private static final Logger log = LoggerFactory.getLogger(CategoriesApiController.class);

    private static final Map<UUID, Category> STORE = new ConcurrentHashMap<>();

    static {
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

    @Override
    public ResponseEntity<CategoryPage> categoriesGet(Integer page, Integer size, @Nullable String sort, @Nullable String q) {
        log.info("GET /categories page={} size={} sort={} q={}", page, size, sort, q);
        List<Category> list = new ArrayList<>(STORE.values());
        if (q != null && !q.isBlank()) {
            String qq = q.toLowerCase(Locale.ROOT);
            list = list.stream().filter(c -> c.getName() != null && c.getName().toLowerCase(Locale.ROOT).contains(qq)).toList();
        }
        String sortKey = "name";
        boolean asc = true;
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",", 2);
            sortKey = parts[0].trim();
            if (parts.length > 1) asc = !"desc".equalsIgnoreCase(parts[1].trim());
        }
        Comparator<Category> cmp = Comparator.comparing(Category::getName, Comparator.nullsLast(String::compareToIgnoreCase));
        if ("id".equalsIgnoreCase(sortKey)) {
            cmp = Comparator.comparing(c -> c.getId() == null ? null : c.getId().toString());
        }
        if (!asc) cmp = cmp.reversed();
        list = list.stream().sorted(cmp).toList();

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
                .sort(List.of(sort != null ? sort : (sortKey + "," + (asc ? "asc" : "desc"))));
        return ResponseEntity.ok(body);
    }

    @Override
    public ResponseEntity<Void> categoriesIdDelete(UUID id, @Nullable Boolean force) {
        Category existing = STORE.get(id);
        if (existing == null) return ResponseEntity.notFound().build();
        // For dummy, ignore references and delete
        STORE.remove(id);
        return ResponseEntity.noContent().build();
    }

    @Override
    public ResponseEntity<Category> categoriesIdGet(UUID id) {
        Category existing = STORE.get(id);
        if (existing == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(existing);
    }

    @Override
    public ResponseEntity<Category> categoriesIdPatch(UUID id, RenameCategoryRequest renameCategoryRequest) {
        Category existing = STORE.get(id);
        if (existing == null) return ResponseEntity.notFound().build();
        if (renameCategoryRequest == null || renameCategoryRequest.getName() == null || renameCategoryRequest.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String newName = renameCategoryRequest.getName().trim();
        // ensure unique name (case-insensitive)
        boolean clash = STORE.values().stream()
                .anyMatch(c -> !c.getId().equals(id) && c.getName() != null && c.getName().equalsIgnoreCase(newName));
        if (clash) {
            return ResponseEntity.status(409).build();
        }
        existing.setName(newName);
        STORE.put(id, existing);
        return ResponseEntity.ok(existing);
    }

    @Override
    public ResponseEntity<Category> categoriesPost(CreateCategoryRequest createCategoryRequest) {
        if (createCategoryRequest == null || createCategoryRequest.getName() == null || createCategoryRequest.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String name = createCategoryRequest.getName().trim();
        // unique name check
        boolean clash = STORE.values().stream().anyMatch(c -> c.getName() != null && c.getName().equalsIgnoreCase(name));
        if (clash) return ResponseEntity.status(409).build();
        UUID id = UUID.randomUUID();
        Category created = new Category().id(id).name(name);
        STORE.put(id, created);
        return ResponseEntity.ok(created);
    }
}
