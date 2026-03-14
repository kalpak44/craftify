package com.craftify.backend.controller.impl;

import com.craftify.backend.model.WorkItemDetail;
import com.craftify.backend.model.WorkItemPage;
import com.craftify.backend.model.WorkItemQuery;
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
            new WorkItemQuery(page == null ? 0 : page, size == null ? 8 : size, sort, q, status));
    return ResponseEntity.ok(body);
  }

  @PostMapping(
      value = "/work-items:request",
      consumes = {"application/json"},
      produces = {"application/json"})
  public ResponseEntity<WorkItemDetail> workItemsRequestPost(@Valid @NotNull @RequestBody WorkItemRequest req) {
    WorkItemDetail created = workItemService.requestFromBom(req.getBomId(), req.getRequestedQty());
    return ResponseEntity.created(URI.create("/work-items/" + created.getId())).body(created);
  }

  @PostMapping(value = "/work-items/{id}:cancel", produces = {"application/json"})
  public ResponseEntity<WorkItemDetail> workItemsIdCancelPost(@PathVariable("id") String id) {
    WorkItemDetail updated = workItemService.cancel(id);
    return ResponseEntity.ok(updated);
  }

  @PostMapping(value = "/work-items/{id}:complete", produces = {"application/json"})
  public ResponseEntity<WorkItemDetail> workItemsIdCompletePost(@PathVariable("id") String id) {
    WorkItemDetail updated = workItemService.complete(id);
    return ResponseEntity.ok(updated);
  }
}
