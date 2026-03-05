package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.CategoriesApi;
import com.craftify.backend.model.Category;
import com.craftify.backend.model.CategoryPage;
import com.craftify.backend.model.CreateCategoryRequest;
import com.craftify.backend.model.RenameCategoryRequest;
import com.craftify.backend.service.CategoryService;
import java.net.URI;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CategoriesApiController implements CategoriesApi {

  private static final Logger log = LoggerFactory.getLogger(CategoriesApiController.class);

  private final CategoryService categoryService;

  public CategoriesApiController(CategoryService categoryService) {
    this.categoryService = categoryService;
  }

  @Override
  public ResponseEntity<CategoryPage> categoriesGet(
      Integer page, Integer size, @Nullable String sort, @Nullable String q) {
    log.info("GET /categories page={} size={} sort={} q={}", page, size, sort, q);
    return ResponseEntity.ok(categoryService.list(page == null ? 0 : page, size == null ? 8 : size, sort, q));
  }

  @Override
  public ResponseEntity<Void> categoriesIdDelete(UUID id, @Nullable Boolean force) {
    try {
      boolean deleted = categoryService.delete(id, force != null && force);
      return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    } catch (IllegalStateException ex) {
      return ResponseEntity.status(409).build();
    }
  }

  @Override
  public ResponseEntity<Category> categoriesIdGet(UUID id) {
    Category existing = categoryService.get(id);
    if (existing == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(existing);
  }

  @Override
  public ResponseEntity<Category> categoriesIdPatch(
      UUID id, RenameCategoryRequest renameCategoryRequest) {
    if (renameCategoryRequest == null
        || renameCategoryRequest.getName() == null
        || renameCategoryRequest.getName().isBlank()) {
      return ResponseEntity.badRequest().build();
    }

    try {
      Category updated = categoryService.rename(id, renameCategoryRequest.getName());
      if (updated == null) {
        return ResponseEntity.notFound().build();
      }
      return ResponseEntity.ok(updated);
    } catch (IllegalStateException ex) {
      return ResponseEntity.status(409).build();
    }
  }

  @Override
  public ResponseEntity<Category> categoriesPost(CreateCategoryRequest createCategoryRequest) {
    if (createCategoryRequest == null
        || createCategoryRequest.getName() == null
        || createCategoryRequest.getName().isBlank()) {
      return ResponseEntity.badRequest().build();
    }

    Category created = categoryService.create(createCategoryRequest.getName());
    if (created == null) {
      return ResponseEntity.status(409).build();
    }

    return ResponseEntity.created(URI.create("/categories/" + created.getId())).body(created);
  }
}
