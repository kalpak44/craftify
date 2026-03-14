package com.craftify.backend.service;

import com.craftify.backend.error.ApiException;
import com.craftify.backend.model.ItemDetail;
import com.craftify.backend.model.ItemList;
import com.craftify.backend.model.ItemPage;
import com.craftify.backend.model.ItemQuery;
import com.craftify.backend.model.ItemUom;
import com.craftify.backend.model.Status;
import com.craftify.backend.model.CreateItemRequest;
import com.craftify.backend.model.UpdateItemRequest;
import com.craftify.backend.persistence.entity.ItemEntity;
import com.craftify.backend.persistence.entity.ItemUomEmbeddable;
import com.craftify.backend.persistence.entity.WorkItemEntity;
import com.craftify.backend.persistence.repository.BomRepository;
import com.craftify.backend.persistence.repository.InventoryRepository;
import com.craftify.backend.persistence.repository.ItemRepository;
import com.craftify.backend.persistence.repository.WorkItemRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemService {

  private final ItemRepository itemRepository;
  private final InventoryRepository inventoryRepository;
  private final BomRepository bomRepository;
  private final WorkItemRepository workItemRepository;
  private final CurrentUserService currentUserService;
  private final CategoryService categoryService;
  private static final Pattern SNAPSHOT_ITEM_ID_PATTERN =
      Pattern.compile("\"itemId\"\\s*:\\s*\"([^\"]+)\"", Pattern.CASE_INSENSITIVE);

  public ItemService(
      ItemRepository itemRepository,
      InventoryRepository inventoryRepository,
      BomRepository bomRepository,
      WorkItemRepository workItemRepository,
      CurrentUserService currentUserService,
      CategoryService categoryService) {
    this.itemRepository = itemRepository;
    this.inventoryRepository = inventoryRepository;
    this.bomRepository = bomRepository;
    this.workItemRepository = workItemRepository;
    this.currentUserService = currentUserService;
    this.categoryService = categoryService;
  }

  @Transactional(readOnly = true)
  public ItemPage list(ItemQuery query) {
    String ownerSub = currentUserService.requiredSub();
    Pageable pageable =
        PageRequest.of(Math.max(query.page(), 0), Math.max(query.size(), 1), parseSort(query.sort()));

    Specification<ItemEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          predicates.add(cb.equal(root.get("ownerSub"), ownerSub));
          if (query.q() != null && !query.q().isBlank()) {
            String pattern = "%" + query.q().toLowerCase(Locale.ROOT) + "%";
            predicates.add(
                cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("categoryName")), pattern)));
          }
          if (query.status() != null) {
            predicates.add(cb.equal(root.get("status"), query.status()));
          }
          if (query.categoryName() != null && !query.categoryName().isBlank()) {
            predicates.add(
                cb.equal(
                    cb.lower(root.get("categoryName")), query.categoryName().toLowerCase(Locale.ROOT)));
          }
          if (query.uom() != null && !query.uom().isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("uomBase")), query.uom().toLowerCase(Locale.ROOT)));
          }
          return cb.and(predicates.toArray(Predicate[]::new));
        };

    Page<ItemEntity> result = itemRepository.findAll(spec, pageable);

    return new ItemPage()
        .content(result.stream().map(this::toListModel).toList())
        .page(result.getNumber())
        .size(result.getSize())
        .totalElements((int) result.getTotalElements())
        .totalPages(Math.max(1, result.getTotalPages()))
        .sort(List.of(query.sort() == null || query.sort().isBlank() ? "updatedAt,desc" : query.sort()));
  }

  @Transactional(readOnly = true)
  public ItemDetail getByCode(String code) {
    String ownerSub = currentUserService.requiredSub();
    if (code == null || code.isBlank()) {
      return null;
    }
    return itemRepository
        .findByCodeIgnoreCaseAndOwnerSub(code, ownerSub)
        .map(this::toDetailModel)
        .orElse(null);
  }

  @Transactional
  public ItemDetail create(CreateItemRequest req) {
    String ownerSub = currentUserService.requiredSub();
    String code =
        (req.getCode() == null || req.getCode().isBlank())
            ? generateNextCode(ownerSub)
            : req.getCode().trim().toUpperCase(Locale.ROOT);

    if (itemRepository.existsByCodeIgnoreCaseAndOwnerSub(code, ownerSub)) {
      return null;
    }

    ItemEntity entity = new ItemEntity();
    categoryService.ensureExistsForCurrentUser(req.getCategoryName());
    entity.setCode(code);
    entity.setName(req.getName().trim());
    entity.setStatus(req.getStatus());
    entity.setCategoryName(req.getCategoryName().trim());
    entity.setUomBase(req.getUomBase().trim());
    entity.setDescription(req.getDescription());
    entity.setUoms(toEmbeddables(req.getUoms()));
    entity.setOwnerSub(ownerSub);

    return toDetailModel(itemRepository.save(entity));
  }

  @Transactional
  public ItemDetail updateByCode(String code, UpdateItemRequest req, Integer expectedVersion) {
    String ownerSub = currentUserService.requiredSub();
    ItemEntity existing = itemRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).orElse(null);
    if (existing == null) {
      return null;
    }
    if (expectedVersion == null || existing.getVersion() != expectedVersion.longValue()) {
      throw ApiException.preconditionFailed("version_mismatch");
    }

    String nextCode =
        (req.getCode() == null || req.getCode().isBlank())
            ? existing.getCode()
            : req.getCode().trim().toUpperCase(Locale.ROOT);
    if (!nextCode.equalsIgnoreCase(existing.getCode())
        && itemRepository.existsByCodeIgnoreCaseAndOwnerSub(nextCode, ownerSub)) {
      throw ApiException.conflict("code_conflict");
    }
    if (!nextCode.equalsIgnoreCase(existing.getCode()) && isItemInUse(existing.getCode(), ownerSub)) {
      throw ApiException.conflict("item_in_use_code_change");
    }

    existing.setCode(nextCode);
    categoryService.ensureExistsForCurrentUser(req.getCategoryName());
    existing.setName(req.getName().trim());
    existing.setStatus(req.getStatus());
    existing.setCategoryName(req.getCategoryName().trim());
    existing.setUomBase(req.getUomBase().trim());
    existing.setDescription(req.getDescription());
    existing.setUoms(toEmbeddables(req.getUoms()));

    return toDetailModel(itemRepository.save(existing));
  }

  @Transactional
  public boolean deleteByCode(String code, Integer expectedVersion) {
    String ownerSub = currentUserService.requiredSub();
    ItemEntity existing = itemRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).orElse(null);
    if (existing == null) {
      return false;
    }
    if (expectedVersion == null || existing.getVersion() != expectedVersion.longValue()) {
      throw ApiException.preconditionFailed("version_mismatch");
    }
    if (isItemInUse(existing.getCode(), ownerSub)) {
      throw ApiException.conflict("item_in_use");
    }
    itemRepository.delete(existing);
    return true;
  }

  @Transactional
  public int deleteByIds(List<UUID> ids) {
    String ownerSub = currentUserService.requiredSub();
    if (ids == null || ids.isEmpty()) {
      return 0;
    }
    int deleted = 0;
    List<ItemEntity> rows = itemRepository.findAllById(ids);
    List<ItemEntity> toDelete = new ArrayList<>();
    for (ItemEntity row : rows) {
      if (ownerSub.equals(row.getOwnerSub())) {
        if (isItemInUse(row.getCode(), ownerSub)) {
          continue;
        }
        toDelete.add(row);
        deleted++;
      }
    }
    if (!toDelete.isEmpty()) {
      itemRepository.deleteAll(toDelete);
    }
    return deleted;
  }

  @Transactional
  public void upsertFromImport(
      String code,
      String name,
      Status status,
      String categoryName,
      String uomBase,
      String description,
      List<ItemUom> uoms,
      boolean createOnly) {
    String ownerSub = currentUserService.requiredSub();
    String normalizedCode =
        (code == null || code.isBlank()) ? generateNextCode(ownerSub) : code.trim().toUpperCase(Locale.ROOT);

    ItemEntity existing = itemRepository.findByCodeIgnoreCaseAndOwnerSub(normalizedCode, ownerSub).orElse(null);
    if (existing != null) {
      if (createOnly) {
        throw ApiException.conflict("create_only_conflict");
      }
      existing.setName(name.trim());
      existing.setStatus(status);
      categoryService.ensureExistsForCurrentUser(categoryName);
      existing.setCategoryName(categoryName.trim());
      existing.setUomBase(uomBase.trim());
      existing.setDescription(description);
      if (uoms != null) {
        existing.setUoms(toEmbeddables(uoms));
      }
      itemRepository.save(existing);
      return;
    }

    ItemEntity entity = new ItemEntity();
    categoryService.ensureExistsForCurrentUser(categoryName);
    entity.setCode(normalizedCode);
    entity.setName(name.trim());
    entity.setStatus(status);
    entity.setCategoryName(categoryName.trim());
    entity.setUomBase(uomBase.trim());
    entity.setDescription(description);
    entity.setUoms(toEmbeddables(Objects.requireNonNullElse(uoms, List.of())));
    entity.setOwnerSub(ownerSub);
    itemRepository.save(entity);
  }

  @Transactional(readOnly = true)
  public List<ItemDetail> listForExport(String q, Status status, String categoryName, String uom, List<String> codes) {
    String ownerSub = currentUserService.requiredSub();
    Specification<ItemEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          predicates.add(cb.equal(root.get("ownerSub"), ownerSub));

          if (q != null && !q.isBlank()) {
            String pattern = "%" + q.toLowerCase(Locale.ROOT) + "%";
            predicates.add(
                cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("name")), pattern)));
          }
          if (status != null) {
            predicates.add(cb.equal(root.get("status"), status));
          }
          if (categoryName != null && !categoryName.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("categoryName")), categoryName.toLowerCase(Locale.ROOT)));
          }
          if (uom != null && !uom.isBlank()) {
            predicates.add(cb.equal(cb.lower(root.get("uomBase")), uom.toLowerCase(Locale.ROOT)));
          }
          if (codes != null && !codes.isEmpty()) {
            predicates.add(root.get("code").in(codes));
          }

          return cb.and(predicates.toArray(Predicate[]::new));
        };

    return itemRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "code")).stream().map(this::toDetailModel).toList();
  }

  private String generateNextCode(String ownerSub) {
    int max = itemRepository.findMaxCodeSuffixByOwnerSub(ownerSub);
    return "ITM-" + String.format("%03d", max + 1);
  }

  private boolean isItemInUse(String itemCode, String ownerSub) {
    String normalizedItemCode = itemCode == null ? "" : itemCode.trim().toUpperCase(Locale.ROOT);
    if (normalizedItemCode.isBlank()) {
      return false;
    }
    if (inventoryRepository.existsByItemIdIgnoreCaseAndOwnerSub(normalizedItemCode, ownerSub)) {
      return true;
    }
    if (isReferencedInBoms(normalizedItemCode, ownerSub)) {
      return true;
    }
    return isReferencedInQueuedWorkItems(normalizedItemCode, ownerSub);
  }

  private boolean isReferencedInBoms(String normalizedItemCode, String ownerSub) {
    return bomRepository.findAllByOwnerSub(ownerSub).stream()
        .anyMatch(
            bom ->
                (bom.getProductId() != null && bom.getProductId().trim().equalsIgnoreCase(normalizedItemCode))
                    || (bom.getComponents() != null
                        && bom.getComponents().stream()
                            .anyMatch(
                                c ->
                                    c.getItemId() != null
                                        && c.getItemId().trim().equalsIgnoreCase(normalizedItemCode))));
  }

  private boolean isReferencedInQueuedWorkItems(String normalizedItemCode, String ownerSub) {
    for (WorkItemEntity wi : workItemRepository.findAllByOwnerSubAndStatus(ownerSub, com.craftify.backend.model.WorkItemStatus.QUEUED)) {
      if (wi.getOutputItemId() != null && wi.getOutputItemId().trim().equalsIgnoreCase(normalizedItemCode)) {
        return true;
      }
      if (isInAllocatedSnapshot(wi.getAllocatedComponentsJson(), normalizedItemCode)) {
        return true;
      }
    }
    return false;
  }

  private boolean isInAllocatedSnapshot(String json, String normalizedItemCode) {
    if (json == null || json.isBlank()) {
      return false;
    }
    Matcher matcher = SNAPSHOT_ITEM_ID_PATTERN.matcher(json);
    while (matcher.find()) {
      String itemId = matcher.group(1);
      if (itemId != null && itemId.trim().equalsIgnoreCase(normalizedItemCode)) {
        return true;
      }
    }
    return false;
  }

  private Sort parseSort(String sort) {
    String value = (sort == null || sort.isBlank()) ? "updatedAt,desc" : sort;
    String[] parts = value.split(",", 2);
    String key = parts[0].trim();
    Sort.Direction direction =
        (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim()))
            ? Sort.Direction.DESC
            : Sort.Direction.ASC;

    if ("code".equalsIgnoreCase(key) || "id".equalsIgnoreCase(key)) {
      return Sort.by(direction, "code");
    }
    if ("updatedAt".equalsIgnoreCase(key)) {
      return Sort.by(direction, "updatedAt");
    }
    return Sort.by(direction, "name");
  }

  private ItemList toListModel(ItemEntity entity) {
    return new ItemList()
        .id(entity.getCode())
        .code(entity.getCode())
        .name(entity.getName())
        .status(entity.getStatus())
        .categoryName(entity.getCategoryName())
        .uomBase(entity.getUomBase())
        .updatedAt(entity.getUpdatedAt());
  }

  private ItemDetail toDetailModel(ItemEntity entity) {
    return new ItemDetail()
        .id(entity.getCode())
        .code(entity.getCode())
        .name(entity.getName())
        .status(entity.getStatus())
        .categoryName(entity.getCategoryName())
        .uomBase(entity.getUomBase())
        .description(entity.getDescription())
        .uoms(toModels(entity.getUoms()))
        .createdAt(entity.getCreatedAt())
        .updatedAt(entity.getUpdatedAt())
        .version((int) entity.getVersion());
  }

  private List<ItemUomEmbeddable> toEmbeddables(List<ItemUom> uoms) {
    if (uoms == null) {
      return List.of();
    }
    return uoms.stream()
        .map(
            u -> {
              ItemUomEmbeddable emb = new ItemUomEmbeddable();
              emb.setUom(u.getUom());
              emb.setCoef(Objects.requireNonNullElse(u.getCoef(), BigDecimal.ONE));
              emb.setNotes(u.getNotes());
              return emb;
            })
        .toList();
  }

  private List<ItemUom> toModels(List<ItemUomEmbeddable> uoms) {
    if (uoms == null) {
      return List.of();
    }
    return uoms.stream()
        .map(u -> new ItemUom().uom(u.getUom()).coef(u.getCoef()).notes(u.getNotes()))
        .toList();
  }

}
