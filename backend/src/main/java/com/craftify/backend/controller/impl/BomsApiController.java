package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.BomsApi;
import com.craftify.backend.model.BomDetail;
import com.craftify.backend.model.BomPage;
import com.craftify.backend.model.BomQuery;
import com.craftify.backend.model.BomStatus;
import com.craftify.backend.service.BomService;
import com.craftify.backend.utils.HttpHeaderVersionUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BomsApiController implements BomsApi {

  private static final Logger log = LoggerFactory.getLogger(BomsApiController.class);
  private static final String ERROR_BOM_CODE_CONFLICT = "bom_code_conflict";

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
        bomService.list(new BomQuery(page == null ? 0 : page, size == null ? 8 : size, sort, q, status));
    return ResponseEntity.ok(body);
  }

  @Override
  public ResponseEntity<BomDetail> bomsIdGet(String id) {
    BomDetail existing = bomService.getByCode(id);
    if (existing == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok().eTag(HttpHeaderVersionUtil.toWeakEtag(existing.getVersion())).body(existing);
  }

  @Override
  public ResponseEntity<BomDetail> bomsPost(BomDetail req) {
    BomDetail created = bomService.create(req);
    if (created == null) {
      return ResponseEntity.status(409).header("X-Error-Code", ERROR_BOM_CODE_CONFLICT).build();
    }
    return ResponseEntity.created(URI.create("/boms/" + created.getId()))
        .eTag(HttpHeaderVersionUtil.toWeakEtag(created.getVersion()))
        .body(created);
  }

  @Override
  public ResponseEntity<BomDetail> bomsIdPut(String id, String ifMatch, BomDetail req) {
    Integer expectedVersion = HttpHeaderVersionUtil.parseIfMatchVersion(ifMatch);
    if (expectedVersion == null) {
      return ResponseEntity.status(412).build();
    }

    BomDetail updated = bomService.updateByCode(id, req, expectedVersion);
    if (updated == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok().eTag(HttpHeaderVersionUtil.toWeakEtag(updated.getVersion())).body(updated);
  }

  @Override
  public ResponseEntity<Void> bomsIdDelete(String id, String ifMatch) {
    Integer expectedVersion = HttpHeaderVersionUtil.parseIfMatchVersion(ifMatch);
    if (expectedVersion == null) {
      return ResponseEntity.status(412).build();
    }
    boolean deleted = bomService.deleteByCode(id, expectedVersion);
    return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
  }
}
