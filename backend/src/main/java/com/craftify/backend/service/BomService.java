package com.craftify.backend.service;

import com.craftify.backend.model.BomComponent;
import com.craftify.backend.model.BomDetail;
import com.craftify.backend.model.BomList;
import com.craftify.backend.model.BomPage;
import com.craftify.backend.model.BomStatus;
import com.craftify.backend.persistence.entity.BomComponentEmbeddable;
import com.craftify.backend.persistence.entity.BomEntity;
import com.craftify.backend.persistence.entity.ItemEntity;
import com.craftify.backend.persistence.repository.BomRepository;
import com.craftify.backend.persistence.repository.ItemRepository;
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
public class BomService {

  public record BomQuery(int page, int size, String sort, String q, BomStatus status) {}

  private final BomRepository bomRepository;
  private final ItemRepository itemRepository;
  private final CurrentUserService currentUserService;

  public BomService(
      BomRepository bomRepository,
      ItemRepository itemRepository,
      CurrentUserService currentUserService) {
    this.bomRepository = bomRepository;
    this.itemRepository = itemRepository;
    this.currentUserService = currentUserService;
  }

  @Transactional(readOnly = true)
  public BomPage list(BomQuery query) {
    String ownerSub = currentUserService.requiredSub();
    Pageable pageable =
        PageRequest.of(Math.max(query.page(), 0), Math.max(query.size(), 1), parseSort(query.sort()));

    Specification<BomEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          predicates.add(cb.equal(root.get("ownerSub"), ownerSub));
          if (query.q() != null && !query.q().isBlank()) {
            String pattern = "%" + query.q().toLowerCase(Locale.ROOT) + "%";
            predicates.add(
                cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("productId")), pattern),
                    cb.like(cb.lower(root.get("productName")), pattern)));
          }
          if (query.status() != null) {
            predicates.add(cb.equal(root.get("status"), query.status()));
          }
          return cb.and(predicates.toArray(Predicate[]::new));
        };

    Page<BomEntity> result = bomRepository.findAll(spec, pageable);

    return new BomPage()
        .content(result.stream().map(this::toListModel).toList())
        .page(result.getNumber())
        .size(result.getSize())
        .totalElements((int) result.getTotalElements())
        .totalPages(Math.max(1, result.getTotalPages()))
        .sort(List.of(query.sort() == null || query.sort().isBlank() ? "updatedAt,desc" : query.sort()));
  }

  @Transactional(readOnly = true)
  public BomDetail getByCode(String code) {
    String ownerSub = currentUserService.requiredSub();
    if (code == null || code.isBlank()) {
      return null;
    }
    return bomRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).map(this::toDetailModel).orElse(null);
  }

  @Transactional
  public BomDetail create(BomDetail req) {
    String ownerSub = currentUserService.requiredSub();
    String code =
        (req.getId() == null || req.getId().isBlank())
            ? generateNextCode()
            : req.getId().trim().toUpperCase(Locale.ROOT);

    if (bomRepository.existsByCodeIgnoreCaseAndOwnerSub(code, ownerSub)) {
      return null;
    }
    validateItemReferences(req.getProductId(), req.getComponents(), ownerSub);

    BomEntity entity = new BomEntity();
    entity.setCode(code);
    entity.setProductId(req.getProductId().trim());
    entity.setProductName(req.getProductName());
    entity.setRevision(req.getRevision().trim());
    entity.setStatus(req.getStatus());
    entity.setDescription(req.getDescription());
    entity.setNote(req.getNote());
    entity.setComponents(toEmbeddables(req.getComponents()));
    entity.setOwnerSub(ownerSub);

    return toDetailModel(bomRepository.save(entity));
  }

  @Transactional
  public BomDetail updateByCode(String code, BomDetail req, Integer expectedVersion) {
    String ownerSub = currentUserService.requiredSub();
    BomEntity existing = bomRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).orElse(null);
    if (existing == null) {
      return null;
    }
    if (expectedVersion == null || existing.getVersion() != expectedVersion.longValue()) {
      throw new IllegalStateException("version_mismatch");
    }
    validateItemReferences(req.getProductId(), req.getComponents(), ownerSub);

    existing.setProductId(req.getProductId().trim());
    existing.setProductName(req.getProductName());
    existing.setRevision(req.getRevision().trim());
    existing.setStatus(req.getStatus());
    existing.setDescription(req.getDescription());
    existing.setNote(req.getNote());
    existing.setComponents(toEmbeddables(req.getComponents()));

    return toDetailModel(bomRepository.save(existing));
  }

  @Transactional
  public boolean deleteByCode(String code, Integer expectedVersion) {
    String ownerSub = currentUserService.requiredSub();
    BomEntity existing = bomRepository.findByCodeIgnoreCaseAndOwnerSub(code, ownerSub).orElse(null);
    if (existing == null) {
      return false;
    }
    if (expectedVersion == null || existing.getVersion() != expectedVersion.longValue()) {
      throw new IllegalStateException("version_mismatch");
    }
    bomRepository.delete(existing);
    return true;
  }

  @Transactional(readOnly = true)
  public List<BomDetail> listForExport(String q, BomStatus status, List<String> codes) {
    String ownerSub = currentUserService.requiredSub();
    Specification<BomEntity> spec =
        (root, cq, cb) -> {
          List<Predicate> predicates = new ArrayList<>();
          predicates.add(cb.equal(root.get("ownerSub"), ownerSub));
          if (q != null && !q.isBlank()) {
            String pattern = "%" + q.toLowerCase(Locale.ROOT) + "%";
            predicates.add(
                cb.or(
                    cb.like(cb.lower(root.get("code")), pattern),
                    cb.like(cb.lower(root.get("productId")), pattern),
                    cb.like(cb.lower(root.get("productName")), pattern)));
          }
          if (status != null) {
            predicates.add(cb.equal(root.get("status"), status));
          }
          if (codes != null && !codes.isEmpty()) {
            predicates.add(root.get("code").in(codes));
          }
          return cb.and(predicates.toArray(Predicate[]::new));
        };

    return bomRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "code")).stream()
        .map(this::toDetailModel)
        .toList();
  }

  @Transactional
  public BomDetail upsertFromImport(
      String code,
      String productId,
      String productName,
      String revision,
      BomStatus status,
      String description,
      String note,
      List<BomComponent> components,
      boolean createOnly) {
    String ownerSub = currentUserService.requiredSub();
    String normalizedCode =
        (code == null || code.isBlank()) ? generateNextCode() : code.trim().toUpperCase(Locale.ROOT);

    BomEntity existing = bomRepository.findByCodeIgnoreCaseAndOwnerSub(normalizedCode, ownerSub).orElse(null);
    if (existing != null) {
      if (createOnly) {
        throw new IllegalStateException("create_only_conflict");
      }
      validateItemReferences(productId, components, ownerSub);
      existing.setProductId(productId.trim().toUpperCase(Locale.ROOT));
      existing.setProductName(productName == null ? null : productName.trim());
      existing.setRevision(revision.trim());
      existing.setStatus(status);
      existing.setDescription(description == null ? null : description.trim());
      existing.setNote(note == null ? null : note.trim());
      existing.setComponents(toEmbeddables(components));
      return toDetailModel(bomRepository.save(existing));
    }

    BomEntity entity = new BomEntity();
    validateItemReferences(productId, components, ownerSub);
    entity.setCode(normalizedCode);
    entity.setProductId(productId.trim().toUpperCase(Locale.ROOT));
    entity.setProductName(productName == null ? null : productName.trim());
    entity.setRevision(revision.trim());
    entity.setStatus(status);
    entity.setDescription(description == null ? null : description.trim());
    entity.setNote(note == null ? null : note.trim());
    entity.setComponents(toEmbeddables(components));
    entity.setOwnerSub(ownerSub);
    return toDetailModel(bomRepository.save(entity));
  }

  private String generateNextCode() {
    int max =
        bomRepository.findAll().stream()
            .map(BomEntity::getCode)
            .map(BomService::extractNumericSuffix)
            .filter(n -> n >= 0)
            .max(Integer::compareTo)
            .orElse(0);
    return "BOM-" + String.format("%03d", max + 1);
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

    if ("id".equalsIgnoreCase(key)) {
      return Sort.by(direction, "code");
    }
    if ("productId".equalsIgnoreCase(key)) {
      return Sort.by(direction, "productId");
    }
    if ("updatedAt".equalsIgnoreCase(key)) {
      return Sort.by(direction, "updatedAt");
    }
    return Sort.by(direction, "productName");
  }

  private BomList toListModel(BomEntity entity) {
    return new BomList()
        .id(entity.getCode())
        .productId(entity.getProductId())
        .productName(entity.getProductName())
        .revision(entity.getRevision())
        .status(entity.getStatus())
        .updatedAt(entity.getUpdatedAt())
        .componentsCount(entity.getComponents() == null ? 0 : entity.getComponents().size());
  }

  private BomDetail toDetailModel(BomEntity entity) {
    return new BomDetail()
        .id(entity.getCode())
        .productId(entity.getProductId())
        .productName(entity.getProductName())
        .revision(entity.getRevision())
        .status(entity.getStatus())
        .description(entity.getDescription())
        .note(entity.getNote())
        .components(toModels(entity.getComponents()))
        .createdAt(entity.getCreatedAt())
        .updatedAt(entity.getUpdatedAt())
        .version((int) entity.getVersion());
  }

  private List<BomComponentEmbeddable> toEmbeddables(List<BomComponent> components) {
    if (components == null) {
      return List.of();
    }
    return components.stream()
        .filter(c -> c != null && c.getItemId() != null && !c.getItemId().isBlank())
        .map(
            c -> {
              BomComponentEmbeddable emb = new BomComponentEmbeddable();
              emb.setItemId(c.getItemId().trim().toUpperCase(Locale.ROOT));
              emb.setQuantity(BigDecimal.valueOf(c.getQuantity() == null ? 0d : c.getQuantity()));
              emb.setUom(c.getUom() == null ? "" : c.getUom().trim());
              emb.setNote(c.getNote());
              return emb;
            })
        .toList();
  }

  private void validateItemReferences(String productId, List<BomComponent> components, String ownerSub) {
    String normalizedProductId = productId == null ? "" : productId.trim().toUpperCase(Locale.ROOT);
    if (normalizedProductId.isBlank()) {
      throw new IllegalStateException("invalid_product_item");
    }
    ItemEntity product = itemRepository.findByCodeIgnoreCaseAndOwnerSub(normalizedProductId, ownerSub).orElse(null);
    if (product == null) {
      throw new IllegalStateException("product_item_not_found");
    }

    if (components == null) {
      return;
    }
    for (BomComponent component : components) {
      if (component == null) {
        continue;
      }
      String itemId = component.getItemId() == null ? "" : component.getItemId().trim().toUpperCase(Locale.ROOT);
      if (itemId.isBlank()) {
        continue;
      }
      if (itemRepository.findByCodeIgnoreCaseAndOwnerSub(itemId, ownerSub).isEmpty()) {
        throw new IllegalStateException("component_item_not_found");
      }
    }
  }

  private List<BomComponent> toModels(List<BomComponentEmbeddable> components) {
    if (components == null) {
      return List.of();
    }
    return components.stream()
        .map(
            c ->
                new BomComponent()
                    .itemId(c.getItemId())
                    .quantity(c.getQuantity() == null ? null : c.getQuantity().doubleValue())
                    .uom(c.getUom())
                    .note(c.getNote()))
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

  public static String toWeakEtag(Integer version) {
    int v = (version == null) ? 0 : Math.max(version, 0);
    return "W\"" + v + "\"";
  }
}
