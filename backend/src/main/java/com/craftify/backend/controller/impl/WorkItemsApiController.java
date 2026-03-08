package com.craftify.backend.controller.impl;

import com.craftify.backend.model.WorkItemDetail;
import com.craftify.backend.model.WorkItemPage;
import com.craftify.backend.model.WorkItemRequest;
import com.craftify.backend.model.WorkItemStatus;
import com.craftify.backend.service.WorkItemService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorkItemsApiController {

  private static final Logger log = LoggerFactory.getLogger(WorkItemsApiController.class);
  private static final String HEADER_ERROR_CODE = "X-Error-Code";
  private static final String ERROR_BOM_NOT_FOUND = "bom_not_found";
  private static final String ERROR_INVALID_REQUESTED_QTY = "invalid_requested_qty";
  private static final String ERROR_INSUFFICIENT_INVENTORY = "insufficient_inventory";
  private static final String ERROR_OUTPUT_ITEM_NOT_FOUND = "output_item_not_found";
  private static final String ERROR_COMPONENT_ITEM_NOT_FOUND = "component_item_not_found";
  private static final String ERROR_WORK_ITEM_NOT_FOUND = "work_item_not_found";
  private static final String ERROR_WORK_ITEM_NOT_CANCELABLE = "work_item_not_cancelable";
  private static final String ERROR_WORK_ITEM_NOT_COMPLETABLE = "work_item_not_completable";
  private static final String ERROR_INVALID_WORK_ITEM_SNAPSHOT = "invalid_work_item_snapshot";

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
  public ResponseEntity<WorkItemDetail> workItemsRequestPost(@Valid @NotNull @RequestBody WorkItemRequest req) {
    try {
      WorkItemDetail created = workItemService.requestFromBom(req.getBomId(), req.getRequestedQty());
      return ResponseEntity.created(URI.create("/work-items/" + created.getId())).body(created);
    } catch (IllegalStateException ex) {
      if (ERROR_BOM_NOT_FOUND.equals(ex.getMessage())) {
        return ResponseEntity.notFound().build();
      }
      if (ERROR_INVALID_REQUESTED_QTY.equals(ex.getMessage())) {
        return badRequestWithCode(ERROR_INVALID_REQUESTED_QTY).build();
      }
      if (isRequestConflict(ex.getMessage())) {
        return conflictWithCode(ex.getMessage()).build();
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
      if (ERROR_WORK_ITEM_NOT_FOUND.equals(ex.getMessage())) {
        return ResponseEntity.notFound().build();
      }
      if (isCancelConflict(ex.getMessage())) {
        return conflictWithCode(ex.getMessage()).build();
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
      if (ERROR_WORK_ITEM_NOT_FOUND.equals(ex.getMessage())) {
        return ResponseEntity.notFound().build();
      }
      if (isCompleteConflict(ex.getMessage())) {
        return conflictWithCode(ex.getMessage()).build();
      }
      return ResponseEntity.badRequest().build();
    }
  }

  private static boolean isRequestConflict(String errorCode) {
    return ERROR_INSUFFICIENT_INVENTORY.equals(errorCode)
        || ERROR_OUTPUT_ITEM_NOT_FOUND.equals(errorCode)
        || ERROR_COMPONENT_ITEM_NOT_FOUND.equals(errorCode);
  }

  private static boolean isCancelConflict(String errorCode) {
    return ERROR_WORK_ITEM_NOT_CANCELABLE.equals(errorCode)
        || ERROR_INVALID_WORK_ITEM_SNAPSHOT.equals(errorCode);
  }

  private static boolean isCompleteConflict(String errorCode) {
    return ERROR_WORK_ITEM_NOT_COMPLETABLE.equals(errorCode)
        || ERROR_INVALID_WORK_ITEM_SNAPSHOT.equals(errorCode);
  }

  private static ResponseEntity.BodyBuilder badRequestWithCode(String errorCode) {
    return ResponseEntity.badRequest().header(HEADER_ERROR_CODE, errorCode);
  }

  private static ResponseEntity.BodyBuilder conflictWithCode(String errorCode) {
    return ResponseEntity.status(409).header(HEADER_ERROR_CODE, errorCode);
  }
}
