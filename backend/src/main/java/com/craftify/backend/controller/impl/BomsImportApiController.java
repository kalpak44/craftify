package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.BomsImportApi;
import com.craftify.backend.model.ImportResult;
import com.craftify.backend.service.csv.BomsCsvImportService;
import com.craftify.backend.service.csv.CsvImportExecution;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class BomsImportApiController implements BomsImportApi {

  private final BomsCsvImportService bomsCsvImportService;

  public BomsImportApiController(BomsCsvImportService bomsCsvImportService) {
    this.bomsCsvImportService = bomsCsvImportService;
  }

  @Override
  public ResponseEntity<ImportResult> bomsImportPost(MultipartFile file, String mode) {
    CsvImportExecution execution = bomsCsvImportService.importCsv(file, mode);
    return ResponseEntity.status(execution.status()).body(execution.body());
  }
}
