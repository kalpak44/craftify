package com.craftify.backend.service;

import com.craftify.backend.model.WorkItemDetail;
import com.craftify.backend.model.WorkItemList;
import com.craftify.backend.model.WorkItemPage;
import com.craftify.backend.model.WorkItemStatus;
import com.craftify.backend.persistence.entity.BomComponentEmbeddable;
import com.craftify.backend.persistence.entity.BomEntity;
import com.craftify.backend.persistence.entity.ItemEntity;
import com.craftify.backend.persistence.entity.InventoryEntity;
import com.craftify.backend.persistence.entity.WorkItemEntity;
import com.craftify.backend.persistence.repository.BomRepository;
import com.craftify.backend.persistence.repository.ItemRepository;
import com.craftify.backend.persistence.repository.InventoryRepository;
import com.craftify.backend.persistence.repository.WorkItemRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
  private final ItemRepository itemRepository;
  private final InventoryRepository inventoryRepository;
  private final CurrentUserService currentUserService;
  private final CategoryService categoryService;
  private final ObjectMapper objectMapper = new ObjectMapper();

  public WorkItemService(
      WorkItemRepository workItemRepository,
      BomRepository bomRepository,
      ItemRepository itemRepository,
      InventoryRepository inventoryRepository,
      CurrentUserService currentUserService,
      CategoryService categoryService) {
    this.workItemRepository = workItemRepository;
    this.bomRepository = bomRepository;
    this.itemRepository = itemRepository;
    this.inventoryRepository = inventoryRepository;
    this.currentUserService = currentUserService;
    this.categoryService = categoryService;
  }

  @Transactional(readOnly = true)
  public WorkItemPage list(WorkItemQuery query) {
    String ownerSub = currentUserService.requiredSub();
    Pageable pageable =
        PageRequest.of(Math.max(query.page(), 0), Math.max(query.size(), 1), parseSort(query.sort()));

    Specification<WorkItemEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          predicates.add(cb.equal(root.get("ownerSub"), ownerSub));
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
    String ownerSub = currentUserService.requiredSub();
    if (bomId == null || bomId.isBlank()) {
      throw new IllegalStateException("bom_not_found");
    }
    if (requestedQty == null || requestedQty.compareTo(BigDecimal.ZERO) <= 0) {
      throw new IllegalStateException("invalid_requested_qty");
    }

    BomEntity bom = bomRepository.findByCodeIgnoreCaseAndOwnerSub(bomId.trim(), ownerSub).orElse(null);
    if (bom == null) {
      throw new IllegalStateException("bom_not_found");
    }
    String outputItemId = bom.getProductId() == null ? "" : bom.getProductId().trim().toUpperCase(Locale.ROOT);
    if (outputItemId.isBlank()) {
      throw new IllegalStateException("invalid_product_item");
    }
    ItemEntity outputItem = itemRepository.findByCodeIgnoreCaseAndOwnerSub(outputItemId, ownerSub).orElse(null);
    if (outputItem == null) {
      throw new IllegalStateException("output_item_not_found");
    }

    List<BomComponentEmbeddable> components = bom.getComponents() == null ? List.of() : bom.getComponents();
    if (components.isEmpty()) {
      throw new IllegalStateException("invalid_bom_components");
    }

    Map<String, BigDecimal> requiredByItemCode = new HashMap<>();
    Map<String, ItemEntity> componentItems = new HashMap<>();
    for (BomComponentEmbeddable c : components) {
      String itemCode = c.getItemId() == null ? "" : c.getItemId().trim().toUpperCase(Locale.ROOT);
      BigDecimal perUnit =
          c.getQuantity() == null
              ? BigDecimal.ZERO
              : c.getQuantity().setScale(6, RoundingMode.HALF_UP);
      if (itemCode.isBlank() || perUnit.compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalStateException("invalid_bom_components");
      }
      ItemEntity componentItem = itemRepository.findByCodeIgnoreCaseAndOwnerSub(itemCode, ownerSub).orElse(null);
      if (componentItem == null) {
        throw new IllegalStateException("component_item_not_found");
      }
      componentItems.put(itemCode, componentItem);
      BigDecimal required = perUnit.multiply(requestedQty).setScale(6, RoundingMode.HALF_UP);
      requiredByItemCode.merge(itemCode, required, BigDecimal::add);
    }

    Map<String, InventoryEntity> inventoryByItemCode = new HashMap<>();
    for (Map.Entry<String, BigDecimal> e : requiredByItemCode.entrySet()) {
      String itemCode = e.getKey();
      BigDecimal required = e.getValue();
      InventoryEntity inv = inventoryRepository.findByItemIdIgnoreCaseAndOwnerSub(itemCode, ownerSub).orElse(null);
      BigDecimal available = inv == null || inv.getAvailable() == null ? BigDecimal.ZERO : inv.getAvailable();
      if (inv == null || available.compareTo(required) < 0) {
        throw new IllegalStateException("insufficient_inventory");
      }
      inventoryByItemCode.put(itemCode, inv);
    }

    List<AllocatedComponentSnapshot> allocatedComponents = new ArrayList<>();
    for (Map.Entry<String, BigDecimal> e : requiredByItemCode.entrySet()) {
      ItemEntity item = componentItems.get(e.getKey());
      allocatedComponents.add(
          new AllocatedComponentSnapshot(
              e.getKey(),
              item != null && item.getName() != null && !item.getName().isBlank() ? item.getName() : e.getKey(),
              item != null && item.getCategoryName() != null && !item.getCategoryName().isBlank()
                  ? item.getCategoryName()
                  : "Unknown",
              item != null && item.getUomBase() != null && !item.getUomBase().isBlank() ? item.getUomBase() : "pcs",
              e.getValue().setScale(6, RoundingMode.HALF_UP)));
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
    entity.setOutputItemId(outputItemId);
    entity.setOutputItemName(
        outputItem.getName() != null && !outputItem.getName().isBlank()
            ? outputItem.getName()
            : (bom.getProductName() == null || bom.getProductName().isBlank() ? outputItemId : bom.getProductName()));
    entity.setOutputItemCategoryName(
        outputItem.getCategoryName() != null && !outputItem.getCategoryName().isBlank()
            ? outputItem.getCategoryName()
            : "Unknown");
    entity.setOutputItemUom(
        outputItem.getUomBase() != null && !outputItem.getUomBase().isBlank() ? outputItem.getUomBase() : "pcs");
    entity.setAllocatedComponentsJson(toAllocatedComponentsJson(allocatedComponents));
    entity.setRequestedQty(requestedQty.setScale(6, RoundingMode.HALF_UP));
    entity.setStatus(WorkItemStatus.QUEUED);
    entity.setOwnerSub(ownerSub);
    WorkItemEntity created = workItemRepository.save(entity);
    return toDetailModel(created);
  }

  @Transactional
  public WorkItemDetail cancel(String id) {
    String ownerSub = currentUserService.requiredSub();
    if (id == null || id.isBlank()) {
      throw new IllegalStateException("work_item_not_found");
    }
    WorkItemEntity existing = workItemRepository.findByCodeIgnoreCaseAndOwnerSub(id.trim(), ownerSub).orElse(null);
    if (existing == null) {
      throw new IllegalStateException("work_item_not_found");
    }
    if (existing.getStatus() == WorkItemStatus.CANCELED || existing.getStatus() == WorkItemStatus.COMPLETED) {
      throw new IllegalStateException("work_item_not_cancelable");
    }

    List<AllocatedComponentSnapshot> allocations = parseAllocatedComponentsJson(existing.getAllocatedComponentsJson());
    if (allocations.isEmpty()) {
      allocations = deriveAllocationsFromBom(existing.getBomId(), existing.getRequestedQty(), ownerSub);
    }
    if (allocations.isEmpty()) {
      throw new IllegalStateException("invalid_work_item_snapshot");
    }

    for (AllocatedComponentSnapshot alloc : allocations) {
      InventoryEntity inv =
          inventoryRepository.findByItemIdIgnoreCaseAndOwnerSub(alloc.itemId(), ownerSub).orElse(null);
      if (inv == null) {
        InventoryEntity created = new InventoryEntity();
        created.setCode(generateNextInventoryCode());
        created.setItemId(alloc.itemId());
        created.setItemName(alloc.itemName());
        created.setItemCategoryName(alloc.itemCategoryName());
        created.setCategoryDetached(false);
        created.setDetachedCategoryName(null);
        created.setCategoryName(alloc.itemCategoryName());
        categoryService.ensureExistsForCurrentUser(alloc.itemCategoryName());
        created.setUom(alloc.uom());
        created.setAvailable(alloc.allocatedQty().setScale(6, RoundingMode.HALF_UP));
        created.setOwnerSub(ownerSub);
        inventoryRepository.save(created);
      } else {
        BigDecimal currentAvailable = inv.getAvailable() == null ? BigDecimal.ZERO : inv.getAvailable();
        inv.setAvailable(currentAvailable.add(alloc.allocatedQty()).setScale(6, RoundingMode.HALF_UP));
        inventoryRepository.save(inv);
      }
    }

    existing.setStatus(WorkItemStatus.CANCELED);
    return toDetailModel(workItemRepository.save(existing));
  }

  @Transactional
  public WorkItemDetail complete(String id) {
    String ownerSub = currentUserService.requiredSub();
    if (id == null || id.isBlank()) {
      throw new IllegalStateException("work_item_not_found");
    }
    WorkItemEntity existing = workItemRepository.findByCodeIgnoreCaseAndOwnerSub(id.trim(), ownerSub).orElse(null);
    if (existing == null) {
      throw new IllegalStateException("work_item_not_found");
    }
    if (existing.getStatus() == WorkItemStatus.CANCELED || existing.getStatus() == WorkItemStatus.COMPLETED) {
      throw new IllegalStateException("work_item_not_completable");
    }

    String productCode =
        existing.getOutputItemId() == null ? "" : existing.getOutputItemId().trim().toUpperCase(Locale.ROOT);
    String outputName =
        existing.getOutputItemName() == null || existing.getOutputItemName().isBlank()
            ? productCode
            : existing.getOutputItemName().trim();
    String outputCategory =
        existing.getOutputItemCategoryName() == null || existing.getOutputItemCategoryName().isBlank()
            ? "Unknown"
            : existing.getOutputItemCategoryName().trim();
    String outputUom =
        existing.getOutputItemUom() == null || existing.getOutputItemUom().isBlank()
            ? "pcs"
            : existing.getOutputItemUom().trim();
    if (productCode.isBlank() || "UNKNOWN".equalsIgnoreCase(productCode)) {
      OutputSnapshot fallback = deriveOutputFromBom(existing.getBomId(), ownerSub);
      if (fallback != null) {
        productCode = fallback.itemId();
        outputName = fallback.itemName();
        outputCategory = fallback.categoryName();
        outputUom = fallback.uom();
      }
    }
    if (productCode.isBlank() || "UNKNOWN".equalsIgnoreCase(productCode)) {
      throw new IllegalStateException("invalid_work_item_snapshot");
    }

    InventoryEntity productInventory =
        inventoryRepository.findByItemIdIgnoreCaseAndOwnerSub(productCode, ownerSub).orElse(null);
    if (productInventory == null) {
      InventoryEntity created = new InventoryEntity();
      created.setCode(generateNextInventoryCode());
      created.setItemId(productCode);
      created.setItemName(outputName);
      created.setItemCategoryName(outputCategory);
      created.setCategoryDetached(false);
      created.setDetachedCategoryName(null);
      created.setCategoryName(outputCategory);
      categoryService.ensureExistsForCurrentUser(outputCategory);
      created.setUom(outputUom);
      created.setAvailable(existing.getRequestedQty().setScale(6, RoundingMode.HALF_UP));
      created.setOwnerSub(ownerSub);
      inventoryRepository.save(created);
    } else {
      BigDecimal current = productInventory.getAvailable() == null ? BigDecimal.ZERO : productInventory.getAvailable();
      productInventory.setAvailable(current.add(existing.getRequestedQty()).setScale(6, RoundingMode.HALF_UP));
      inventoryRepository.save(productInventory);
    }

    existing.setStatus(WorkItemStatus.COMPLETED);
    return toDetailModel(workItemRepository.save(existing));
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

  private String generateNextInventoryCode() {
    int max =
        inventoryRepository.findAll().stream()
            .map(InventoryEntity::getCode)
            .map(WorkItemService::extractNumericSuffix)
            .filter(n -> n >= 0)
            .max(Integer::compareTo)
            .orElse(0);
    return "INV-" + String.format("%03d", max + 1);
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
    model.setRequestedQty(e.getRequestedQty());
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

  private String toAllocatedComponentsJson(List<AllocatedComponentSnapshot> allocations) {
    try {
      return objectMapper.writeValueAsString(allocations == null ? List.of() : allocations);
    } catch (Exception ex) {
      throw new IllegalStateException("invalid_work_item_snapshot");
    }
  }

  private List<AllocatedComponentSnapshot> parseAllocatedComponentsJson(String json) {
    if (json == null || json.isBlank()) {
      return List.of();
    }
    try {
      List<AllocatedComponentSnapshot> rows =
          objectMapper.readValue(json, new TypeReference<List<AllocatedComponentSnapshot>>() {});
      return rows == null ? List.of() : rows;
    } catch (Exception ex) {
      throw new IllegalStateException("invalid_work_item_snapshot");
    }
  }

  private record AllocatedComponentSnapshot(
      String itemId, String itemName, String itemCategoryName, String uom, BigDecimal allocatedQty) {}

  private List<AllocatedComponentSnapshot> deriveAllocationsFromBom(
      String bomId, BigDecimal requestedQty, String ownerSub) {
    BomEntity bom = bomRepository.findByCodeIgnoreCaseAndOwnerSub(bomId, ownerSub).orElse(null);
    if (bom == null || bom.getComponents() == null || bom.getComponents().isEmpty()) {
      return List.of();
    }
    List<AllocatedComponentSnapshot> out = new ArrayList<>();
    for (BomComponentEmbeddable c : bom.getComponents()) {
      String itemCode = c.getItemId() == null ? "" : c.getItemId().trim().toUpperCase(Locale.ROOT);
      BigDecimal perUnit =
          c.getQuantity() == null ? BigDecimal.ZERO : c.getQuantity().setScale(6, RoundingMode.HALF_UP);
      if (itemCode.isBlank() || perUnit.compareTo(BigDecimal.ZERO) <= 0) {
        return List.of();
      }
      BigDecimal allocated = perUnit.multiply(requestedQty).setScale(6, RoundingMode.HALF_UP);
      ItemEntity item = itemRepository.findByCodeIgnoreCaseAndOwnerSub(itemCode, ownerSub).orElse(null);
      out.add(
          new AllocatedComponentSnapshot(
              itemCode,
              item != null && item.getName() != null && !item.getName().isBlank() ? item.getName() : itemCode,
              item != null && item.getCategoryName() != null && !item.getCategoryName().isBlank()
                  ? item.getCategoryName()
                  : "Unknown",
              item != null && item.getUomBase() != null && !item.getUomBase().isBlank() ? item.getUomBase() : "pcs",
              allocated));
    }
    return out;
  }

  private OutputSnapshot deriveOutputFromBom(String bomId, String ownerSub) {
    BomEntity bom = bomRepository.findByCodeIgnoreCaseAndOwnerSub(bomId, ownerSub).orElse(null);
    if (bom == null || bom.getProductId() == null || bom.getProductId().isBlank()) {
      return null;
    }
    String productCode = bom.getProductId().trim().toUpperCase(Locale.ROOT);
    ItemEntity item = itemRepository.findByCodeIgnoreCaseAndOwnerSub(productCode, ownerSub).orElse(null);
    if (item == null) {
      return null;
    }
    String name =
        item.getName() != null && !item.getName().isBlank()
            ? item.getName()
            : (bom.getProductName() == null || bom.getProductName().isBlank() ? productCode : bom.getProductName());
    String category =
        item.getCategoryName() != null && !item.getCategoryName().isBlank() ? item.getCategoryName() : "Unknown";
    String uom = item.getUomBase() != null && !item.getUomBase().isBlank() ? item.getUomBase() : "pcs";
    return new OutputSnapshot(productCode, name, category, uom);
  }

  private record OutputSnapshot(String itemId, String itemName, String categoryName, String uom) {}
}
