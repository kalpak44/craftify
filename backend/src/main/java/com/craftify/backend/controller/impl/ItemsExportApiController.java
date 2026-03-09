package com.craftify.backend.controller.impl;

import com.craftify.backend.controller.ItemsExportApi;
import com.craftify.backend.model.Status;
import com.craftify.backend.service.csv.CsvExportPayload;
import com.craftify.backend.service.csv.ItemsCsvExportService;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import jakarta.annotation.Nullable;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ItemsExportApiController implements ItemsExportApi {

  private final ItemsCsvExportService itemsCsvExportService;

  public ItemsExportApiController(ItemsCsvExportService itemsCsvExportService) {
    this.itemsCsvExportService = itemsCsvExportService;
  }

  @Override
  public ResponseEntity<org.springframework.core.io.Resource> itemsExportGet(
      @Nullable String q,
      @Nullable Status status,
      @Nullable UUID categoryId,
      @Nullable String uom,
      @Nullable String ids) {
    String categoryName = null;
    ServletRequestAttributes attrs =
        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    if (attrs != null && attrs.getRequest() != null) {
      categoryName = attrs.getRequest().getParameter("categoryName");
    }

    CsvExportPayload payload = itemsCsvExportService.export(q, status, categoryId, categoryName, uom, ids);
    return ResponseEntity.ok()
        .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + payload.filename() + "\"")
        .header(HttpHeaders.CACHE_CONTROL, "no-store")
        .body(payload.resource());
  }
}
