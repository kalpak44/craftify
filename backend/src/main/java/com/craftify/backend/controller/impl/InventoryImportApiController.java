package com.craftify.backend.controller.impl;

import com.craftify.backend.model.ImportResult;
import com.craftify.backend.service.csv.CsvImportExecution;
import com.craftify.backend.service.csv.InventoryCsvImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class InventoryImportApiController {

  private final InventoryCsvImportService inventoryCsvImportService;

  public InventoryImportApiController(InventoryCsvImportService inventoryCsvImportService) {
    this.inventoryCsvImportService = inventoryCsvImportService;
  }

  @PostMapping(
      value = "/inventory:import",
      consumes = {"multipart/form-data"},
      produces = {"application/json", "application/problem+json"})
  public ResponseEntity<ImportResult> inventoryImportPost(
      @RequestPart(value = "file", required = true) MultipartFile file,
      @RequestParam(value = "mode", required = false, defaultValue = "upsert") String mode) {
    CsvImportExecution execution = inventoryCsvImportService.importCsv(file, mode);
    return ResponseEntity.status(execution.status()).body(execution.body());
  }
}
