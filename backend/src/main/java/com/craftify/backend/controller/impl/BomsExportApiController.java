package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.BomsExportApi;
import com.craftify.backend.model.BomStatus;
import com.craftify.backend.service.csv.BomsCsvExportService;
import com.craftify.backend.service.csv.CsvExportPayload;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import jakarta.annotation.Nullable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BomsExportApiController implements BomsExportApi {

  private final BomsCsvExportService bomsCsvExportService;

  public BomsExportApiController(BomsCsvExportService bomsCsvExportService) {
    this.bomsCsvExportService = bomsCsvExportService;
  }

  @Override
  public ResponseEntity<org.springframework.core.io.Resource> bomsExportGet(
      @Nullable String q, @Nullable BomStatus status, @Nullable String ids) {
    CsvExportPayload payload = bomsCsvExportService.export(q, status, ids);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.filename() + "\"")
        .header(HttpHeaders.CACHE_CONTROL, "no-store")
        .body(payload.resource());
  }
}
