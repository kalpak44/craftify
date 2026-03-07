package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.ItemsApi;
import com.craftify.backend.model.CreateItemRequest;
import com.craftify.backend.model.ItemDetail;
import com.craftify.backend.model.ItemPage;
import com.craftify.backend.model.Status;
import com.craftify.backend.model.UpdateItemRequest;
import com.craftify.backend.service.ItemService;
import com.craftify.backend.utils.HttpHeaderVersionUtil;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ItemsApiController implements ItemsApi {

  private static final Logger log = LoggerFactory.getLogger(ItemsApiController.class);
  private static final String HEADER_ERROR_CODE = "X-Error-Code";
  private static final String ERROR_ITEM_IN_USE = "item_in_use";
  private static final String ERROR_CODE_CONFLICT = "code_conflict";
  private static final String ERROR_ITEM_IN_USE_CODE_CHANGE = "item_in_use_code_change";

  private final ItemService itemService;

  public ItemsApiController(ItemService itemService) {
    this.itemService = itemService;
  }

  @Override
  public ResponseEntity<ItemPage> itemsGet(
      Integer page,
      Integer size,
      @Nullable String sort,
      @Nullable String q,
      @Nullable Status status,
      @Nullable UUID categoryId,
      @Nullable String uom,
      Boolean includeDeleted) {
    String categoryName = null;
    ServletRequestAttributes attrs =
        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    if (attrs != null && attrs.getRequest() != null) {
      categoryName = attrs.getRequest().getParameter("categoryName");
    }

    log.info(
        "GET /items page={} size={} sort={} q={} status={} categoryId={} categoryName={} uom={} includeDeleted={}",
        page,
        size,
        sort,
        q,
        status,
        categoryId,
        categoryName,
        uom,
        includeDeleted);

    ItemPage body =
        itemService.list(
            new ItemService.ItemQuery(
                page == null ? 0 : page,
                size == null ? 8 : size,
                sort,
                q,
                status,
                categoryName,
                uom,
                includeDeleted != null && includeDeleted));

    return ResponseEntity.ok(body);
  }

  @Override
  public ResponseEntity<Void> itemsIdDelete(String id, String ifMatch) {
    Integer expectedVersion = HttpHeaderVersionUtil.parseIfMatchVersion(ifMatch);
    if (expectedVersion == null) {
      return ResponseEntity.status(412).build();
    }
    try {
      boolean deleted = itemService.deleteByCode(id, expectedVersion);
      return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    } catch (IllegalStateException ex) {
      if (ERROR_ITEM_IN_USE.equals(ex.getMessage())) {
        return conflict(ERROR_ITEM_IN_USE).build();
      }
      return ResponseEntity.status(412).build();
    }
  }

  @Override
  public ResponseEntity<ItemDetail> itemsIdGet(String id) {
    ItemDetail existing = itemService.getByCode(id);
    if (existing == null) {
      return ResponseEntity.notFound().build();
    }
    return ResponseEntity.ok().eTag(HttpHeaderVersionUtil.toWeakEtag(existing.getVersion())).body(existing);
  }

  @Override
  public ResponseEntity<ItemDetail> itemsIdPut(String id, String ifMatch, @Valid @NotNull UpdateItemRequest req) {
    Integer expectedVersion = HttpHeaderVersionUtil.parseIfMatchVersion(ifMatch);
    if (expectedVersion == null) {
      return ResponseEntity.status(412).build();
    }

    try {
      ItemDetail updated = itemService.updateByCode(id, req, expectedVersion);
      if (updated == null) {
        return ResponseEntity.notFound().build();
      }
      return ResponseEntity.ok().eTag(HttpHeaderVersionUtil.toWeakEtag(updated.getVersion())).body(updated);
    } catch (IllegalStateException ex) {
      if (ERROR_CODE_CONFLICT.equals(ex.getMessage())) {
        return ResponseEntity.status(409).build();
      }
      if (ERROR_ITEM_IN_USE_CODE_CHANGE.equals(ex.getMessage())) {
        return conflict(ERROR_ITEM_IN_USE_CODE_CHANGE).build();
      }
      return ResponseEntity.status(412).build();
    }
  }

  @Override
  public ResponseEntity<ItemDetail> itemsPost(@Valid @NotNull CreateItemRequest req) {
    ItemDetail created = itemService.create(req);
    if (created == null) {
      return ResponseEntity.status(409).build();
    }

    return ResponseEntity.created(URI.create("/items/" + created.getCode()))
        .eTag(HttpHeaderVersionUtil.toWeakEtag(created.getVersion()))
        .body(created);
  }

  private static ResponseEntity.BodyBuilder conflict(String errorCode) {
    return ResponseEntity.status(409).header(HEADER_ERROR_CODE, errorCode);
  }
}
