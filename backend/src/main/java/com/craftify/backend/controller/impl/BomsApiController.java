package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.BomsApi;
import com.craftify.backend.model.BomDetail;
import com.craftify.backend.model.BomPage;
import com.craftify.backend.model.BomStatus;
import com.craftify.backend.service.BomService;
import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BomsApiController implements BomsApi {

  private static final Logger log = LoggerFactory.getLogger(BomsApiController.class);

  private final BomService bomService;

  public BomsApiController(BomService bomService) {
    this.bomService = bomService;
  }

  @Override
  public ResponseEntity<BomPage> bomsGet(
      Integer page,
      Integer size,
      @Nullable String sort,
      @Nullable String q,
      @Nullable BomStatus status) {
    log.info("GET /boms page={} size={} sort={} q={} status={}", page, size, sort, q, status);
    BomPage body =
        bomService.list(
            new BomService.BomQuery(
                page == null ? 0 : page, size == null ? 8 : size, sort, q, status));
    return ResponseEntity.ok(body);
  }

  @Override
  public ResponseEntity<BomDetail> bomsIdGet(String id) {
    BomDetail existing = bomService.getByCode(id);
    if (existing == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok().eTag(BomService.toWeakEtag(existing.getVersion())).body(existing);
  }

  @Override
  public ResponseEntity<BomDetail> bomsPost(BomDetail req) {
    if (req == null
        || req.getProductId() == null
        || req.getProductId().isBlank()
        || req.getRevision() == null
        || req.getRevision().isBlank()
        || req.getStatus() == null) {
      return ResponseEntity.badRequest().build();
    }
    BomDetail created = bomService.create(req);
    if (created == null) {
      return ResponseEntity.status(409).build();
    }
    return ResponseEntity.created(URI.create("/boms/" + created.getId()))
        .eTag(BomService.toWeakEtag(created.getVersion()))
        .body(created);
  }

  @Override
  public ResponseEntity<BomDetail> bomsIdPut(String id, String ifMatch, BomDetail req) {
    if (req == null
        || req.getProductId() == null
        || req.getProductId().isBlank()
        || req.getRevision() == null
        || req.getRevision().isBlank()
        || req.getStatus() == null) {
      return ResponseEntity.badRequest().build();
    }
    Integer expectedVersion = BomService.parseIfMatchVersion(ifMatch);
    if (expectedVersion == null) {
      return ResponseEntity.status(412).build();
    }

    try {
      BomDetail updated = bomService.updateByCode(id, req, expectedVersion);
      if (updated == null) {
        return ResponseEntity.notFound().build();
      }
      return ResponseEntity.ok().eTag(BomService.toWeakEtag(updated.getVersion())).body(updated);
    } catch (IllegalStateException ex) {
      return ResponseEntity.status(412).build();
    }
  }

  @Override
  public ResponseEntity<Void> bomsIdDelete(String id, String ifMatch) {
    Integer expectedVersion = BomService.parseIfMatchVersion(ifMatch);
    if (expectedVersion == null) {
      return ResponseEntity.status(412).build();
    }
    try {
      boolean deleted = bomService.deleteByCode(id, expectedVersion);
      return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    } catch (IllegalStateException ex) {
      return ResponseEntity.status(412).build();
    }
  }
}
