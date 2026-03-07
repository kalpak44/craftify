package com.craftify.backend.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "inventory")
public class InventoryEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "code", nullable = false, length = 64, unique = true)
  private String code;

  @Column(name = "item_id", nullable = false, length = 64)
  private String itemId;

  @Column(name = "item_name", nullable = false, length = 200)
  private String itemName;

  @Column(name = "item_category_name", nullable = false, length = 100)
  private String itemCategoryName;

  @Column(name = "category_detached", nullable = false)
  private boolean categoryDetached;

  @Column(name = "detached_category_name", length = 100)
  private String detachedCategoryName;

  @Column(name = "category_name", nullable = false, length = 100)
  private String categoryName;

  @Column(name = "uom", nullable = false, length = 16)
  private String uom;

  @Column(name = "available", nullable = false, precision = 19, scale = 6)
  private BigDecimal available;

  @Column(name = "owner_sub", nullable = false, length = 191)
  private String ownerSub;

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

  public String getItemId() {
    return itemId;
  }

  public void setItemId(String itemId) {
    this.itemId = itemId;
  }

  public String getItemName() {
    return itemName;
  }

  public void setItemName(String itemName) {
    this.itemName = itemName;
  }

  public String getItemCategoryName() {
    return itemCategoryName;
  }

  public void setItemCategoryName(String itemCategoryName) {
    this.itemCategoryName = itemCategoryName;
  }

  public boolean isCategoryDetached() {
    return categoryDetached;
  }

  public void setCategoryDetached(boolean categoryDetached) {
    this.categoryDetached = categoryDetached;
  }

  public String getDetachedCategoryName() {
    return detachedCategoryName;
  }

  public void setDetachedCategoryName(String detachedCategoryName) {
    this.detachedCategoryName = detachedCategoryName;
  }

  public String getCategoryName() {
    return categoryName;
  }

  public void setCategoryName(String categoryName) {
    this.categoryName = categoryName;
  }

  public String getUom() {
    return uom;
  }

  public void setUom(String uom) {
    this.uom = uom;
  }

  public BigDecimal getAvailable() {
    return available;
  }

  public void setAvailable(BigDecimal available) {
    this.available = available;
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
}
