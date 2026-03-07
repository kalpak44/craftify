package com.craftify.backend.controller.impl;

import com.craftify.backend.model.WorkItemDetail;
import com.craftify.backend.model.WorkItemPage;
import com.craftify.backend.model.WorkItemRequest;
import com.craftify.backend.model.WorkItemStatus;
import com.craftify.backend.service.WorkItemService;
import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorkItemsApiController {

  private static final Logger log = LoggerFactory.getLogger(WorkItemsApiController.class);

  private final WorkItemService workItemService;

  public WorkItemsApiController(WorkItemService workItemService) {
    this.workItemService = workItemService;
  }

  @GetMapping(value = "/work-items", produces = {"application/json"})
  public ResponseEntity<WorkItemPage> workItemsGet(
      @RequestParam(value = "page", required = false, defaultValue = "0") Integer page,
      @RequestParam(value = "size", required = false, defaultValue = "8") Integer size,
      @RequestParam(value = "sort", required = false) @Nullable String sort,
      @RequestParam(value = "q", required = false) @Nullable String q,
      @RequestParam(value = "status", required = false) @Nullable WorkItemStatus status) {
    log.info("GET /work-items page={} size={} sort={} q={} status={}", page, size, sort, q, status);
    WorkItemPage body =
        workItemService.list(
            new WorkItemService.WorkItemQuery(
                page == null ? 0 : page, size == null ? 8 : size, sort, q, status));
    return ResponseEntity.ok(body);
  }

  @PostMapping(
      value = "/work-items:request",
      consumes = {"application/json"},
      produces = {"application/json"})
  public ResponseEntity<WorkItemDetail> workItemsRequestPost(@RequestBody WorkItemRequest req) {
    if (req == null || req.getBomId() == null || req.getBomId().isBlank() || req.getRequestedQty() == null) {
      return ResponseEntity.badRequest().build();
    }
    try {
      WorkItemDetail created = workItemService.requestFromBom(req.getBomId(), req.getRequestedQty());
      return ResponseEntity.created(URI.create("/work-items/" + created.getId())).body(created);
    } catch (IllegalStateException ex) {
      if ("bom_not_found".equals(ex.getMessage())) {
        return ResponseEntity.notFound().build();
      }
      if ("invalid_requested_qty".equals(ex.getMessage())) {
        return ResponseEntity.badRequest().header("X-Error-Code", "invalid_requested_qty").build();
      }
      if ("insufficient_inventory".equals(ex.getMessage())
          || "output_item_not_found".equals(ex.getMessage())
          || "component_item_not_found".equals(ex.getMessage())) {
        return ResponseEntity.status(409).header("X-Error-Code", ex.getMessage()).build();
      }
      return ResponseEntity.badRequest().build();
    }
  }

  @PostMapping(value = "/work-items/{id}:cancel", produces = {"application/json"})
  public ResponseEntity<WorkItemDetail> workItemsIdCancelPost(@PathVariable("id") String id) {
    try {
      WorkItemDetail updated = workItemService.cancel(id);
      return ResponseEntity.ok(updated);
    } catch (IllegalStateException ex) {
      if ("work_item_not_found".equals(ex.getMessage())) {
        return ResponseEntity.notFound().build();
      }
      if ("work_item_not_cancelable".equals(ex.getMessage())
          || "invalid_work_item_snapshot".equals(ex.getMessage())) {
        return ResponseEntity.status(409).header("X-Error-Code", ex.getMessage()).build();
      }
      return ResponseEntity.badRequest().build();
    }
  }

  @PostMapping(value = "/work-items/{id}:complete", produces = {"application/json"})
  public ResponseEntity<WorkItemDetail> workItemsIdCompletePost(@PathVariable("id") String id) {
    try {
      WorkItemDetail updated = workItemService.complete(id);
      return ResponseEntity.ok(updated);
    } catch (IllegalStateException ex) {
      if ("work_item_not_found".equals(ex.getMessage())) {
        return ResponseEntity.notFound().build();
      }
      if ("work_item_not_completable".equals(ex.getMessage())
          || "invalid_work_item_snapshot".equals(ex.getMessage())) {
        return ResponseEntity.status(409).header("X-Error-Code", ex.getMessage()).build();
      }
      return ResponseEntity.badRequest().build();
    }
  }
}
