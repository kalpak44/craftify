package com.craftify.backend.persistence.entity;

import com.craftify.backend.model.BomStatus;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "boms")
public class BomEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "code", nullable = false, length = 64, unique = true)
  private String code;

  @Column(name = "product_id", nullable = false, length = 64)
  private String productId;

  @Column(name = "product_name", length = 200)
  private String productName;

  @Column(name = "revision", nullable = false, length = 32)
  private String revision;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 32)
  private BomStatus status;

  @Column(name = "description", length = 4000)
  private String description;

  @Column(name = "note", length = 4000)
  private String note;

  @Column(name = "owner_sub", nullable = false, length = 191)
  private String ownerSub;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Version
  @Column(name = "version", nullable = false)
  private long version;

  @ElementCollection(fetch = FetchType.LAZY)
  @CollectionTable(name = "bom_components", joinColumns = @JoinColumn(name = "bom_id"))
  @OrderColumn(name = "ord")
  private List<BomComponentEmbeddable> components = new ArrayList<>();

  @PrePersist
  void prePersist() {
    OffsetDateTime now = OffsetDateTime.now();
    if (createdAt == null) {
      createdAt = now;
    }
    updatedAt = now;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = OffsetDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getProductId() {
    return productId;
  }

  public void setProductId(String productId) {
    this.productId = productId;
  }

  public String getProductName() {
    return productName;
  }

  public void setProductName(String productName) {
    this.productName = productName;
  }

  public String getRevision() {
    return revision;
  }

  public void setRevision(String revision) {
    this.revision = revision;
  }

  public BomStatus getStatus() {
    return status;
  }

  public void setStatus(BomStatus status) {
    this.status = status;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getNote() {
    return note;
  }

  public void setNote(String note) {
    this.note = note;
  }

  public String getOwnerSub() {
    return ownerSub;
  }

  public void setOwnerSub(String ownerSub) {
    this.ownerSub = ownerSub;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public long getVersion() {
    return version;
  }

  public void setVersion(long version) {
    this.version = version;
  }

  public List<BomComponentEmbeddable> getComponents() {
    return components;
  }

  public void setComponents(List<BomComponentEmbeddable> components) {
    this.components = (components == null) ? new ArrayList<>() : new ArrayList<>(components);
  }
}
