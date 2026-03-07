package com.craftify.backend.service;

import com.craftify.backend.model.InventoryDetail;
import com.craftify.backend.model.InventoryList;
import com.craftify.backend.model.InventoryPage;
import com.craftify.backend.model.InventoryUpsertRequest;
import com.craftify.backend.model.Status;
import com.craftify.backend.persistence.entity.ItemEntity;
import com.craftify.backend.persistence.entity.InventoryEntity;
import com.craftify.backend.persistence.repository.ItemRepository;
import com.craftify.backend.persistence.repository.InventoryRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventoryService {

  public record InventoryQuery(
      int page, int size, String sort, String q, String categoryName, String uom) {}
  public record CreateFromItemResult(InventoryDetail detail, boolean created) {}

  private final InventoryRepository inventoryRepository;
  private final ItemRepository itemRepository;
  private final CurrentUserService currentUserService;
  private final CategoryService categoryService;

  public InventoryService(
      InventoryRepository inventoryRepository,
      ItemRepository itemRepository,
      CurrentUserService currentUserService,
      CategoryService categoryService) {
    this.inventoryRepository = inventoryRepository;
    this.itemRepository = itemRepository;
    this.currentUserService = currentUserService;
    this.categoryService = categoryService;
  }

  @Transactional(readOnly = true)
  public InventoryPage list(InventoryQuery query) {
    String ownerSub = currentUserService.requiredSub();
    Pageable pageable =
        PageRequest.of(Math.max(query.page(), 0), Math.max(query.size(), 1), parseSort(query.sort()));

    Specification<InventoryEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          predicates.add(cb.equal(root.get("ownerSub"), ownerSub));
          if (query.q() != null && !query.q().isBlank()) {
            String pattern = "%" + query.q().toLowerCase(Locale.ROOT) + "%";
            predicates.add(
                cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("itemId")), pattern),
                    cb.like(cb.lower(root.get("itemName")), pattern)));
          }
          if (query.categoryName() != null && !query.categoryName().isBlank()) {
            predicates.add(
                cb.equal(
                    cb.lower(root.get("categoryName")), query.categoryName().toLowerCase(Locale.ROOT)));
          }
          if (query.uom() != null && !query.uom().isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("uom")), query.uom().toLowerCase(Locale.ROOT)));
          }
          return cb.and(predicates.toArray(Predicate[]::new));
        };

    Page<InventoryEntity> result = inventoryRepository.findAll(spec, pageable);

    InventoryPage page = new InventoryPage();
    page.setContent(result.stream().map(this::toListModel).toList());
    page.setPage(result.getNumber());
    page.setSize(result.getSize());
    page.setTotalElements((int) result.getTotalElements());
    page.setTotalPages(Math.max(1, result.getTotalPages()));
    page.setSort(List.of(query.sort() == null || query.sort().isBlank() ? "updatedAt,desc" : query.sort()));
    return page;
  }

  @Transactional(readOnly = true)
  public InventoryDetail getByCode(String code) {
    String ownerSub = currentUserService.requiredSub();
    if (code == null || code.isBlank()) {
      return null;
    }
    return inventoryRepository
        .findByCodeIgnoreCaseAndOwnerSub(code.trim(), ownerSub)
        .map(this::toDetailModel)
        .orElse(null);
  }

  @Transactional
  public InventoryDetail create(InventoryUpsertRequest req) {
    String ownerSub = currentUserService.requiredSub();
    String code =
        (req.getCode() == null || req.getCode().isBlank())
            ? generateNextCode()
            : req.getCode().trim().toUpperCase(Locale.ROOT);

    if (inventoryRepository.existsByCodeIgnoreCaseAndOwnerSub(code, ownerSub)) {
      return null;
    }

    InventoryEntity entity = new InventoryEntity();
    entity.setCode(code);
    entity.setOwnerSub(ownerSub);
    collectCategoriesFromRequest(req);
    apply(entity, req);
    return toDetailModel(inventoryRepository.save(entity));
  }

  @Transactional
  public InventoryDetail updateByCode(String code, InventoryUpsertRequest req) {
    String ownerSub = currentUserService.requiredSub();
    InventoryEntity existing = inventoryRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).orElse(null);
    if (existing == null) {
      return null;
    }
    collectCategoriesFromRequest(req);
    apply(existing, req);
    return toDetailModel(inventoryRepository.save(existing));
  }

  @Transactional
  public boolean deleteByCode(String code) {
    String ownerSub = currentUserService.requiredSub();
    InventoryEntity existing = inventoryRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).orElse(null);
    if (existing == null) {
      return false;
    }
    inventoryRepository.delete(existing);
    return true;
  }

  @Transactional(readOnly = true)
  public String nextCode() {
    return generateNextCode();
  }

  @Transactional
  public InventoryDetail upsertFromImport(
      String code,
      String itemId,
      String itemName,
      String itemCategoryName,
      boolean categoryDetached,
      String detachedCategoryName,
      String uom,
      BigDecimal available,
      boolean createOnly) {
    String ownerSub = currentUserService.requiredSub();
    String normalizedCode =
        (code == null || code.isBlank()) ? generateNextCode() : code.trim().toUpperCase(Locale.ROOT);

    InventoryEntity existing =
        inventoryRepository.findByCodeIgnoreCaseAndOwnerSub(normalizedCode, ownerSub).orElse(null);
    if (existing != null) {
      if (createOnly) {
        throw new IllegalStateException("create_only_conflict");
      }
      String normalizedItemCategory = itemCategoryName.trim();
      String normalizedDetached = normalize(detachedCategoryName);
      String effectiveCategory =
          categoryDetached
              ? (normalizedDetached == null || normalizedDetached.isBlank()
                  ? normalizedItemCategory
                  : normalizedDetached)
              : normalizedItemCategory;
      categoryService.ensureExistsForCurrentUser(normalizedItemCategory);
      categoryService.ensureExistsForCurrentUser(effectiveCategory);
      existing.setItemId(itemId.trim().toUpperCase(Locale.ROOT));
      existing.setItemName(itemName.trim());
      existing.setItemCategoryName(normalizedItemCategory);
      existing.setCategoryDetached(categoryDetached);
      existing.setDetachedCategoryName(categoryDetached ? normalizedDetached : null);
      existing.setCategoryName(effectiveCategory);
      existing.setUom(uom.trim());
      existing.setAvailable(available == null ? BigDecimal.ZERO : available);
      return toDetailModel(inventoryRepository.save(existing));
    }

    String normalizedItemCategory = itemCategoryName.trim();
    String normalizedDetached = normalize(detachedCategoryName);
    String effectiveCategory =
        categoryDetached
            ? (normalizedDetached == null || normalizedDetached.isBlank()
                ? normalizedItemCategory
                : normalizedDetached)
            : normalizedItemCategory;
    categoryService.ensureExistsForCurrentUser(normalizedItemCategory);
    categoryService.ensureExistsForCurrentUser(effectiveCategory);

    InventoryEntity entity = new InventoryEntity();
    entity.setCode(normalizedCode);
    entity.setOwnerSub(ownerSub);
    entity.setItemId(itemId.trim().toUpperCase(Locale.ROOT));
    entity.setItemName(itemName.trim());
    entity.setItemCategoryName(normalizedItemCategory);
    entity.setCategoryDetached(categoryDetached);
    entity.setDetachedCategoryName(categoryDetached ? normalizedDetached : null);
    entity.setCategoryName(effectiveCategory);
    entity.setUom(uom.trim());
    entity.setAvailable(available == null ? BigDecimal.ZERO : available);
    return toDetailModel(inventoryRepository.save(entity));
  }

  @Transactional
  public CreateFromItemResult createFromItem(String itemCode, BigDecimal available, String mode) {
    String ownerSub = currentUserService.requiredSub();
    if (itemCode == null || itemCode.isBlank()) {
      throw new IllegalStateException("item_not_found");
    }

    ItemEntity item = itemRepository.findByCodeIgnoreCaseAndOwnerSub(itemCode.trim(), ownerSub).orElse(null);
    if (item == null) {
      throw new IllegalStateException("item_not_found");
    }
    if (item.getStatus() != Status.ACTIVE) {
      throw new IllegalStateException("item_not_active");
    }

    InventoryEntity existing =
        inventoryRepository.findByItemIdIgnoreCaseAndOwnerSub(item.getCode(), ownerSub).orElse(null);
    if (existing != null) {
      String normalizedMode = mode == null ? "" : mode.trim().toLowerCase(Locale.ROOT);
      if ("add".equals(normalizedMode)) {
        BigDecimal delta = available == null ? BigDecimal.ZERO : available;
        existing.setAvailable((existing.getAvailable() == null ? BigDecimal.ZERO : existing.getAvailable()).add(delta));
      } else if ("override".equals(normalizedMode)) {
        existing.setAvailable(available == null ? BigDecimal.ZERO : available);
      } else {
        throw new IllegalStateException("inventory_exists_for_item");
      }
      existing.setItemName(item.getName());
      existing.setItemCategoryName(item.getCategoryName());
      existing.setCategoryName(existing.isCategoryDetached() ? existing.getCategoryName() : item.getCategoryName());
      categoryService.ensureExistsForCurrentUser(existing.getCategoryName());
      existing.setUom(item.getUomBase());
      return new CreateFromItemResult(toDetailModel(inventoryRepository.save(existing)), false);
    }

    InventoryEntity entity = new InventoryEntity();
    entity.setCode(generateNextCode());
    entity.setItemId(item.getCode());
    entity.setItemName(item.getName());
    entity.setItemCategoryName(item.getCategoryName());
    entity.setCategoryDetached(false);
    entity.setDetachedCategoryName(null);
    entity.setCategoryName(item.getCategoryName());
    categoryService.ensureExistsForCurrentUser(item.getCategoryName());
    entity.setUom(item.getUomBase());
    entity.setAvailable(available == null ? BigDecimal.ZERO : available);
    entity.setOwnerSub(ownerSub);

    return new CreateFromItemResult(toDetailModel(inventoryRepository.save(entity)), true);
  }

  private void apply(InventoryEntity entity, InventoryUpsertRequest req) {
    boolean categoryDetached = Boolean.TRUE.equals(req.getCategoryDetached());
    String itemCategoryName = normalize(req.getItemCategoryName());
    String detachedCategoryName = normalize(req.getDetachedCategoryName());
    String effectiveCategory = categoryDetached ? detachedCategoryName : itemCategoryName;

    entity.setItemId(normalize(req.getItemId()).toUpperCase(Locale.ROOT));
    entity.setItemName(normalize(req.getItemName()));
    entity.setItemCategoryName(itemCategoryName);
    entity.setCategoryDetached(categoryDetached);
    entity.setDetachedCategoryName(categoryDetached ? detachedCategoryName : null);
    entity.setCategoryName(effectiveCategory);
    entity.setUom(normalize(req.getUom()));
    entity.setAvailable(req.getAvailable() == null ? BigDecimal.ZERO : req.getAvailable());
  }

  private String generateNextCode() {
    int max =
        inventoryRepository.findAll().stream()
            .map(InventoryEntity::getCode)
            .map(InventoryService::extractNumericSuffix)
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
    String value = (sort == null || sort.isBlank()) ? "updatedAt,desc" : sort;
    String[] parts = value.split(",", 2);
    String key = parts[0].trim();
    Sort.Direction direction =
        (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim()))
            ? Sort.Direction.DESC
            : Sort.Direction.ASC;

    if ("code".equalsIgnoreCase(key)) {
      return Sort.by(direction, "code");
    }
    if ("itemId".equalsIgnoreCase(key)) {
      return Sort.by(direction, "itemId");
    }
    if ("itemName".equalsIgnoreCase(key)) {
      return Sort.by(direction, "itemName");
    }
    if ("categoryName".equalsIgnoreCase(key)) {
      return Sort.by(direction, "categoryName");
    }
    if ("uom".equalsIgnoreCase(key)) {
      return Sort.by(direction, "uom");
    }
    if ("available".equalsIgnoreCase(key)) {
      return Sort.by(direction, "available");
    }
    return Sort.by(direction, "updatedAt");
  }

  private InventoryList toListModel(InventoryEntity entity) {
    InventoryList item = new InventoryList();
    item.setCode(entity.getCode());
    item.setItemId(entity.getItemId());
    item.setItemName(entity.getItemName());
    item.setCategoryName(entity.getCategoryName());
    item.setUom(entity.getUom());
    item.setAvailable(entity.getAvailable());
    item.setUpdatedAt(entity.getUpdatedAt());
    return item;
  }

  private InventoryDetail toDetailModel(InventoryEntity entity) {
    InventoryDetail item = new InventoryDetail();
    item.setCode(entity.getCode());
    item.setItemId(entity.getItemId());
    item.setItemName(entity.getItemName());
    item.setItemCategoryName(entity.getItemCategoryName());
    item.setCategoryDetached(entity.isCategoryDetached());
    item.setDetachedCategoryName(entity.getDetachedCategoryName());
    item.setCategoryName(entity.getCategoryName());
    item.setUom(entity.getUom());
    item.setAvailable(entity.getAvailable());
    item.setUpdatedAt(entity.getUpdatedAt());
    item.setVersion(entity.getVersion());
    return item;
  }

  private static String normalize(String value) {
    return value == null ? "" : value.trim();
  }

  private void collectCategoriesFromRequest(InventoryUpsertRequest req) {
    if (req == null) {
      return;
    }
    String itemCategoryName = normalize(req.getItemCategoryName());
    boolean categoryDetached = Boolean.TRUE.equals(req.getCategoryDetached());
    String detachedCategoryName = normalize(req.getDetachedCategoryName());
    String effectiveCategory = categoryDetached ? detachedCategoryName : itemCategoryName;
    categoryService.ensureExistsForCurrentUser(itemCategoryName);
    categoryService.ensureExistsForCurrentUser(effectiveCategory);
  }
}
