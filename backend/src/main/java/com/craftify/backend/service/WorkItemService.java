package com.craftify.backend.service;

import com.craftify.backend.model.WorkItemDetail;
import com.craftify.backend.model.WorkItemList;
import com.craftify.backend.model.WorkItemPage;
import com.craftify.backend.model.WorkItemStatus;
import com.craftify.backend.persistence.entity.BomComponentEmbeddable;
import com.craftify.backend.persistence.entity.BomEntity;
import com.craftify.backend.persistence.entity.InventoryEntity;
import com.craftify.backend.persistence.entity.WorkItemEntity;
import com.craftify.backend.persistence.repository.BomRepository;
import com.craftify.backend.persistence.repository.InventoryRepository;
import com.craftify.backend.persistence.repository.WorkItemRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkItemService {

  public record WorkItemQuery(int page, int size, String sort, String q, WorkItemStatus status) {}

  private final WorkItemRepository workItemRepository;
  private final BomRepository bomRepository;
  private final InventoryRepository inventoryRepository;

  public WorkItemService(
      WorkItemRepository workItemRepository,
      BomRepository bomRepository,
      InventoryRepository inventoryRepository) {
    this.workItemRepository = workItemRepository;
    this.bomRepository = bomRepository;
    this.inventoryRepository = inventoryRepository;
  }

  @Transactional(readOnly = true)
  public WorkItemPage list(WorkItemQuery query) {
    Pageable pageable =
        PageRequest.of(Math.max(query.page(), 0), Math.max(query.size(), 1), parseSort(query.sort()));

    Specification<WorkItemEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          if (query.q() != null && !query.q().isBlank()) {
            String pattern = "%" + query.q().toLowerCase(Locale.ROOT) + "%";
            predicates.add(
                cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("bomId")), pattern),
                    cb.like(cb.lower(root.get("parentBomItem")), pattern),
                    cb.like(cb.lower(root.get("bomVersion")), pattern)));
          }
          if (query.status() != null) {
            predicates.add(cb.equal(root.get("status"), query.status()));
          }
          return cb.and(predicates.toArray(Predicate[]::new));
        };

    Page<WorkItemEntity> result = workItemRepository.findAll(spec, pageable);
    WorkItemPage page = new WorkItemPage();
    page.setContent(result.stream().map(this::toListModel).toList());
    page.setPage(result.getNumber());
    page.setSize(result.getSize());
    page.setTotalElements((int) result.getTotalElements());
    page.setTotalPages(Math.max(1, result.getTotalPages()));
    page.setSort(List.of(query.sort() == null || query.sort().isBlank() ? "requestedAt,desc" : query.sort()));
    return page;
  }

  @Transactional
  public WorkItemDetail requestFromBom(String bomId, BigDecimal requestedQty) {
    if (bomId == null || bomId.isBlank()) {
      throw new IllegalStateException("bom_not_found");
    }
    if (requestedQty == null || requestedQty.compareTo(BigDecimal.ZERO) <= 0) {
      throw new IllegalStateException("invalid_requested_qty");
    }

    BomEntity bom = bomRepository.findByCodeIgnoreCase(bomId.trim()).orElse(null);
    if (bom == null) {
      throw new IllegalStateException("bom_not_found");
    }

    List<BomComponentEmbeddable> components = bom.getComponents() == null ? List.of() : bom.getComponents();
    if (components.isEmpty()) {
      throw new IllegalStateException("invalid_bom_components");
    }

    Map<String, BigDecimal> requiredByItemCode = new HashMap<>();
    for (BomComponentEmbeddable c : components) {
      String itemCode = c.getItemId() == null ? "" : c.getItemId().trim().toUpperCase(Locale.ROOT);
      BigDecimal perUnit =
          c.getQuantity() == null
              ? BigDecimal.ZERO
              : c.getQuantity().setScale(6, RoundingMode.HALF_UP);
      if (itemCode.isBlank() || perUnit.compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalStateException("invalid_bom_components");
      }
      BigDecimal required = perUnit.multiply(requestedQty).setScale(6, RoundingMode.HALF_UP);
      requiredByItemCode.merge(itemCode, required, BigDecimal::add);
    }

    Map<String, InventoryEntity> inventoryByItemCode = new HashMap<>();
    for (Map.Entry<String, BigDecimal> e : requiredByItemCode.entrySet()) {
      String itemCode = e.getKey();
      BigDecimal required = e.getValue();
      InventoryEntity inv = inventoryRepository.findByItemIdIgnoreCase(itemCode).orElse(null);
      BigDecimal available = inv == null || inv.getAvailable() == null ? BigDecimal.ZERO : inv.getAvailable();
      if (inv == null || available.compareTo(required) < 0) {
        throw new IllegalStateException("insufficient_inventory");
      }
      inventoryByItemCode.put(itemCode, inv);
    }

    for (Map.Entry<String, BigDecimal> e : requiredByItemCode.entrySet()) {
      InventoryEntity inv = inventoryByItemCode.get(e.getKey());
      inv.setAvailable(inv.getAvailable().subtract(e.getValue()).setScale(6, RoundingMode.HALF_UP));
      inventoryRepository.save(inv);
    }

    WorkItemEntity entity = new WorkItemEntity();
    entity.setCode(generateNextCode());
    entity.setBomId(bom.getCode());
    entity.setParentBomItem(
        bom.getProductName() == null || bom.getProductName().isBlank()
            ? bom.getProductId()
            : bom.getProductName());
    entity.setBomVersion(
        (bom.getCode() == null ? "" : bom.getCode())
            + " "
            + (bom.getRevision() == null ? "" : bom.getRevision()));
    entity.setComponentsCount(components.size());
    entity.setRequestedQty(requestedQty.setScale(6, RoundingMode.HALF_UP));
    entity.setStatus(WorkItemStatus.QUEUED);
    WorkItemEntity created = workItemRepository.save(entity);
    return toDetailModel(created);
  }

  private String generateNextCode() {
    int max =
        workItemRepository.findAll().stream()
            .map(WorkItemEntity::getCode)
            .map(WorkItemService::extractNumericSuffix)
            .filter(n -> n >= 0)
            .max(Integer::compareTo)
            .orElse(0);
    return "WI-" + String.format("%03d", max + 1);
  }

  private static int extractNumericSuffix(String code) {
    if (code == null) return -1;
    int idx = code.lastIndexOf('-');
    if (idx < 0 || idx == code.length() - 1) return -1;
    try {
      return Integer.parseInt(code.substring(idx + 1));
    } catch (NumberFormatException ex) {
      return -1;
    }
  }

  private Sort parseSort(String sort) {
    String value = (sort == null || sort.isBlank()) ? "requestedAt,desc" : sort;
    String[] parts = value.split(",", 2);
    String key = parts[0].trim();
    Sort.Direction direction =
        (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim()))
            ? Sort.Direction.DESC
            : Sort.Direction.ASC;

    if ("id".equalsIgnoreCase(key) || "code".equalsIgnoreCase(key)) {
      return Sort.by(direction, "code");
    }
    if ("bomId".equalsIgnoreCase(key)) {
      return Sort.by(direction, "bomId");
    }
    if ("status".equalsIgnoreCase(key)) {
      return Sort.by(direction, "status");
    }
    if ("componentsCount".equalsIgnoreCase(key)) {
      return Sort.by(direction, "componentsCount");
    }
    return Sort.by(direction, "requestedAt");
  }

  private WorkItemList toListModel(WorkItemEntity e) {
    WorkItemList model = new WorkItemList();
    model.setId(e.getCode());
    model.setBomId(e.getBomId());
    model.setParentBomItem(e.getParentBomItem());
    model.setBomVersion(e.getBomVersion());
    model.setComponentsCount(e.getComponentsCount());
    model.setStatus(e.getStatus());
    model.setRequestedAt(e.getRequestedAt());
    return model;
  }

  private WorkItemDetail toDetailModel(WorkItemEntity e) {
    WorkItemDetail model = new WorkItemDetail();
    model.setId(e.getCode());
    model.setBomId(e.getBomId());
    model.setParentBomItem(e.getParentBomItem());
    model.setBomVersion(e.getBomVersion());
    model.setComponentsCount(e.getComponentsCount());
    model.setRequestedQty(e.getRequestedQty());
    model.setRequestedAt(e.getRequestedAt());
    model.setStatus(e.getStatus());
    model.setCreatedAt(e.getCreatedAt());
    model.setUpdatedAt(e.getUpdatedAt());
    model.setVersion((int) e.getVersion());
    return model;
  }
}
