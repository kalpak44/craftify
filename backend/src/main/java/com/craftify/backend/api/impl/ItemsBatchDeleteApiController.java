package com.craftify.backend.api.impl;

import com.craftify.backend.api.ItemsBatchDeleteApi;
import com.craftify.backend.api.model.ItemsBatchDeletePost200Response;
import com.craftify.backend.api.model.ItemsBatchDeletePostRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Objects;

/**
 * Dummy implementation of ItemsBatchDeleteApi.
 * Returns the number of IDs received as "deleted".
 */
@RestController
public class ItemsBatchDeleteApiController implements ItemsBatchDeleteApi {

    private static final Logger log = LoggerFactory.getLogger(ItemsBatchDeleteApiController.class);

    @Override
    public ResponseEntity<ItemsBatchDeletePost200Response> itemsBatchDeletePost(ItemsBatchDeletePostRequest request) {
        List<java.util.UUID> ids = (request != null) ? request.getIds() : null;
        int deleted = (ids == null) ? 0 : (int) ids.stream().filter(Objects::nonNull).distinct().count();

        log.info("POST /items:batch-delete (dummy) ids={} -> deleted={}", ids, deleted);

        ItemsBatchDeletePost200Response body = new ItemsBatchDeletePost200Response().deleted(deleted);
        return ResponseEntity.ok(body);
    }
}
