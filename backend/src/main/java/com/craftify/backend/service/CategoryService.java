package com.craftify.backend.service;

import com.craftify.backend.model.Category;
import com.craftify.backend.model.CategoryPage;
import com.craftify.backend.persistence.entity.CategoryEntity;
import com.craftify.backend.persistence.repository.CategoryRepository;
import com.craftify.backend.persistence.repository.ItemRepository;
import jakarta.persistence.criteria.Predicate;
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

  private final CategoryRepository categoryRepository;
  private final ItemRepository itemRepository;
  private final CurrentUserService currentUserService;

  public CategoryService(
      CategoryRepository categoryRepository,
      ItemRepository itemRepository,
      CurrentUserService currentUserService) {
    this.categoryRepository = categoryRepository;
    this.itemRepository = itemRepository;
    this.currentUserService = currentUserService;
  }

  @Transactional(readOnly = true)
  public CategoryPage list(int page, int size, String sort, String q) {
    Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), parseSort(sort));
    Specification<CategoryEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new java.util.ArrayList<>();
          if (q != null && !q.isBlank()) {
            predicates.add(cb.like(cb.lower(root.get("name")), "%" + q.toLowerCase(Locale.ROOT) + "%"));
          }
          return cb.and(predicates.toArray(Predicate[]::new));
        };
    Page<CategoryEntity> rows = categoryRepository.findAll(spec, pageable);

    return new CategoryPage()
        .content(rows.stream().map(this::toModel).toList())
        .page(rows.getNumber())
        .size(rows.getSize())
        .totalElements((int) rows.getTotalElements())
        .totalPages(Math.max(1, rows.getTotalPages()))
        .sort(List.of(sort == null || sort.isBlank() ? "name,asc" : sort));
  }

  @Transactional(readOnly = true)
  public Category get(UUID id) {
    return categoryRepository.findById(id).map(this::toModel).orElse(null);
  }

  @Transactional
  public Category create(String name) {
    String normalized = name.trim();
    if (categoryRepository.existsByNameIgnoreCase(normalized)) {
      return null;
    }
    CategoryEntity entity = new CategoryEntity();
    entity.setName(normalized);
    return toModel(categoryRepository.save(entity));
  }

  @Transactional
  public Category rename(UUID id, String newName) {
    String ownerSub = currentUserService.requiredSub();
    CategoryEntity existing = categoryRepository.findById(id).orElse(null);
    if (existing == null) {
      return null;
    }

    String normalized = newName.trim();
    boolean clash =
        categoryRepository.findByNameIgnoreCase(normalized)
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
    CategoryEntity existing = categoryRepository.findById(id).orElse(null);
    if (existing == null) {
      return false;
    }

    if (!force
        && itemRepository.existsByDeletedFalseAndCategoryNameIgnoreCaseAndOwnerSub(
            existing.getName(), ownerSub)) {
      throw new IllegalStateException("category_in_use");
    }

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
}
