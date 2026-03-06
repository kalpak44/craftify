package com.craftify.backend.persistence.entity;

import com.craftify.backend.model.WorkItemStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "work_items")
public class WorkItemEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "code", nullable = false, length = 64, unique = true)
  private String code;

  @Column(name = "bom_id", nullable = false, length = 64)
  private String bomId;

  @Column(name = "parent_bom_item", nullable = false, length = 200)
  private String parentBomItem;

  @Column(name = "bom_version", nullable = false, length = 96)
  private String bomVersion;

  @Column(name = "components_count", nullable = false)
  private int componentsCount;

  @Column(name = "requested_qty", nullable = false, precision = 19, scale = 6)
  private BigDecimal requestedQty;

  @Column(name = "requested_at", nullable = false)
  private OffsetDateTime requestedAt;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 32)
  private WorkItemStatus status;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Version
  @Column(name = "version", nullable = false)
  private long version;

  @PrePersist
  void prePersist() {
    OffsetDateTime now = OffsetDateTime.now();
    if (requestedAt == null) {
      requestedAt = now;
    }
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

  public String getBomId() {
    return bomId;
  }

  public void setBomId(String bomId) {
    this.bomId = bomId;
  }

  public String getParentBomItem() {
    return parentBomItem;
  }

  public void setParentBomItem(String parentBomItem) {
    this.parentBomItem = parentBomItem;
  }

  public String getBomVersion() {
    return bomVersion;
  }

  public void setBomVersion(String bomVersion) {
    this.bomVersion = bomVersion;
  }

  public int getComponentsCount() {
    return componentsCount;
  }

  public void setComponentsCount(int componentsCount) {
    this.componentsCount = componentsCount;
  }

  public BigDecimal getRequestedQty() {
    return requestedQty;
  }

  public void setRequestedQty(BigDecimal requestedQty) {
    this.requestedQty = requestedQty;
  }

  public OffsetDateTime getRequestedAt() {
    return requestedAt;
  }

  public void setRequestedAt(OffsetDateTime requestedAt) {
    this.requestedAt = requestedAt;
  }

  public WorkItemStatus getStatus() {
    return status;
  }

  public void setStatus(WorkItemStatus status) {
    this.status = status;
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
}
