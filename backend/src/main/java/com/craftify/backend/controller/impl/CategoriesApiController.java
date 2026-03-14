package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.CategoriesApi;
import com.craftify.backend.model.Category;
import com.craftify.backend.model.CategoryPage;
import com.craftify.backend.model.CreateCategoryRequest;
import com.craftify.backend.model.RenameCategoryRequest;
import com.craftify.backend.service.CategoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.util.Objects;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import jakarta.annotation.Nullable;
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
    return ResponseEntity.ok(
        categoryService.list(
            Objects.requireNonNullElse(page, 0), Objects.requireNonNullElse(size, 8), sort, q));
  }

  @Override
  public ResponseEntity<Void> categoriesIdDelete(UUID id, @Nullable Boolean force) {
    boolean deleted = categoryService.delete(id, force != null && force);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
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
    Category updated = categoryService.rename(id, renameCategoryRequest.getName());
    if (updated == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(updated);
  }

  @Override
  public ResponseEntity<Category> categoriesPost(CreateCategoryRequest createCategoryRequest) {
    Category created = categoryService.create(createCategoryRequest.getName());
    if (created == null) {
      return ResponseEntity.status(409).build();
    }

    return ResponseEntity.created(URI.create("/categories/" + created.getId())).body(created);
  }
}
