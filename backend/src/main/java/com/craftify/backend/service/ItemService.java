package com.craftify.backend.service;

import com.craftify.backend.model.ItemDetail;
import com.craftify.backend.model.ItemList;
import com.craftify.backend.model.ItemPage;
import com.craftify.backend.model.ItemUom;
import com.craftify.backend.model.Status;
import com.craftify.backend.model.CreateItemRequest;
import com.craftify.backend.model.UpdateItemRequest;
import com.craftify.backend.persistence.entity.ItemEntity;
import com.craftify.backend.persistence.entity.ItemUomEmbeddable;
import com.craftify.backend.persistence.repository.ItemRepository;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ItemService {

  public record ItemQuery(
      int page,
      int size,
      String sort,
      String q,
      Status status,
      String categoryName,
      String uom,
      boolean includeDeleted) {}

  private final ItemRepository itemRepository;
  private final CurrentUserService currentUserService;

  public ItemService(ItemRepository itemRepository, CurrentUserService currentUserService) {
    this.itemRepository = itemRepository;
    this.currentUserService = currentUserService;
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
          if (!query.includeDeleted()) {
            predicates.add(cb.isFalse(root.get("deleted")));
          }
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
        .filter(i -> !i.isDeleted())
        .map(this::toDetailModel)
        .orElse(null);
  }

  @Transactional(readOnly = true)
  public ItemDetail getByCodeIncludingDeleted(String code) {
    String ownerSub = currentUserService.requiredSub();
    if (code == null || code.isBlank()) {
      return null;
    }
    return itemRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).map(this::toDetailModel).orElse(null);
  }

  @Transactional
  public ItemDetail create(CreateItemRequest req) {
    String code =
        (req.getCode() == null || req.getCode().isBlank())
            ? generateNextCode()
            : req.getCode().trim().toUpperCase(Locale.ROOT);

    if (itemRepository.existsByCodeIgnoreCase(code)) {
      return null;
    }

    ItemEntity entity = new ItemEntity();
    entity.setCode(code);
    entity.setName(req.getName().trim());
    entity.setStatus(req.getStatus());
    entity.setCategoryName(req.getCategoryName().trim());
    entity.setUomBase(req.getUomBase().trim());
    entity.setDescription(req.getDescription());
    entity.setUoms(toEmbeddables(req.getUoms()));
    entity.setOwnerSub(currentUserService.requiredSub());
    entity.setDeleted(false);

    return toDetailModel(itemRepository.save(entity));
  }

  @Transactional
  public ItemDetail updateByCode(String code, UpdateItemRequest req, Integer expectedVersion) {
    String ownerSub = currentUserService.requiredSub();
    ItemEntity existing = itemRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).orElse(null);
    if (existing == null || existing.isDeleted()) {
      return null;
    }
    if (expectedVersion == null || existing.getVersion() != expectedVersion.longValue()) {
      throw new IllegalStateException("version_mismatch");
    }

    String nextCode =
        (req.getCode() == null || req.getCode().isBlank())
            ? existing.getCode()
            : req.getCode().trim().toUpperCase(Locale.ROOT);
    if (!nextCode.equalsIgnoreCase(existing.getCode())
        && itemRepository.existsByCodeIgnoreCase(nextCode)) {
      throw new IllegalStateException("code_conflict");
    }

    existing.setCode(nextCode);
    existing.setName(req.getName().trim());
    existing.setStatus(req.getStatus());
    existing.setCategoryName(req.getCategoryName().trim());
    existing.setUomBase(req.getUomBase().trim());
    existing.setDescription(req.getDescription());
    existing.setUoms(toEmbeddables(req.getUoms()));

    return toDetailModel(itemRepository.save(existing));
  }

  @Transactional
  public boolean softDeleteByCode(String code, Integer expectedVersion) {
    String ownerSub = currentUserService.requiredSub();
    ItemEntity existing = itemRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).orElse(null);
    if (existing == null || existing.isDeleted()) {
      return false;
    }
    if (expectedVersion == null || existing.getVersion() != expectedVersion.longValue()) {
      throw new IllegalStateException("version_mismatch");
    }
    existing.setDeleted(true);
    itemRepository.save(existing);
    return true;
  }

  @Transactional
  public int softDeleteByIds(List<UUID> ids) {
    String ownerSub = currentUserService.requiredSub();
    if (ids == null || ids.isEmpty()) {
      return 0;
    }
    int deleted = 0;
    List<ItemEntity> rows = itemRepository.findAllById(ids);
    for (ItemEntity row : rows) {
      if (ownerSub.equals(row.getOwnerSub()) && !row.isDeleted()) {
        row.setDeleted(true);
        deleted++;
      }
    }
    itemRepository.saveAll(rows);
    return deleted;
  }

  @Transactional(readOnly = true)
  public long count(Status status) {
    String ownerSub = currentUserService.requiredSub();
    if (status == null) {
      return itemRepository.countByDeletedFalseAndOwnerSub(ownerSub);
    }
    return itemRepository.countByDeletedFalseAndStatusAndOwnerSub(status, ownerSub);
  }

  @Transactional
  public ItemDetail upsertFromImport(
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
        (code == null || code.isBlank()) ? generateNextCode() : code.trim().toUpperCase(Locale.ROOT);

    ItemEntity existing = itemRepository.findByCodeIgnoreCaseAndOwnerSub(normalizedCode, ownerSub).orElse(null);
    if (existing != null) {
      if (createOnly) {
        throw new IllegalStateException("create_only_conflict");
      }
      existing.setName(name.trim());
      existing.setStatus(status);
      existing.setCategoryName(categoryName.trim());
      existing.setUomBase(uomBase.trim());
      existing.setDescription(description);
      if (uoms != null) {
        existing.setUoms(toEmbeddables(uoms));
      }
      return toDetailModel(itemRepository.save(existing));
    }

    // Code remains globally unique in DB. If the code exists for another owner, fail with a clear error.
    if (itemRepository.existsByCodeIgnoreCase(normalizedCode)) {
      throw new IllegalStateException("code_conflict");
    }

    ItemEntity entity = new ItemEntity();
    entity.setCode(normalizedCode);
    entity.setName(name.trim());
    entity.setStatus(status);
    entity.setCategoryName(categoryName.trim());
    entity.setUomBase(uomBase.trim());
    entity.setDescription(description);
    entity.setUoms(toEmbeddables(uoms == null ? List.of() : uoms));
    entity.setOwnerSub(ownerSub);
    entity.setDeleted(false);
    return toDetailModel(itemRepository.save(entity));
  }

  @Transactional(readOnly = true)
  public List<ItemDetail> listForExport(String q, Status status, String categoryName, String uom, List<String> codes) {
    String ownerSub = currentUserService.requiredSub();
    Specification<ItemEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          predicates.add(cb.equal(root.get("ownerSub"), ownerSub));
          predicates.add(cb.isFalse(root.get("deleted")));

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

  private String generateNextCode() {
    int max =
        itemRepository.findAll().stream()
            .map(ItemEntity::getCode)
            .map(ItemService::extractNumericSuffix)
            .filter(n -> n >= 0)
            .max(Integer::compareTo)
            .orElse(0);
    return "ITM-" + String.format("%03d", max + 1);
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
              emb.setCoef(u.getCoef() == null ? BigDecimal.ONE : u.getCoef());
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

  public static Integer parseIfMatchVersion(String ifMatch) {
    if (ifMatch == null || ifMatch.isBlank()) {
      return null;
    }
    String cleaned = ifMatch.trim();
    if (cleaned.startsWith("W\"") && cleaned.endsWith("\"")) {
      cleaned = cleaned.substring(2, cleaned.length() - 1);
    }
    if (cleaned.startsWith("\"") && cleaned.endsWith("\"")) {
      cleaned = cleaned.substring(1, cleaned.length() - 1);
    }
    try {
      return Integer.parseInt(cleaned);
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  public static String toWeakEtag(int version) {
    return "W\"" + version + "\"";
  }

  public static String toWeakEtag(long version) {
    return "W\"" + version + "\"";
  }

}
