package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.ItemsBatchDeleteApi;
import com.craftify.backend.model.ItemsBatchDeletePost200Response;
import com.craftify.backend.model.ItemsBatchDeletePostRequest;
import com.craftify.backend.service.ItemService;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ItemsBatchDeleteApiController implements ItemsBatchDeleteApi {

  private static final Logger log = LoggerFactory.getLogger(ItemsBatchDeleteApiController.class);

  private final ItemService itemService;

  public ItemsBatchDeleteApiController(ItemService itemService) {
    this.itemService = itemService;
  }

  @Override
  public ResponseEntity<ItemsBatchDeletePost200Response> itemsBatchDeletePost(
      ItemsBatchDeletePostRequest request) {
    List<UUID> ids = (request == null || request.getIds() == null) ? List.of() : request.getIds();
    int deleted = itemService.softDeleteByIds(ids);
    log.info("POST /items:batch-delete ids={} -> deleted={}", ids, deleted);
    return ResponseEntity.ok(new ItemsBatchDeletePost200Response().deleted(deleted));
  }
}
