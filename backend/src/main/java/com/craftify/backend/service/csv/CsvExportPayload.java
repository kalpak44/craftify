package com.craftify.backend.service.csv;

import org.springframework.core.io.Resource;

public record CsvExportPayload(Resource resource, String filename) {}
