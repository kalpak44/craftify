package com.craftify.backend.api.impl;

import com.craftify.backend.api.ItemsImportApi;
import com.craftify.backend.api.model.ImportResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Dummy implementation of ItemsImportApi.
 * Replace with real CSV parsing + persistence logic later.
 */
@RestController
public class ItemsImportApiController implements ItemsImportApi {

    private static final Logger log = LoggerFactory.getLogger(ItemsImportApiController.class);

    @Override
    public ResponseEntity<ImportResult> itemsImportPost(MultipartFile file, String mode) {
        log.info("POST /items:import called (dummy implementation) mode={} fileName={} size={}",
                mode, file.getOriginalFilename(), file.getSize());

        // Build a dummy result
        ImportResult result = new ImportResult()
                .created(3)
                .updated(1)
                .errors(List.of());

        return ResponseEntity.ok(result);
    }
}
