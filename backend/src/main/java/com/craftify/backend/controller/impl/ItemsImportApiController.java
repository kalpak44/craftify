package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.ItemsImportApi;
import com.craftify.backend.model.ImportResult;
import com.craftify.backend.service.csv.CsvImportExecution;
import com.craftify.backend.service.csv.ItemsCsvImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class ItemsImportApiController implements ItemsImportApi {

  private final ItemsCsvImportService itemsCsvImportService;

  public ItemsImportApiController(ItemsCsvImportService itemsCsvImportService) {
    this.itemsCsvImportService = itemsCsvImportService;
  }

  @Override
  public ResponseEntity<ImportResult> itemsImportPost(MultipartFile file, String mode) {
    CsvImportExecution execution = itemsCsvImportService.importCsv(file, mode);
    return ResponseEntity.status(execution.status()).body(execution.body());
  }
}
