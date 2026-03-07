package com.craftify.backend.service;

import com.craftify.backend.model.Category;
import com.craftify.backend.model.CategoryPage;
import com.craftify.backend.persistence.entity.CategoryEntity;
import com.craftify.backend.persistence.entity.InventoryEntity;
import com.craftify.backend.persistence.entity.ItemEntity;
import com.craftify.backend.persistence.repository.CategoryRepository;
import com.craftify.backend.persistence.repository.InventoryRepository;
import com.craftify.backend.persistence.repository.ItemRepository;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

  private static final String UNKNOWN_CATEGORY = "Unknown";

  private final CategoryRepository categoryRepository;
  private final ItemRepository itemRepository;
  private final InventoryRepository inventoryRepository;
  private final CurrentUserService currentUserService;

  public CategoryService(
      CategoryRepository categoryRepository,
      ItemRepository itemRepository,
      InventoryRepository inventoryRepository,
      CurrentUserService currentUserService) {
    this.categoryRepository = categoryRepository;
    this.itemRepository = itemRepository;
    this.inventoryRepository = inventoryRepository;
    this.currentUserService = currentUserService;
  }

  @Transactional(readOnly = true)
  public CategoryPage list(int page, int size, String sort, String q) {
    String ownerSub = currentUserService.requiredSub();
    Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), parseSort(sort));
    Specification<CategoryEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new java.util.ArrayList<>();
          predicates.add(cb.equal(root.get("ownerSub"), ownerSub));
          if (q != null && !q.isBlank()) {
            predicates.add(cb.like(cb.lower(root.get("name")), "%" + q.toLowerCase(Locale.ROOT) + "%"));
          }
          return cb.and(predicates.toArray(Predicate[]::new));
        };
    Page<CategoryEntity> rows = categoryRepository.findAll(spec, pageable);
    List<Category> content =
        rows.stream()
            .map(this::toModel)
            .sorted(
                Comparator.comparing(
                        (Category c) ->
                            !UNKNOWN_CATEGORY.equalsIgnoreCase(c.getName() == null ? "" : c.getName().trim()))
                    .thenComparing(c -> c.getName() == null ? "" : c.getName(), String.CASE_INSENSITIVE_ORDER))
            .toList();

    return new CategoryPage()
        .content(content)
        .page(rows.getNumber())
        .size(rows.getSize())
        .totalElements((int) rows.getTotalElements())
        .totalPages(Math.max(1, rows.getTotalPages()))
        .sort(List.of(sort == null || sort.isBlank() ? "name,asc" : sort));
  }

  @Transactional(readOnly = true)
  public Category get(UUID id) {
    String ownerSub = currentUserService.requiredSub();
    return categoryRepository.findByIdAndOwnerSub(id, ownerSub).map(this::toModel).orElse(null);
  }

  @Transactional
  public Category create(String name) {
    String ownerSub = currentUserService.requiredSub();
    String normalized = name.trim();
    if (categoryRepository.existsByNameIgnoreCaseAndOwnerSub(normalized, ownerSub)) {
      return null;
    }
    CategoryEntity entity = new CategoryEntity();
    entity.setName(normalized);
    entity.setOwnerSub(ownerSub);
    return toModel(categoryRepository.save(entity));
  }

  @Transactional
  public void ensureExistsForCurrentUser(String name) {
    if (name == null || name.isBlank()) {
      return;
    }
    String ownerSub = currentUserService.requiredSub();
    String normalized = name.trim();
    if (normalized.isBlank()) {
      return;
    }
    if (categoryRepository.existsByNameIgnoreCaseAndOwnerSub(normalized, ownerSub)) {
      return;
    }
    CategoryEntity entity = new CategoryEntity();
    entity.setName(normalized);
    entity.setOwnerSub(ownerSub);
    categoryRepository.save(entity);
  }

  @Transactional
  public Category rename(UUID id, String newName) {
    String ownerSub = currentUserService.requiredSub();
    CategoryEntity existing = categoryRepository.findByIdAndOwnerSub(id, ownerSub).orElse(null);
    if (existing == null) {
      return null;
    }
    if (UNKNOWN_CATEGORY.equalsIgnoreCase(existing.getName() == null ? "" : existing.getName().trim())) {
      throw new IllegalStateException("cannot_rename_unknown");
    }

    String normalized = newName.trim();
    boolean clash =
        categoryRepository.findByNameIgnoreCaseAndOwnerSub(normalized, ownerSub)
            .map(c -> !c.getId().equals(id))
            .orElse(false);
    if (clash) {
      throw new IllegalStateException("name_conflict");
    }

    String oldName = existing.getName();
    existing.setName(normalized);
    categoryRepository.save(existing);

    // Keep item/categoryName denormalized value in sync.
    itemRepository
        .findAll()
        .forEach(
            item -> {
              if (ownerSub.equals(item.getOwnerSub())
                  && item.getCategoryName() != null
                  && item.getCategoryName().equalsIgnoreCase(oldName)) {
                item.setCategoryName(normalized);
              }
            });

    return toModel(existing);
  }

  @Transactional
  public boolean delete(UUID id, boolean force) {
    String ownerSub = currentUserService.requiredSub();
    CategoryEntity existing = categoryRepository.findByIdAndOwnerSub(id, ownerSub).orElse(null);
    if (existing == null) {
      return false;
    }

    String categoryName = existing.getName() == null ? "" : existing.getName().trim();
    if (UNKNOWN_CATEGORY.equalsIgnoreCase(categoryName)) {
      throw new IllegalStateException("cannot_delete_unknown");
    }

    String unknown = ensureUnknownForOwner(ownerSub);
    reassignItemsToUnknown(ownerSub, categoryName, unknown);
    reassignInventoryToUnknown(ownerSub, categoryName, unknown);

    categoryRepository.delete(existing);
    return true;
  }

  private Sort parseSort(String sort) {
    String value = (sort == null || sort.isBlank()) ? "name,asc" : sort;
    String[] parts = value.split(",", 2);
    String key = parts[0].trim();
    Sort.Direction direction =
        (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim()))
            ? Sort.Direction.DESC
            : Sort.Direction.ASC;

    if ("id".equalsIgnoreCase(key)) {
      return Sort.by(direction, "id");
    }
    return Sort.by(direction, "name");
  }

  private Category toModel(CategoryEntity entity) {
    return new Category().id(entity.getId()).name(entity.getName());
  }

  private String ensureUnknownForOwner(String ownerSub) {
    CategoryEntity unknown =
        categoryRepository
            .findByNameIgnoreCaseAndOwnerSub(UNKNOWN_CATEGORY, ownerSub)
            .orElse(null);
    if (unknown == null) {
      unknown = new CategoryEntity();
      unknown.setName(UNKNOWN_CATEGORY);
      unknown.setOwnerSub(ownerSub);
      unknown = categoryRepository.save(unknown);
    }
    return unknown.getName();
  }

  private void reassignItemsToUnknown(String ownerSub, String oldName, String unknownName) {
    List<ItemEntity> changed = new ArrayList<>();
    for (ItemEntity item : itemRepository.findAll()) {
      if (!ownerSub.equals(item.getOwnerSub())) {
        continue;
      }
      if (item.getCategoryName() != null && item.getCategoryName().equalsIgnoreCase(oldName)) {
        item.setCategoryName(unknownName);
        changed.add(item);
      }
    }
    if (!changed.isEmpty()) {
      itemRepository.saveAll(changed);
    }
  }

  private void reassignInventoryToUnknown(String ownerSub, String oldName, String unknownName) {
    List<InventoryEntity> changed = new ArrayList<>();
    for (InventoryEntity inv : inventoryRepository.findAll()) {
      if (!ownerSub.equals(inv.getOwnerSub())) {
        continue;
      }
      boolean touched = false;
      if (inv.getItemCategoryName() != null && inv.getItemCategoryName().equalsIgnoreCase(oldName)) {
        inv.setItemCategoryName(unknownName);
        if (!inv.isCategoryDetached()) {
          inv.setCategoryName(unknownName);
        }
        touched = true;
      }
      if (inv.isCategoryDetached()
          && inv.getDetachedCategoryName() != null
          && inv.getDetachedCategoryName().equalsIgnoreCase(oldName)) {
        inv.setCategoryDetached(false);
        inv.setDetachedCategoryName(null);
        String fallback =
            (inv.getItemCategoryName() == null || inv.getItemCategoryName().isBlank())
                ? unknownName
                : inv.getItemCategoryName();
        inv.setCategoryName(fallback);
        touched = true;
      } else if (inv.getCategoryName() != null && inv.getCategoryName().equalsIgnoreCase(oldName)) {
        inv.setCategoryName(unknownName);
        touched = true;
      }
      if (touched) {
        changed.add(inv);
      }
    }
    if (!changed.isEmpty()) {
      inventoryRepository.saveAll(changed);
    }
  }
}
