package com.craftify.backend.controller.impl;

import com.craftify.backend.model.InventoryDetail;
import com.craftify.backend.model.InventoryNextCodeResponse;
import com.craftify.backend.model.InventoryPage;
import com.craftify.backend.model.InventoryUpsertRequest;
import com.craftify.backend.service.InventoryService;
import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class InventoryApiController {

  private static final Logger log = LoggerFactory.getLogger(InventoryApiController.class);

  private final InventoryService inventoryService;

  public InventoryApiController(InventoryService inventoryService) {
    this.inventoryService = inventoryService;
  }

  @GetMapping(value = "/inventory", produces = {"application/json"})
  public ResponseEntity<InventoryPage> inventoryGet(
      @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
      @RequestParam(value = "size", required = false, defaultValue = "8") Integer size,
      @RequestParam(value = "sort", required = false) @Nullable String sort,
      @RequestParam(value = "q", required = false) @Nullable String q,
      @RequestParam(value = "categoryName", required = false) @Nullable String categoryName,
      @RequestParam(value = "uom", required = false) @Nullable String uom) {

    log.info(
        "GET /inventory page={} size={} sort={} q={} categoryName={} uom={}",
        page,
        size,
        sort,
        q,
        categoryName,
        uom);

    InventoryPage body =
        inventoryService.list(
            new InventoryService.InventoryQuery(
                page == null ? 0 : page,
                size == null ? 8 : size,
                sort,
                q,
                categoryName,
                uom));

    return ResponseEntity.ok(body);
  }

  @GetMapping(value = "/inventory/{id}", produces = {"application/json"})
  public ResponseEntity<InventoryDetail> inventoryIdGet(@PathVariable("id") String id) {
    InventoryDetail existing = inventoryService.getByCode(id);
    if (existing == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok(existing);
  }

  @PostMapping(value = "/inventory", produces = {"application/json"}, consumes = {"application/json"})
  public ResponseEntity<InventoryDetail> inventoryPost(@RequestBody InventoryUpsertRequest req) {
    if (!isValidRequest(req)) {
      return ResponseEntity.badRequest().build();
    }

    InventoryDetail created = inventoryService.create(req);
    if (created == null) {
      return ResponseEntity.status(409).build();
    }

    return ResponseEntity.created(URI.create("/inventory/" + created.getCode())).body(created);
  }

  @PutMapping(value = "/inventory/{id}", produces = {"application/json"}, consumes = {"application/json"})
  public ResponseEntity<InventoryDetail> inventoryIdPut(
      @PathVariable("id") String id, @RequestBody InventoryUpsertRequest req) {
    if (!isValidRequest(req)) {
      return ResponseEntity.badRequest().build();
    }

    InventoryDetail updated = inventoryService.updateByCode(id, req);
    if (updated == null) {
      return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok(updated);
  }

  @DeleteMapping(value = "/inventory/{id}")
  public ResponseEntity<Void> inventoryIdDelete(@PathVariable("id") String id) {
    boolean deleted = inventoryService.deleteByCode(id);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
  }

  @GetMapping(value = "/inventory:next-code", produces = {"application/json"})
  public ResponseEntity<InventoryNextCodeResponse> inventoryNextCodeGet() {
    return ResponseEntity.ok(new InventoryNextCodeResponse(inventoryService.nextCode()));
  }

  private static boolean isValidRequest(InventoryUpsertRequest req) {
    if (req == null) {
      return false;
    }
    if (req.getItemId() == null || req.getItemId().isBlank()) {
      return false;
    }
    if (req.getItemName() == null || req.getItemName().isBlank()) {
      return false;
    }
    if (req.getItemCategoryName() == null || req.getItemCategoryName().isBlank()) {
      return false;
    }
    if (req.getUom() == null || req.getUom().isBlank()) {
      return false;
    }
    if (req.getAvailable() == null) {
      return false;
    }

    boolean detached = Boolean.TRUE.equals(req.getCategoryDetached());
    if (detached) {
      return req.getDetachedCategoryName() != null && !req.getDetachedCategoryName().isBlank();
    }
    return true;
  }
}
