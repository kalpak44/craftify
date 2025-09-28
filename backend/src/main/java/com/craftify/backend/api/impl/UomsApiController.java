package com.craftify.backend.api.impl;

import com.craftify.backend.api.UomsApi;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

/**
 * Dummy implementation of UomsApi.
 * Replace with a service layer + repository later.
 */
@RestController
public class UomsApiController implements UomsApi {

    private static final Logger log = LoggerFactory.getLogger(UomsApiController.class);

    @Override
    public ResponseEntity<List<String>> uomsGet() {
        log.info("GET /uoms called (dummy implementation)");

        // dummy list of common units of measure
        List<String> uoms = Arrays.asList("pcs", "ea", "kg", "L", "box", "pack");

        // You can add caching headers or ETags here if needed
        return ResponseEntity.ok(uoms);
    }
}
