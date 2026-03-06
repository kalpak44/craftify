package com.craftify.backend.service;

import com.craftify.backend.model.InventoryDetail;
import com.craftify.backend.model.InventoryList;
import com.craftify.backend.model.InventoryPage;
import com.craftify.backend.model.InventoryUpsertRequest;
import com.craftify.backend.persistence.entity.InventoryEntity;
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

  private final InventoryRepository inventoryRepository;

  public InventoryService(InventoryRepository inventoryRepository) {
    this.inventoryRepository = inventoryRepository;
  }

  @Transactional(readOnly = true)
  public InventoryPage list(InventoryQuery query) {
    Pageable pageable =
        PageRequest.of(Math.max(query.page(), 0), Math.max(query.size(), 1), parseSort(query.sort()));

    Specification<InventoryEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
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
    if (code == null || code.isBlank()) {
      return null;
    }
    return inventoryRepository.findByCodeIgnoreCase(code.trim()).map(this::toDetailModel).orElse(null);
  }

  @Transactional
  public InventoryDetail create(InventoryUpsertRequest req) {
    String code =
        (req.getCode() == null || req.getCode().isBlank())
            ? generateNextCode()
            : req.getCode().trim().toUpperCase(Locale.ROOT);

    if (inventoryRepository.existsByCodeIgnoreCase(code)) {
      return null;
    }

    InventoryEntity entity = new InventoryEntity();
    entity.setCode(code);
    apply(entity, req);
    return toDetailModel(inventoryRepository.save(entity));
  }

  @Transactional
  public InventoryDetail updateByCode(String code, InventoryUpsertRequest req) {
    InventoryEntity existing = inventoryRepository.findByCodeIgnoreCase(code).orElse(null);
    if (existing == null) {
      return null;
    }
    apply(existing, req);
    return toDetailModel(inventoryRepository.save(existing));
  }

  @Transactional
  public boolean deleteByCode(String code) {
    InventoryEntity existing = inventoryRepository.findByCodeIgnoreCase(code).orElse(null);
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
}
