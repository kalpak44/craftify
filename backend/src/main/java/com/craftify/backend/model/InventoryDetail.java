package com.craftify.backend.model;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class InventoryDetail {

  private String code;
  private String itemId;
  private String itemName;
  private String itemCategoryName;
  private Boolean categoryDetached;
  private String detachedCategoryName;
  private String categoryName;
  private String uom;
  private BigDecimal available;
  private OffsetDateTime updatedAt;
  private Long version;

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

  public Boolean getCategoryDetached() {
    return categoryDetached;
  }

  public void setCategoryDetached(Boolean categoryDetached) {
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

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(OffsetDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public Long getVersion() {
    return version;
  }

  public void setVersion(Long version) {
    this.version = version;
  }
}
